/**
 * @module captain-panel
 *
 * Panel narrativo del registro final del capitán. Estilo terminal igual que el panel
 * de IDs de tripulante, pero con texto más largo y sin barra de progreso. Se cierra
 * con confirm (Enter/E) o pause (Escape) después de un delay mínimo.
 *
 * Usado por: EscapeSystem (lo abre al interactuar con la consola del capitán).
 * Depende de: config.js (MESSAGES), timer.js, crew-logs.js (CAPTAIN_LOG_TEXT).
 */
import { MESSAGES } from '../config.js';
import { Timer } from '../core/timer.js';
import { CAPTAIN_LOG_TEXT } from '../levels/crew-logs.js';

/**
 * Panel del registro final del capitán.
 *
 * Ciclo de vida: EscapeSystem lo crea una vez; open() lo muestra; close() lo oculta;
 * destroy() limpia el DOM.
 */
export class CaptainPanel {
  #panelsLayer;
  #element = null;
  #isOpen = false;
  #closeDelayTimer = new Timer();

  constructor(panelsLayer) {
    this.#panelsLayer = panelsLayer;
  }

  get isOpen() { return this.#isOpen; }

  open() {
    this.#closeDelayTimer.start(MESSAGES.closeDelay);
    this.#isOpen = true;
    this.#buildElement();
  }

  /**
   * Avanza el delay y revisa si el jugador quiere cerrar.
   * @param {number} dt — delta time en segundos.
   * @param {Input} input — sistema de entrada.
   */
  update(dt, input) {
    if (!this.#isOpen) return;
    this.#closeDelayTimer.update(dt);
    if (this.#closeDelayTimer.active) return;
    if (input.consumePress('confirm') || input.consumePress('pause')) {
      this.close();
    }
  }

  close() {
    this.#isOpen = false;
    this.#element?.remove();
    this.#element = null;
  }

  destroy() {
    this.close();
  }

  #buildElement() {
    this.#element?.remove();
    const el = document.createElement('div');
    el.className = 'captain-panel';

    const content = document.createElement('div');
    content.className = 'captain-panel__content';
    for (const line of CAPTAIN_LOG_TEXT.split('\n')) {
      const p = document.createElement('p');
      p.className = 'captain-panel__line';
      p.textContent = line;
      if (line === '') p.innerHTML = '&nbsp;';
      content.append(p);
    }
    el.append(content);

    const hint = document.createElement('div');
    hint.className = 'captain-panel__hint';
    hint.textContent = 'Enter / Esc para continuar';
    el.append(hint);

    this.#panelsLayer.append(el);
    this.#element = el;
  }
}
