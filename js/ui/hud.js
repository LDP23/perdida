/**
 * @module hud
 *
 * Modelo de datos del HUD (Heads-Up Display): batería, vidas, nivel, puntos, IDs
 * y toast (aviso breve). No toca el DOM — HudView lee estos valores para dibujar.
 *
 * Usado por: PlayingState (actualiza los valores), HudView (los lee para dibujar).
 * Depende de: config.js (MESSAGES), timer.js.
 */
import { MESSAGES } from '../config.js';
import { Timer } from '../core/timer.js';

/**
 * Datos del HUD. Separado de la vista para mantener lógica y DOM aislados.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); vive toda la escena.
 */
export class Hud {
  battery = 100;
  batteryRatio = 1;
  batteryLow = false;
  lives = 3;
  levelName = '';
  score = 0;
  crewFound = 0;
  crewTotal = 9;
  #toastText = '';
  #toastTimer = new Timer();

  get toast() { return this.#toastTimer.active ? this.#toastText : ''; }

  showToast(text) {
    this.#toastText = text;
    this.#toastTimer.start(MESSAGES.toastDuration);
  }

  update(dt) {
    this.#toastTimer.update(dt);
  }
}
