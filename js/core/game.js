import { DEBUG } from '../config.js';
import { PlayingState } from '../states/playing-state.js';
import { DebugView } from '../view/debug-view.js';
import { queryRefs } from '../view/dom-utils.js';
import { WorldView } from '../view/world-view.js';
import { Camera } from './camera.js';
import { GameLoop } from './game-loop.js';
import { Input } from './input.js';
import { StateMachine } from './state-machine.js';

const REFS = ['game', 'viewport', 'world', 'scene', 'entities', 'debug-layer', 'debug-panel'];

// Raíz de composición: crea cada pieza UNA vez y se la pasa a quien la necesita.
// Nada es global; los estados reciben todo por el objeto "context".
export class Game {
  #input;
  #camera;
  #worldView;
  #debugView;
  #states;
  #loop;
  #resizeObserver;

  constructor(scope = document) {
    const refs = queryRefs(scope, REFS);
    this.#input = new Input();
    this.#camera = new Camera();
    this.#worldView = new WorldView(refs);
    this.#debugView = new DebugView(refs, this.#camera);

    const context = {
      input: this.#input,
      camera: this.#camera,
      worldView: this.#worldView,
      debugView: this.#debugView,
      layers: { entities: refs.entities },
    };
    this.#states = new StateMachine(
      { playing: new PlayingState(context) },
      // El CSS muestra u oculta pantallas según este atributo (etapa 6).
      (name) => { refs.game.dataset.state = name; },
    );
    this.#loop = new GameLoop({
      update: (deltaTime) => this.#update(deltaTime),
      render: (frameDelta) => this.#render(frameDelta),
      endFrame: () => this.#input.endFrame(),
    });
    this.#resizeObserver = new ResizeObserver(([entry]) => this.#onResize(entry.contentRect));
    this.#resizeObserver.observe(refs.viewport);
    // Medida inicial inmediata: la cámara necesita la escala antes del primer frame.
    this.#onResize(refs.viewport.getBoundingClientRect());
  }

  start() {
    this.#debugView.setEnabled(DEBUG.enabledOnStart);
    this.#states.change('playing');
    this.#loop.start();
  }

  // Deja todo como estaba: sin bucles, listeners ni observadores sueltos.
  destroy() {
    this.#loop.stop();
    this.#states.dispose();
    this.#resizeObserver.disconnect();
    this.#input.dispose();
    this.#debugView.dispose();
  }

  #update(deltaTime) {
    if (this.#input.consumePress('debug')) this.#debugView.toggle();
    this.#states.update(deltaTime);
  }

  #render(frameDelta) {
    this.#states.render(frameDelta);
    this.#worldView.render(this.#camera);
    this.#debugView.render(frameDelta);
  }

  #onResize({ width, height }) {
    this.#camera.resize(width, height);
    this.#worldView.applyScale(this.#camera);
  }
}
