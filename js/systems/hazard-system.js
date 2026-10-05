/**
 * @module hazard-system
 *
 * Gestiona peligros del escenario (zonas de daño) y caídas al vacío. Actualiza el
 * SafePointTracker en cada frame. Si el robot toca un peligro o cae, le aplica daño
 * y lo reposiciona en el último punto seguro.
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: config.js (BATTERY, SCENE), collision.js.
 * Emite: 'player:hazard' (al tocar peligro o caer).
 */
import { BATTERY, SCENE } from '../config.js';
import { rectsOverlap } from '../physics/collision.js';

/**
 * Sistema de peligros y caídas.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() no necesita limpieza.
 */
export class HazardSystem {
  #getWorld;
  #events;

  constructor({ context, getWorld }) {
    this.#getWorld = getWorld;
    this.#events = context.events;
  }

  update() {
    const w = this.#getWorld();
    w.safePoint.update(w.player.body);
    this.#checkHazards(w);
    this.#handleFall(w);
  }

  dispose() {}

  #checkHazards(w) {
    if (!w.player.canBeHurt) return;
    if (this.#hitAnyHazard(w, w.scene.hazards)) return;
    this.#hitAnyHazard(w, w.dynamicHazards);
  }

  /** Revisa un arreglo de peligros; aplica daño y retorna true si hubo impacto */
  #hitAnyHazard(w, hazards) {
    for (const hazard of hazards) {
      if (rectsOverlap(w.player.body, hazard)) {
        w.player.takeHit(BATTERY.hitCost);
        w.player.placeAt(w.safePoint.point);
        this.#events.emit('player:hazard');
        return true;
      }
    }
    return false;
  }

  #handleFall(w) {
    if (!w.player.canBeHurt) return;
    if (w.player.body.y > w.scene.height + SCENE.fallMargin) {
      w.player.takeHit(BATTERY.hitCost);
      w.player.placeAt(w.safePoint.point);
      this.#events.emit('player:hazard');
    }
  }
}
