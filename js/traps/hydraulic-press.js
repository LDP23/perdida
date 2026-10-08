/**
 * @module hydraulic-press
 *
 * Prensa hidráulica: un bloque de acero sube y baja cíclicamente.
 *
 * Ciclo de fases:
 *   idle (arriba, seguro) → warning (tiembla, luz roja, seguro) →
 *   slam (baja de golpe, peligroso) → hold (abajo, peligroso) →
 *   rise (sube lento, peligroso) → idle …
 *
 * El bloque interpola entre restBottom y bottom. La hitbox y el sólido son el
 * bloque visible (blockWidth × blockHeight, centrado en x1–x2, docs/SPRITES.md).
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
 * - restBottom: y del borde inferior del bloque en reposo.
 * - bottom: y del borde inferior del bloque al golpear.
 */
export class HydraulicPress extends Trap {
  #centerX;
  #restBottom;
  #bottom;
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

    this.#centerX = (data.x1 + data.x2) / 2;
    this.#restBottom = data.restBottom;
    this.#bottom = data.bottom;
    this.#currentBottom = data.restBottom;
  }

  get type() { return 'press'; }

  get dangerRects() {
    const phase = this.phase;
    if (phase === 'idle' || phase === 'warning') return [];
    return [this.#blockRect()];
  }

  get solidRects() {
    const phase = this.phase;
    if (phase !== 'idle' && phase !== 'warning') return [];
    return [this.#blockRect()];
  }

  get viewData() {
    return { '--block-y': this.#currentBottom - this.zone.y };
  }

  update(dt) {
    super.update(dt);
    this.#updateBlockPosition();
  }

  #blockRect() {
    return {
      x: this.#centerX - P.blockWidth / 2,
      y: this.#currentBottom - P.blockHeight,
      width: P.blockWidth,
      height: P.blockHeight,
    };
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
