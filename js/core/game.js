import { DEBUG, ENEMY, ENEMY_SPRITE, PICKUP, PLATFORMS, PLAYER, PLAYER_FEEDBACK, ROBOT_SPRITE, SHOOT, TRAINING_DUMMY, TRANSITION } from '../config.js';
import { GameOverState } from '../states/game-over-state.js';
import { LevelCompleteState } from '../states/level-complete-state.js';
import { MenuState } from '../states/menu-state.js';
import { OffState } from '../states/off-state.js';
import { PausedState } from '../states/paused-state.js';
import { PlayingState } from '../states/playing-state.js';
import { DebugView } from '../view/debug-view.js';
import { queryRefs } from '../view/dom-utils.js';
import { WorldView } from '../view/world-view.js';
import { Camera } from './camera.js';
import { setupDeviceClass } from './device.js';
import { EventBus } from './event-bus.js';
import { GameLoop } from './game-loop.js';
import { Input } from './input.js';
import { Settings } from './settings.js';
import { StateMachine } from './state-machine.js';

const REFS = [
  'game', 'viewport', 'world', 'scene', 'entities',
  'debug-layer', 'debug-panel', 'hud', 'panels',
];

// Raíz de composición: crea cada pieza UNA vez y se la pasa a quien la necesita.
// Nada es global; los estados reciben todo por el objeto "context".
export class Game {
  #input;
  #camera;
  #events;
  #worldView;
  #debugView;
  #settings;
  #states;
  #loop;
  #resizeObserver;
  #disposeDevice;

  constructor(scope = document) {
    const refs = queryRefs(scope, REFS);
    this.#input = new Input();
    this.#camera = new Camera();
    this.#events = new EventBus();
    this.#settings = new Settings(refs.game);
    this.#worldView = new WorldView(refs);
    this.#debugView = new DebugView(refs, this.#camera);

    this.#loop = new GameLoop({
      update: (deltaTime) => this.#update(deltaTime),
      render: (frameDelta) => this.#render(frameDelta),
      endFrame: () => this.#input.endFrame(),
    });

    const context = {
      input: this.#input,
      camera: this.#camera,
      events: this.#events,
      settings: this.#settings,
      worldView: this.#worldView,
      debugView: this.#debugView,
      loop: this.#loop,
      layers: { entities: refs.entities, world: refs.world, hud: refs.hud, panels: refs.panels },
      refs,
    };

    this.#states = new StateMachine(
      {
        menu: new MenuState(context),
        playing: new PlayingState(context),
        paused: new PausedState(context),
        'level-complete': new LevelCompleteState(context),
        'game-over': new GameOverState(context),
        off: new OffState(context),
      },
      refs.game,
    );
    context.states = this.#states;

    // Variables CSS sincronizadas con config.js (se escriben una sola vez)
    const s = refs.game.style;
    s.setProperty('--collect-duration', `${PICKUP.collectDuration}s`);
    s.setProperty('--robot-frame-w', ROBOT_SPRITE.frameWidth);
    s.setProperty('--robot-frame-h', ROBOT_SPRITE.frameHeight);
    s.setProperty('--run-cycle', `${3 / PLAYER_FEEDBACK.runFps}s`);
    s.setProperty('--land-duration', `${PLAYER_FEEDBACK.landDuration}s`);
    s.setProperty('--hurt-aura-duration', `${PLAYER_FEEDBACK.hurtAuraDuration}s`);
    s.setProperty('--death-duration', `${PLAYER_FEEDBACK.deathSequenceDuration}s`);
    s.setProperty('--respawn-duration', `${PLAYER_FEEDBACK.respawnDuration}s`);
    s.setProperty('--shake-duration', `${PLAYER_FEEDBACK.shakeDuration}s`);
    s.setProperty('--shake-intensity', PLAYER_FEEDBACK.shakeIntensity);
    // El fogonazo esta en el sprite, cuyo top esta (frameHeight - hitboxHeight) px
    // por encima del borde superior de la hitbox.
    const spriteTopOffset = ROBOT_SPRITE.frameHeight - PLAYER.height;
    s.setProperty('--muzzle-y', SHOOT.muzzleOffset.y + spriteTopOffset);
    // Espantapajaros: distancia del fondo de la hitbox al fondo del sprite
    const dummyBottomOffset = TRAINING_DUMMY.spriteHeight
      - TRAINING_DUMMY.hitboxTopOffset - TRAINING_DUMMY.hitboxHeight;
    s.setProperty('--dummy-bottom-offset', dummyBottomOffset);
    s.setProperty('--fade-out', `${TRANSITION.fadeOut}s`);
    s.setProperty('--fade-in', `${TRANSITION.fadeIn}s`);
    s.setProperty('--platform-shake-time', `${PLATFORMS.falling.shakeTime}s`);
    s.setProperty('--enemy-frame-w', ENEMY_SPRITE.frameWidth);
    s.setProperty('--enemy-frame-h', ENEMY_SPRITE.frameHeight);
    s.setProperty('--enemy-walk-cycle', `${2 / ENEMY.walkFps}s`);
    s.setProperty('--enemy-windup-time', `${ENEMY.windupTime}s`);
    s.setProperty('--enemy-hurt-time', `${ENEMY.hurtTime}s`);
    s.setProperty('--enemy-dying-time', `${ENEMY.dyingTime}s`);
    s.setProperty('--enemy-fade-time', `${ENEMY.fadeTime}s`);

    this.#disposeDevice = setupDeviceClass(refs.game);
    this.#resizeObserver = new ResizeObserver(([entry]) => this.#onResize(entry.contentRect));
    this.#resizeObserver.observe(refs.viewport);
    this.#onResize(refs.viewport.getBoundingClientRect());
  }

  start() {
    this.#debugView.setEnabled(DEBUG.enabledOnStart);
    this.#states.change('menu');
    this.#loop.start();
  }

  destroy() {
    this.#loop.stop();
    this.#states.dispose();
    this.#resizeObserver.disconnect();
    this.#input.dispose();
    this.#events.clear();
    this.#disposeDevice();
    this.#debugView.dispose();
  }

  #update(deltaTime) {
    if (this.#input.consumePress('debug')) this.#debugView.toggle();
    this.#states.update(deltaTime);
  }

  #render(frameDelta) {
    this.#states.render(frameDelta);
    if (this.#states.baseName === 'playing') {
      this.#worldView.render(this.#camera);
    }
    this.#debugView.render(frameDelta);
  }

  #onResize({ width, height }) {
    this.#camera.resize(width, height);
    this.#worldView.applyScale(this.#camera);
  }
}
