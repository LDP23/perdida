// Máquina de estados: el juego está en UN solo estado a la vez (inicio, jugando,
// game over, victoria). Cada estado es un objeto con enter/exit/update/render
// opcionales, así cada pantalla limpia lo suyo al salir y nada queda duplicado.
export class StateMachine {
  #states;
  #onChange;
  #current = null;
  #currentName = null;

  constructor(states, onChange = () => {}) {
    this.#states = states;
    this.#onChange = onChange;
  }

  get currentName() {
    return this.#currentName;
  }

  change(name, params) {
    const next = this.#states[name];
    if (!next) throw new Error(`Estado desconocido: ${name}`);
    this.#current?.exit?.();
    this.#current = next;
    this.#currentName = name;
    this.#onChange(name);
    next.enter?.(params);
  }

  update(deltaTime) {
    this.#current?.update?.(deltaTime);
  }

  render(frameDelta) {
    this.#current?.render?.(frameDelta);
  }

  // Al destruir el juego, el estado activo libera sus recursos.
  dispose() {
    this.#current?.exit?.();
    this.#current = null;
    this.#currentName = null;
  }
}
