/**
 * @module level-complete-state
 *
 * Overlay al completar un nivel: muestra bono de batería, IDs encontrados en el nivel,
 * puntuación total y botón para continuar al siguiente nivel o volver al menú.
 *
 * Usado por: StateMachine (estado 'level-complete', superpuesto con push sobre 'playing').
 * Depende de: MenuNavigator, screens.js, dom-utils.js, levels.js.
 */
import { MenuNavigator } from '../ui/menu-navigator.js';
import { formatScore, saveHighScore } from '../ui/screens.js';
import { queryRefs } from '../view/dom-utils.js';
import { LEVELS } from '../levels/levels.js';

const REFS = [
  'screen-level-complete', 'lc-title', 'lc-battery-bonus', 'lc-crew',
  'lc-score', 'lc-buttons', 'btn-lc-continue',
];

/**
 * Estado de nivel completado.
 *
 * Ciclo de vida: se apila sobre PlayingState; el jugador decide continuar o salir.
 */
export class LevelCompleteState {
  #context;
  #refs;
  #nav = null;
  #listeners = [];

  constructor(context) {
    this.#context = context;
    this.#refs = queryRefs(document, REFS);
  }

  enter(params) {
    this.#context.input.setGameplayEnabled(false);
    const { session, batteryBonus, crewThisLevel } = params;

    const level = LEVELS[session.levelIndex];
    this.#refs['lc-title'].textContent = `Nivel ${level.id} completado · ${level.name}`;
    this.#refs['lc-battery-bonus'].textContent = `+${formatScore(batteryBonus)}`;
    this.#refs['lc-crew'].textContent = `${crewThisLevel}/3`;
    this.#refs['lc-score'].textContent = formatScore(session.score);

    this.#listen('btn-lc-continue', () => this.#continue(session));
    this.#nav = new MenuNavigator(this.#refs['lc-buttons']);
  }

  exit() {
    this.#nav?.dispose();
    this.#nav = null;
    this.#removeListeners();
  }

  update() {
    // Solo espera a que el jugador pulse el botón
  }

  #continue(session) {
    const nextLevel = session.levelIndex + 1;
    if (nextLevel < LEVELS.length) {
      session.levelIndex = nextLevel;
      session.sceneIndex = 0;
      this.#context.states.change('playing', { session });
    } else {
      // Provisional: niveles 2 y 3 en la etapa 9
      saveHighScore(session.score);
      this.#context.states.change('menu');
    }
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
