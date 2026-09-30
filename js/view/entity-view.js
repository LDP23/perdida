import { createElement, setPosition, setSize } from './dom-utils.js';

// Dibujo genérico de una entidad: una caja del tamaño de su hitbox (posicionada
// con --x/--y) y un sprite adentro que el CSS acomoda y anima según las clases.
// El robot, los enemigos y los disparos usan esta misma clase.
export class EntityView {
  #element;

  constructor(layer, modifier, { width, height }) {
    this.#element = createElement(`entity entity--${modifier}`, layer);
    createElement('entity__sprite', this.#element);
    setSize(this.#element, width, height);
  }

  // flags: { 'is-facing-left': true, ... } -> clases CSS que activan estilos/animaciones.
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
