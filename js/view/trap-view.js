/**
 * @module trap-view
 *
 * Vista genérica de una trampa: un elemento .trap posicionado en la zona,
 * con la clase del tipo (.trap--press, .trap--laser) y la fase actual (is-*).
 * Escribe variables CSS de geometría y las variables extra que la trampa
 * exponga vía viewData (por ejemplo --block-y para la prensa).
 *
 * Para la prensa se crea un hijo .trap__block porque el CSS necesita
 * posicionar el bloque independientemente del pistón.
 *
 * Usado por: SceneWorld (crea una vista por trampa).
 * Depende de: dom-utils.js.
 */
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
    if (trap.type === 'press') {
      createElement('trap__block', this.#element);
    } else if (trap.type === 'acid-drip') {
      createElement('trap__splash', this.#element);
    }
  }

  /**
   * Sincroniza la fase y las variables CSS con el estado actual de la trampa.
   * @param {Trap} trap
   */
  sync(trap) {
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
