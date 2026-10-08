/**
 * @module turret
 *
 * Torreta: trampa del nivel 3 que dispara proyectiles al robot. Es trampa
 * y además implementa la interfaz shootable (body + onShot). El robot
 * la destruye disparándole.
 *
 * Ciclo de fases (mientras está viva):
 *   idle → aiming → fire → cooldown → idle …
 *
 * En la fase 'fire', emite 'turret:fire' una sola vez. CombatSystem crea
 * el proyectil enemy. Al recibir impactos suficientes, emite 'turret:destroyed'
 * y queda como chatarra (sin peligro y sin ser disparable).
 *
 * La posición del dato (x, y) es el centro de la torreta. La boca del cañón
 * se calcula a partir de los offsets del sprite (docs/SPRITES.md).
 *
 * Usado por: trap-factory.js (mapa type → clase), SceneWorld (como shootable).
 * Depende de: config.js (TRAPS.turret), trap.js.
 */
import { TRAPS } from '../config.js';
import { Trap } from './trap.js';

const T = TRAPS.turret;

/**
 * Torreta.
 *
 * Datos de escena: { type: 'turret', x, y, direction, phaseOffset? }
 * - x, y: centro de la torreta.
 * - direction: -1 (izquierda) o 1 (derecha).
 */
export class Turret extends Trap {
  /** @type {Rect} — hitbox de la torreta (interfaz shootable) */
  body;
  /** @type {1|-1} — dirección de disparo */
  #direction;
  /** @type {number} — puntos de vida restantes */
  #health;
  /** @type {boolean} — true cuando fue destruida */
  #destroyed = false;
  /** @type {boolean} — true si ya se emitió el disparo en esta fase fire */
  #firedThisPhase = false;
  /** @type {number} — x de la boca del cañón */
  #muzzleX;
  /** @type {number} — y de la boca del cañón */
  #muzzleY;
  /** @type {EventBus|null} — bus de eventos (se asigna al montar la escena) */
  #events = null;
  /** @type {number} — contador de impactos recibidos (para destello en la vista) */
  #hitFlashCount = 0;

  constructor(data) {
    const dir = data.direction ?? -1;
    const zone = {
      x: data.x - T.spriteWidth / 2,
      y: data.y - T.spriteHeight / 2,
      width: T.spriteWidth,
      height: T.spriteHeight,
    };

    super([
      { name: 'idle',     duration: T.idleTime },
      { name: 'aiming',   duration: T.aimTime },
      { name: 'fire',     duration: 0.1 },
      { name: 'cooldown', duration: T.cooldownTime },
    ], zone, data.phaseOffset);

    this.#direction = dir;
    this.#health = T.health;

    const muzzleFromLeft = T.spriteWidth - T.muzzleOffsetX;
    const muzzleFromTop = T.spriteHeight - T.muzzleOffsetY;

    if (dir === -1) {
      this.#muzzleX = zone.x + muzzleFromLeft;
    } else {
      this.#muzzleX = zone.x + T.spriteWidth - muzzleFromLeft;
    }
    this.#muzzleY = zone.y + muzzleFromTop;

    this.body = { ...zone };
  }

  get type() { return 'turret'; }
  get destroyed() { return this.#destroyed; }
  get canBeShot() { return !this.#destroyed; }

  get viewData() {
    return {
      '--turret-dir': this.#direction,
      '--turret-hit-count': this.#hitFlashCount,
    };
  }

  /** Conecta el bus de eventos para emitir turret:fire y turret:destroyed */
  setEvents(events) {
    this.#events = events;
  }

  /** Interfaz shootable: recibe un impacto del proyectil del robot */
  onShot() {
    if (this.#destroyed) return;
    this.#health--;
    this.#hitFlashCount++;
    if (this.#health <= 0) {
      this.#destroyed = true;
      this.#events?.emit('turret:destroyed', {
        x: this.#muzzleX,
        y: this.#muzzleY,
      });
    }
  }

  update(dt) {
    if (this.#destroyed) return;
    const prevPhase = this.phase;
    super.update(dt);
    const newPhase = this.phase;

    if (newPhase === 'fire' && prevPhase !== 'fire') {
      this.#firedThisPhase = false;
    }
    if (newPhase === 'fire' && !this.#firedThisPhase) {
      this.#firedThisPhase = true;
      this.#events?.emit('turret:fire', {
        x: this.#muzzleX,
        y: this.#muzzleY,
        direction: this.#direction,
      });
    }
  }
}
