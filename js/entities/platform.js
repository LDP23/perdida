/**
 * @module platform
 *
 * Clase base para todas las plataformas: un rectángulo sólido que se puede mover.
 * Las subclases definen cómo se mueve (MovingPlatform: vaivén, FallingPlatform: caída).
 *
 * Usado por: MovingPlatform, FallingPlatform (herencia).
 * Depende de: config.js (PLATFORMS.thickness).
 */
import { PLATFORMS } from '../config.js';

/**
 * Plataforma base. Rastrea su posición anterior para calcular el desplazamiento
 * del último paso (dx, dy), que PlatformSystem usa para arrastrar al rider.
 *
 * Ciclo de vida: SceneWorld crea las subclases a partir de los datos de escena;
 * PlatformSystem las actualiza; se destruyen al cambiar de escena.
 */
export class Platform {
  /** @type {number} — posición X del paso anterior, en px del mundo */
  #prevX;
  /** @type {number} — posición Y del paso anterior, en px del mundo */
  #prevY;
  /** @type {boolean} — si la plataforma actúa como sólido (false cuando está cayendo) */
  #isSolid = true;

  /**
   * @param {number} x — borde izquierdo, en px del mundo.
   * @param {number} y — borde superior, en px del mundo.
   * @param {number} width — ancho, en px del mundo.
   */
  constructor(x, y, width) {
    const h = PLATFORMS.thickness;
    this.body = { x, y, width, height: h, kind: 'solid' };
    this.#prevX = x;
    this.#prevY = y;
  }

  /** @returns {number} desplazamiento horizontal desde el paso anterior, en px */
  get dx() { return this.body.x - this.#prevX; }
  /** @returns {number} desplazamiento vertical desde el paso anterior, en px */
  get dy() { return this.body.y - this.#prevY; }
  /** @returns {boolean} si la plataforma es sólida actualmente */
  get isSolid() { return this.#isSolid; }

  /** @param {boolean} value */
  set isSolid(value) { this.#isSolid = value; }

  /** Guarda la posición actual antes de mover, para calcular dx/dy después */
  savePrevious() {
    this.#prevX = this.body.x;
    this.#prevY = this.body.y;
  }
}
