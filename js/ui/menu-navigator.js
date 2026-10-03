// Navegación por teclado para pantallas de menú.
// Flechas arriba/abajo (y W/S) mueven el foco entre los botones visibles; Escape ejecuta "volver".
export class MenuNavigator {
  #container;
  #onBack;
  #handleKeyDown;

  constructor(container, onBack = null) {
    this.#container = container;
    this.#onBack = onBack;
    this.#handleKeyDown = (event) => this.#onKey(event);
    window.addEventListener('keydown', this.#handleKeyDown);
    this.focusFirst();
  }

  focusFirst() {
    const buttons = this.#visibleButtons();
    if (buttons.length > 0) buttons[0].focus();
  }

  dispose() {
    window.removeEventListener('keydown', this.#handleKeyDown);
  }

  #visibleButtons() {
    return [...this.#container.querySelectorAll('button')]
      .filter((btn) => btn.offsetParent !== null && !btn.disabled);
  }

  #onKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const nav = event.code === 'ArrowUp' || event.code === 'KeyW'
      ? -1
      : event.code === 'ArrowDown' || event.code === 'KeyS'
        ? 1
        : 0;

    if (nav !== 0) {
      event.preventDefault();
      this.#moveFocus(nav);
      return;
    }

    if (event.code === 'Escape' && this.#onBack) {
      event.preventDefault();
      this.#onBack();
    }
  }

  #moveFocus(direction) {
    const buttons = this.#visibleButtons();
    if (buttons.length === 0) return;
    const current = buttons.indexOf(document.activeElement);
    const next = current === -1
      ? 0
      : (current + direction + buttons.length) % buttons.length;
    buttons[next].focus();
  }
}
