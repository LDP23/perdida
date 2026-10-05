/**
 * @module training-dummy-view
 *
 * Vista del maniquí de práctica (espantapájaros). El sprite es más grande que la
 * hitbox: la caja .entity mide como la hitbox; el sprite queda centrado y alineado
 * al piso (bottom, no a la hitbox). Muestra un contador de impactos.
 *
 * Usado por: SceneWorld (la crea vía EntityCollection con viewFactory).
 * Depende de: config.js (TRAINING_DUMMY), dom-utils.js.
 */
import { TRAINING_DUMMY } from '../config.js';
import { createElement, setPosition, setSize } from './dom-utils.js';

/**
 * Vista del maniquí de práctica.
 *
 * Ciclo de vida: EntityCollection la crea vía viewFactory; destroy() remueve del DOM.
 */
export class TrainingDummyView {
  #element;
  #hitLabel;
  #lastHitCount = 0;
  #lastIsHit = false;

  constructor(layer, body) {
    this.#element = createElement('entity entity--training-dummy', layer);
    const sprite = createElement('entity__sprite', this.#element);
    sprite.style.setProperty('--dummy-sprite-w', TRAINING_DUMMY.spriteWidth);
    sprite.style.setProperty('--dummy-sprite-h', TRAINING_DUMMY.spriteHeight);
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
