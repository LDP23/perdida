/**
 * @module hydraulic-press
 *
 * Prensa hidráulica: trampa de aplastamiento del nivel 1 escena 2.
 * Un bloque de acero sube y baja cíclicamente sobre un pasillo.
 *
 * Ciclo de fases:
 *   idle (arriba, seguro) → warning (tiembla, luz roja, seguro) →
 *   slam (baja de golpe, peligroso) → hold (abajo, peligroso) →
 *   rise (sube lento, peligroso) → idle …
 *
 * El bloque interpola su posición vertical entre restBottom (arriba) y
 * bottom (abajo). dangerRects devuelve el bloque solo en slam/hold/rise.
 * viewData expone --block-y para que el CSS posicione el bloque.
 *
 * Usado por: trap-factory.js (mapa type → clase).
 * Depende de: config.js (TRAPS.press), trap.js.
 */
import { TRAPS } from '../config.js';
import { Trap } from './trap.js';

const P = TRAPS.press;

/**
 * Prensa hidráulica.
 *
 * Datos de escena: { type: 'press', x1, x2, ceiling, restBottom, bottom, phaseOffset? }
 * - ceiling: y del soporte donde se ancla al techo.
 * - restBottom: y del borde inferior del bloque en reposo (debe dejar pasar al robot).
 * - bottom: y del borde inferior del bloque al golpear (la superficie del piso).
 */
export class HydraulicPress extends Trap {
  #x1;
  #x2;
  #restBottom;
  #bottom;
  #blockHeight;
  /** @type {number} — y del borde inferior del bloque en este instante */
  #currentBottom;

  constructor(data) {
    const zone = {
      x: data.x1,
      y: data.ceiling,
      width: data.x2 - data.x1,
      height: data.bottom - data.ceiling,
    };

    super([
      { name: 'idle',    duration: P.idleTime },
      { name: 'warning', duration: P.warningTime },
      { name: 'slam',    duration: P.slamTime },
      { name: 'hold',    duration: P.holdTime },
      { name: 'rise',    duration: P.riseTime },
    ], zone, data.phaseOffset);

    this.#x1 = data.x1;
    this.#x2 = data.x2;
    this.#restBottom = data.restBottom;
    this.#bottom = data.bottom;
    this.#blockHeight = P.blockHeight;
    this.#currentBottom = data.restBottom;
  }

  get type() { return 'press'; }

  get dangerRects() {
    const phase = this.phase;
    if (phase === 'idle' || phase === 'warning') return [];
    return [{
      x: this.#x1,
      y: this.#currentBottom - this.#blockHeight,
      width: this.#x2 - this.#x1,
      height: this.#blockHeight,
    }];
  }

  /** --block-y: posición del borde inferior del bloque relativa al top de la zona */
  get viewData() {
    return { '--block-y': this.#currentBottom - this.zone.y };
  }

  update(dt) {
    super.update(dt);
    this.#updateBlockPosition();
  }

  #updateBlockPosition() {
    const phase = this.phase;
    const t = this.phaseProgress;
    const rest = this.#restBottom;
    const bottom = this.#bottom;
    switch (phase) {
      case 'idle':
      case 'warning':
        this.#currentBottom = rest;
        break;
      case 'slam':
        this.#currentBottom = rest + (bottom - rest) * t;
        break;
      case 'hold':
        this.#currentBottom = bottom;
        break;
      case 'rise':
        this.#currentBottom = bottom - (bottom - rest) * t;
        break;
    }
  }
}
