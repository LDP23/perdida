/**
 * @module touch-controls
 *
 * Controles tactiles para dispositivos moviles y tablets.
 * Crea botones en pantalla (D-pad + acciones + pausa) que alimentan
 * el mismo sistema de Input que el teclado, usando press() y release().
 *
 * Los botones se crean dinamicamente y se insertan en el contenedor .game.
 * Solo aparecen cuando el dispositivo tiene pantalla tactil (clase is-touch).
 *
 * Soporta multitouch: cada boton rastrea su propio touch ID para que
 * el jugador pueda caminar y saltar al mismo tiempo.
 *
 * Usado por: Game (game.js).
 * Depende de: Input (input.js) para press/release.
 */

/**
 * Mapa de boton -> accion del sistema de Input.
 * Las claves coinciden con los sufijos de clase CSS (.touch-btn--left, etc.).
 */
const BUTTON_MAP = [
  { id: 'up',    action: 'jump',    label: '▲' },
  { id: 'left',  action: 'left',    label: '◀' },
  { id: 'right', action: 'right',   label: '▶' },
  { id: 'down',  action: 'confirm', label: '▼' },
  { id: 'jump',  action: 'jump',    label: 'SALTO' },
  { id: 'shoot', action: 'shoot',   label: 'ATAQUE' },
  { id: 'pause', action: 'pause',   label: '⏸' },
];

/**
 * Controles tactiles en pantalla.
 *
 * Ciclo de vida: Game lo crea si el dispositivo es tactil. dispose() elimina
 * los elementos del DOM y los listeners.
 */
export class TouchControls {
  /** @type {HTMLElement} */
  #container;
  /** @type {Input} */
  #input;
  /** @type {Map<string, { el: HTMLElement, action: string, touchId: number|null }>} */
  #buttons = new Map();
  /** @type {Array<[EventTarget, string, Function]>} */
  #listeners = [];

  /**
   * @param {HTMLElement} gameElement - elemento raiz .game donde insertar los controles.
   * @param {Input} input - sistema de input para alimentar con press/release.
   */
  constructor(gameElement, input) {
    this.#input = input;
    this.#container = this.#buildDOM(gameElement);
  }

  /**
   * Construye toda la estructura DOM de los controles y la inserta en el juego.
   * @param {HTMLElement} gameElement
   * @returns {HTMLElement} el contenedor principal .touch-controls
   */
  #buildDOM(gameElement) {
    const root = document.createElement('div');
    root.className = 'touch-controls';

    const dpad = document.createElement('div');
    dpad.className = 'touch-dpad';

    const actions = document.createElement('div');
    actions.className = 'touch-actions';

    for (const { id, action, label } of BUTTON_MAP) {
      const btn = document.createElement('button');
      btn.className = `touch-btn touch-btn--${id}`;
      btn.textContent = label;
      btn.setAttribute('aria-label', label);
      btn.type = 'button';

      this.#buttons.set(id, { el: btn, action, touchId: null });
      this.#bindTouch(btn, id);

      if (id === 'up' || id === 'left' || id === 'right' || id === 'down') {
        dpad.append(btn);
      } else if (id === 'pause') {
        root.append(btn);
      } else {
        actions.append(btn);
      }
    }

    root.append(dpad, actions);
    gameElement.append(root);
    return root;
  }

  /**
   * Vincula eventos tactiles a un boton. Usa touchstart/touchend/touchcancel
   * en vez de pointer events para mejor soporte de multitouch.
   *
   * Cada boton rastrea el ID de su touch activo para no confundir dedos:
   * si el jugador toca ◀ con un dedo y SALTO con otro, cada boton sabe
   * cual touch le pertenece y se suelta solo cuando ESE dedo se levanta.
   *
   * @param {HTMLElement} btn - elemento del boton
   * @param {string} id - identificador del boton en el mapa
   */
  #bindTouch(btn, id) {
    const onStart = (e) => {
      e.preventDefault();
      const state = this.#buttons.get(id);
      if (state.touchId !== null) return;
      const touch = e.changedTouches[0];
      state.touchId = touch.identifier;
      btn.classList.add('is-pressed');
      this.#input.press(state.action);
    };

    const onEnd = (e) => {
      e.preventDefault();
      const state = this.#buttons.get(id);
      for (const touch of e.changedTouches) {
        if (touch.identifier === state.touchId) {
          state.touchId = null;
          btn.classList.remove('is-pressed');
          this.#input.release(state.action);
          return;
        }
      }
    };

    btn.addEventListener('touchstart', onStart, { passive: false });
    btn.addEventListener('touchend', onEnd, { passive: false });
    btn.addEventListener('touchcancel', onEnd, { passive: false });

    this.#listeners.push(
      [btn, 'touchstart', onStart],
      [btn, 'touchend', onEnd],
      [btn, 'touchcancel', onEnd],
    );
  }

  /** Elimina los controles del DOM y desuscribe todos los listeners. */
  dispose() {
    for (const [el, type, handler] of this.#listeners) {
      el.removeEventListener(type, handler);
    }
    this.#listeners.length = 0;
    this.#buttons.clear();
    this.#container.remove();
  }
}
