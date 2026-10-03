import { createElement, setPosition } from './dom-utils.js';

// Crea los carteles del tutorial una vez y alterna clases para mostrarlos/ocultarlos.

export class TutorialView {
  #layer;
  #elements = new Map();

  constructor(worldElement, signsData) {
    this.#layer = createElement('layer layer--tutorial', null);
    this.#layer.dataset.ref = 'tutorial';
    const debugLayer = worldElement.querySelector('[data-ref="debug-layer"]');
    worldElement.insertBefore(this.#layer, debugLayer);

    for (const sign of signsData) {
      const el = createElement('tutorial-sign', this.#layer);
      el.dataset.signId = sign.id;

      if (sign.keys.keyboard !== null) {
        const keyEl = createElement('tutorial-sign__key', el);
        const kbLabel = document.createElement('span');
        kbLabel.className = 'tutorial-sign__label--keyboard';
        kbLabel.textContent = sign.keys.keyboard;
        keyEl.append(kbLabel);
        const touchLabel = document.createElement('span');
        touchLabel.className = 'tutorial-sign__label--touch';
        touchLabel.textContent = sign.keys.touch;
        keyEl.append(touchLabel);
      }

      const textEl = createElement('tutorial-sign__text', el);
      textEl.textContent = sign.text;

      setPosition(el, sign.x, sign.y);
      this.#elements.set(sign.id, el);
    }
  }

  sync(signs) {
    for (const sign of signs) {
      const el = this.#elements.get(sign.id);
      if (!el) continue;
      el.classList.toggle('is-visible', sign.state === 'visible');
      el.classList.toggle('is-dismissed', sign.state === 'dismissed');
    }
  }

  destroy() {
    this.#layer.remove();
    this.#elements.clear();
  }
}
