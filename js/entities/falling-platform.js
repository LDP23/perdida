/**
 * @module falling-platform
 *
 * Plataforma que cae al ser pisada por el robot. Ciclo de estados:
 * idle → shaking (aviso visual) → falling (deja de ser sólida, cae con gravedad)
 * → hidden (invisible, espera respawnTime) → respawning (materialización) → idle.
 *
 * Usado por: SceneWorld (la crea), PlatformSystem (la actualiza y detecta pisadas).
 * Depende de: config.js (PHYSICS, PLATFORMS.falling), collision.js, platform.js.
 */
import { PHYSICS, PLATFORMS } from '../config.js';
import { rectsOverlap } from '../physics/collision.js';
import { Platform } from './platform.js';

/**
 * Plataforma que cae al pisarla.
 *
 * Ciclo de vida: SceneWorld la crea; PlatformSystem llama update() y onStepped();
 * se destruye al cambiar de escena.
 */
export class FallingPlatform extends Platform {
  /** @type {number} — posición Y original (para reaparecer en el mismo sitio) */
  #originY;
  /** @type {number} — duración del temblor antes de caer, en segundos */
  #shakeTime;
  /** @type {number} — tiempo que permanece oculta antes de reaparecer, en segundos */
  #respawnTime;
  /** @type {'idle'|'shaking'|'falling'|'hidden'|'respawning'} */
  #state = 'idle';
  /** @type {number} — temporizador del estado actual, en segundos */
  #timer = 0;
  /** @type {number} — velocidad vertical de caída, en px/s */
  #fallVy = 0;

  /**
   * @param {Object} opts
   * @param {number} opts.x — borde izquierdo, en px del mundo.
   * @param {number} opts.y — borde superior, en px del mundo.
   * @param {number} opts.width — ancho, en px del mundo.
   */
  constructor({ x, y, width }) {
    super(x, y, width, PLATFORMS.falling.height);
    this.#originY = y;
    this.#shakeTime = PLATFORMS.falling.shakeTime;
    this.#respawnTime = PLATFORMS.falling.respawnTime;
  }

  /** @returns {'idle'|'shaking'|'falling'|'hidden'|'respawning'} estado visual actual */
  get visualState() { return this.#state; }

  /**
   * Avanza la máquina de estados y actualiza la posición.
   * @param {number} deltaTime — segundos del paso actual.
   */
  update(deltaTime) {
    this.savePrevious();

    switch (this.#state) {
      case 'idle':
        break;

      case 'shaking':
        this.#timer -= deltaTime;
        if (this.#timer <= 0) {
          this.#state = 'falling';
          this.isSolid = false;
          this.#fallVy = 0;
        }
        break;

      case 'falling': {
        this.#fallVy += PHYSICS.gravity * PLATFORMS.falling.fallGravityScale * deltaTime;
        this.body.y += this.#fallVy * deltaTime;
        // Desaparecer cuando quede fuera de la escena
        if (this.body.y > 800) {
          this.#state = 'hidden';
          this.#timer = this.#respawnTime;
        }
        break;
      }

      case 'hidden':
        this.#timer -= deltaTime;
        if (this.#timer <= 0) {
          this.#state = 'respawning';
          this.#timer = 0.5;
          this.body.y = this.#originY;
        }
        break;

      case 'respawning':
        this.#timer -= deltaTime;
        if (this.#timer <= 0) {
          this.#state = 'idle';
          this.isSolid = true;
        }
        break;
    }
  }

  /**
   * Inicia el temblor (si estaba en idle). Llamado por PlatformSystem cuando
   * detecta que el robot está parado sobre esta plataforma.
   */
  onStepped() {
    if (this.#state === 'idle') {
      this.#state = 'shaking';
      this.#timer = this.#shakeTime;
    }
  }

  /**
   * Verifica si el robot ocupa el espacio de reaparición (para no reaparecer encima).
   * @param {Body} playerBody — cuerpo del robot.
   * @returns {boolean} true si el robot bloquea la reaparición.
   */
  isBlockedByBody(playerBody) {
    if (this.#state !== 'respawning') return false;
    // Chequear si el jugador ocupa el espacio de reaparición
    const spawnRect = { x: this.body.x, y: this.#originY, width: this.body.width, height: this.body.height };
    return rectsOverlap(playerBody, spawnRect);
  }
}
