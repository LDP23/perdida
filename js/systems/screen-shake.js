/**
 * @module screen-shake
 *
 * Sacudida de pantalla al recibir daño con knockback. Agrega y quita la clase
 * `is-shaking` en el elemento .game; CSS aplica la animación. Respeta la
 * preferencia screenShake del jugador.
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: config.js (PLAYER_FEEDBACK), timer.js.
 * Escucha: 'player:hurt' { knockback }
 */
import { PLAYER_FEEDBACK } from '../config.js';
import { Timer } from '../core/timer.js';

/**
 * Sistema de sacudida de pantalla.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() limpia el listener.
 * Colabora con: EventBus (escucha player:hurt), Settings (consulta screenShake).
 */
export class ScreenShake {
  #settings;
  #gameEl;
  #timer = new Timer();
  #unsub;

  constructor({ context }) {
    this.#settings = context.settings;
    this.#gameEl = context.refs.game;
    this.#unsub = context.events.on('player:hurt', ({ knockback }) => {
      if (knockback) this.#trigger();
    });
  }

  update(deltaTime) {
    this.#timer.update(deltaTime);
    if (!this.#timer.active) {
      this.#gameEl.classList.remove('is-shaking');
    }
  }

  dispose() {
    this.#unsub();
    this.#stop();
  }

  #trigger() {
    if (!this.#settings.get('screenShake')) return;
    this.#gameEl.classList.remove('is-shaking');
    void this.#gameEl.offsetWidth;
    this.#gameEl.classList.add('is-shaking');
    this.#timer.start(PLAYER_FEEDBACK.shakeDuration);
  }

  #stop() {
    this.#timer.reset();
    this.#gameEl.classList.remove('is-shaking');
  }
}
