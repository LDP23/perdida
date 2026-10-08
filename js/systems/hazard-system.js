/**
 * @module hazard-system
 *
 * Gestiona peligros del escenario (zonas de daño) y caídas al vacío. Actualiza el
 * SafePointTracker en cada frame. Si el robot toca un peligro o cae, lo reposiciona
 * en el último punto seguro. El daño solo se aplica si canBeHurt es true.
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
    if (w.player.isDying || w.player.isDead || w.player.isRespawning) return;
    if (this.#hitAnyHazard(w, w.scene.hazards)) return;
    this.#hitAnyHazard(w, w.dynamicHazards);
  }

  #hitAnyHazard(w, hazards) {
    for (const hazard of hazards) {
      if (rectsOverlap(w.player.body, hazard)) {
        if (w.player.canBeHurt) {
          w.player.takeHit(BATTERY.hitCost);
          this.#events.emit('player:hazard');
        }
        w.player.placeAt(w.safePoint.point);
        return true;
      }
    }
    return false;
  }

  #handleFall(w) {
    if (w.player.isDying || w.player.isDead || w.player.isRespawning) return;
    if (w.player.body.y > w.scene.height + SCENE.fallMargin) {
      if (w.player.canBeHurt) {
        w.player.takeHit(BATTERY.hitCost);
        this.#events.emit('player:hazard');
      }
      w.player.placeAt(w.safePoint.point);
    }
  }
}
