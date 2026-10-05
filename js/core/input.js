/**
 * @module input
 *
 * Abstracción de entrada: el juego pregunta por ACCIONES ('left', 'jump', 'shoot'),
 * no por teclas físicas. Así el teclado y los botones táctiles (etapa futura)
 * alimentan el mismo estado y el resto del código no sabe de dónde vino la orden.
 *
 * Usado por: Game (game.js), Player, estados, sistemas de depuración.
 * Depende de: config.js (KEY_BINDINGS).
 * Participa en: se consulta durante update(); endFrame() limpia las pulsaciones al final del frame.
 *
 * Pulsaciones consumibles (consumePress):
 * Cuando el jugador pulsa una tecla, la acción se agrega a #pressed. consumePress()
 * la devuelve UNA sola vez y la elimina del conjunto. Al final del frame, endFrame()
 * limpia las que nadie consumió — así un salto pulsado en el menú no se ejecuta
 * segundos después al empezar a jugar. Esto separa "mantener presionado" (isHeld)
 * de "acaba de pulsar" (consumePress).
 */
import { KEY_BINDINGS } from '../config.js';

/**
 * Sistema de entrada basado en acciones, no en teclas.
 *
 * Ciclo de vida: Game lo crea; funciona mientras el juego esté activo. Game llama
 * dispose() al destruir.
 * Colabora con: GameLoop (endFrame), Player (isHeld/consumePress), estados (pause, debug).
 */
export class Input {
  /** @type {Map<string, string>} — mapa de event.code → nombre de acción */
  #actionByCode;
  /** @type {Set<string>} — acciones actualmente mantenidas presionadas */
  #held = new Set();
  /** @type {Set<string>} — acciones pulsadas este frame (se limpian con consumePress o endFrame) */
  #pressed = new Set();
  /** @type {boolean} — si las acciones de gameplay están habilitadas (false en menús) */
  #gameplayEnabled = false;
  /** @type {Array} — listeners registrados, para poder limpiarlos en dispose() */
  #listeners;

  /**
   * @param {EventTarget} [target=window] — elemento donde escuchar eventos de teclado.
   */
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

  /** @returns {boolean} si las acciones de gameplay están activas */
  get gameplayEnabled() {
    return this.#gameplayEnabled;
  }

  /**
   * Habilita o deshabilita las acciones de gameplay.
   * Al desactivar, suelta todas las teclas (el robot no se queda caminando solo en el menú).
   * Las acciones 'debug' y 'pause' funcionan siempre, incluso con gameplay desactivado.
   *
   * @param {boolean} enabled
   */
  setGameplayEnabled(enabled) {
    this.#gameplayEnabled = enabled;
    if (!enabled) this.releaseAll();
  }

  /**
   * @param {string} action — nombre de la acción (p.ej. 'left', 'jump').
   * @returns {boolean} true si la acción está siendo mantenida presionada.
   */
  isHeld(action) {
    return this.#held.has(action);
  }

  /**
   * Devuelve true una sola vez por pulsación (para saltar, disparar, alternar).
   * Elimina la pulsación del conjunto: si dos sistemas la consultan, solo el primero la ve.
   *
   * @param {string} action — nombre de la acción.
   * @returns {boolean} true si la acción fue pulsada y aún no consumida.
   */
  consumePress(action) {
    return this.#pressed.delete(action);
  }

  /**
   * Simula una pulsación (usado por controles táctiles futuros).
   * @param {string} action
   */
  press(action) {
    if (!this.#held.has(action)) this.#pressed.add(action);
    this.#held.add(action);
  }

  /**
   * Simula soltar una tecla (usado por controles táctiles futuros).
   * @param {string} action
   */
  release(action) {
    this.#held.delete(action);
  }

  /** Suelta todas las acciones (al perder foco o desactivar gameplay). */
  releaseAll() {
    this.#held.clear();
    this.#pressed.clear();
  }

  // Las pulsaciones que nadie usó en este frame se descartan; si no, un salto
  // pulsado en el menú se ejecutaría segundos después al empezar a jugar.
  endFrame() {
    this.#pressed.clear();
  }

  /** Desuscribe todos los listeners del DOM. Se llama al destruir el juego. */
  dispose() {
    for (const [element, type, handler] of this.#listeners) element.removeEventListener(type, handler);
    this.releaseAll();
  }

  /** Traduce un evento de teclado a una acción y la registra o suelta */
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

/**
 * Invierte el mapa de KEY_BINDINGS ({acción: [codes]}) a un Map de code → acción.
 * @param {Object<string, string[]>} bindings
 * @returns {Map<string, string>}
 */
function mapCodesToActions(bindings) {
  const map = new Map();
  for (const [action, codes] of Object.entries(bindings)) {
    for (const code of codes) map.set(code, action);
  }
  return map;
}
