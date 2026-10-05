/**
 * @module battery
 *
 * Energía del robot: se agota con el tiempo y al disparar/recibir daño, se recarga
 * con celdas de energía recogidas en el mundo. Pura lógica, sin DOM ni eventos:
 * el Player decide qué emitir cuando la batería llega a cero.
 *
 * Usado por: Player (player.js).
 * Depende de: config.js (BATTERY), math-utils.js (clamp).
 */
import { BATTERY } from '../config.js';
import { clamp } from '../core/math-utils.js';

/**
 * Modelo de batería con drenaje, gasto, recarga y llenado.
 *
 * Ciclo de vida: Player la crea en su constructor; vive mientras el Player exista.
 * Colabora con: Player (consulta isEmpty, isLow; llama drain, spend, recharge).
 */
export class Battery {
  /** @type {number} — carga actual, en unidades (0 a max) */
  #value;
  /** @type {number} — carga máxima */
  #max;

  /**
   * @param {number} max — carga máxima (normalmente BATTERY.max = 100).
   */
  constructor(max) {
    this.#max = max;
    this.#value = max;
  }

  /** @returns {number} carga actual */
  get value() { return this.#value; }
  /** @returns {number} carga actual como fracción 0–1 (para la barra del HUD) */
  get ratio() { return this.#value / this.#max; }
  /** @returns {boolean} true si la batería está vacía */
  get isEmpty() { return this.#value <= 0; }
  /** @returns {boolean} true si la carga está por debajo del umbral de alarma */
  get isLow() { return this.#value <= BATTERY.lowThreshold; }

  /**
   * Reduce la carga (drenaje pasivo o daño). Nunca baja de cero.
   * @param {number} amount — cantidad a drenar.
   */
  drain(amount) {
    this.#value = clamp(this.#value - amount, 0, this.#max);
  }

  /**
   * Gasta una cantidad exacta si hay suficiente carga. Si no alcanza, no gasta nada.
   * Se usa para disparar: si no hay batería, no se puede disparar.
   *
   * @param {number} amount — cantidad a gastar.
   * @returns {boolean} true si se pudo gastar, false si no había suficiente.
   */
  spend(amount) {
    if (this.#value < amount) return false;
    this.#value = clamp(this.#value - amount, 0, this.#max);
    return true;
  }

  /**
   * Recarga la batería (al recoger una celda de energía). Nunca supera el máximo.
   * @param {number} amount — cantidad a recargar.
   */
  recharge(amount) {
    this.#value = clamp(this.#value + amount, 0, this.#max);
  }

  /** Llena la batería al máximo (al empezar un nivel o reaparecer). */
  refill() {
    this.#value = this.#max;
  }
}
