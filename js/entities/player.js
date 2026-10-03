import { BATTERY, PLAYER, PLAYER_FEEDBACK, SHOOT } from '../config.js';
import { approach } from '../core/math-utils.js';
import { Timer } from '../core/timer.js';
import { createBody, stepBody, velocityForHeight } from '../physics/physics.js';
import { Battery } from './battery.js';

const JUMP_VELOCITY = velocityForHeight(PLAYER.jumpHeight);
const DOUBLE_JUMP_VELOCITY = velocityForHeight(PLAYER.doubleJumpHeight);

// Estado y reglas del robot. No toca el DOM: las vistas lo dibujan.
export class Player {
  body = createBody({ width: PLAYER.width, height: PLAYER.height });
  facing = 1;
  jumpsUsed = 0;
  coyoteTimer = 0;
  jumpBufferTimer = 0;
  battery;

  #events;
  #batteryEmptyEmitted = false;
  #shootCooldown = new Timer();
  #landTimer = new Timer();
  #shootPoseTimer = new Timer();
  #hurtTimer = new Timer();

  constructor(spawn, events) {
    this.#events = events;
    this.battery = new Battery(BATTERY.max);
    this.placeAt(spawn);
  }

  get isGrounded() {
    return this.body.contacts.ground;
  }

  get isWalking() {
    return this.isGrounded && Math.abs(this.body.vx) > PLAYER_FEEDBACK.walkSpeedThreshold;
  }

  get isJumping() { return this.body.vy < 0; }
  get isFalling() { return this.body.vy > 0 && !this.isGrounded; }
  get isLanding() { return this.#landTimer.active; }
  get isShooting() { return this.#shootPoseTimer.active; }
  get isHurt() { return this.#hurtTimer.active; }
  get isInvulnerable() { return this.#hurtTimer.active; }

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
    this.#updateTimers(deltaTime);
    this.#updateRun(deltaTime, input);
    this.#updateJump(deltaTime, input);
    this.#updateShoot(input);
    this.#detectLanding();
    stepBody(this.body, solids, deltaTime);
    this.#detectLandingPost();
    this.#updateBattery(deltaTime);
  }

  takeHit(amount) {
    if (this.isInvulnerable) return;
    this.battery.drain(amount);
    this.#hurtTimer.start(PLAYER_FEEDBACK.hurtInvulnerability);
    this.#events.emit('player:hurt');
  }

  // --- métodos privados ---

  #wasInAir = false;

  #updateTimers(deltaTime) {
    this.#shootCooldown.update(deltaTime);
    this.#landTimer.update(deltaTime);
    this.#shootPoseTimer.update(deltaTime);
    this.#hurtTimer.update(deltaTime);
  }

  #updateRun(deltaTime, input) {
    const direction = Number(input.isHeld('right')) - Number(input.isHeld('left'));
    if (direction !== 0) {
      this.facing = direction;
      this.#events.emit('player:move');
    }
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
      this.#events.emit('player:jump');
    } else if (this.jumpsUsed < PLAYER.maxJumps) {
      this.#jump(DOUBLE_JUMP_VELOCITY, Math.max(this.jumpsUsed, 1) + 1);
      this.#events.emit('player:double-jump');
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

  #updateShoot(input) {
    if (!input.consumePress('shoot')) return;
    if (this.#shootCooldown.active) return;
    if (!this.battery.spend(BATTERY.shotCost)) return;
    this.#shootCooldown.start(SHOOT.cooldown);
    this.#shootPoseTimer.start(PLAYER_FEEDBACK.shootPoseDuration);
    const cx = this.body.x + this.body.width / 2;
    const x = cx + SHOOT.muzzleOffset.x * this.facing;
    const y = this.body.y + SHOOT.muzzleOffset.y;
    this.#events.emit('player:shoot', { x, y, direction: this.facing });
  }

  #detectLanding() {
    this.#wasInAir = !this.isGrounded;
  }

  #detectLandingPost() {
    if (this.#wasInAir && this.isGrounded) {
      this.#landTimer.start(PLAYER_FEEDBACK.landDuration);
      this.#events.emit('player:land');
    }
  }

  #updateBattery(deltaTime) {
    this.battery.drain(BATTERY.drainPerSecond * deltaTime);
    if (this.battery.isEmpty && !this.#batteryEmptyEmitted) {
      this.#batteryEmptyEmitted = true;
      this.#events.emit('player:battery-empty');
    }
    if (!this.battery.isEmpty) this.#batteryEmptyEmitted = false;
  }
}
