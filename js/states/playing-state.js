import { PLAYER, SCENE } from '../config.js';
import { Player } from '../entities/player.js';
import { LEVEL_1 } from '../levels/level1.js';
import { loadScene } from '../levels/level-loader.js';
import { EntityView } from '../view/entity-view.js';

// Estado "jugando": carga la escena, actualiza al robot y a la cámara, y le pide
// a las vistas que dibujen. En la etapa 3 elegirá la escena según el progreso.
export class PlayingState {
  #context;
  #scene = null;
  #player = null;
  #playerView = null;
  // Cada carga recibe un número; si el estado cambió mientras cargaba, se descarta.
  #loadId = 0;

  constructor(context) {
    this.#context = context;
  }

  enter() {
    this.#load(LEVEL_1.scenes[0]);
  }

  exit() {
    this.#loadId += 1;
    this.#playerView?.destroy();
    this.#playerView = null;
    this.#player = null;
    this.#scene = null;
  }

  update(deltaTime) {
    if (!this.#scene) return;
    const { input, camera } = this.#context;
    this.#player.update(deltaTime, input, this.#scene.solids);
    this.#handleFall();
    camera.follow(this.#player.body, this.#scene.width, deltaTime);
  }

  render() {
    if (!this.#scene) return;
    const player = this.#player;
    this.#playerView.sync(player.body, {
      'is-facing-left': player.facing < 0,
      'is-grounded': player.isGrounded,
    });
    if (this.#context.debugView.isEnabled) this.#reportDebug();
  }

  async #load(sceneData) {
    const loadId = ++this.#loadId;
    const scene = await loadScene(sceneData);
    if (loadId !== this.#loadId) return;
    this.#showScene(scene);
  }

  #showScene(scene) {
    const { camera, worldView, debugView, layers } = this.#context;
    this.#scene = scene;
    this.#player = new Player(scene.spawn);
    this.#playerView ??= new EntityView(layers.entities, 'player', PLAYER);
    worldView.showScene(scene);
    debugView.showScene(scene);
    debugView.track('player', this.#player.body, 'player');
    camera.jumpTo(this.#player.body, scene.width);
  }

  // Provisional: en la etapa 4 caer al vacío quitará batería y llevará
  // al último punto seguro. Por ahora solo evita perder al robot.
  #handleFall() {
    if (this.#player.body.y > this.#scene.height + SCENE.fallMargin) {
      this.#player.placeAt(this.#scene.spawn);
    }
  }

  #reportDebug() {
    const { body, facing, jumpsUsed } = this.#player;
    this.#context.debugView.report({
      escena: `${this.#scene.id} · ${this.#scene.name}`,
      'robot (pies)': `x ${Math.round(body.x + body.width / 2)}  y ${Math.round(body.y + body.height)}`,
      velocidad: `vx ${Math.round(body.vx)}  vy ${Math.round(body.vy)}`,
      estado: `${this.#player.isGrounded ? 'en el suelo' : 'en el aire'}  saltos ${jumpsUsed}/${PLAYER.maxJumps}  mira ${facing > 0 ? '→' : '←'}`,
    });
  }
}
