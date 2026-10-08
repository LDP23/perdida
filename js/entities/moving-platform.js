/**
 * @module moving-platform
 *
 * Plataforma que va y vuelve entre dos puntos (vaivén), con pausa en cada extremo.
 * Interpola linealmente la posición: sirve para trayectos horizontales, verticales o diagonales.
 *
 * Usado por: SceneWorld (la crea), PlatformSystem (la actualiza).
 * Depende de: config.js (PLATFORMS.moving), platform.js (herencia).
 */
import { PLATFORMS } from '../config.js';
import { Platform } from './platform.js';

/**
 * Plataforma con movimiento de vaivén.
 *
 * Ciclo de vida: SceneWorld la crea; PlatformSystem llama update(); se destruye al cambiar de escena.
 * Colabora con: PlatformSystem (arrastre del rider).
 */
export class MovingPlatform extends Platform {
  /** @type {{x: number, y: number}} — punto de inicio, en px del mundo */
  #from;
  /** @type {{x: number, y: number}} — punto de destino, en px del mundo */
  #to;
  /** @type {number} — velocidad de desplazamiento, en px/s */
  #speed;
  /** @type {number} — duración de la pausa en cada extremo, en segundos */
  #endPause;
  /** @type {number} — progreso de la interpolación: 0 = from, 1 = to */
  #progress = 0;
  /** @type {1|-1} — dirección del progreso: 1 = hacia to, -1 = hacia from */
  #direction = 1;
  /** @type {number} — tiempo restante de pausa en el extremo, en segundos */
  #pauseTimer = 0;
  /** @type {number} — distancia total entre from y to, en px del mundo */
  #totalDistance;

  /**
   * @param {Object} opts
   * @param {{x: number, y: number}} opts.from — punto de inicio.
   * @param {{x: number, y: number}} opts.to — punto de destino.
   * @param {number} opts.width — ancho de la plataforma, en px del mundo.
   */
  constructor({ from, to, width }) {
    super(from.x, from.y, width, PLATFORMS.moving.height);
    this.#from = from;
    this.#to = to;
    this.#speed = PLATFORMS.moving.speed;
    this.#endPause = PLATFORMS.moving.endPause;
    const diffX = to.x - from.x;
    const diffY = to.y - from.y;
    this.#totalDistance = Math.sqrt(diffX * diffX + diffY * diffY);
  }

  /** @returns {{x: number, y: number}} punto de inicio */
  get from() { return this.#from; }
  /** @returns {{x: number, y: number}} punto de destino */
  get to() { return this.#to; }
  /** @returns {'moving'} estado visual (siempre 'moving' para esta plataforma) */
  get visualState() { return 'moving'; }

  /**
   * Avanza la interpolación y actualiza la posición de la plataforma.
   * @param {number} deltaTime — segundos del paso actual.
   */
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
