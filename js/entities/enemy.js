import { ENEMY } from '../config.js';
import { Timer } from '../core/timer.js';
import { createBody, stepBody } from '../physics/physics.js';

// Criatura enemiga: patrulla, persigue, ataca con zarpazo.
// No usa StateMachine (diseñada para estados de UI con pila y data-attributes),
// sino un estado simple con Timer y transiciones explícitas.
export class Enemy {
  body;
  facing = -1;
  isDead = false;
  #state = 'patrol';
  #health;
  #patrol;
  #events;
  #stateTimer = new Timer();
  #fadeTimer = new Timer();
  #hasStruckThisSwing = false;
  #fadeStarted = false;

  constructor({ x, y, patrol }, events) {
    this.body = createBody({ width: ENEMY.width, height: ENEMY.height });
    // x,y son los pies: centrar la hitbox horizontalmente, alinear abajo
    this.body.x = x - ENEMY.width / 2;
    this.body.y = y - ENEMY.height;
    this.#health = ENEMY.health;
    this.#patrol = patrol;
    this.#events = events;
  }

  get state() { return this.#state; }
  get health() { return this.#health; }
  get canBeShot() { return this.#state !== 'dying' && this.#state !== 'dead'; }
  get canDamageOnContact() { return this.#state !== 'dying' && this.#state !== 'dead'; }
  get isFading() { return this.#fadeTimer.active; }

  get visualState() {
    if (this.#state === 'dead') return 'dead';
    if (this.#state === 'dying') return 'dying';
    if (this.#state === 'hurt') return 'hurt';
    if (this.#state === 'strike') return 'strike';
    if (this.#state === 'windup') return 'windup';
    if (Math.abs(this.body.vx) > 10) return 'walking';
    return 'idle';
  }

  get strikeRect() {
    if (this.#state !== 'strike' || this.#hasStruckThisSwing) return null;
    const sx = this.facing > 0
      ? this.body.x + this.body.width
      : this.body.x - ENEMY.strikeReach;
    const sy = this.body.y + this.body.height - ENEMY.strikeHeight;
    return { x: sx, y: sy, width: ENEMY.strikeReach, height: ENEMY.strikeHeight };
  }

  // Interfaz shootable (mismo camino que el espantapájaros)
  onShot() {
    if (!this.canBeShot) return;
    this.#health--;
    if (this.#health <= 0) {
      this.#enterDying();
      return;
    }
    this.#enterHurt();
  }

  onStrikeHit() {
    this.#hasStruckThisSwing = true;
  }

  update(dt, solids, playerBody) {
    this.#stateTimer.update(dt);
    this.#fadeTimer.update(dt);
    if (this.isDead) return;

    switch (this.#state) {
      case 'patrol': this.#updatePatrol(playerBody); break;
      case 'chase': this.#updateChase(playerBody); break;
      case 'windup': this.#updateWindup(); break;
      case 'strike': this.#updateStrike(); break;
      case 'recover': this.#updateRecover(playerBody); break;
      case 'hurt': this.#updateHurt(); break;
      case 'dying': this.#updateDying(); break;
      case 'dead': this.#updateDead(); break;
    }

    if (this.#state !== 'dead') {
      stepBody(this.body, solids, dt);
      this.#clampToPatrol();
    }
  }

  // --- Estados ---

  #updatePatrol(playerBody) {
    if (this.#detectsPlayer(playerBody)) {
      this.#enterChase(playerBody);
      return;
    }
    this.body.vx = ENEMY.patrolSpeed * this.facing;
    const footCx = this.body.x + this.body.width / 2;
    if (footCx <= this.#patrol.x1 && this.facing < 0) this.facing = 1;
    if (footCx >= this.#patrol.x2 && this.facing > 0) this.facing = -1;
  }

  #updateChase(playerBody) {
    if (!this.#detectsPlayer(playerBody)) {
      this.#enterPatrol();
      return;
    }
    this.#facePlayer(playerBody);
    if (this.#horizontalDist(playerBody) <= ENEMY.attackRange) {
      this.#enterWindup(playerBody);
      return;
    }
    this.body.vx = ENEMY.chaseSpeed * this.facing;
  }

  #updateWindup() {
    this.body.vx = 0;
    if (!this.#stateTimer.active) this.#enterStrike();
  }

  #updateStrike() {
    this.body.vx = 0;
    if (!this.#stateTimer.active) this.#enterRecover();
  }

  #updateRecover(playerBody) {
    this.body.vx = 0;
    if (!this.#stateTimer.active) {
      if (this.#detectsPlayer(playerBody)) this.#enterChase(playerBody);
      else this.#enterPatrol();
    }
  }

  #updateHurt() {
    this.body.vx = 0;
    if (!this.#stateTimer.active) this.#enterPatrol();
  }

  #updateDying() {
    this.body.vx = 0;
    if (!this.#stateTimer.active) {
      this.#state = 'dead';
      this.#stateTimer.start(ENEMY.corpseTime);
    }
  }

  #updateDead() {
    if (!this.#stateTimer.active && !this.#fadeStarted) {
      this.#fadeStarted = true;
      this.#fadeTimer.start(ENEMY.fadeTime);
    }
    if (this.#fadeStarted && !this.#fadeTimer.active) {
      this.isDead = true;
    }
  }

  // --- Transiciones ---

  #enterPatrol() { this.#state = 'patrol'; }

  #enterChase(playerBody) {
    this.#state = 'chase';
    this.#facePlayer(playerBody);
  }

  #enterWindup(playerBody) {
    this.#state = 'windup';
    this.#stateTimer.start(ENEMY.windupTime);
    this.body.vx = 0;
    this.#facePlayer(playerBody);
  }

  #enterStrike() {
    this.#state = 'strike';
    this.#stateTimer.start(ENEMY.strikeTime);
    this.#hasStruckThisSwing = false;
  }

  #enterRecover() {
    this.#state = 'recover';
    this.#stateTimer.start(ENEMY.recoverTime);
  }

  #enterHurt() {
    this.#state = 'hurt';
    this.#stateTimer.start(ENEMY.hurtTime);
    this.body.vx = 0;
  }

  #enterDying() {
    this.#state = 'dying';
    this.#stateTimer.start(ENEMY.dyingTime);
    this.body.vx = 0;
    this.#events.emit('enemy:destroyed');
  }

  // --- Detección ---

  #detectsPlayer(playerBody) {
    return this.#horizontalDist(playerBody) <= ENEMY.detectRange
        && this.#verticalDist(playerBody) <= ENEMY.detectHeight;
  }

  #horizontalDist(playerBody) {
    const myCx = this.body.x + this.body.width / 2;
    const pCx = playerBody.x + playerBody.width / 2;
    return Math.abs(pCx - myCx);
  }

  #verticalDist(playerBody) {
    const myCy = this.body.y + this.body.height / 2;
    const pCy = playerBody.y + playerBody.height / 2;
    return Math.abs(pCy - myCy);
  }

  #facePlayer(playerBody) {
    const pCx = playerBody.x + playerBody.width / 2;
    const myCx = this.body.x + this.body.width / 2;
    this.facing = pCx > myCx ? 1 : -1;
  }

  #clampToPatrol() {
    if (this.#state === 'dying' || this.#state === 'dead') return;
    const footCx = this.body.x + this.body.width / 2;
    if (footCx < this.#patrol.x1) {
      this.body.x = this.#patrol.x1 - this.body.width / 2;
      this.body.vx = 0;
    }
    if (footCx > this.#patrol.x2) {
      this.body.x = this.#patrol.x2 - this.body.width / 2;
      this.body.vx = 0;
    }
  }
}
