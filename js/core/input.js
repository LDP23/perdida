import { KEY_BINDINGS } from '../config.js';

// El juego no pregunta por teclas sino por ACCIONES ('left', 'jump'...).
// Así el teclado y los botones táctiles (etapa 8) alimentan el mismo estado
// y el resto del código no sabe de dónde vino la orden.
export class Input {
  #actionByCode;
  #held = new Set();
  #pressed = new Set();
  #gameplayEnabled = false;
  #listeners;

  constructor(target = window) {
    this.#actionByCode = mapCodesToActions(KEY_BINDINGS);
    this.#listeners = [
      [target, 'keydown', (event) => this.#onKey(event, true)],
      [target, 'keyup', (event) => this.#onKey(event, false)],
      // Si la ventana pierde el foco con una tecla apretada, nunca llega el keyup:
      // soltamos todo para que el robot no siga caminando solo.
      [target, 'blur', () => this.releaseAll()],
    ];
    for (const [element, type, handler] of this.#listeners) element.addEventListener(type, handler);
  }

  get gameplayEnabled() {
    return this.#gameplayEnabled;
  }

  setGameplayEnabled(enabled) {
    this.#gameplayEnabled = enabled;
    if (!enabled) this.releaseAll();
  }

  isHeld(action) {
    return this.#held.has(action);
  }

  // Devuelve true una sola vez por pulsación (para saltar, disparar, alternar).
  consumePress(action) {
    return this.#pressed.delete(action);
  }

  press(action) {
    if (!this.#held.has(action)) this.#pressed.add(action);
    this.#held.add(action);
  }

  release(action) {
    this.#held.delete(action);
  }

  releaseAll() {
    this.#held.clear();
    this.#pressed.clear();
  }

  // Las pulsaciones que nadie usó en este frame se descartan; si no, un salto
  // pulsado en el menú se ejecutaría segundos después al empezar a jugar.
  endFrame() {
    this.#pressed.clear();
  }

  dispose() {
    for (const [element, type, handler] of this.#listeners) element.removeEventListener(type, handler);
    this.releaseAll();
  }

  #onKey(event, isDown) {
    const action = this.#actionByCode.get(event.code);
    if (!action || event.ctrlKey || event.metaKey || event.altKey) return;

    // Acciones que funcionan siempre (debug, pause), sin bloquear teclas nativas.
    const alwaysActive = action === 'debug' || action === 'pause';
    if (!this.#gameplayEnabled && !alwaysActive) return;

    // En modo gameplay se previene el comportamiento nativo (scroll por Espacio, etc.).
    if (this.#gameplayEnabled) event.preventDefault();

    if (isDown) this.press(action);
    else this.release(action);
  }
}

function mapCodesToActions(bindings) {
  const map = new Map();
  for (const [action, codes] of Object.entries(bindings)) {
    for (const code of codes) map.set(code, action);
  }
  return map;
}
