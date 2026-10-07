/**
 * @module scene-flow
 *
 * Gestiona las salidas de escena (por borde y por puerta), las transiciones con fundido
 * a negro, la muerte/reaparición, completar nivel, y la carga asíncrona de escenas.
 *
 * Fases de la transición de escena:
 * 1. fade-out: se muestra el fundido negro (duración TRANSITION.fadeOut).
 * 2. loading: se carga la siguiente escena (asíncrona, con loadImage + loadScene).
 * 3. fade-in: se oculta el fundido (duración TRANSITION.fadeIn).
 * 4. fade-in-wait: espera a que la animación CSS termine, luego se elimina el elemento.
 *
 * La transición se detiene durante la pausa (no avanza el Timer).
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: config.js, assets.js, timer.js, levels.js, level-loader.js, collision.js, screens.js.
 * Escucha: 'player:battery-empty', 'player:respawn-end', 'debug:jump-scene'.
 */
import { SCORE, TRANSITION } from '../config.js';
import { loadImage } from '../core/assets.js';
import { Timer } from '../core/timer.js';
import { LEVELS } from '../levels/levels.js';
import { loadScene } from '../levels/level-loader.js';
import { rectsOverlap } from '../physics/collision.js';
import { saveHighScore } from '../ui/screens.js';

/**
 * Sistema de flujo de escena.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() limpia listeners y fundido.
 * Colabora con: PlayingState (mountScene callback), GameSession, StateMachine.
 */
export class SceneFlow {
  #context;
  #getWorld;
  #session;
  #hud;
  #mountScene;
  #transitioning = false;
  #transitionPhase = null;
  #transitionTimer = new Timer();
  #fadeElement = null;
  #loadId = 0;
  #unsubs = [];

  constructor({ context, getWorld, session, hud }, mountScene) {
    this.#context = context;
    this.#getWorld = getWorld;
    this.#session = session;
    this.#hud = hud;
    this.#mountScene = mountScene;

    this.#unsubs.push(
      context.events.on('player:battery-empty', () => this.#onBatteryEmpty()),
      context.events.on('player:respawn-end', () => {
        context.input.setGameplayEnabled(true);
      }),
      context.events.on('debug:jump-scene', ({ index }) => {
        this.#session.sceneIndex = index;
        this.loadCurrentScene();
      }),
    );
  }

  get transitioning() { return this.#transitioning; }

  updateTransition(deltaTime) {
    this.#transitionTimer.update(deltaTime);
    if (!this.#transitioning) return false;
    this.#advanceTransition();
    return true;
  }

  checkExits() {
    this.#checkEdgeExit();
    this.#checkDoorExit();
  }

  onDeathSequenceEnd() {
    const remaining = this.#session.loseLife();
    if (this.#session.isGameOver) {
      saveHighScore(this.#session.score);
      this.#context.states.change('game-over', { session: this.#session });
      return;
    }
    this.#session.restoreLevelStart();
    this.#hud.showToast(`Batería agotada · Intentos: ${remaining}`);
    this.loadCurrentScene();
  }

  loadCurrentScene() {
    const level = LEVELS[this.#session.levelIndex];
    const sceneData = level.scenes[this.#session.sceneIndex];
    this.#load(sceneData);
    this.#preloadNextScene();
  }

  dispose() {
    this.#loadId++;
    for (const unsub of this.#unsubs) unsub();
    this.#removeFade();
    this.#transitioning = false;
    this.#transitionPhase = null;
    this.#transitionTimer.reset();
  }
  async #load(sceneData) {
    const loadId = ++this.#loadId;
    const scene = await loadScene(sceneData);
    if (loadId !== this.#loadId) return;
    this.#mountScene(scene);
  }

  #preloadNextScene() {
    const level = LEVELS[this.#session.levelIndex];
    const nextIdx = this.#session.sceneIndex + 1;
    if (nextIdx < level.scenes.length) {
      loadImage(level.scenes[nextIdx].background).catch(() => {});
    }
  }

  #checkEdgeExit() {
    const w = this.#getWorld();
    if (!w.scene.exit || w.scene.exit.type !== 'edge') return;
    const cx = w.player.body.x + w.player.body.width / 2;
    if (cx <= w.scene.width) return;
    this.#startEdgeTransition();
  }

  #startEdgeTransition() {
    if (this.#transitioning) return;
    this.#transitioning = true;
    this.#context.input.setGameplayEnabled(false);
    this.#showFade();
    this.#transitionPhase = 'fade-out';
    this.#transitionTimer.start(TRANSITION.fadeOut);
  }

  #advanceTransition() {
    if (this.#transitionTimer.active) return;
    switch (this.#transitionPhase) {
      case 'fade-out':
        this.#session.sceneIndex++;
        this.#transitionPhase = 'loading';
        this.#loadNextSceneForTransition();
        break;
      case 'loading':
        break;
      case 'fade-in':
        this.#hideFade();
        this.#transitionPhase = 'fade-in-wait';
        this.#transitionTimer.start(TRANSITION.fadeIn);
        break;
      case 'fade-in-wait':
        this.#removeFade();
        this.#transitioning = false;
        this.#transitionPhase = null;
        break;
    }
  }

  async #loadNextSceneForTransition() {
    const level = LEVELS[this.#session.levelIndex];
    const sceneData = level.scenes[this.#session.sceneIndex];
    const loadId = ++this.#loadId;
    const scene = await loadScene(sceneData);
    if (loadId !== this.#loadId) return;
    this.#mountScene(scene);
    this.#preloadNextScene();
    this.#transitionPhase = 'fade-in';
  }

  #checkDoorExit() {
    const w = this.#getWorld();
    if (!w.scene.door) return;
    if (this.#transitioning) return;
    if (!w.player.isGrounded) return;
    if (w.player.isDying || w.player.isDead || w.player.isRespawning) return;
    if (!rectsOverlap(w.player.body, w.scene.door)) return;
    this.#transitioning = true;
    this.#completeLevel();
  }

  #completeLevel() {
    const w = this.#getWorld();
    const batteryBonus = Math.round(w.player.battery.value) * SCORE.batteryBonusPerPoint;
    this.#session.addScore(batteryBonus);
    const level = LEVELS[this.#session.levelIndex];
    const levelCrewIds = level.scenes.flatMap(s => [
      ...(s.crewIds?.map(c => c.crewId) ?? []),
      ...(s.enemies?.map(e => e.dropsCrewId).filter(Boolean) ?? []),
    ]);
    const crewThisLevel = levelCrewIds.filter(id => this.#session.hasFoundCrewId(id)).length;
    this.#context.states.push('level-complete', {
      session: this.#session,
      batteryBonus,
      crewThisLevel,
    });
  }

  #onBatteryEmpty() {
    const w = this.#getWorld();
    w.player.die();
    this.#context.input.setGameplayEnabled(false);
  }

  #showFade() {
    if (!this.#fadeElement) {
      this.#fadeElement = document.createElement('div');
      this.#fadeElement.className = 'scene-fade';
      this.#context.refs.game.append(this.#fadeElement);
    }
    this.#fadeElement.classList.remove('is-hiding');
    this.#fadeElement.classList.add('is-showing');
  }

  #hideFade() {
    if (this.#fadeElement) {
      this.#fadeElement.classList.remove('is-showing');
      this.#fadeElement.classList.add('is-hiding');
    }
  }

  #removeFade() {
    this.#fadeElement?.remove();
    this.#fadeElement = null;
  }
}
