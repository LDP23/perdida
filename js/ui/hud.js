import { MESSAGES } from '../config.js';
import { Timer } from '../core/timer.js';

// Datos del HUD: recopila los valores que la vista necesita dibujar.
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
