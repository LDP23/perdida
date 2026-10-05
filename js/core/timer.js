/**
 * @module timer
 *
 * Temporizador de cuenta regresiva reutilizable, actualizado manualmente cada frame.
 * Se usa en vez de setTimeout/setInterval porque éstos siguen corriendo durante
 * la pausa y pueden dispararse después de reiniciar o salir al menú.
 *
 * Usado por: Player (invulnerabilidad, cooldown, muerte), Enemy (estados),
 *            SceneFlow (transiciones), ScreenShake, FallingPlatform, CrewLogPanel.
 * Depende de: nada.
 */

/**
 * Temporizador de cuenta regresiva. Cuenta hacia cero a partir de una duración dada.
 *
 * Ciclo de vida: la entidad o sistema lo crea como campo, llama start(duración)
 * para activarlo y update(dt) en cada frame. Se puede reusar llamando start() de nuevo.
 */
export class Timer {
  /** @type {number} — segundos restantes; 0 cuando inactivo */
  #remaining = 0;

  /** @returns {boolean} true si el temporizador aún no llegó a cero */
  get active() { return this.#remaining > 0; }

  /** @returns {number} segundos restantes */
  get value() { return this.#remaining; }

  /**
   * Inicia o reinicia la cuenta regresiva.
   * @param {number} duration — duración en segundos.
   */
  start(duration) {
    this.#remaining = duration;
  }

  /** Detiene el temporizador poniéndolo en cero. */
  reset() {
    this.#remaining = 0;
  }

  /**
   * Avanza la cuenta regresiva. Debe llamarse en cada update().
   * @param {number} dt — deltaTime del paso actual, en segundos.
   */
  update(dt) {
    if (this.#remaining > 0) this.#remaining = Math.max(0, this.#remaining - dt);
  }
}
