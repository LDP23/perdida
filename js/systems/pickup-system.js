/**
 * @module pickup-system
 *
 * Sistema de recolección: verifica colisión del robot con celdas de energía e IDs
 * de tripulante, aplica sus efectos (recarga batería, suma puntos, abre panel de ID),
 * y gestiona el panel de registro de tripulante que pausa el juego mientras está abierto.
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: config.js (PICKUP, SCORE), CrewLogPanel, collision.js.
 * Escucha: 'scene:mounted' (para cerrar el panel al cambiar de escena).
 */
import { PICKUP, SCORE } from '../config.js';
import { Pickup } from '../entities/pickup.js';
import { CrewLogPanel } from '../ui/crew-log-panel.js';
import { rectsOverlap } from '../physics/collision.js';

/**
 * Sistema de recolección.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() limpia listener y panel.
 * Colabora con: GameSession (puntos, IDs), Hud (toast), EventBus.
 */
export class PickupSystem {
  #getWorld;
  #context;
  #session;
  #hud;
  #crewPanel;
  #panelPaused = false;
  #unsubs = [];

  constructor({ context, getWorld, session, hud }) {
    this.#context = context;
    this.#getWorld = getWorld;
    this.#session = session;
    this.#hud = hud;
    this.#crewPanel = new CrewLogPanel(context.layers.panels);
    this.#unsubs.push(
      context.events.on('scene:mounted', () => {
        this.#panelPaused = false;
        this.#crewPanel.close();
      }),
      context.events.on('enemy:destroyed', ({ x, y, dropsCrewId }) => {
        if (!dropsCrewId || this.#session.hasFoundCrewId(dropsCrewId)) return;
        const w = this.#getWorld();
        const pickup = new Pickup({ type: 'crew-id', x, y: y - 60, crewId: dropsCrewId });
        pickup.isDropped = true;
        w.crewIdPickups.add(pickup);
      }),
    );
  }

  // Devuelve true si el panel consume el frame
  updatePanel(deltaTime, input) {
    if (!this.#panelPaused) return false;
    this.#crewPanel.update(deltaTime, input);
    if (!this.#crewPanel.isOpen) this.#panelPaused = false;
    return this.#panelPaused;
  }

  update(deltaTime) {
    const w = this.#getWorld();
    w.energyCells.update((p) => p.update(deltaTime));
    w.crewIdPickups.update((p) => p.update(deltaTime));
    this.#checkPickups(w);
  }

  dispose() {
    for (const unsub of this.#unsubs) unsub();
    this.#crewPanel.destroy();
  }

  #checkPickups(w) {
    const check = (pickup) => {
      if (pickup.isCollected || pickup.isDead) return;
      if (!rectsOverlap(w.player.body, pickup.body)) return;
      pickup.collect();
      if (pickup.type === 'energy-cell') {
        w.player.battery.recharge(PICKUP.energyCellRecharge);
        this.#session.addScore(SCORE.energyCell);
        this.#hud.showToast('+30 batería');
        this.#context.events.emit('pickup:energy-cell');
      } else if (pickup.type === 'crew-id') {
        if (this.#session.collectCrewId(pickup.crewId)) {
          this.#session.addScore(SCORE.crewId);
          this.#context.events.emit('pickup:crew-id', { crewId: pickup.crewId });
          this.#panelPaused = true;
          this.#crewPanel.open(pickup.crewId);
        }
      }
    };
    w.energyCells.forEach(check);
    w.crewIdPickups.forEach(check);
  }
}
