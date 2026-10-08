/**
 * @module victory-state
 *
 * Pantalla de victoria: muestra la lista de tripulantes encontrados, el mensaje
 * especial si se encontraron los 9, y los créditos del equipo. Se activa con
 * states.change('victory') al tocar la cápsula de escape.
 *
 * Se usa change() y no push() porque el juego terminó: no hay que volver al estado
 * de juego. change() vacía la pila y destruye PlayingState, liberando sistemas,
 * entidades y vistas. Es la transición más limpia.
 *
 * Usado por: StateMachine (estado 'victory').
 * Depende de: crew-logs.js (CREW_LOGS, VICTORY_MESSAGE), MenuNavigator, dom-utils.js, screens.js.
 */
import { CREW_LOGS, VICTORY_MESSAGE } from '../levels/crew-logs.js';
import { MenuNavigator } from '../ui/menu-navigator.js';
import { formatScore, saveHighScore } from '../ui/screens.js';
import { queryRefs } from '../view/dom-utils.js';

const REFS = [
  'screen-victory', 'victory-subtitle', 'victory-crew-list',
  'victory-special', 'victory-score', 'victory-buttons', 'btn-victory-menu',
];

/**
 * Estado de victoria (final del juego).
 *
 * Ciclo de vida: StateMachine lo activa con change('victory'); enter() muestra los
 * resultados; exit() limpia listeners.
 */
export class VictoryState {
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
    const found = session?.crewFoundCount ?? 0;
    const total = CREW_LOGS.length;
    const allFound = found === total;

    saveHighScore(session?.score ?? 0);

    this.#refs['victory-subtitle'].textContent = allFound
      ? `Tripulación identificada: ${found} de ${total} — COMPLETA`
      : `Tripulación identificada: ${found} de ${total}`;
    this.#refs['victory-subtitle'].classList.toggle('is-complete', allFound);

    const list = this.#refs['victory-crew-list'];
    list.innerHTML = '';
    for (const entry of CREW_LOGS) {
      const li = document.createElement('li');
      const isFound = session?.hasFoundCrewId(entry.id) ?? false;
      li.className = isFound ? 'crew-found' : 'crew-missing';
      const dot = isFound ? '●' : '●';
      li.textContent = isFound
        ? `${dot} ${entry.name} — ${entry.role}`
        : `${dot} — Desconocido —`;
      list.append(li);
    }

    this.#refs['victory-special'].textContent = allFound ? VICTORY_MESSAGE : '';
    this.#refs['victory-special'].hidden = !allFound;

    this.#refs['victory-score'].textContent = formatScore(session?.score ?? 0);

    this.#listen('btn-victory-menu', () => this.#toMenu());
    this.#nav = new MenuNavigator(this.#refs['victory-buttons']);
  }

  exit() {
    this.#nav?.dispose();
    this.#nav = null;
    this.#removeListeners();
  }

  update() {}

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
