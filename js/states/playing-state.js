import { BATTERY, PICKUP, PLAYER, SCENE, SCORE } from '../config.js';
import { GameSession } from '../core/session.js';
import { EntityCollection } from '../entities/entity-collection.js';
import { Pickup } from '../entities/pickup.js';
import { Player } from '../entities/player.js';
import { Projectile } from '../entities/projectile.js';
import { SafePointTracker } from '../entities/safe-point.js';
import { TrainingDummy } from '../entities/training-dummy.js';
import { rectsOverlap } from '../physics/collision.js';
import { LEVEL_1 } from '../levels/level1.js';
import { loadScene } from '../levels/level-loader.js';
import { CrewLogPanel } from '../ui/crew-log-panel.js';
import { Hud } from '../ui/hud.js';
import { Tutorial } from '../ui/tutorial.js';
import { HudView } from '../view/hud-view.js';
import { PlayerView } from '../view/player-view.js';
import { TrainingDummyView } from '../view/training-dummy-view.js';
import { TutorialView } from '../view/tutorial-view.js';

export class PlayingState {
  #context;
  #session = null;
  #scene = null;
  #player = null;
  #playerView = null;
  #safePoint = null;
  #projectiles = null;
  #energyCells = null;
  #crewIdPickups = null;
  #dummies = [];
  #dummyViews = [];
  #shootables = [];
  #tutorial = null;
  #tutorialView = null;
  #hud = null;
  #hudView = null;
  #crewPanel = null;
  #paused = false;
  #unsubscribes = [];
  #loadId = 0;

  constructor(context) {
    this.#context = context;
  }

  enter(params) {
    this.#session = params?.session ?? new GameSession(this.#context.events);
    this.#hud = new Hud();
    this.#hudView = new HudView(this.#context.layers.hud);
    this.#crewPanel = new CrewLogPanel(this.#context.layers.panels);
    this.#loadCurrentScene();
  }

  exit() {
    this.#loadId += 1;
    this.#cleanup();
    this.#crewPanel?.destroy();
    this.#crewPanel = null;
    this.#hudView?.destroy();
    this.#hudView = null;
    this.#hud = null;
    this.#session = null;
  }

  update(deltaTime) {
    if (!this.#scene) return;
    const { input, camera, debugView } = this.#context;

    if (this.#paused) {
      this.#crewPanel.update(deltaTime, input);
      if (!this.#crewPanel.isOpen) this.#paused = false;
      return;
    }

    if (debugView.isEnabled && input.consumePress('debugHurt')) {
      this.#player.takeHit(BATTERY.hitCost);
    }

    this.#player.update(deltaTime, input, this.#scene.solids);
    this.#projectiles.update((p) => p.update(deltaTime, this.#scene.solids));
    this.#energyCells.update((p) => p.update(deltaTime));
    this.#crewIdPickups.update((p) => p.update(deltaTime));
    for (const d of this.#dummies) d.update(deltaTime);
    this.#checkProjectileHits();
    this.#checkPickups();
    this.#safePoint.update(this.#player.body);
    this.#checkHazards();
    this.#handleFall();
    this.#tutorial?.update(this.#player.body, deltaTime);
    this.#hud.update(deltaTime);
    this.#syncHudData();
    camera.follow(this.#player.body, this.#scene.width, deltaTime);
  }

  render() {
    if (!this.#scene) return;
    this.#playerView.sync(this.#player);
    this.#projectiles.sync((p) => ({ 'is-facing-left': p.direction < 0 }));
    this.#energyCells.sync((p) => ({ 'is-collected': p.isCollected }));
    this.#crewIdPickups.sync((p) => ({ 'is-collected': p.isCollected }));
    for (let i = 0; i < this.#dummies.length; i++) {
      this.#dummyViews[i].sync(this.#dummies[i]);
    }
    this.#tutorialView?.sync(this.#tutorial.signs);
    this.#hudView.sync(this.#hud);
    if (this.#context.debugView.isEnabled) this.#reportDebug();
  }

  // --- Carga y reinicio ---

  #loadCurrentScene() {
    this.#load(LEVEL_1.scenes[this.#session.sceneIndex]);
  }

  async #load(sceneData) {
    const loadId = ++this.#loadId;
    const scene = await loadScene(sceneData);
    if (loadId !== this.#loadId) return;
    this.#showScene(scene);
  }

  #showScene(scene) {
    this.#cleanupScene();
    const { camera, worldView, debugView, layers, events } = this.#context;
    this.#scene = scene;
    this.#player = new Player(scene.spawn, events);
    this.#playerView = new PlayerView(layers.entities);
    this.#projectiles = new EntityCollection(layers.entities, 'projectile');
    this.#safePoint = new SafePointTracker(scene.spawn, scene.solids, scene.hazards);

    // Celdas de energía
    this.#energyCells = new EntityCollection(layers.entities, 'energy-cell');
    for (const data of scene.energyCells) {
      this.#energyCells.add(new Pickup({ type: 'energy-cell', ...data }));
    }

    // IDs de tripulante (no crear si ya fue encontrado)
    this.#crewIdPickups = new EntityCollection(layers.entities, 'crew-id');
    for (const data of scene.crewIds) {
      if (!this.#session.hasFoundCrewId(data.crewId)) {
        this.#crewIdPickups.add(new Pickup({ type: 'crew-id', ...data }));
      }
    }

    // Maniquís
    this.#dummies = [];
    this.#dummyViews = [];
    this.#shootables = [];
    for (const data of scene.trainingDummies) {
      const dummy = new TrainingDummy(data);
      const view = new TrainingDummyView(layers.entities, dummy.body);
      this.#dummies.push(dummy);
      this.#dummyViews.push(view);
      this.#shootables.push(dummy);
    }

    // Suscripciones
    const unShoot = events.on('player:shoot', (data) => {
      this.#projectiles.add(new Projectile(data));
    });
    const unEmpty = events.on('player:battery-empty', () => this.#onBatteryEmpty());
    this.#unsubscribes.push(unShoot, unEmpty);

    // Tutorial
    if (scene.tutorial.length > 0) {
      this.#tutorial = new Tutorial(scene.tutorial, events);
      this.#tutorialView = new TutorialView(layers.world, scene.tutorial);
    }

    // HUD
    this.#hud.levelName = `Nivel ${LEVEL_1.id} · ${LEVEL_1.name}`;
    this.#hud.lives = this.#session.lives;

    // Vistas de escena y depuración
    worldView.showScene(scene);
    debugView.showScene(scene);
    for (const h of scene.hazards) {
      debugView.track(`hazard-${h.x}-${h.y}`, h, 'hazard');
    }
    debugView.track('player', this.#player.body, 'player');
    if (this.#tutorial) {
      for (const sign of scene.tutorial) {
        debugView.track(`tut-${sign.id}`, {
          x: sign.x - 110, y: sign.y - 20, width: 220, height: 40,
        }, 'trigger');
      }
    }
    camera.jumpTo(this.#player.body, scene.width);
  }

  // --- Reglas ---

  #checkHazards() {
    for (const hazard of this.#scene.hazards) {
      if (rectsOverlap(this.#player.body, hazard)) {
        this.#player.takeHit(BATTERY.hitCost);
        this.#returnToSafePoint();
        this.#context.events.emit('player:hazard');
        return;
      }
    }
  }

  #handleFall() {
    if (this.#player.body.y > this.#scene.height + SCENE.fallMargin) {
      this.#player.takeHit(BATTERY.hitCost);
      this.#returnToSafePoint();
      this.#context.events.emit('player:hazard');
    }
  }

  #returnToSafePoint() {
    this.#player.placeAt(this.#safePoint.point);
  }

  #checkProjectileHits() {
    this.#projectiles.forEach((proj) => {
      if (proj.isDead) return;
      for (const target of this.#shootables) {
        if (rectsOverlap(proj.body, target.body)) {
          target.onShot(proj);
          proj.isDead = true;
          return;
        }
      }
    });
  }

  #checkPickups() {
    const check = (pickup) => {
      if (pickup.isCollected || pickup.isDead) return;
      if (!rectsOverlap(this.#player.body, pickup.body)) return;
      pickup.collect();
      if (pickup.type === 'energy-cell') {
        this.#player.battery.recharge(PICKUP.energyCellRecharge);
        this.#session.addScore(SCORE.energyCell);
        this.#hud.showToast('+30 batería');
        this.#context.events.emit('pickup:energy-cell');
      } else if (pickup.type === 'crew-id') {
        if (this.#session.collectCrewId(pickup.crewId)) {
          this.#session.addScore(SCORE.crewId);
          this.#context.events.emit('pickup:crew-id', { crewId: pickup.crewId });
          this.#paused = true;
          this.#crewPanel.open(pickup.crewId);
        }
      }
    };
    this.#energyCells.forEach(check);
    this.#crewIdPickups.forEach(check);
  }

  #onBatteryEmpty() {
    const remaining = this.#session.loseLife();
    if (this.#session.isGameOver) {
      // Provisional: pantalla de Game Over en la etapa 4
      console.info('[game] Game Over');
      this.#session = new GameSession(this.#context.events);
      this.#hud.showToast('Game Over');
    } else {
      this.#hud.showToast(`Batería agotada · Intentos: ${remaining}`);
    }
    this.#loadCurrentScene();
  }

  #syncHudData() {
    this.#hud.battery = this.#player.battery.value;
    this.#hud.batteryRatio = this.#player.battery.ratio;
    this.#hud.batteryLow = this.#player.battery.isLow;
    this.#hud.lives = this.#session.lives;
    this.#hud.score = this.#session.score;
    this.#hud.crewFound = this.#session.crewFoundCount;
  }

  // --- Limpieza ---

  #cleanupScene() {
    for (const unsub of this.#unsubscribes) unsub();
    this.#unsubscribes.length = 0;
    this.#projectiles?.clear();
    this.#energyCells?.clear();
    this.#crewIdPickups?.clear();
    this.#projectiles = null;
    this.#energyCells = null;
    this.#crewIdPickups = null;
    for (const v of this.#dummyViews) v.destroy();
    this.#dummies = [];
    this.#dummyViews = [];
    this.#shootables = [];
    this.#tutorial?.dispose();
    this.#tutorial = null;
    this.#tutorialView?.destroy();
    this.#tutorialView = null;
    this.#playerView?.destroy();
    this.#playerView = null;
    this.#safePoint = null;
    this.#player = null;
    this.#scene = null;
    this.#paused = false;
    this.#crewPanel?.close();
  }

  #cleanup() {
    this.#cleanupScene();
  }

  #reportDebug() {
    const { body, facing, jumpsUsed, battery } = this.#player;
    const sp = this.#safePoint.point;
    const tutorialStates = this.#tutorial
      ? this.#tutorial.signs.map((s) => {
          let info = `${s.id}:${s.state}`;
          if (s.minVisibleTimer.active) info += `(min:${s.minVisibleTimer.value.toFixed(1)})`;
          if (s.lingering) info += `(lnr:${s.lingerTimer.value.toFixed(1)})`;
          return info;
        }).join(' ')
      : '—';

    this.#context.debugView.report({
      escena: `${this.#scene.id} · ${this.#scene.name}`,
      'robot (pies)': `x ${Math.round(body.x + body.width / 2)}  y ${Math.round(body.y + body.height)}`,
      velocidad: `vx ${Math.round(body.vx)}  vy ${Math.round(body.vy)}`,
      estado: `${this.#player.isGrounded ? 'suelo' : 'aire'}  saltos ${jumpsUsed}/${PLAYER.maxJumps}  mira ${facing > 0 ? '→' : '←'}`,
      'batería': `${battery.value.toFixed(1)} ${battery.isLow ? '⚠ BAJA' : ''}`,
      intentos: `${this.#session.lives}/3`,
      puntos: this.#session.score,
      IDs: `${this.#session.crewFoundCount}/9`,
      disparos: this.#projectiles?.count ?? 0,
      invulnerable: this.#player.isInvulnerable ? 'sí' : 'no',
      'punto seguro': `x ${Math.round(sp.x)}  y ${Math.round(sp.y)}`,
      tutorial: tutorialStates,
    });

    this.#context.debugView.track('safe-point', {
      x: sp.x - 6, y: sp.y - 12, width: 12, height: 12,
    }, 'safe-point');
  }
}
