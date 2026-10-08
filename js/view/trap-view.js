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

      case 'sweep-laser':
        createElement('trap__rail-left', this.#element);
        createElement('trap__rail trap-tile-x', this.#element);
        createElement('trap__rail-right', this.#element);
        createElement('trap__emitter', this.#element);
        createElement('trap__beam', this.#element);
        break;

      case 'acid-drip':
        createElement('trap__ceiling-glow', this.#element);
        createElement('trap__drop', this.#element);
        createElement('trap__splash', this.#element);
        createElement('trap__surface-mark', this.#element);
        break;

      case 'decompression':
        this.#buildDecompression(trap);
        break;

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

  #buildDecompression(trap) {
    const streaksContainer = createElement('trap__streaks', this.#element);
    const zone = trap.zone;
    const pullX = trap.viewData['--pull-x'];
    const zoneLeft = 0;
    const zoneRight = zone.width;
    const pullRel = pullX;

    for (let i = 0; i < 12; i++) {
      const el = createElement('trap__streak', streaksContainer);
      const fromLeft = i < 6;
      if (fromLeft) {
        el.style.setProperty('--streak-start', `${zoneLeft}px`);
        el.style.setProperty('--streak-end', `${pullRel}px`);
      } else {
        el.style.setProperty('--streak-start', `${zoneRight}px`);
        el.style.setProperty('--streak-end', `${pullRel}px`);
        el.style.transform = 'scaleX(-1)';
      }
    }

    const chevronsContainer = createElement('trap__chevrons', this.#element);
    const edgeLeft = 40;
    const edgeRight = zone.width - 40;
    for (let i = 0; i < 3; i++) {
      const chL = createElement('trap__chevron', chevronsContainer);
      chL.style.left = `${edgeLeft + i * 25}px`;
      chL.style.setProperty('--chev-travel', `${pullRel - edgeLeft - i * 25}px`);
      chL.style.setProperty('--chev-angle', '-45deg');
    }
    for (let i = 0; i < 3; i++) {
      const chR = createElement('trap__chevron', chevronsContainer);
      chR.style.left = `${edgeRight - i * 25}px`;
      chR.style.setProperty('--chev-travel', `${pullRel - edgeRight + i * 25}px`);
      chR.style.setProperty('--chev-angle', '135deg');
    }
  }
}
