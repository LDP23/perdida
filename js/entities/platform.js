import { PLATFORMS } from '../config.js';

// Base para todas las plataformas: un rectángulo sólido que se mueve.
// Las hijas definen cómo se mueve (vaivén, caída, etc.).
export class Platform {
  #prevX;
  #prevY;
  #isSolid = true;

  constructor(x, y, width) {
    const h = PLATFORMS.thickness;
    this.body = { x, y, width, height: h, kind: 'solid' };
    this.#prevX = x;
    this.#prevY = y;
  }

  // Desplazamiento del último paso (para arrastrar al rider)
  get dx() { return this.body.x - this.#prevX; }
  get dy() { return this.body.y - this.#prevY; }
  get isSolid() { return this.#isSolid; }

  set isSolid(value) { this.#isSolid = value; }

  // Llamar antes de mover para calcular delta
  savePrevious() {
    this.#prevX = this.body.x;
    this.#prevY = this.body.y;
  }
}
