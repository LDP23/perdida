/**
 * @module sweeping-laser
 *
 * Láser de barrido: un riel horizontal en y = 0 entre x1 y x2, con un emisor
 * que se desliza y un rayo vertical que baja hasta la primera superficie.
 *
 * Ciclo de fases (6):
 *   warning-left → sweep-right → pause-right →
 *   warning-right → sweep-left → pause-left → warning-left …
 *
 * La duración de cada barrido se calcula: (x2 − x1) / speed.
 * dangerRects devuelve el rayo solo en las fases 'sweep-*'.
 * viewData expone --beam-x (posición del emisor relativa a x1).
 *
 * Usado por: trap-factory.js (mapa type → clase).
 * Depende de: config.js (TRAPS.sweepLaser, TRAPS.laser, WORLD, HAZARD), trap.js, collision.js.
 */
import { TRAPS, WORLD, HAZARD } from '../config.js';
import { findSurfaceBelow } from '../physics/collision.js';
import { Trap } from './trap.js';

const SL = TRAPS.sweepLaser;
const beamW = SL.beamWidth;
const emitterMouthY = TRAPS.laser.emitterMouthY;

/**
 * Láser de barrido.
 *
 * Datos de escena: { type: 'sweep-laser', x1, x2, phaseOffset? }
 * - x1, x2: extremos horizontales del recorrido del riel.
 */
export class SweepingLaser extends Trap {
  #x1;
  #x2;
  #beamX;
  #beamBottom;
  #sweepWidth;

  constructor(data) {
    const sweepWidth = data.x2 - data.x1;
    const sweepTime = sweepWidth / SL.speed;

    const zone = {
      x: data.x1,
      y: 0,
      width: sweepWidth,
      height: WORLD.height,
    };

    super([
      { name: 'warning-left',  duration: SL.warningTime },
      { name: 'sweep-right',   duration: sweepTime },
      { name: 'pause-right',   duration: SL.pauseTime },
      { name: 'warning-right', duration: SL.warningTime },
      { name: 'sweep-left',    duration: sweepTime },
      { name: 'pause-left',    duration: SL.pauseTime },
    ], zone, data.phaseOffset);

    this.#x1 = data.x1;
    this.#x2 = data.x2;
    this.#sweepWidth = sweepWidth;
    this.#beamX = data.x1;
    this.#beamBottom = WORLD.height;
  }

  get type() { return 'sweep-laser'; }

  get dangerRects() {
    const phase = this.phase;
    if (phase !== 'sweep-right' && phase !== 'sweep-left') return [];
    const halfBeam = beamW / 2;
    return [{
      x: this.#beamX - halfBeam,
      y: emitterMouthY,
      width: beamW,
      height: this.#beamBottom - emitterMouthY,
    }];
  }

  /**
   * Exclusiones del punto seguro: solo el rayo actual ensanchado, no toda la zona.
   * Evita que un golpe del barrido devuelva al robot antes de la brecha.
   */
  get safePointExclusions() {
    const phase = this.phase;
    if (phase !== 'sweep-right' && phase !== 'sweep-left') return [];
    const m = HAZARD.safePointHazardMargin;
    return [{
      x: this.#beamX - beamW / 2 - m,
      y: 0,
      width: beamW + m * 2,
      height: WORLD.height,
    }];
  }

  get viewData() {
    return {
      '--beam-x': this.#beamX - this.#x1,
      '--beam-h': this.#beamBottom - emitterMouthY,
    };
  }

  /**
   * Recalcula la longitud del rayo según los sólidos actuales.
   * @param {number} dt
   * @param {Rect[]} [solids]
   */
  updateWithSolids(dt, solids) {
    super.update(dt);
    this.#updateBeamPosition();
    if (solids) {
      this.#beamBottom = findSurfaceBelow(this.#beamX, emitterMouthY, solids, beamW);
    }
  }

  update(dt) {
    super.update(dt);
    this.#updateBeamPosition();
  }

  #updateBeamPosition() {
    const phase = this.phase;
    const t = this.phaseProgress;
    switch (phase) {
      case 'warning-left':
      case 'pause-left':
        this.#beamX = this.#x1;
        break;
      case 'sweep-right':
        this.#beamX = this.#x1 + this.#sweepWidth * t;
        break;
      case 'warning-right':
      case 'pause-right':
        this.#beamX = this.#x2;
        break;
      case 'sweep-left':
        this.#beamX = this.#x2 - this.#sweepWidth * t;
        break;
    }
  }
}
