import { SHOOT } from '../config.js';
import { createBody, stepBody } from '../physics/physics.js';

// Rayo horizontal sin gravedad. Se destruye al tocar un sólido o recorrer su alcance máximo.
export class Projectile {
  body;
  isDead = false;
  direction;
  #distanceTraveled = 0;

  constructor({ x, y, direction }) {
    this.direction = direction;
    this.body = createBody({
      x: direction > 0 ? x : x - SHOOT.width,
      y: y - SHOOT.height / 2,
      width: SHOOT.width,
      height: SHOOT.height,
      gravityScale: 0,
    });
    this.body.vx = SHOOT.speed * direction;
  }

  update(deltaTime, solids) {
    stepBody(this.body, solids, deltaTime);
    this.#distanceTraveled += SHOOT.speed * deltaTime;
    const { left, right, ground, ceiling } = this.body.contacts;
    if (left || right || ground || ceiling) this.isDead = true;
    if (this.#distanceTraveled >= SHOOT.maxDistance) this.isDead = true;
  }
}
