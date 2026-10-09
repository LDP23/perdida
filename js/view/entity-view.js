/**
 * @module entity-view
 *
 * Vista genérica de una entidad: una caja del tamaño de su hitbox (posicionada
 * con --x/--y) y un sprite hijo que el CSS acomoda y anima según las clases is-*.
 * El robot, los enemigos y los disparos la usan como base.
 *
 * Usado por: PlayerView, EnemyView, SceneWorld (para proyectiles, pickups).
 * Depende de: dom-utils.js.
 */
import { createElement, setPosition, setSize } from './dom-utils.js';

/**
 * Vista genérica de entidad.
 *
 * Ciclo de vida: se crea al montar la escena; destroy() remueve el elemento del DOM.
 */
export class EntityView {
  #element;
  #sprite;

  /**
   * @param {HTMLElement} layer — capa del DOM donde se inserta la entidad.
   * @param {string} modifier — sufijo BEM para la clase (entity--<modifier>).
   * @param {{width: number, height: number}} size — tamaño de la hitbox en px del mundo.
   */
  constructor(layer, modifier, { width, height }) {
    this.#element = createElement(`entity entity--${modifier}`, layer);
    this.#sprite = createElement('entity__sprite', this.#element);
    setSize(this.#element, width, height);
  }

  get element() { return this.#element; }
  get sprite() { return this.#sprite; }

  /**
   * Actualiza la posición del elemento y las clases de estado.
   * @param {{x: number, y: number}} body — cuerpo con posición en px del mundo.
   * @param {Object.<string, boolean>} [flags={}] — clases CSS a activar/desactivar.
   */
  sync(body, flags = {}) {
    setPosition(this.#element, body.x, body.y);
    for (const [className, enabled] of Object.entries(flags)) {
      this.#element.classList.toggle(className, enabled);
    }
  }

  destroy() {
    this.#element.remove();
  }
}
