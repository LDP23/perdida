/**
 * @module intermittent-laser
 *
 * Láser intermitente: trampa del nivel 1 escena 3. Un rayo vertical que se
 * enciende y apaga cíclicamente sobre una pasarela.
 *
 * Ciclo de fases:
 *   off (apagado, seguro) → warning (hilo rojo delgado, seguro) →
 *   on (rayo completo, peligroso) → off …
 *
 * dangerRects devuelve el rectángulo del rayo solo en la fase 'on'.
 * La zona fija cubre el rayo completo para que el safe-point nunca
 * guarde una posición dentro del haz.
 *
 * Usado por: trap-factory.js (mapa type → clase).
 * Depende de: config.js (TRAPS.laser), trap.js.
 */
import { TRAPS } from '../config.js';
import { Trap } from './trap.js';

const L = TRAPS.laser;

/**
 * Láser intermitente.
 *
 * Datos de escena: { type: 'laser', x, top, bottom, phaseOffset? }
 * - x: posición horizontal del centro del rayo.
 * - top: y del emisor (techo).
 * - bottom: y de la superficie donde impacta el rayo.
 */
export class IntermittentLaser extends Trap {
  /** @type {Rect} — rectángulo del rayo (fijo, el peligro se activa/desactiva por fase) */
  #beamRect;

  constructor(data) {
    const halfBeam = L.beamWidth / 2;
    const zone = {
      x: data.x - halfBeam,
      y: data.top,
      width: L.beamWidth,
      height: data.bottom - data.top,
    };

    super([
      { name: 'off',     duration: L.offTime },
      { name: 'warning', duration: L.warningTime },
      { name: 'on',      duration: L.onTime },
    ], zone, data.phaseOffset);

    this.#beamRect = { ...zone };
  }

  get type() { return 'laser'; }

  get dangerRects() {
    return this.phase === 'on' ? [this.#beamRect] : [];
  }

  get viewData() { return null; }
}
