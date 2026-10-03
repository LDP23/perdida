import { Timer } from '../core/timer.js';

// Maniquí de práctica: no es sólido, cuenta impactos, destella al recibir un disparo.
// Implementa la interfaz "shootable": tiene body y onShot(projectile).
export class TrainingDummy {
  body;
  hitCount = 0;
  isDead = false;
  #hitFlash = new Timer();

  constructor({ x, y }) {
    this.body = { x: x - 20, y: y - 100, width: 40, height: 100 };
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
