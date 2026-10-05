/**
 * @module player
 *
 * Lógica completa del robot: movimiento, salto (simple y doble), disparo, batería,
 * daño (con y sin knockback), muerte y reaparición. No toca el DOM: las vistas
 * (PlayerView) lo dibujan a partir de visualState y las propiedades públicas.
 *
 * Usado por: PlayingState (lo actualiza cada frame), HazardSystem, CombatSystem, SceneFlow.
 * Depende de: config.js, math-utils.js, timer.js, physics.js, battery.js.
 * Participa en: update se llama una vez por subpaso, después de mover plataformas.
 *
 * Coyote time, buffer de salto y doble salto:
 * - Coyote time: tras salir de un borde, el robot puede saltar durante coyoteTime (0.06 s).
 *   Esto hace que el control se sienta justo: el jugador no siente que "se le robó" el salto.
 * - Buffer de salto: si el jugador pulsa saltar un poco ANTES de tocar el piso (jumpBufferTime
 *   = 0.1 s), el salto ocurre automáticamente al aterrizar. Perdona la anticipación.
 * - Doble salto: si ya usó el salto normal y jumpsUsed < maxJumps, se ejecuta un salto
 *   más corto (doubleJumpHeight). Caer de un borde y saltar en el aire consume el doble
 *   salto (jumpsUsed se pone en max(jumpsUsed, 1) + 1), evitando cruzar fosos con
 *   2 saltos aéreos completos.
 *
 * @typedef {import('../physics/physics.js').Body} Body
 */
import { BATTERY, PLAYER, PLAYER_FEEDBACK, SHOOT } from '../config.js';
import { approach } from '../core/math-utils.js';
import { Timer } from '../core/timer.js';
import { createBody, stepBody, velocityForHeight } from '../physics/physics.js';
import { Battery } from './battery.js';

/** Velocidad inicial del salto normal, calculada con v = √(2·g·h) */
const JUMP_VELOCITY = velocityForHeight(PLAYER.jumpHeight);
/** Velocidad inicial del doble salto (más corto) */
const DOUBLE_JUMP_VELOCITY = velocityForHeight(PLAYER.doubleJumpHeight);

/**
 * El robot protagonista.
 *
 * Ciclo de vida: PlayingState lo crea con el spawn de la escena; vive toda la escena.
 * Colabora con: PlayerView (dibujado), Battery (energía), EventBus (emite eventos de jugador).
 */
export class Player {
  /** @type {Body} — hitbox de 48×112 px */
  body = createBody({ width: PLAYER.width, height: PLAYER.height });
  /** @type {1|-1} — dirección a la que mira (1 = derecha) */
  facing = 1;
  /** @type {number} — saltos usados en el aire actual (0 si está en el suelo) */
  jumpsUsed = 0;
  /** @type {number} — tiempo restante de coyote time, en segundos */
  coyoteTimer = 0;
  /** @type {number} — tiempo restante del buffer de salto, en segundos */
  jumpBufferTimer = 0;
  /** @type {Battery} — energía del robot */
  battery;

  /** @type {EventBus} */
  #events;
  /** @type {boolean} — evita emitir battery-empty más de una vez seguida */
  #batteryEmptyEmitted = false;
  /** @type {Timer} — cooldown entre disparos */
  #shootCooldown = new Timer();
  /** @type {Timer} — aplastamiento visual al aterrizar */
  #landTimer = new Timer();
  /** @type {Timer} — pose de ataque tras disparar */
  #shootPoseTimer = new Timer();
  /** @type {Timer} — invulnerabilidad tras recibir daño (incluye parpadeo) */
  #hurtTimer = new Timer();
  /** @type {Timer} — frame de daño (bloquea movimiento horizontal) */
  #hurtFrameTimer = new Timer();
  /** @type {Timer} — secuencia de muerte (congela jugabilidad) */
  #deathTimer = new Timer();
  /** @type {Timer} — secuencia de reaparición (materialización) */
  #respawnTimer = new Timer();
  /** @type {Timer} — aura roja visible tras recibir daño */
  #hurtAuraTimer = new Timer();

  /** @type {boolean} — true durante la secuencia de muerte */
  #isDying = false;
  /** @type {boolean} — true tras completar la secuencia de muerte */
  #isDead = false;
  /** @type {boolean} — true durante la reaparición */
  #isRespawning = false;
  /** @type {number} — contador de golpes recibidos (para reiniciar la animación del aura) */
  #hurtAuraCount = 0;

  /**
   * @param {{x: number, y: number}} spawn — posición inicial (centro-abajo del robot).
   * @param {EventBus} events — bus de eventos.
   */
  constructor(spawn, events) {
    this.#events = events;
    this.battery = new Battery(BATTERY.max);
    this.placeAt(spawn);
  }

  /** @returns {boolean} true si está apoyado en el suelo */
  get isGrounded() {
    return this.body.contacts.ground;
  }

  /** @returns {boolean} true si está caminando (en el suelo con velocidad > umbral) */
  get isWalking() {
    return this.isGrounded && Math.abs(this.body.vx) > PLAYER_FEEDBACK.walkSpeedThreshold;
  }

  get isJumping() { return this.body.vy < 0; }
  get isFalling() { return this.body.vy > 0 && !this.isGrounded; }
  get isLanding() { return this.#landTimer.active; }
  get isShooting() { return this.#shootPoseTimer.active; }
  get isHurt() { return this.#hurtTimer.active; }
  get isInvulnerable() { return this.#hurtTimer.active; }
  get isHurtFrame() { return this.#hurtFrameTimer.active; }
  get isDying() { return this.#isDying; }
  get isDead() { return this.#isDead; }
  get isRespawning() { return this.#isRespawning; }
  get hasHurtAura() { return this.#hurtAuraTimer.active; }
  get hurtAuraCount() { return this.#hurtAuraCount; }
  /**
   * Centraliza la verificación de si el robot puede recibir daño.
   * Excluye: invulnerabilidad post-daño, secuencia de muerte, muerto, reapareciendo.
   * @returns {boolean}
   */
  get canBeHurt() {
    return !this.isInvulnerable && !this.#isDying && !this.#isDead && !this.#isRespawning;
  }

  /**
   * Estado visual del robot, usado por PlayerView para aplicar la clase is-* correspondiente.
   * Prioridad (de mayor a menor): dying > respawning > hurt-frame > attacking > rising > falling > running > idle.
   * @returns {string}
   */
  get visualState() {
    if (this.#isDying) return 'dying';
    if (this.#isRespawning) return 'respawning';
    if (this.#hurtFrameTimer.active) return 'hurt-frame';
    if (this.#shootPoseTimer.active && this.isGrounded) return 'attacking';
    if (this.body.vy < 0) return 'rising';
    if (this.body.vy > 0 && !this.isGrounded) return 'falling';
    if (this.isWalking) return 'running';
    return 'idle';
  }

  /**
   * Coloca al robot en una posición (centro-abajo) y resetea su velocidad y saltos.
   * @param {{x: number, y: number}} pos — centro-abajo del robot, en px del mundo.
   */
  placeAt({ x, y }) {
    this.body.x = x - this.body.width / 2;
    this.body.y = y - this.body.height;
    this.body.vx = 0;
    this.body.vy = 0;
    this.jumpsUsed = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
  }

  /**
   * Inicia la secuencia de reaparición (materialización). Bloquea el input hasta que termine.
   * Emite: 'player:respawn-start'
   */
  startRespawn() {
    this.#isRespawning = true;
    this.#respawnTimer.start(PLAYER_FEEDBACK.respawnDuration);
    this.#events.emit('player:respawn-start');
  }

  /**
   * Actualiza toda la lógica del robot: temporizadores, movimiento, salto, disparo,
   * física y batería. Durante la muerte o el respawn, solo avanza temporizadores.
   *
   * @param {number} deltaTime — segundos del subpaso actual.
   * @param {Input} input — sistema de entrada.
   * @param {Rect[]} solids — sólidos de la escena (paredes, piso, plataformas activas).
   */
  update(deltaTime, input, solids) {
    this.#updateTimers(deltaTime);

    // Durante la muerte no se procesa nada mas
    if (this.#isDying) {
      if (!this.#deathTimer.active) {
        this.#isDying = false;
        this.#isDead = true;
        this.#events.emit('player:death-end');
      }
      return;
    }

    // Durante el respawn solo avanzar temporizadores
    if (this.#isRespawning) {
      if (!this.#respawnTimer.active) {
        this.#isRespawning = false;
        this.#events.emit('player:respawn-end');
      }
      return;
    }

    // Durante el frame de dano, bloquear movimiento horizontal
    if (this.#hurtFrameTimer.active) {
      this.#applyKnockback(deltaTime);
      stepBody(this.body, solids, deltaTime);
      this.#updateBattery(deltaTime);
      return;
    }

    this.#updateRun(deltaTime, input);
    this.#updateJump(deltaTime, input);
    this.#updateShoot(input);
    this.#detectLanding();
    stepBody(this.body, solids, deltaTime);
    this.#detectLandingPost();
    this.#updateBattery(deltaTime);
  }

  /**
   * Daño con origen conocido (enemigo): aplica knockback en dirección opuesta y sacudida.
   * Emite: 'player:hurt' { knockback: true }
   *
   * @param {number} amount — cantidad de batería a drenar.
   * @param {number} originX — posición X del origen del daño, en px del mundo.
   */
  takeHitWithOrigin(amount, originX) {
    if (!this.canBeHurt) return;
    this.battery.drain(amount);
    this.#hurtTimer.start(PLAYER_FEEDBACK.hurtInvulnerability);
    this.#hurtFrameTimer.start(PLAYER_FEEDBACK.hurtFrameDuration);
    this.#hurtAuraTimer.start(PLAYER_FEEDBACK.hurtAuraDuration);
    this.#hurtAuraCount++;
    const playerCx = this.body.x + this.body.width / 2;
    const dir = originX < playerCx ? 1 : -1;
    this.body.vx = dir * PLAYER_FEEDBACK.knockbackSpeed;
    this.#events.emit('player:hurt', { knockback: true });
  }

  /**
   * Daño sin origen conocido (peligros del escenario): sin knockback ni sacudida.
   * Emite: 'player:hurt' { knockback: false }
   *
   * @param {number} amount — cantidad de batería a drenar.
   */
  takeHit(amount) {
    if (!this.canBeHurt) return;
    this.battery.drain(amount);
    this.#hurtTimer.start(PLAYER_FEEDBACK.hurtInvulnerability);
    this.#hurtAuraTimer.start(PLAYER_FEEDBACK.hurtAuraDuration);
    this.#hurtAuraCount++;
    this.#events.emit('player:hurt', { knockback: false });
  }

  /**
   * Inicia la secuencia de muerte: congela jugabilidad, detiene velocidad.
   * Emite: 'player:death-start'
   */
  die() {
    if (this.#isDying || this.#isDead) return;
    this.#isDying = true;
    this.body.vx = 0;
    this.body.vy = 0;
    this.#deathTimer.start(PLAYER_FEEDBACK.deathSequenceDuration);
    this.#events.emit('player:death-start');
  }

  /** @type {boolean} — si estaba en el aire ANTES del paso actual (para detectar aterrizaje) */
  #wasInAir = false;

  /** Avanza todos los temporizadores internos */
  #updateTimers(deltaTime) {
    this.#shootCooldown.update(deltaTime);
    this.#landTimer.update(deltaTime);
    this.#shootPoseTimer.update(deltaTime);
    this.#hurtTimer.update(deltaTime);
    this.#hurtFrameTimer.update(deltaTime);
    this.#deathTimer.update(deltaTime);
    this.#respawnTimer.update(deltaTime);
    this.#hurtAuraTimer.update(deltaTime);
  }

  /** Desacelera el knockback linealmente hasta detenerse */
  #applyKnockback(deltaTime) {
    this.body.vx = approach(this.body.vx, 0, PLAYER.groundDeceleration * deltaTime);
  }

  /** Procesa input horizontal: aceleración, frenado, inversión de dirección */
  #updateRun(deltaTime, input) {
    const direction = Number(input.isHeld('right')) - Number(input.isHeld('left'));
    if (direction !== 0) {
      this.facing = direction;
      this.#events.emit('player:move');
    }
    const rate = this.#accelerationFor(direction);
    this.body.vx = approach(this.body.vx, direction * PLAYER.runSpeed, rate * deltaTime);
  }

  /** Selecciona la tasa de aceleración según si está en el suelo y la dirección */
  #accelerationFor(direction) {
    if (!this.isGrounded) return PLAYER.airAcceleration;
    return direction === 0 ? PLAYER.groundDeceleration : PLAYER.groundAcceleration;
  }

  /** Procesa salto: coyote time, buffer de salto, salto normal y doble salto */
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

  /** Resetea coyote timer y jumpsUsed al tocar el suelo; decrementa si está en el aire */
  #refreshGroundTimers(deltaTime) {
    if (this.isGrounded) {
      this.coyoteTimer = PLAYER.coyoteTime;
      this.jumpsUsed = 0;
    } else {
      this.coyoteTimer -= deltaTime;
    }
  }

  /** Ejecuta un salto: aplica velocidad vertical y resetea contadores */
  #jump(velocity, jumpsUsed) {
    this.body.vy = -velocity;
    this.jumpsUsed = jumpsUsed;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
  }

  /**
   * Procesa disparo: consume la pulsación, verifica cooldown y batería, emite evento.
   * Emite: 'player:shoot' { x, y, direction }
   */
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

  /** Guarda si estaba en el aire ANTES del paso de física */
  #detectLanding() {
    this.#wasInAir = !this.isGrounded;
  }

  /** Detecta si aterrizó en este paso (estaba en el aire y ahora está en el suelo) */
  #detectLandingPost() {
    if (this.#wasInAir && this.isGrounded) {
      this.#landTimer.start(PLAYER_FEEDBACK.landDuration);
      this.#events.emit('player:land');
    }
  }

  /**
   * Drena batería pasivamente y emite battery-empty cuando llega a cero.
   * Emite: 'player:battery-empty' (una sola vez, hasta que se recargue)
   */
  #updateBattery(deltaTime) {
    this.battery.drain(BATTERY.drainPerSecond * deltaTime);
    if (this.battery.isEmpty && !this.#batteryEmptyEmitted) {
      this.#batteryEmptyEmitted = true;
      this.#events.emit('player:battery-empty');
    }
    if (!this.battery.isEmpty) this.#batteryEmptyEmitted = false;
  }
}
