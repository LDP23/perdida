/**
 * @module acid-drip
 *
 * Goteo de ácido: trampa del nivel 2. Una gota cae desde el techo (y = 0) y
 * salpica al llegar a la primera superficie debajo.
 *
 * Ciclo de fases:
 *   idle (nada visible) → warning (gota crece colgando del techo + marca en
 *   la superficie, no daña) → fall (gota cae acelerando, peligroso) →
 *   splash (salpicadura, peligroso) → idle …
 *
 * La duración de fall se calcula con cinemática (√(2·d/g)).
 * dangerRects devuelve la gota durante fall y la salpicadura durante splash.
 *
 * Datos de escena: { type: 'acid-drip', x, phaseOffset? }
 * La superficie se calcula con findSurfaceBelow a partir de los sólidos de la
 * escena, pasados como sceneContext en el constructor por la fábrica.
 *
 * Usado por: trap-factory.js (mapa type → clase).
 * Depende de: config.js (TRAPS.acidDrip), trap.js, collision.js.
 */
import { TRAPS } from '../config.js';
import { findSurfaceBelow } from '../physics/collision.js';
import { Trap } from './trap.js';

const A = TRAPS.acidDrip;

export class AcidDrip extends Trap {
  #x;
  #surfaceY;
  #fallTime;
  #dropY;

  /**
   * @param {Object} data — datos de escena ({ type, x, phaseOffset? }).
   * @param {Object} [sceneContext] — contexto del mundo ({ solids }).
   */
  constructor(data, sceneContext) {
    const solids = sceneContext?.solids ?? [];
    const surfaceY = findSurfaceBelow(data.x, 0, solids, 1);
    const distance = surfaceY;
    const fallTime = Math.sqrt(2 * distance / A.fallGravity);

    const zone = {
      x: data.x - A.splashWidth / 2,
      y: 0,
      width: A.splashWidth,
      height: surfaceY,
    };

    super([
      { name: 'idle',    duration: A.idleTime },
      { name: 'warning', duration: A.warningTime },
      { name: 'fall',    duration: fallTime },
      { name: 'splash',  duration: A.splashTime },
    ], zone, data.phaseOffset);

    this.#x = data.x;
    this.#surfaceY = surfaceY;
    this.#fallTime = fallTime;
    this.#dropY = 0;
  }

  get type() { return 'acid-drip'; }

  get dangerRects() {
    const phase = this.phase;
    if (phase === 'fall') {
      return [{
        x: this.#x - A.dropWidth / 2,
        y: this.#dropY,
        width: A.dropWidth,
        height: A.dropHeight,
      }];
    }
    if (phase === 'splash') {
      return [{
        x: this.#x - A.splashWidth / 2,
        y: this.#surfaceY - 8,
        width: A.splashWidth,
        height: 8,
      }];
    }
    return [];
  }

  get viewData() {
    return {
      '--drop-y': this.#dropY,
    };
  }

  update(dt) {
    super.update(dt);
    this.#updateDropPosition();
  }

  #updateDropPosition() {
    if (this.phase === 'fall') {
      const t = this.phaseProgress * this.#fallTime;
      this.#dropY = 0.5 * A.fallGravity * t * t;
      if (this.#dropY > this.#surfaceY) this.#dropY = this.#surfaceY;
    } else {
      this.#dropY = 0;
    }
  }
}
