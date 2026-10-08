/**
 * @module intermittent-laser
 *
 * Láser intermitente: un emisor cuelga del techo (y = 0) y el rayo baja hasta
 * la primera superficie sólida debajo, recalculada en cada paso.
 *
 * Ciclo de fases:
 *   off (apagado, seguro) → warning (hilo rojo delgado, seguro) →
 *   on (rayo completo, peligroso) → off …
 *
 * dangerRects devuelve el rectángulo del rayo solo en la fase 'on'.
 * La zona fija cubre desde el emisor hasta el fondo de la escena.
 *
 * Usado por: trap-factory.js (mapa type → clase).
 * Depende de: config.js (TRAPS.laser, WORLD), trap.js, collision.js.
 */
import { TRAPS, WORLD } from '../config.js';
import { findSurfaceBelow } from '../physics/collision.js';
import { Trap } from './trap.js';

const L = TRAPS.laser;

/**
 * Láser intermitente.
 *
 * Datos de escena: { type: 'laser', x, phaseOffset? }
 * - x: posición horizontal del centro del rayo.
 */
export class IntermittentLaser extends Trap {
  #x;
  #beamTop;
  #beamBottom;

  constructor(data) {
    const halfBeam = L.beamWidth / 2;
    const beamTop = L.emitterMouthY;
    const zone = {
      x: data.x - halfBeam,
      y: 0,
      width: L.beamWidth,
      height: WORLD.height,
    };

    super([
      { name: 'off',     duration: L.offTime },
      { name: 'warning', duration: L.warningTime },
      { name: 'on',      duration: L.onTime },
    ], zone, data.phaseOffset);

    this.#x = data.x;
    this.#beamTop = beamTop;
    this.#beamBottom = WORLD.height;
  }

  get type() { return 'laser'; }

  get dangerRects() {
    return this.phase === 'on' ? [this.#beamRect()] : [];
  }

  get viewData() {
    return {
      '--beam-bottom': this.#beamBottom,
    };
  }

  /**
   * Recalcula la longitud del rayo según los sólidos actuales.
   * @param {number} dt
   * @param {Rect[]} [solids]
   */
  updateWithSolids(dt, solids) {
    super.update(dt);
    if (solids) {
      this.#beamBottom = findSurfaceBelow(this.#x, this.#beamTop, solids, L.beamWidth);
    }
  }

  update(dt) {
    super.update(dt);
  }

  #beamRect() {
    const halfBeam = L.beamWidth / 2;
    return {
      x: this.#x - halfBeam,
      y: this.#beamTop,
      width: L.beamWidth,
      height: this.#beamBottom - this.#beamTop,
    };
  }
}
