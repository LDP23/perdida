import { PICKUP } from '../config.js';
import { Timer } from '../core/timer.js';

// Objeto recogible: ID de tripulante o celda de energía.
// Se marca isCollected al tocar al robot, luego isDead tras collectDuration.
export class Pickup {
  body;
  type;
  crewId;
  isCollected = false;
  isDead = false;
  #deathTimer = new Timer();

  constructor({ type, x, y, crewId }) {
    this.type = type;
    this.crewId = crewId ?? null;
    const half = PICKUP.size / 2;
    this.body = { x: x - half, y: y - half, width: PICKUP.size, height: PICKUP.size };
  }

  collect() {
    if (this.isCollected) return;
    this.isCollected = true;
    this.#deathTimer.start(PICKUP.collectDuration);
  }

  update(dt) {
    this.#deathTimer.update(dt);
    if (this.isCollected && !this.#deathTimer.active) this.isDead = true;
  }
}
