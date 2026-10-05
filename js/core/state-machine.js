/**
 * @module state-machine
 *
 * Máquina de estados con pila para las pantallas del juego (menú, jugando, pausa,
 * nivel completado, game over, apagado).
 *
 * Usado por: Game (game.js), estados individuales que llaman change/push/pop.
 * Depende de: nada.
 * Participa en: Game la llama en update() y render() cada frame.
 *
 * Pila de estados (push/pop):
 * La pila permite superponer estados. Por ejemplo, la pausa se apila sobre "playing":
 * el juego se sigue dibujando detrás, pero solo la pausa recibe update().
 *
 * - change(name): vacía TODA la pila (llama exit() de arriba hacia abajo) y pone
 *   el nuevo estado como único. Se usa para transiciones completas (menú → playing).
 * - push(name): llama pause() al estado actual y apila el nuevo encima.
 *   Se usa para overlays (playing → paused).
 * - pop(): llama exit() al de arriba y resume() al que queda debajo.
 *   Se usa para volver (paused → playing).
 *
 * Render recorre TODA la pila (todos se dibujan), pero update solo llama al de arriba.
 *
 * data-state y data-overlay: el primer elemento de la pila se pone como data-state,
 * el último (si hay más de uno) como data-overlay. CSS usa estos atributos para
 * mostrar/ocultar las pantallas sin que JS toque display.
 */

/**
 * Máquina de estados con pila y atributos CSS.
 *
 * Ciclo de vida: Game la crea con todos los estados; vive toda la partida.
 * Game llama dispose() al destruir, que vacía la pila llamando exit() en cada estado.
 * Colabora con: los estados individuales (MenuState, PlayingState, etc.) y el DOM (.game).
 */
export class StateMachine {
  /** @type {Object<string, Object>} — mapa nombre → instancia de estado */
  #states;
  /** @type {Function} — callback opcional al cambiar de estado */
  #onChange;
  /** @type {Array<{name: string, state: Object}>} — pila de estados activos */
  #stack = [];
  /** @type {HTMLElement} — elemento .game donde se escriben data-state/data-overlay */
  #gameEl;

  /**
   * @param {Object<string, Object>} states — mapa nombre → instancia de estado.
   * @param {HTMLElement} gameEl — elemento .game del DOM.
   * @param {Function} [onChange] — callback opcional, recibe el nombre del nuevo estado base.
   */
  constructor(states, gameEl, onChange = () => {}) {
    this.#states = states;
    this.#gameEl = gameEl;
    this.#onChange = onChange;
  }

  /** @returns {string|null} nombre del estado en la cima de la pila (el que recibe update) */
  get currentName() {
    return this.#stack.length > 0 ? this.#stack[this.#stack.length - 1].name : null;
  }

  /** @returns {string|null} nombre del estado en la base de la pila (data-state) */
  get baseName() {
    return this.#stack.length > 0 ? this.#stack[0].name : null;
  }

  /**
   * Transición completa: vacía la pila y pone el nuevo estado como único.
   *
   * @param {string} name — nombre del estado destino.
   * @param {*} [params] — datos para enter() del estado.
   */
  change(name, params) {
    const next = this.#states[name];
    if (!next) throw new Error(`Estado desconocido: ${name}`);
    // Vaciar la pila de arriba hacia abajo
    while (this.#stack.length > 0) {
      const top = this.#stack.pop();
      top.state.exit?.();
    }
    this.#stack.push({ name, state: next });
    this.#updateAttributes();
    this.#onChange(name);
    next.enter?.(params);
  }

  /**
   * Superpone un estado sin salir del actual (llama pause() al de abajo).
   *
   * @param {string} name — nombre del estado a superponer.
   * @param {*} [params] — datos para enter() del estado.
   */
  push(name, params) {
    const next = this.#states[name];
    if (!next) throw new Error(`Estado desconocido: ${name}`);
    if (this.#stack.length > 0) {
      this.#stack[this.#stack.length - 1].state.pause?.();
    }
    this.#stack.push({ name, state: next });
    this.#updateAttributes();
    next.enter?.(params);
  }

  /**
   * Quita el estado de arriba (llama exit()) y reanuda el de abajo (llama resume()).
   * No hace nada si solo queda un estado en la pila.
   */
  pop() {
    if (this.#stack.length <= 1) return;
    const top = this.#stack.pop();
    top.state.exit?.();
    this.#updateAttributes();
    this.#stack[this.#stack.length - 1].state.resume?.();
  }

  /**
   * Actualiza solo el estado de la cima de la pila.
   * @param {number} deltaTime — segundos del subpaso actual.
   */
  update(deltaTime) {
    if (this.#stack.length === 0) return;
    this.#stack[this.#stack.length - 1].state.update?.(deltaTime);
  }

  /**
   * Dibuja TODOS los estados de la pila (de abajo a arriba), para que el juego
   * se vea detrás de la pausa, por ejemplo.
   * @param {number} frameDelta — delta total del frame, en segundos.
   */
  render(frameDelta) {
    for (const entry of this.#stack) {
      entry.state.render?.(frameDelta);
    }
  }

  /** Vacía la pila llamando exit() en cada estado. Se llama al destruir el juego. */
  dispose() {
    while (this.#stack.length > 0) {
      const top = this.#stack.pop();
      top.state.exit?.();
    }
    this.#updateAttributes();
  }

  /** Sincroniza data-state y data-overlay en el DOM según la pila actual */
  #updateAttributes() {
    if (this.#stack.length === 0) {
      delete this.#gameEl.dataset.state;
      delete this.#gameEl.dataset.overlay;
      return;
    }
    this.#gameEl.dataset.state = this.#stack[0].name;
    if (this.#stack.length > 1) {
      this.#gameEl.dataset.overlay = this.#stack[this.#stack.length - 1].name;
    } else {
      delete this.#gameEl.dataset.overlay;
    }
  }
}
