/**
 * @module enemy
 *
 * Criatura enemiga con máquina de estados simple: patrulla, persigue al robot,
 * ataca con zarpazo, recibe daño y muere. Implementa la interfaz "shootable".
 *
 * Usado por: CombatSystem (verifica impactos y daño de contacto), SceneWorld (la crea).
 * Depende de: config.js (ENEMY), timer.js, physics.js.
 *
 * Máquina de estados de la criatura:
 * No usa StateMachine (diseñada para estados de UI con pila y data-attributes),
 * sino un estado simple (#state) con Timer y transiciones explícitas.
 *
 * Estados y transiciones:
 * - patrol: camina entre patrol.x1 y patrol.x2, invierte dirección en los bordes.
 *   → chase: si detecta al robot (distancia horizontal ≤ detectRange Y vertical ≤ detectHeight).
 * - chase: corre hacia el robot a chaseSpeed.
 *   → patrol: si pierde de vista al robot.
 *   → windup: si está a distancia de ataque (≤ attackRange).
 * - windup: se detiene y prepara el zarpazo (windupTime).
 *   → strike: al terminar el tiempo.
 * - strike: ejecuta el zarpazo (strikeTime). strikeRect es el área de daño.
 *   → recover: al terminar el tiempo.
 * - recover: descansa tras el ataque (recoverTime).
 *   → chase o patrol: según si ve al robot.
 * - hurt: recibió un disparo pero no murió (hurtTime). Se detiene.
 *   → patrol: al terminar.
 * - dying: perdió toda la salud (dyingTime). Se detiene.
 *   → dead: al terminar.
 * - dead: cadáver visible (corpseTime), luego se desvanece (fadeTime), luego isDead.
 */
import { ENEMY } from '../config.js';
import { Timer } from '../core/timer.js';
import { createBody, stepBody } from '../physics/physics.js';

/**
 * Criatura enemiga.
 *
 * Ciclo de vida: SceneWorld la crea a partir de los datos de escena;
 * CombatSystem la registra como shootable; al morir se marca isDead y
 * EntityCollection la elimina.
 * Colabora con: CombatSystem (daño), EnemyView (dibujado).
 */
export class Enemy {
  /** @type {Body} — cuerpo físico con gravedad */
  body;
  /** @type {1|-1} — dirección a la que mira */
  facing = -1;
  /** @type {boolean} — true cuando debe ser eliminada */
  isDead = false;
  /** @type {string} — estado actual de la máquina de estados */
  #state = 'patrol';
  /** @type {number} — salud restante (disparos para destruirla) */
  #health;
  /** @type {{x1: number, x2: number}} — límites de patrulla, en px del mundo */
  #patrol;
  /** @type {EventBus} */
  #events;
  /** @type {Timer} — temporizador del estado actual */
  #stateTimer = new Timer();
  /** @type {Timer} — desvanecimiento final del cadáver */
  #fadeTimer = new Timer();
  /** @type {boolean} — si ya conectó el zarpazo en este swing (evita daño doble) */
  #hasStruckThisSwing = false;
  /** @type {boolean} — si el desvanecimiento final ya empezó */
  #fadeStarted = false;
  /** @type {string|null} — ID de tripulante que suelta al morir */
  #dropsCrewId;

  /**
   * @param {Object} data — datos de la criatura desde los datos de escena.
   * @param {number} data.x — centro horizontal (pies), en px del mundo.
   * @param {number} data.y — base (pies), en px del mundo.
   * @param {{x1: number, x2: number}} data.patrol — límites de patrulla.
   * @param {string} [data.dropsCrewId] — ID de tripulante que suelta al morir.
   * @param {EventBus} events — bus de eventos.
   */
  constructor({ x, y, patrol, dropsCrewId }, events) {
    this.body = createBody({ width: ENEMY.width, height: ENEMY.height });
    // x,y son los pies: centrar la hitbox horizontalmente, alinear abajo
    this.body.x = x - ENEMY.width / 2;
    this.body.y = y - ENEMY.height;
    this.#health = ENEMY.health;
    this.#patrol = patrol;
    this.#dropsCrewId = dropsCrewId ?? null;
    this.#events = events;
  }

  /** @returns {string} estado actual de la máquina de estados */
  get state() { return this.#state; }
  /** @returns {number} salud restante */
  get health() { return this.#health; }
  /** @returns {boolean} true si puede recibir disparos (no está muriendo/muerta) */
  get canBeShot() { return this.#state !== 'dying' && this.#state !== 'dead'; }
  /** @returns {boolean} true si hace daño de contacto (no está muriendo/muerta) */
  get canDamageOnContact() { return this.#state !== 'dying' && this.#state !== 'dead'; }
  /** @returns {boolean} true durante el desvanecimiento final */
  get isFading() { return this.#fadeTimer.active; }

  /** @returns {string} estado visual para la vista (prioridad: dead > dying > hurt > strike > windup > walking > idle) */
  get visualState() {
    if (this.#state === 'dead') return 'dead';
    if (this.#state === 'dying') return 'dying';
    if (this.#state === 'hurt') return 'hurt';
    if (this.#state === 'strike') return 'strike';
    if (this.#state === 'windup') return 'windup';
    if (Math.abs(this.body.vx) > 10) return 'walking';
    return 'idle';
  }

  /**
   * Rectángulo de daño del zarpazo (solo existe durante 'strike' y antes de conectar).
   * @returns {Rect|null} rectángulo del zarpazo o null si no aplica.
   */
  get strikeRect() {
    if (this.#state !== 'strike' || this.#hasStruckThisSwing) return null;
    const sx = this.facing > 0
      ? this.body.x + this.body.width
      : this.body.x - ENEMY.strikeReach;
    const sy = this.body.y + this.body.height - ENEMY.strikeHeight;
    return { x: sx, y: sy, width: ENEMY.strikeReach, height: ENEMY.strikeHeight };
  }

  /**
   * Interfaz shootable: recibe un disparo. Reduce salud; si llega a cero, entra en dying.
   */
  onShot() {
    if (!this.canBeShot) return;
    this.#health--;
    if (this.#health <= 0) {
      this.#enterDying();
      return;
    }
    this.#enterHurt();
  }

  /** Marca que el zarpazo ya conectó en este swing (evita daño doble). */
  onStrikeHit() {
    this.#hasStruckThisSwing = true;
  }

  /**
   * Actualiza la máquina de estados, la física y limita la posición a la zona de patrulla.
   *
   * @param {number} dt — deltaTime en segundos.
   * @param {Rect[]} solids — sólidos de la escena.
   * @param {Body} playerBody — cuerpo del robot (para detección y persecución).
   */
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
    const footX = this.body.x + this.body.width / 2;
    const footY = this.body.y + this.body.height;
    this.#events.emit('enemy:destroyed', {
      x: footX,
      y: footY,
      dropsCrewId: this.#dropsCrewId,
    });
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
