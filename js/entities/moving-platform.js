import { PLATFORMS } from '../config.js';
import { Platform } from './platform.js';

// Plataforma que va y vuelve entre dos puntos, con pausa en cada extremo.
// Interpola posición: sirve para trayectos horizontales, verticales o diagonales.
export class MovingPlatform extends Platform {
  #from;
  #to;
  #speed;
  #endPause;
  #progress = 0;      // 0 = from, 1 = to
  #direction = 1;     // 1 = hacia to, -1 = hacia from
  #pauseTimer = 0;
  #totalDistance;

  constructor({ from, to, width }) {
    super(from.x, from.y, width);
    this.#from = from;
    this.#to = to;
    this.#speed = PLATFORMS.moving.speed;
    this.#endPause = PLATFORMS.moving.endPause;
    const diffX = to.x - from.x;
    const diffY = to.y - from.y;
    this.#totalDistance = Math.sqrt(diffX * diffX + diffY * diffY);
  }

  get from() { return this.#from; }
  get to() { return this.#to; }
  get visualState() { return 'moving'; }

  update(deltaTime) {
    this.savePrevious();

    // Pausa en los extremos
    if (this.#pauseTimer > 0) {
      this.#pauseTimer -= deltaTime;
      return;
    }

    // Avanzar progreso
    const step = (this.#speed * deltaTime) / this.#totalDistance;
    this.#progress += step * this.#direction;

    if (this.#progress >= 1) {
      this.#progress = 1;
      this.#direction = -1;
      this.#pauseTimer = this.#endPause;
    } else if (this.#progress <= 0) {
      this.#progress = 0;
      this.#direction = 1;
      this.#pauseTimer = this.#endPause;
    }

    this.body.x = this.#from.x + (this.#to.x - this.#from.x) * this.#progress;
    this.body.y = this.#from.y + (this.#to.y - this.#from.y) * this.#progress;
  }
}
