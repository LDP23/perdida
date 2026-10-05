/**
 * @module settings
 *
 * Preferencias del jugador persistidas en localStorage. Cada opción se refleja como
 * una clase CSS en el elemento .game, para que CSS decida qué efectos activar o desactivar
 * sin que JS manipule estilos directamente.
 *
 * Usado por: Game (game.js, creación), menú de opciones, sistemas que consultan preferencias.
 * Depende de: config.js (SETTINGS_DEFAULTS), storage.js (load, save).
 */
import { SETTINGS_DEFAULTS } from '../config.js';
import { load, save } from './storage.js';

/**
 * Preferencias del jugador con persistencia y reflejo en CSS.
 *
 * Ciclo de vida: Game la crea; vive toda la partida. No necesita dispose().
 * Colabora con: ScreenShake (consulta screenShake), vistas y CSS (clases en .game).
 *
 * Opciones disponibles:
 * - showTutorial: mostrar carteles de instrucciones.
 * - screenShake: sacudida de pantalla al recibir daño.
 * - crtEffect: efecto de monitor CRT (scanlines).
 * - reducedMotion: animaciones reducidas (null = seguir preferencia del sistema).
 */
export class Settings {
  /** @type {HTMLElement} — elemento .game donde se aplican las clases */
  #gameEl;
  /** @type {Object} — valores actuales de las preferencias */
  #values;

  /**
   * @param {HTMLElement} gameEl — elemento .game del DOM.
   */
  constructor(gameEl) {
    this.#gameEl = gameEl;
    const stored = load('settings', {});
    this.#values = { ...SETTINGS_DEFAULTS, ...stored };

    // reduced-motion: si es null (por defecto), seguir la preferencia del sistema
    if (this.#values.reducedMotion === null) {
      this.#values.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    this.#applyAll();
  }

  /**
   * @param {string} key — nombre de la preferencia.
   * @returns {*} valor actual de la preferencia.
   */
  get(key) {
    return this.#values[key];
  }

  /**
   * Cambia una preferencia, la aplica al DOM y la guarda en localStorage.
   *
   * @param {string} key — nombre de la preferencia.
   * @param {*} value — nuevo valor.
   */
  set(key, value) {
    this.#values[key] = value;
    this.#apply(key, value);
    save('settings', this.#values);
  }

  /**
   * Invierte una preferencia booleana.
   * @param {string} key — nombre de la preferencia.
   * @returns {boolean} nuevo valor tras invertir.
   */
  toggle(key) {
    this.set(key, !this.#values[key]);
    return this.#values[key];
  }

  /** Aplica todas las preferencias al DOM (se llama una vez en el constructor) */
  #applyAll() {
    for (const [key, value] of Object.entries(this.#values)) {
      this.#apply(key, value);
    }
  }

  /** Agrega o quita la clase CSS correspondiente a una preferencia */
  #apply(key, value) {
    const classMap = {
      crtEffect: 'no-crt',
      screenShake: 'no-shake',
      reducedMotion: 'reduced-motion',
    };
    const className = classMap[key];
    if (!className) return;
    // crtEffect y screenShake: la clase se agrega cuando la opción está DESACTIVADA
    // reducedMotion: la clase se agrega cuando ESTÁ activada
    if (key === 'reducedMotion') {
      this.#gameEl.classList.toggle(className, value);
    } else {
      this.#gameEl.classList.toggle(className, !value);
    }
  }
}
