import { MenuNavigator } from '../ui/menu-navigator.js';
import { queryRefs } from '../view/dom-utils.js';

const REFS = ['screen-off', 'btn-power-on'];

// Pantalla de apagado. Los navegadores no permiten cerrar una pestaña que el
// usuario abrió manualmente (window.close() solo funciona si fue abierta por script).
// Se intenta cerrar y si sigue abierta se muestra esta pantalla con animación CRT.
export class OffState {
  #context;
  #refs;
  #nav = null;
  #listeners = [];

  constructor(context) {
    this.#context = context;
    this.#refs = queryRefs(document, REFS);
  }

  enter() {
    this.#context.input.setGameplayEnabled(false);
    window.close();
    this.#listen('btn-power-on', () => this.#powerOn());
    this.#nav = new MenuNavigator(this.#refs['screen-off'], () => this.#powerOn());
  }

  exit() {
    this.#nav?.dispose();
    this.#nav = null;
    this.#removeListeners();
  }

  #powerOn() {
    this.#context.states.change('menu');
  }

  #listen(refName, handler) {
    const el = this.#refs[refName];
    el.addEventListener('click', handler);
    this.#listeners.push([el, 'click', handler]);
  }

  #removeListeners() {
    for (const [el, type, handler] of this.#listeners) el.removeEventListener(type, handler);
    this.#listeners.length = 0;
  }
}
