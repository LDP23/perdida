import { createElement, setPosition, setSize } from './dom-utils.js';

// Vista del maniquí: incluye el sprite CSS y la etiqueta de impactos.
export class TrainingDummyView {
  #element;
  #hitLabel;
  #lastHitCount = 0;
  #lastIsHit = false;

  constructor(layer, body) {
    this.#element = createElement('entity entity--training-dummy', layer);
    createElement('entity__sprite', this.#element);
    this.#hitLabel = createElement('entity__hit-count', this.#element);
    setSize(this.#element, body.width, body.height);
    setPosition(this.#element, body.x, body.y);
  }

  sync(dummy) {
    if (this.#lastIsHit !== dummy.isHit) {
      this.#element.classList.toggle('is-hit', dummy.isHit);
      this.#lastIsHit = dummy.isHit;
    }
    if (this.#lastHitCount !== dummy.hitCount) {
      this.#element.classList.toggle('has-hits', dummy.hitCount > 0);
      this.#hitLabel.textContent = `Impactos: ${dummy.hitCount}`;
      this.#lastHitCount = dummy.hitCount;
    }
  }

  destroy() {
    this.#element.remove();
  }
}
