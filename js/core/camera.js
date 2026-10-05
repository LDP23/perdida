/**
 * @module camera
 *
 * Cámara virtual: calcula la escala del mundo y el desplazamiento horizontal.
 * Solo produce números — WorldView (world-view.js) los aplica al DOM como variables CSS.
 *
 * Usado por: Game (resize), PlayingState (follow/jumpTo durante update).
 * Depende de: config.js (CAMERA, WORLD), math-utils.js (clamp, damp).
 * Participa en: al final de cada update, después de mover al robot.
 *
 * Suavizado y redondeo a píxeles:
 * La cámara sigue al robot con suavizado exponencial (damp) para que el movimiento
 * se sienta fluido. El getter snappedX redondea la posición a píxeles reales de la
 * pantalla: sin esto, el pixel art "tiembla" o se ve borroso cuando el desplazamiento
 * cae en fracciones de píxel (subpixel rendering).
 */
import { CAMERA, WORLD } from '../config.js';
import { clamp, damp } from './math-utils.js';

/**
 * Cámara virtual con seguimiento horizontal suavizado.
 *
 * Ciclo de vida: Game la crea; vive toda la partida. No necesita dispose().
 * Colabora con: WorldView (aplica la escala y posición al DOM), Player (objetivo de follow).
 */
export class Camera {
  /** @type {number} — posición horizontal de la cámara, en px del mundo */
  x = 0;
  /** @type {number} — factor de escala (px de pantalla / px del mundo) */
  scale = 1;
  /** @type {number} — ancho visible del mundo, en px del mundo (depende del tamaño de pantalla) */
  viewWidth = WORLD.width;

  /**
   * Recalcula la escala y el ancho visible al cambiar el tamaño de la ventana.
   * La escala se calcula para que el alto del mundo (724 px) ocupe toda la pantalla.
   *
   * @param {number} viewportWidth — ancho del viewport, en px de pantalla.
   * @param {number} viewportHeight — alto del viewport, en px de pantalla.
   */
  resize(viewportWidth, viewportHeight) {
    this.scale = viewportHeight / WORLD.height;
    this.viewWidth = viewportWidth / this.scale;
  }

  /**
   * Sigue al objetivo con suavizado exponencial (se acerca sin llegar de golpe).
   *
   * @param {{ x: number, width: number }} target — rectángulo del objetivo (normalmente el robot).
   * @param {number} sceneWidth — ancho de la escena actual, en px del mundo.
   * @param {number} deltaTime — segundos del paso actual.
   */
  follow(target, sceneWidth, deltaTime) {
    const goal = this.#goalFor(target, sceneWidth);
    this.x = damp(this.x, goal, CAMERA.followSharpness, deltaTime);
  }

  /**
   * Posiciona la cámara instantáneamente (sin suavizado). Se usa al entrar a una escena
   * nueva para que no haya un barrido visual desde la posición anterior.
   *
   * @param {{ x: number, width: number }} target — rectángulo del objetivo.
   * @param {number} sceneWidth — ancho de la escena actual, en px del mundo.
   */
  jumpTo(target, sceneWidth) {
    this.x = this.#goalFor(target, sceneWidth);
  }

  /**
   * Posición X redondeada a píxeles reales de la pantalla.
   * Evita que el pixel art "tiemble" al moverse por fracciones de píxel.
   * @returns {number} posición X en px del mundo, alineada a la rejilla de pantalla.
   */
  get snappedX() {
    return Math.round(this.x * this.scale) / this.scale;
  }

  /**
   * Convierte coordenadas de pantalla a coordenadas del mundo.
   *
   * @param {number} screenX — posición X en px de pantalla.
   * @param {number} screenY — posición Y en px de pantalla.
   * @returns {{ x: number, y: number }} coordenadas en px del mundo.
   */
  screenToWorld(screenX, screenY) {
    return { x: this.snappedX + screenX / this.scale, y: screenY / this.scale };
  }

  /** Calcula la posición X ideal para centrar al objetivo según el ancla y los límites */
  #goalFor(target, sceneWidth) {
    const maxX = sceneWidth - this.viewWidth;
    // Pantalla más ancha que la escena: se centra en vez de seguir.
    if (maxX <= 0) return maxX / 2;
    const targetCenter = target.x + target.width / 2;
    return clamp(targetCenter - this.viewWidth * CAMERA.anchor, 0, maxX);
  }
}
