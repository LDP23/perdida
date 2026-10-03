// Máquina de estados con pila: soporta estados superpuestos (pausa sobre el juego).
// Solo el estado de arriba recibe update; TODOS reciben render (el juego se ve detrás).
// change() vacía la pila; push() apila sin salir del de abajo; pop() vuelve al anterior.
export class StateMachine {
  #states;
  #onChange;
  #stack = [];
  #gameEl;

  constructor(states, gameEl, onChange = () => {}) {
    this.#states = states;
    this.#gameEl = gameEl;
    this.#onChange = onChange;
  }

  get currentName() {
    return this.#stack.length > 0 ? this.#stack[this.#stack.length - 1].name : null;
  }

  get baseName() {
    return this.#stack.length > 0 ? this.#stack[0].name : null;
  }

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

  pop() {
    if (this.#stack.length <= 1) return;
    const top = this.#stack.pop();
    top.state.exit?.();
    this.#updateAttributes();
    this.#stack[this.#stack.length - 1].state.resume?.();
  }

  update(deltaTime) {
    if (this.#stack.length === 0) return;
    this.#stack[this.#stack.length - 1].state.update?.(deltaTime);
  }

  render(frameDelta) {
    for (const entry of this.#stack) {
      entry.state.render?.(frameDelta);
    }
  }

  dispose() {
    while (this.#stack.length > 0) {
      const top = this.#stack.pop();
      top.state.exit?.();
    }
    this.#updateAttributes();
  }

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
