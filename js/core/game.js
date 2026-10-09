/**
 * @module game
 *
 * Raíz de composición del juego. Crea cada pieza una sola vez (Input, Camera,
 * EventBus, Settings, vistas, bucle, máquina de estados) y la inyecta a quien
 * la necesita a través del objeto `context`. Nada es global.
 *
 * Usado por: main.js (punto de entrada).
 * Depende de: todos los módulos core, todos los estados, las vistas y config.js.
 * Participa en: orquesta el arranque y la destrucción del juego completo.
 */
import { DEBUG, ENEMY, ENEMY_SPRITE, ESCAPE, PICKUP, PLATFORMS, PLAYER, PLAYER_FEEDBACK, ROBOT_SPRITE, SHOOT, TRAINING_DUMMY, TRANSITION, TRAPS } from '../config.js';
import { TouchControls } from '../input/touch-controls.js';
import { GameOverState } from '../states/game-over-state.js';
import { LevelCompleteState } from '../states/level-complete-state.js';
import { MenuState } from '../states/menu-state.js';
import { OffState } from '../states/off-state.js';
import { PausedState } from '../states/paused-state.js';
import { PlayingState } from '../states/playing-state.js';
import { StoryState } from '../states/story-state.js';
import { VictoryState } from '../states/victory-state.js';
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

/** Nombres de data-ref que se buscan en el DOM para inyectar en el context */
const REFS = [
  'game', 'viewport', 'world', 'scene', 'entities',
  'debug-layer', 'debug-panel', 'hud', 'panels',
];

/**
 * Raíz de composición del juego.
 *
 * Ciclo de vida: main.js hace `new Game(document).start()`. Al cerrar, se llama destroy().
 * Colabora con: todos los módulos del juego a través del objeto `context`.
 *
 * El constructor también sincroniza variables CSS con config.js (una sola vez),
 * para que las animaciones CSS (duraciones, tamaños de sprite) coincidan con la lógica.
 */
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
  #touchControls;

  /**
   * @param {Document|HTMLElement} [scope=document] — raíz DOM donde buscar los data-ref.
   */
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
        story: new StoryState(context),
        playing: new PlayingState(context),
        paused: new PausedState(context),
        'level-complete': new LevelCompleteState(context),
        'game-over': new GameOverState(context),
        victory: new VictoryState(context),
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
    s.setProperty('--press-block-w', TRAPS.press.blockWidth);
    s.setProperty('--press-block-h', TRAPS.press.blockHeight);
    s.setProperty('--press-piston-overlap', TRAPS.press.pistonOverlap);
    s.setProperty('--alert-pulse-cycle', `${ESCAPE.alertPulseCycle}s`);
    s.setProperty('--alert-shake-amplitude', ESCAPE.shakeAmplitude);

    this.#disposeDevice = setupDeviceClass(refs.game);

    // Controles tactiles: se crean siempre pero CSS los muestra solo con is-touch.
    this.#touchControls = new TouchControls(refs.game, this.#input);

    this.#resizeObserver = new ResizeObserver(([entry]) => this.#onResize(entry.contentRect));
    this.#resizeObserver.observe(refs.viewport);
    this.#onResize(refs.viewport.getBoundingClientRect());
  }

  /**
   * Arranca el juego: activa la depuración si está configurada, cambia al menú
   * principal e inicia el bucle de frames.
   */
  start() {
    this.#debugView.setEnabled(DEBUG.enabledOnStart);
    this.#states.change('menu');
    this.#loop.start();
  }

  /**
   * Destruye el juego: detiene el bucle, sale de todos los estados, desconecta
   * el observer de tamaño, libera Input, EventBus, dispositivo y depuración.
   */
  destroy() {
    this.#loop.stop();
    this.#states.dispose();
    this.#resizeObserver.disconnect();
    this.#input.dispose();
    this.#events.clear();
    this.#touchControls.dispose();
    this.#disposeDevice();
    this.#debugView.dispose();
  }

  /** @param {number} deltaTime — segundos del subpaso actual */
  #update(deltaTime) {
    if (this.#input.consumePress('debug')) this.#debugView.toggle();
    this.#states.update(deltaTime);
  }

  /** @param {number} frameDelta — delta total del frame, en segundos */
  #render(frameDelta) {
    this.#states.render(frameDelta);
    if (this.#states.baseName === 'playing') {
      this.#worldView.render(this.#camera);
    }
    this.#debugView.render(frameDelta);
  }

  /** Recalcula escala y vista al cambiar el tamaño del viewport */
  #onResize({ width, height }) {
    this.#camera.resize(width, height);
    this.#worldView.applyScale(this.#camera);
  }
}
