/**
 * @module game-over-state
 *
 * Resumen de fin de partida: puntuación, IDs encontrados, récord (con marcador de
 * nuevo récord), botones para reiniciar o salir al menú.
 *
 * Usado por: StateMachine (estado 'game-over').
 * Depende de: GameSession, MenuNavigator, screens.js, dom-utils.js.
 */
import { GameSession } from '../core/session.js';
import { MenuNavigator } from '../ui/menu-navigator.js';
import { formatScore, getHighScore, saveHighScore } from '../ui/screens.js';
import { queryRefs } from '../view/dom-utils.js';

const REFS = [
  'screen-game-over', 'game-over-buttons', 'game-over-summary',
  'go-score', 'go-crew', 'go-record', 'go-new-record',
  'btn-restart', 'btn-go-menu',
];

/**
 * Estado de game over.
 *
 * Ciclo de vida: StateMachine lo activa con change('game-over') al perder todos los intentos.
 */
export class GameOverState {
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
    const session = params?.session;
    const score = session?.score ?? 0;
    const crewFound = session?.crewFoundCount ?? 0;

    const isNewRecord = saveHighScore(score);
    const record = getHighScore();

    this.#refs['go-score'].textContent = formatScore(score);
    this.#refs['go-crew'].textContent = crewFound;
    this.#refs['go-record'].textContent = formatScore(record);
    this.#refs['go-new-record'].hidden = !isNewRecord;

    this.#listen('btn-restart', () => this.#restart());
    this.#listen('btn-go-menu', () => this.#toMenu());

    this.#nav = new MenuNavigator(this.#refs['game-over-buttons']);
  }

  exit() {
    this.#nav?.dispose();
    this.#nav = null;
    this.#removeListeners();
  }

  #restart() {
    const session = new GameSession(this.#context.events);
    this.#context.states.change('playing', { session });
  }

  #toMenu() {
    this.#context.states.change('menu');
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
