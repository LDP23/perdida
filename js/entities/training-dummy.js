import { TRAINING_DUMMY } from '../config.js';
import { Timer } from '../core/timer.js';

// Maniqui de practica: no es solido, cuenta impactos, destella al recibir un disparo.
// Implementa la interfaz "shootable": tiene body y onShot(projectile).
export class TrainingDummy {
  body;
  hitCount = 0;
  isDead = false;
  #hitFlash = new Timer();

  constructor({ x, y }) {
    // Hitbox centrada dentro del sprite, con offset desde arriba
    const hw = TRAINING_DUMMY.hitboxWidth;
    const hh = TRAINING_DUMMY.hitboxHeight;
    this.body = {
      x: x - hw / 2,
      y: y - TRAINING_DUMMY.spriteHeight + TRAINING_DUMMY.hitboxTopOffset,
      width: hw,
      height: hh,
    };
  }

  get isHit() { return this.#hitFlash.active; }

  onShot() {
    this.hitCount++;
    this.#hitFlash.start(0.12);
  }

  update(dt) {
    this.#hitFlash.update(dt);
  }
}
