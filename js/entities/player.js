import { PLAYER } from '../config.js';
import { approach } from '../core/math-utils.js';
import { createBody, stepBody, velocityForHeight } from '../physics/physics.js';

const JUMP_VELOCITY = velocityForHeight(PLAYER.jumpHeight);
const DOUBLE_JUMP_VELOCITY = velocityForHeight(PLAYER.doubleJumpHeight);

// Estado y reglas del robot. No toca el DOM: entity-view.js lo dibuja.
// En la etapa 2 se suman disparo, batería y los estados para las animaciones.
export class Player {
  body = createBody({ width: PLAYER.width, height: PLAYER.height });
  facing = 1;
  jumpsUsed = 0;
  coyoteTimer = 0;
  jumpBufferTimer = 0;

  constructor(spawn) {
    this.placeAt(spawn);
  }

  get isGrounded() {
    return this.body.contacts.ground;
  }

  // Coloca los pies del robot en el punto indicado (así se escriben los spawns).
  placeAt({ x, y }) {
    this.body.x = x - this.body.width / 2;
    this.body.y = y - this.body.height;
    this.body.vx = 0;
    this.body.vy = 0;
    this.jumpsUsed = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
  }

  update(deltaTime, input, solids) {
    this.#updateRun(deltaTime, input);
    this.#updateJump(deltaTime, input);
    stepBody(this.body, solids, deltaTime);
  }

  #updateRun(deltaTime, input) {
    const direction = Number(input.isHeld('right')) - Number(input.isHeld('left'));
    if (direction !== 0) this.facing = direction;
    const rate = this.#accelerationFor(direction);
    this.body.vx = approach(this.body.vx, direction * PLAYER.runSpeed, rate * deltaTime);
  }

  #accelerationFor(direction) {
    if (!this.isGrounded) return PLAYER.airAcceleration;
    return direction === 0 ? PLAYER.groundDeceleration : PLAYER.groundAcceleration;
  }

  #updateJump(deltaTime, input) {
    this.#refreshGroundTimers(deltaTime);
    this.jumpBufferTimer = input.consumePress('jump')
      ? PLAYER.jumpBufferTime
      : this.jumpBufferTimer - deltaTime;
    if (this.jumpBufferTimer <= 0) return;

    if (this.coyoteTimer > 0) {
      this.#jump(JUMP_VELOCITY, 1);
    } else if (this.jumpsUsed < PLAYER.maxJumps) {
      // Si cayó de un borde sin saltar, el salto en el aire cuenta como el
      // doble salto. Si no, caer + 2 saltos aéreos cruzaría el foso de 290 px.
      this.#jump(DOUBLE_JUMP_VELOCITY, Math.max(this.jumpsUsed, 1) + 1);
    }
  }

  #refreshGroundTimers(deltaTime) {
    if (this.isGrounded) {
      this.coyoteTimer = PLAYER.coyoteTime;
      this.jumpsUsed = 0;
    } else {
      this.coyoteTimer -= deltaTime;
    }
  }

  #jump(velocity, jumpsUsed) {
    this.body.vy = -velocity;
    this.jumpsUsed = jumpsUsed;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
  }
}
