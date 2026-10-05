/**
 * @module platform-view
 *
 * Vista genérica de una plataforma (móvil o que cae): caja CSS posicionada con
 * --x/--y, con clase is-* según el estado visual de la plataforma.
 *
 * Usado por: SceneWorld (la crea vía EntityCollection con viewFactory).
 * Depende de: dom-utils.js.
 */
import { createElement, setPosition, setSize } from './dom-utils.js';

/**
 * Vista de plataforma.
 *
 * Ciclo de vida: EntityCollection la crea vía viewFactory; destroy() remueve del DOM.
 */
export class PlatformView {
  #element;
  #lastState = '';

  constructor(layer, platform, modifier) {
    this.#element = createElement(`platform platform--${modifier}`, layer);
    setSize(this.#element, platform.body.width, platform.body.height);
  }

  sync(platform) {
    setPosition(this.#element, platform.body.x, platform.body.y);
    const state = platform.visualState;
    if (state !== this.#lastState) {
      this.#element.classList.remove(
        'is-moving', 'is-idle', 'is-shaking', 'is-falling', 'is-hidden', 'is-respawning',
      );
      this.#element.classList.add(`is-${state}`);
      this.#lastState = state;
    }
  }

  destroy() {
    this.#element.remove();
  }
}
