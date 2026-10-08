/**
 * @module trap-view
 *
 * Vista genérica de una trampa: un elemento .trap posicionado en la zona,
 * con la clase del tipo (.trap--press, .trap--laser) y la fase actual (is-*).
 * Escribe variables CSS de geometría y las variables extra que la trampa
 * exponga vía viewData (por ejemplo --block-y para la prensa).
 *
 * Crea la estructura DOM específica de cada tipo de trampa con los elementos
 * hijos necesarios para los sprites (soporte, pistón, bloque, emisor, rayo, etc.).
 *
 * Usado por: SceneWorld (crea una vista por trampa).
 * Depende de: dom-utils.js, config.js (TRAPS.decompression).
 */
import { TRAPS } from '../config.js';
import { createElement, setRect } from './dom-utils.js';

/**
 * Vista de trampa.
 *
 * Ciclo de vida: SceneWorld la crea al montar la escena; destroy() la remueve.
 */
export class TrapView {
  #element;
  #lastPhase = '';

  /**
   * @param {HTMLElement} layer — capa DOM donde se inserta.
   * @param {Trap} trap — trampa lógica (se lee zone y type).
   */
  constructor(layer, trap) {
    this.#element = createElement(`trap trap--${trap.type}`, layer);
    setRect(this.#element, trap.zone);

    switch (trap.type) {
      case 'press':
        createElement('trap__support', this.#element);
        createElement('trap__piston trap-tile-y', this.#element);
        createElement('trap__block', this.#element);
        break;

      case 'laser':
        createElement('trap__emitter', this.#element);
        createElement('trap__beam trap-tile-y', this.#element);
        createElement('trap__impact', this.#element);
        break;

      case 'sparks':
        break;

      case 'sweep-laser':
        createElement('trap__rail-left', this.#element);
        createElement('trap__rail trap-tile-x', this.#element);
        createElement('trap__rail-right', this.#element);
        createElement('trap__emitter', this.#element);
        createElement('trap__beam', this.#element);
        break;

      case 'acid-drip':
        createElement('trap__pipe', this.#element);
        createElement('trap__pipe-tramo trap-tile-y', this.#element);
        createElement('trap__drop', this.#element);
        createElement('trap__splash', this.#element);
        break;

      case 'decompression': {
        createElement('trap__current', this.#element);
        const pullRatio = trap.viewData?.['--pull-x'] ?? (trap.zone.width / 2);
        for (let i = 0; i < TRAPS.decompression.debrisCount; i++) {
          const d = createElement('trap__debris', this.#element);
          const leftPct = Math.random() * 90 + 5;
          d.style.setProperty('left', `${leftPct}%`);
          d.style.setProperty('top', `${Math.random() * 80 + 10}%`);
          const posX = leftPct / 100 * trap.zone.width;
          d.style.setProperty('--debris-dx', posX < pullRatio ? 40 : -40);
        }
        break;
      }

      case 'turret':
        break;
    }
  }

  /**
   * Sincroniza la fase y las variables CSS con el estado actual de la trampa.
   * @param {Trap} trap
   */
  sync(trap) {
    if (trap.destroyed) {
      if (this.#lastPhase) this.#element.classList.remove(`is-${this.#lastPhase}`);
      this.#lastPhase = '';
      this.#element.classList.add('is-destroyed');
      return;
    }
    const phase = trap.phase;
    if (phase !== this.#lastPhase) {
      if (this.#lastPhase) this.#element.classList.remove(`is-${this.#lastPhase}`);
      this.#element.classList.add(`is-${phase}`);
      this.#lastPhase = phase;
    }
    const data = trap.viewData;
    if (data) {
      for (const key in data) {
        this.#element.style.setProperty(key, data[key]);
      }
    }
  }

  destroy() {
    this.#element.remove();
  }
}
