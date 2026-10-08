/**
 * @module electric-sparks
 *
 * Chispas eléctricas: un panel eléctrico en el piso descarga arcos de energía
 * hacia arriba. La zona de daño es el rectángulo de los arcos (docs/SPRITES.md),
 * más estrecho y bajo que la celda del sprite.
 *
 * Ciclo de fases:
 *   idle (panel apagado, seguro) → warning (chispas pequeñas, seguro) →
 *   discharge (descarga eléctrica, peligroso) → idle …
 *
 * dangerRects devuelve el área de los arcos solo en la fase 'discharge'.
 *
 * Usado por: trap-factory.js (mapa type → clase).
 * Depende de: config.js (TRAPS.sparks), trap.js.
 */
import { TRAPS } from '../config.js';
import { Trap } from './trap.js';

const S = TRAPS.sparks;

/**
 * Chispas eléctricas.
 *
 * Datos de escena: { type: 'sparks', x, bottom, width?, height?, phaseOffset? }
 * - x: centro horizontal del panel.
 * - bottom: superficie del piso donde está el panel.
 */
export class ElectricSparks extends Trap {
  #dischargeRect;

  constructor(data) {
    const w = data.width ?? S.width;
    const h = data.height ?? S.height;

    const zone = {
      x: data.x - w / 2,
      y: data.bottom - h,
      width: w,
      height: h,
    };

    super([
      { name: 'idle',      duration: S.idleTime },
      { name: 'warning',   duration: S.warningTime },
      { name: 'discharge', duration: S.dischargeTime },
    ], zone, data.phaseOffset);

    this.#dischargeRect = {
      x: data.x - S.arcLeft,
      y: data.bottom - S.arcHeight,
      width: S.arcLeft + S.arcRight,
      height: S.arcHeight,
    };
  }

  get type() { return 'sparks'; }

  get dangerRects() {
    return this.phase === 'discharge' ? [this.#dischargeRect] : [];
  }

  get viewData() { return null; }
}
