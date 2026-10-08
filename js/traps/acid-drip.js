/**
 * @module acid-drip
 *
 * Goteo de ácido: trampa del nivel 2. Una gota cae desde una tubería y salpica
 * al llegar al suelo.
 *
 * Ciclo de fases:
 *   idle (nada visible) → warning (gota crece en la tubería, no daña) →
 *   fall (gota cae acelerando, peligroso) → splash (salpicadura, peligroso) → idle …
 *
 * La duración de fall no es constante: se calcula con cinemática (√(2·d/g)).
 * dangerRects devuelve la gota durante fall y la salpicadura durante splash.
 *
 * Usado por: trap-factory.js (mapa type → clase).
 * Depende de: config.js (TRAPS.acidDrip), trap.js.
 */
import { TRAPS } from '../config.js';
import { Trap } from './trap.js';

const A = TRAPS.acidDrip;

/**
 * Goteo de ácido.
 *
 * Datos de escena: { type: 'acid-drip', x, top, bottom, phaseOffset? }
 * - x: centro horizontal de la tubería.
 * - top: boca de la tubería.
 * - bottom: superficie donde salpica.
 */
export class AcidDrip extends Trap {
  #x;
  #top;
  #bottom;
  #fallTime;
  #dropY;
  #dropStartY;

  constructor(data) {
    const dropStartY = A.dropStartY;
    const startWorldY = data.top + dropStartY;
    const distance = data.bottom - startWorldY;
    const fallTime = Math.sqrt(2 * distance / A.fallGravity);

    const zone = {
      x: data.x - A.splashWidth / 2,
      y: data.top,
      width: A.splashWidth,
      height: data.bottom - data.top,
    };

    super([
      { name: 'idle',    duration: A.idleTime },
      { name: 'warning', duration: A.warningTime },
      { name: 'fall',    duration: fallTime },
      { name: 'splash',  duration: A.splashTime },
    ], zone, data.phaseOffset);

    this.#x = data.x;
    this.#top = data.top;
    this.#bottom = data.bottom;
    this.#dropStartY = dropStartY;
    this.#fallTime = fallTime;
    this.#dropY = data.top + dropStartY;
  }

  get type() { return 'acid-drip'; }

  get dangerRects() {
    const phase = this.phase;
    if (phase === 'fall') {
      return [{
        x: this.#x - A.dropWidth / 2,
        y: this.#dropY - A.dropHeight / 2,
        width: A.dropWidth,
        height: A.dropHeight,
      }];
    }
    if (phase === 'splash') {
      return [{
        x: this.#x - A.splashWidth / 2,
        y: this.#bottom - 8,
        width: A.splashWidth,
        height: 8,
      }];
    }
    return [];
  }

  get viewData() {
    return {
      '--drop-y': this.#dropY - this.#top,
      '--pipe-ceiling-h': this.#top,
    };
  }

  update(dt) {
    super.update(dt);
    this.#updateDropPosition();
  }

  #updateDropPosition() {
    const phase = this.phase;
    if (phase === 'fall') {
      const startY = this.#top + this.#dropStartY;
      const t = this.phaseProgress * this.#fallTime;
      this.#dropY = startY + 0.5 * A.fallGravity * t * t;
      if (this.#dropY > this.#bottom) this.#dropY = this.#bottom;
    } else {
      this.#dropY = this.#top + this.#dropStartY;
    }
  }
}
