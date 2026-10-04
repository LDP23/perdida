import { PHYSICS, PLATFORMS } from '../config.js';
import { rectsOverlap } from '../physics/collision.js';
import { Platform } from './platform.js';

// Plataforma que cae al pisarla:
// idle → shaking (aviso) → falling (deja de ser sólida) → hidden → respawning → idle.
export class FallingPlatform extends Platform {
  #originY;
  #shakeTime;
  #respawnTime;
  #state = 'idle';
  #timer = 0;
  #fallVy = 0;

  constructor({ x, y, width }) {
    super(x, y, width);
    this.#originY = y;
    this.#shakeTime = PLATFORMS.falling.shakeTime;
    this.#respawnTime = PLATFORMS.falling.respawnTime;
  }

  get visualState() { return this.#state; }

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

  // Llamado por PlayingState cuando el robot pisa esta plataforma
  onStepped() {
    if (this.#state === 'idle') {
      this.#state = 'shaking';
      this.#timer = this.#shakeTime;
    }
  }

  // No reaparecer encima del robot
  isBlockedByBody(playerBody) {
    if (this.#state !== 'respawning') return false;
    // Chequear si el jugador ocupa el espacio de reaparición
    const spawnRect = { x: this.body.x, y: this.#originY, width: this.body.width, height: this.body.height };
    return rectsOverlap(playerBody, spawnRect);
  }
}
