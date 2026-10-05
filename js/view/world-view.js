/**
 * @module world-view
 *
 * Traduce el estado de la cámara y la escena a variables CSS (--world-scale,
 * --camera-x, --scene-image). El CSS en world.css aplica el transform real:
 * escalar el mundo, desplazarlo horizontalmente y pintar el fondo.
 *
 * Usado por: Game (la crea), PlayingState (llama render en cada frame).
 * Depende de: config.js (WORLD).
 */
import { WORLD } from '../config.js';

/**
 * Vista del mundo.
 *
 * Ciclo de vida: Game la crea una vez; vive toda la sesión.
 */
export class WorldView {
  #root;
  #world;
  #scene;

  constructor({ game, world, scene }) {
    this.#root = game;
    this.#world = world;
    this.#scene = scene;
    // El tamaño del mundo sale de config.js: no se repite el número en el CSS.
    this.#root.style.setProperty('--world-width', WORLD.width);
    this.#root.style.setProperty('--world-height', WORLD.height);
  }

  // Excepción justificada a "solo variables de posición": la imagen de fondo
  // viene de los datos del nivel, así agregar una escena no requiere tocar el CSS.
  // Se pasa como URL absoluta porque una ruta relativa dentro de una variable CSS
  // se resolvería desde la carpeta css/ y no encontraría la imagen.
  showScene(scene) {
    const url = new URL(scene.background, document.baseURI).href;
    this.#scene.style.setProperty('--scene-image', `url("${url}")`);
    this.#scene.dataset.scene = scene.id;
  }

  applyScale(camera) {
    this.#root.style.setProperty('--world-scale', camera.scale);
  }

  render(camera) {
    this.#world.style.setProperty('--camera-x', camera.snappedX);
  }
}
