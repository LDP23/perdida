import { createElement, setPosition, setSize } from './dom-utils.js';

// Vista genérica de una plataforma: caja CSS posicionada con --x/--y.
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
