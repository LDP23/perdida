import { MESSAGES } from '../config.js';
import { clamp } from '../core/math-utils.js';
import { Timer } from '../core/timer.js';
import { CREW_LOGS } from '../levels/crew-logs.js';

// Panel que muestra el registro de un tripulante encontrado.
// Mientras está abierto el juego se pausa (PlayingState lo consulta).
export class CrewLogPanel {
  #panelsLayer;
  #element = null;
  #barEl = null;
  #isOpen = false;
  #duration = 0;
  #elapsed = 0;
  #closeDelayTimer = new Timer();

  constructor(panelsLayer) {
    this.#panelsLayer = panelsLayer;
  }

  get isOpen() { return this.#isOpen; }

  open(crewId) {
    const entry = CREW_LOGS.find((c) => c.id === crewId);
    if (!entry) return;
    this.#duration = clamp(
      entry.log.length / MESSAGES.readingCharsPerSecond,
      MESSAGES.readingMin,
      MESSAGES.readingMax,
    );
    this.#elapsed = 0;
    this.#closeDelayTimer.start(MESSAGES.closeDelay);
    this.#isOpen = true;
    this.#buildElement(entry);
  }

  update(dt, input) {
    if (!this.#isOpen) return;
    this.#elapsed += dt;
    this.#closeDelayTimer.update(dt);

    const ratio = clamp(1 - this.#elapsed / this.#duration, 0, 1);
    if (this.#barEl) this.#barEl.style.setProperty('--ratio', ratio);

    const canClose = !this.#closeDelayTimer.active;
    const expired = this.#elapsed >= this.#duration;
    const confirmed = canClose && input.consumePress('confirm');

    if (expired || confirmed) this.close();
  }

  close() {
    this.#isOpen = false;
    this.#element?.remove();
    this.#element = null;
    this.#barEl = null;
  }

  destroy() {
    this.close();
  }

  #buildElement(entry) {
    this.#element?.remove();
    const el = document.createElement('div');
    el.className = 'crew-panel';

    el.innerHTML =
      `<div class="crew-panel__header">` +
        `<div class="crew-panel__name">${entry.name}</div>` +
        `<div class="crew-panel__role">${entry.role}</div>` +
      `</div>` +
      `<div class="crew-panel__label">Último registro</div>` +
      `<div class="crew-panel__log">${entry.log}</div>` +
      `<div class="crew-panel__bar"></div>` +
      `<div class="crew-panel__hint">Enter / E para continuar</div>`;

    this.#panelsLayer.append(el);
    this.#element = el;
    this.#barEl = el.querySelector('.crew-panel__bar');
  }
}
