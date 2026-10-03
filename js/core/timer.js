// Temporizador de cuenta regresiva reutilizable.
// Lo usan las animaciones del Player, el cooldown del disparo y las trampas.

export class Timer {
  #remaining = 0;

  get active() { return this.#remaining > 0; }
  get value() { return this.#remaining; }

  start(duration) {
    this.#remaining = duration;
  }

  reset() {
    this.#remaining = 0;
  }

  update(dt) {
    if (this.#remaining > 0) this.#remaining = Math.max(0, this.#remaining - dt);
  }
}
