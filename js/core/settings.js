import { SETTINGS_DEFAULTS } from '../config.js';
import { load, save } from './storage.js';

// Preferencias del jugador. Cada opción se refleja como clase en .game para que el CSS decida qué apagar.
export class Settings {
  #gameEl;
  #values;

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

  get(key) {
    return this.#values[key];
  }

  set(key, value) {
    this.#values[key] = value;
    this.#apply(key, value);
    save('settings', this.#values);
  }

  toggle(key) {
    this.set(key, !this.#values[key]);
    return this.#values[key];
  }

  #applyAll() {
    for (const [key, value] of Object.entries(this.#values)) {
      this.#apply(key, value);
    }
  }

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
