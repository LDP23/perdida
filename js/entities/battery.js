import { BATTERY } from '../config.js';
import { clamp } from '../core/math-utils.js';

// Energía del robot: se agota con el tiempo y los disparos, se recarga con celdas.
// Pura lógica, sin DOM ni eventos: el Player decide qué emitir.

export class Battery {
  #value;
  #max;

  constructor(max) {
    this.#max = max;
    this.#value = max;
  }

  get value() { return this.#value; }
  get ratio() { return this.#value / this.#max; }
  get isEmpty() { return this.#value <= 0; }
  get isLow() { return this.#value <= BATTERY.lowThreshold; }

  drain(amount) {
    this.#value = clamp(this.#value - amount, 0, this.#max);
  }

  // Gasta si alcanza; devuelve false sin gastar si no.
  spend(amount) {
    if (this.#value < amount) return false;
    this.#value = clamp(this.#value - amount, 0, this.#max);
    return true;
  }

  recharge(amount) {
    this.#value = clamp(this.#value + amount, 0, this.#max);
  }

  refill() {
    this.#value = this.#max;
  }
}
