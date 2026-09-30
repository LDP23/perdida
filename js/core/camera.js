import { CAMERA, WORLD } from '../config.js';
import { clamp, damp } from './math-utils.js';

// La cámara solo calcula números (escala y desplazamiento); world-view.js los aplica.
// El mundo se escala para ocupar el alto de la pantalla, así que solo hay
// desplazamiento horizontal: lo visible a lo ancho depende de la pantalla.
export class Camera {
  x = 0;
  scale = 1;
  viewWidth = WORLD.width;

  resize(viewportWidth, viewportHeight) {
    this.scale = viewportHeight / WORLD.height;
    this.viewWidth = viewportWidth / this.scale;
  }

  follow(target, sceneWidth, deltaTime) {
    const goal = this.#goalFor(target, sceneWidth);
    this.x = damp(this.x, goal, CAMERA.followSharpness, deltaTime);
  }

  // Al entrar a una escena, la cámara aparece ya en su sitio (sin barrido).
  jumpTo(target, sceneWidth) {
    this.x = this.#goalFor(target, sceneWidth);
  }

  // Redondeado a píxeles reales de la pantalla: evita que el pixel art
  // "tiemble" o se vea borroso al moverse por fracciones de píxel.
  get snappedX() {
    return Math.round(this.x * this.scale) / this.scale;
  }

  screenToWorld(screenX, screenY) {
    return { x: this.snappedX + screenX / this.scale, y: screenY / this.scale };
  }

  #goalFor(target, sceneWidth) {
    const maxX = sceneWidth - this.viewWidth;
    // Pantalla más ancha que la escena: se centra en vez de seguir.
    if (maxX <= 0) return maxX / 2;
    const targetCenter = target.x + target.width / 2;
    return clamp(targetCenter - this.viewWidth * CAMERA.anchor, 0, maxX);
  }
}
