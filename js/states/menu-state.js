import { GameSession } from '../core/session.js';
import { MenuNavigator } from '../ui/menu-navigator.js';
import { formatScore, getHighScore, supportsFullscreen, toggleFullscreen } from '../ui/screens.js';
import { queryRefs } from '../view/dom-utils.js';

const REFS = [
  'screen-menu', 'menu-buttons', 'menu-record',
  'btn-new-game', 'btn-how-to-play', 'btn-options', 'btn-credits', 'btn-exit',
  'screen-how-to-play', 'how-to-play-buttons', 'btn-back-how-to-play',
  'screen-options', 'options-list', 'options-buttons', 'btn-back-options', 'btn-fullscreen',
  'screen-credits', 'credits-buttons', 'btn-back-credits',
];

export class MenuState {
  #context;
  #refs;
  #nav = null;
  #sub = null;
  #subNav = null;
  #listeners = [];

  constructor(context) {
    this.#context = context;
    this.#refs = queryRefs(document, REFS);
    if (!supportsFullscreen()) this.#refs['btn-fullscreen'].hidden = true;
  }

  enter() {
    this.#context.input.setGameplayEnabled(false);
    this.#refs['menu-record'].textContent = `Récord: ${formatScore(getHighScore())}`;
    this.#sub = null;

    this.#listen('btn-new-game', () => this.#newGame());
    this.#listen('btn-how-to-play', () => this.#openSub('how-to-play'));
    this.#listen('btn-options', () => this.#openSub('options'));
    this.#listen('btn-credits', () => this.#openSub('credits'));
    this.#listen('btn-exit', () => this.#exit());
    this.#listen('btn-back-how-to-play', () => this.#closeSub());
    this.#listen('btn-back-options', () => this.#closeSub());
    this.#listen('btn-back-credits', () => this.#closeSub());
    this.#listen('btn-fullscreen', () => toggleFullscreen());
    this.#setupOptionToggles();

    this.#nav = new MenuNavigator(this.#refs['menu-buttons']);
  }

  exit() {
    this.#cleanupSub();
    this.#nav?.dispose();
    this.#nav = null;
    this.#removeListeners();
  }

  #newGame() {
    const session = new GameSession(this.#context.events);
    this.#context.states.change('playing', { session });
  }

  #openSub(name) {
    this.#cleanupSub();
    this.#sub = name;
    this.#context.refs.game.dataset.sub = name;

    if (name === 'options') this.#syncOptionStates();

    const navRoot = {
      'how-to-play': this.#refs['screen-how-to-play'],
      options: this.#refs['screen-options'],
      credits: this.#refs['screen-credits'],
    }[name];
    this.#subNav = new MenuNavigator(navRoot, () => this.#closeSub());
  }

  #closeSub() {
    this.#cleanupSub();
    this.#nav?.focusFirst();
  }

  #cleanupSub() {
    if (this.#sub) {
      delete this.#context.refs.game.dataset.sub;
      this.#sub = null;
    }
    this.#subNav?.dispose();
    this.#subNav = null;
  }

  #exit() {
    this.#context.states.change('off');
  }

  #setupOptionToggles() {
    const toggles = this.#refs['options-list'].querySelectorAll('[data-option]');
    for (const btn of toggles) {
      const key = btn.dataset.option;
      const handler = () => {
        const newValue = this.#context.settings.toggle(key);
        btn.setAttribute('aria-pressed', String(newValue));
      };
      btn.addEventListener('click', handler);
      this.#listeners.push([btn, 'click', handler]);
    }
  }

  #syncOptionStates() {
    const toggles = this.#refs['options-list'].querySelectorAll('[data-option]');
    for (const btn of toggles) {
      const key = btn.dataset.option;
      btn.setAttribute('aria-pressed', String(this.#context.settings.get(key)));
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
