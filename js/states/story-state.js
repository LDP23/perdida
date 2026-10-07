/**
 * @module story-state
 *
 * Pantalla de historia entre niveles: muestra el título y las líneas narrativas
 * del nivel que está por empezar. Aparece al iniciar una partida nueva (antes del
 * nivel 1) y al continuar desde "nivel completado" (antes del nivel siguiente).
 * NO aparece al morir ni al reiniciar.
 *
 * Tiempos: usa las mismas reglas de MESSAGES que el panel de IDs.
 * - Duración = clamp(caracteres / readingCharsPerSecond, readingMin, readingMax).
 * - confirm solo funciona después de closeDelay.
 * - Se cierra sola al terminar el tiempo.
 *
 * Usado por: StateMachine (estado 'story').
 * Depende de: config.js (MESSAGES), MenuNavigator, dom-utils.js, levels.js.
 */
import { MESSAGES } from '../config.js';
import { Timer } from '../core/timer.js';
import { LEVELS } from '../levels/levels.js';
import { MenuNavigator } from '../ui/menu-navigator.js';
import { queryRefs } from '../view/dom-utils.js';

const REFS = [
  'screen-story', 'story-title', 'story-lines', 'story-buttons',
  'btn-story-continue',
];

/**
 * Estado de historia entre niveles.
 *
 * Ciclo de vida: StateMachine lo activa con change('story'); enter() monta las
 * líneas; update() avanza los temporizadores; exit() limpia.
 */
export class StoryState {
  #context;
  #refs;
  #nav = null;
  #session = null;
  #readTimer = new Timer();
  #delayTimer = new Timer();
  #canConfirm = false;
  #listeners = [];

  constructor(context) {
    this.#context = context;
    this.#refs = queryRefs(document, REFS);
  }

  enter(params) {
    this.#context.input.setGameplayEnabled(false);
    this.#session = params.session;

    const level = LEVELS[this.#session.levelIndex];
    const story = level.story;

    this.#refs['story-title'].textContent = story.title;
    const container = this.#refs['story-lines'];
    container.innerHTML = '';
    for (const line of story.lines) {
      const p = document.createElement('p');
      p.className = 'story__line';
      p.textContent = line;
      container.append(p);
    }

    const bg = level.scenes[0].background;
    this.#refs['screen-story'].style.setProperty('--story-image', `url(${bg})`);

    if (level.theme) this.#context.refs.game.dataset.theme = level.theme;

    const totalChars = story.lines.reduce((sum, l) => sum + l.length, 0);
    const duration = Math.max(MESSAGES.readingMin,
      Math.min(totalChars / MESSAGES.readingCharsPerSecond, MESSAGES.readingMax));
    this.#readTimer.start(duration);
    this.#delayTimer.start(MESSAGES.closeDelay);
    this.#canConfirm = false;

    this.#listen('btn-story-continue', () => this.#confirm());
    this.#nav = new MenuNavigator(this.#refs['story-buttons']);
  }

  exit() {
    this.#nav?.dispose();
    this.#nav = null;
    this.#removeListeners();
    this.#refs['screen-story'].style.removeProperty('--story-image');
  }

  update(deltaTime) {
    this.#readTimer.update(deltaTime);
    this.#delayTimer.update(deltaTime);
    if (!this.#canConfirm && !this.#delayTimer.active) this.#canConfirm = true;
    if (!this.#readTimer.active) { this.#advance(); return; }
    if (this.#canConfirm && this.#context.input.consumePress('confirm')) {
      this.#advance();
    }
  }

  #confirm() {
    if (this.#canConfirm) this.#advance();
  }

  #advance() {
    this.#context.states.change('playing', { session: this.#session });
  }

  #listen(refName, handler) {
    const el = this.#refs[refName];
    el.addEventListener('click', handler);
    this.#listeners.push([el, 'click', handler]);
  }

  #removeListeners() {
    for (const [el, type, handler] of this.#listeners) el.removeEventListener(type, handler);
    this.#listeners.length = 0;
  }
}
