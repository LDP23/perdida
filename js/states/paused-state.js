import { MenuNavigator } from '../ui/menu-navigator.js';
import { toggleFullscreen } from '../ui/screens.js';
import { queryRefs } from '../view/dom-utils.js';

const REFS = [
  'screen-paused', 'paused-buttons',
  'btn-resume', 'btn-restart-level', 'btn-pause-how-to-play', 'btn-pause-options', 'btn-exit-to-menu',
  'confirm-dialog', 'btn-confirm-yes', 'btn-confirm-no',
  'screen-how-to-play', 'how-to-play-buttons', 'btn-back-how-to-play',
  'screen-options', 'options-list', 'options-buttons', 'btn-back-options', 'btn-fullscreen',
];

export class PausedState {
  #context;
  #refs;
  #nav = null;
  #subNav = null;
  #sub = null;
  #pendingAction = null;
  #listeners = [];

  constructor(context) {
    this.#context = context;
    this.#refs = queryRefs(document, REFS);
  }

  enter() {
    this.#context.input.setGameplayEnabled(false);
    this.#pendingAction = null;
    this.#refs['confirm-dialog'].hidden = true;
    this.#refs['paused-buttons'].hidden = false;

    this.#listen('btn-resume', () => this.#resume());
    this.#listen('btn-restart-level', () => this.#confirmAction('restart'));
    this.#listen('btn-pause-how-to-play', () => this.#openSub('how-to-play'));
    this.#listen('btn-pause-options', () => this.#openSub('options'));
    this.#listen('btn-exit-to-menu', () => this.#confirmAction('exit'));
    this.#listen('btn-confirm-yes', () => this.#executeConfirm());
    this.#listen('btn-confirm-no', () => this.#cancelConfirm());
    this.#listen('btn-back-how-to-play', () => this.#closeSub());
    this.#listen('btn-back-options', () => this.#closeSub());
    this.#listen('btn-fullscreen', () => toggleFullscreen());
    this.#setupOptionToggles();

    this.#nav = new MenuNavigator(this.#refs['paused-buttons'], () => this.#resume());
  }

  exit() {
    this.#cleanupSub();
    this.#nav?.dispose();
    this.#nav = null;
    this.#removeListeners();
  }

  update() {
    if (this.#context.input.consumePress('pause') && !this.#sub && !this.#pendingAction) {
      this.#resume();
    }
  }

  #resume() {
    this.#context.states.pop();
  }

  #confirmAction(action) {
    this.#pendingAction = action;
    this.#refs['paused-buttons'].hidden = true;
    this.#refs['confirm-dialog'].hidden = false;
    this.#nav?.dispose();
    this.#nav = new MenuNavigator(this.#refs['confirm-dialog'], () => this.#cancelConfirm());
  }

  #executeConfirm() {
    if (this.#pendingAction === 'restart') {
      // Restaurar puntos e IDs al inicio del nivel, sin perder intento
      const session = this.#context.playingSession;
      session.restoreLevelStart();
      this.#context.states.change('playing', { session });
    } else if (this.#pendingAction === 'exit') {
      this.#context.states.change('menu');
    }
  }

  #cancelConfirm() {
    this.#pendingAction = null;
    this.#refs['confirm-dialog'].hidden = true;
    this.#refs['paused-buttons'].hidden = false;
    this.#context.input.consumePress('pause');
    this.#nav?.dispose();
    this.#nav = new MenuNavigator(this.#refs['paused-buttons'], () => this.#resume());
  }

  #openSub(name) {
    this.#cleanupSub();
    this.#sub = name;
    this.#context.refs.game.dataset.sub = name;

    if (name === 'options') this.#syncOptionStates();

    const navRoot = {
      'how-to-play': this.#refs['screen-how-to-play'],
      options: this.#refs['screen-options'],
    }[name];
    this.#subNav = new MenuNavigator(navRoot, () => this.#closeSub());
  }

  #closeSub() {
    this.#cleanupSub();
    // Consumir la pulsación de pause para que update() no la interprete como "reanudar"
    this.#context.input.consumePress('pause');
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
