/**
 * @module playing-state
 *
 * Estado principal del juego: orquesta la creación de escenas, sistemas, HUD y el
 * orden de actualización de cada frame. No contiene reglas de juego propias — toda
 * la lógica vive en los sistemas y entidades. PlayingState solo los llama en orden.
 *
 * Usado por: StateMachine (estado 'playing').
 * Depende de: todos los sistemas, SceneWorld, GameSession, Hud, HudView, levels.
 *
 * Compuertas del orden de actualización:
 * El update sigue un orden estricto con compuertas que detienen el frame temprano:
 * 1. screenShake — siempre se actualiza (puede estar activo durante transiciones).
 * 2. sceneFlow.updateTransition — si hay transición activa, el frame se corta aquí.
 * 3. Si no hay world, corta.
 * 4. pause — si se pulsó pausa, se apila PausedState y corta.
 * 5. pickupSystem.updatePanel — si el panel de ID está abierto, consume el frame.
 * 6. debugTools.handleInput — tecla H: daño de prueba; 1–9: salto de escena.
 * 7. Si el robot está muriendo: solo avanza su animación + HUD + cámara.
 * 8. Si el robot está muerto: procesa fin de muerte (game over o respawn).
 * 9. Si el robot está reapareciendo: solo avanza su temporizador + HUD.
 * 10. Paso normal completo: escape.checkInteraction → plataformas → robot →
 *     trampas → combate → pickups → hazards → escape.update → exits →
 *     tutorial → HUD → cámara.
 */
import { GameSession } from '../core/session.js';
import { LEVELS } from '../levels/levels.js';
import { SceneWorld } from '../scene/scene-world.js';
import { CombatSystem } from '../systems/combat-system.js';
import { DebugTools } from '../systems/debug-tools.js';
import { EscapeSystem } from '../systems/escape-system.js';
import { HazardSystem } from '../systems/hazard-system.js';
import { PickupSystem } from '../systems/pickup-system.js';
import { PlatformSystem } from '../systems/platform-system.js';
import { SceneFlow } from '../systems/scene-flow.js';
import { ScreenShake } from '../systems/screen-shake.js';
import { TrapSystem } from '../systems/trap-system.js';
import { Hud } from '../ui/hud.js';
import { HudView } from '../view/hud-view.js';

/**
 * Estado de juego activo: orquesta sistemas, escenas y el orden de update.
 *
 * Ciclo de vida: StateMachine lo activa con change('playing'); enter() crea todo;
 * exit() destruye todo. Se puede pausar con push('paused').
 */
export class PlayingState {
  #context;
  #session = null;
  #world = null;
  #hud = null;
  #hudView = null;
  #screenShake = null;
  #platformSystem = null;
  #trapSystem = null;
  #combatSystem = null;
  #pickupSystem = null;
  #hazardSystem = null;
  #escapeSystem = null;
  #sceneFlow = null;
  #debugTools = null;
  #systems = [];
  #visibilityHandler = null;

  constructor(context) {
    this.#context = context;
  }

  enter(params) {
    this.#context.input.setGameplayEnabled(true);
    this.#session = params?.session ?? new GameSession(this.#context.events);
    this.#context.playingSession = this.#session;
    this.#hud = new Hud();
    this.#hudView = new HudView(this.#context.layers.hud);
    if (this.#session.sceneIndex === 0) this.#session.snapshotLevelStart();

    const deps = {
      context: this.#context,
      getWorld: () => this.#world,
      session: this.#session,
      hud: this.#hud,
    };

    this.#screenShake = new ScreenShake(deps);
    this.#platformSystem = new PlatformSystem(deps);
    this.#trapSystem = new TrapSystem(deps);
    this.#combatSystem = new CombatSystem(deps);
    this.#pickupSystem = new PickupSystem(deps);
    this.#hazardSystem = new HazardSystem(deps);
    this.#escapeSystem = new EscapeSystem(deps);
    this.#sceneFlow = new SceneFlow(deps, (scene) => this.#mountScene(scene));
    this.#debugTools = new DebugTools(deps);

    this.#systems = [
      this.#screenShake, this.#platformSystem, this.#trapSystem, this.#combatSystem,
      this.#pickupSystem, this.#hazardSystem, this.#escapeSystem, this.#sceneFlow,
      this.#debugTools,
    ];
    this.#visibilityHandler = () => {
      if (document.hidden) this.#autoPause();
    };
    document.addEventListener('visibilitychange', this.#visibilityHandler);
    window.addEventListener('blur', this.#visibilityHandler);

    this.#sceneFlow.loadCurrentScene();
  }

  exit() {
    for (let i = this.#systems.length - 1; i >= 0; i--) {
      this.#systems[i].dispose();
    }
    this.#systems = [];
    this.#world?.dispose();
    this.#world = null;
    this.#hudView?.destroy();
    this.#hudView = null;
    this.#hud = null;
    this.#session = null;
    this.#context.playingSession = null;
    delete this.#context.refs.game.dataset.theme;
    if (this.#visibilityHandler) {
      document.removeEventListener('visibilitychange', this.#visibilityHandler);
      window.removeEventListener('blur', this.#visibilityHandler);
      this.#visibilityHandler = null;
    }
  }

  pause() {
    this.#context.input.setGameplayEnabled(false);
  }

  resume() {
    const p = this.#world?.player;
    const blocked = p?.isRespawning || p?.isDying || p?.isDead;
    this.#context.input.setGameplayEnabled(!blocked && !this.#sceneFlow.transitioning);
    this.#context.loop.resetTime();
  }

  update(deltaTime) {
    this.#screenShake.update(deltaTime);
    if (this.#sceneFlow.updateTransition(deltaTime)) return;
    const w = this.#world;
    if (!w) return;
    const { input, camera } = this.#context;
    if (this.#escapeSystem.updatePanel(deltaTime, input)) return;
    if (input.consumePress('pause')) { this.#context.states.push('paused'); return; }
    if (this.#pickupSystem.updatePanel(deltaTime, input)) return;
    this.#debugTools.handleInput(deltaTime, input);

    if (w.player.isDying) {
      w.player.update(deltaTime, input, w.scene.solids);
      this.#hud.update(deltaTime);
      camera.follow(w.player.body, w.scene.width, deltaTime);
      return;
    }
    if (w.player.isDead) { this.#sceneFlow.onDeathSequenceEnd(); return; }
    if (w.player.isRespawning) {
      w.player.update(deltaTime, input, w.scene.solids);
      this.#hud.update(deltaTime);
      return;
    }

    this.#escapeSystem.checkInteraction(input);
    this.#platformSystem.beforePlayer(deltaTime);
    w.player.update(deltaTime, input, w.getAllSolids());
    this.#platformSystem.afterPlayer();
    this.#trapSystem.update(deltaTime);
    this.#combatSystem.update(deltaTime);
    this.#pickupSystem.update(deltaTime);
    this.#hazardSystem.update();
    this.#escapeSystem.update(deltaTime);
    this.#sceneFlow.checkExits();
    w.tutorial?.update(w.player.body, deltaTime);
    this.#hud.update(deltaTime);
    this.#syncHudData();
    camera.follow(w.player.body, w.scene.width, deltaTime);
  }

  render() {
    const w = this.#world;
    if (!w) return;
    w.playerView.sync(w.player);
    w.projectiles.sync((p) => ({
      'is-facing-left': p.direction < 0,
      'is-enemy': p.owner === 'enemy',
    }));
    w.energyCells.sync((p) => ({ 'is-collected': p.isCollected }));
    w.crewIdPickups.sync((p) => ({ 'is-collected': p.isCollected, 'is-dropped': p.isDropped }));
    w.dummies.syncCustom((dummy, view) => view.sync(dummy));
    w.enemies.syncCustom((enemy, view) => view.sync(enemy));
    w.movingPlatforms.syncCustom((mp, view) => view.sync(mp));
    w.fallingPlatforms.syncCustom((fp, view) => view.sync(fp));
    for (let i = 0; i < w.traps.length; i++) {
      w.trapViews[i].sync(w.traps[i]);
    }
    w.tutorialView?.sync(w.tutorial.signs);
    this.#hudView.sync(this.#hud);
    if (this.#context.debugView.isEnabled) this.#debugTools.reportDebug();
  }

  #mountScene(scene) {
    this.#world?.dispose();
    this.#world = null;
    this.#world = new SceneWorld(scene, {
      layers: this.#context.layers,
      events: this.#context.events,
      settings: this.#context.settings,
      session: this.#session,
    });

    const level = LEVELS[this.#session.levelIndex];
    if (level.theme) this.#context.refs.game.dataset.theme = level.theme;
    this.#hud.levelName = `Nivel ${level.id} · ${level.name}`;
    this.#hud.lives = this.#session.lives;

    this.#context.worldView.showScene(scene);
    this.#context.camera.jumpTo(this.#world.player.body, scene.width);
    this.#world.player.startRespawn();
    this.#context.input.setGameplayEnabled(false);
    this.#context.events.emit('scene:mounted');
  }
  #syncHudData() {
    const w = this.#world;
    this.#hud.battery = w.player.battery.value;
    this.#hud.batteryRatio = w.player.battery.ratio;
    this.#hud.batteryLow = w.player.battery.isLow;
    this.#hud.lives = this.#session.lives;
    this.#hud.score = this.#session.score;
    this.#hud.crewFound = this.#session.crewFoundCount;
  }
  #autoPause() {
    if (this.#context.states.currentName === 'playing') {
      this.#context.states.push('paused');
    }
  }
}
