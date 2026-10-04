import { BATTERY, ENEMY, PICKUP, PLAYER, PLAYER_FEEDBACK, SCENE, SCORE, TRANSITION } from '../config.js';
import { loadImage } from '../core/assets.js';
import { GameSession } from '../core/session.js';
import { Enemy } from '../entities/enemy.js';
import { EntityCollection } from '../entities/entity-collection.js';
import { FallingPlatform } from '../entities/falling-platform.js';
import { MovingPlatform } from '../entities/moving-platform.js';
import { Pickup } from '../entities/pickup.js';
import { Player } from '../entities/player.js';
import { Projectile } from '../entities/projectile.js';
import { SafePointTracker } from '../entities/safe-point.js';
import { TrainingDummy } from '../entities/training-dummy.js';
import { rectsOverlap } from '../physics/collision.js';
import { carryByPlatform } from '../physics/physics.js';
import { LEVELS } from '../levels/levels.js';
import { loadScene } from '../levels/level-loader.js';
import { CrewLogPanel } from '../ui/crew-log-panel.js';
import { Hud } from '../ui/hud.js';
import { saveHighScore } from '../ui/screens.js';
import { Tutorial } from '../ui/tutorial.js';
import { createElement } from '../view/dom-utils.js';
import { EnemyView } from '../view/enemy-view.js';
import { HudView } from '../view/hud-view.js';
import { PlatformView } from '../view/platform-view.js';
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
  #enemies = [];
  #enemyViews = [];
  #enemyDebugRects = [];
  #shootables = [];
  #movingPlatforms = [];
  #fallingPlatforms = [];
  #platformViews = [];
  #allPlatformBodies = [];
  #tutorial = null;
  #tutorialView = null;
  #hud = null;
  #hudView = null;
  #crewPanel = null;
  #panelPaused = false;
  #unsubscribes = [];
  #loadId = 0;
  #visibilityHandler = null;
  #shakeTimer = null;
  #transitioning = false;
  #fadeElement = null;
  #decorationElements = [];

  constructor(context) {
    this.#context = context;
  }

  enter(params) {
    this.#transitioning = false;
    this.#context.input.setGameplayEnabled(true);
    this.#session = params?.session ?? new GameSession(this.#context.events);
    this.#context.playingSession = this.#session;
    this.#hud = new Hud();
    this.#hudView = new HudView(this.#context.layers.hud);
    this.#crewPanel = new CrewLogPanel(this.#context.layers.panels);

    // Instantánea al empezar cada nivel
    if (this.#session.sceneIndex === 0) {
      this.#session.snapshotLevelStart();
    }

    this.#visibilityHandler = () => {
      if (document.hidden) this.#autoPause();
    };
    document.addEventListener('visibilitychange', this.#visibilityHandler);
    window.addEventListener('blur', this.#visibilityHandler);

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
    this.#context.playingSession = null;
    this.#stopShake();
    this.#removeFade();

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
    const blocked = this.#player?.isRespawning || this.#player?.isDying || this.#player?.isDead;
    this.#context.input.setGameplayEnabled(!blocked && !this.#transitioning);
    this.#context.loop.resetTime();
  }

  update(deltaTime) {
    if (!this.#scene || this.#transitioning) return;
    const { input, camera, debugView } = this.#context;

    if (input.consumePress('pause')) {
      this.#context.states.push('paused');
      return;
    }

    if (this.#panelPaused) {
      this.#crewPanel.update(deltaTime, input);
      if (!this.#crewPanel.isOpen) this.#panelPaused = false;
      return;
    }

    if (debugView.isEnabled) {
      if (input.consumePress('debugHurt')) {
        const playerCx = this.#player.body.x + this.#player.body.width / 2;
        const fakeOriginX = playerCx + this.#player.facing * 10;
        this.#player.takeHitWithOrigin(BATTERY.hitCost, fakeOriginX);
        this.#triggerShake();
      }
      this.#handleSceneJump(input);
    }

    if (this.#player.isDying) {
      this.#player.update(deltaTime, input, this.#scene.solids);
      this.#hud.update(deltaTime);
      camera.follow(this.#player.body, this.#scene.width, deltaTime);
      return;
    }

    if (this.#player.isDead) {
      this.#onDeathSequenceEnd();
      return;
    }

    if (this.#player.isRespawning) {
      this.#player.update(deltaTime, input, this.#scene.solids);
      this.#hud.update(deltaTime);
      return;
    }

    // 1. Mover plataformas
    this.#updatePlatforms(deltaTime);

    // 2. Arrastrar al rider si está sobre una plataforma
    this.#carryRider();

    // 3. Paso normal del robot
    this.#player.update(deltaTime, input, this.#getAllSolids());

    // 4. Detectar pisada en plataformas que caen
    this.#checkFallingPlatformStep();

    // 5. Enemigos
    this.#updateEnemies(deltaTime);

    this.#projectiles.update((p) => p.update(deltaTime, this.#getAllSolids()));
    this.#energyCells.update((p) => p.update(deltaTime));
    this.#crewIdPickups.update((p) => p.update(deltaTime));
    for (const d of this.#dummies) d.update(deltaTime);
    this.#checkProjectileHits();
    this.#checkEnemyDamage();
    this.#checkPickups();
    this.#safePoint.update(this.#player.body);
    this.#checkHazards();
    this.#handleFall();
    this.#checkEdgeExit();
    this.#checkDoorExit();
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
    for (let i = 0; i < this.#enemies.length; i++) {
      this.#enemyViews[i].sync(this.#enemies[i]);
    }
    // Las vistas se crearon en el mismo orden: primero moving, luego falling
    let vi = 0;
    for (const mp of this.#movingPlatforms) this.#platformViews[vi++].sync(mp);
    for (const fp of this.#fallingPlatforms) this.#platformViews[vi++].sync(fp);
    this.#tutorialView?.sync(this.#tutorial.signs);
    this.#hudView.sync(this.#hud);
    if (this.#context.debugView.isEnabled) this.#reportDebug();
  }

  // --- Carga y reinicio ---

  #loadCurrentScene() {
    const level = LEVELS[this.#session.levelIndex];
    const sceneData = level.scenes[this.#session.sceneIndex];
    this.#load(sceneData);
    this.#preloadNextScene();
  }

  // Precarga la imagen de la siguiente escena en segundo plano
  #preloadNextScene() {
    const level = LEVELS[this.#session.levelIndex];
    const nextIdx = this.#session.sceneIndex + 1;
    if (nextIdx < level.scenes.length) {
      loadImage(level.scenes[nextIdx].background).catch(() => {});
    }
  }

  async #load(sceneData) {
    const loadId = ++this.#loadId;
    const scene = await loadScene(sceneData);
    if (loadId !== this.#loadId) return;
    this.#showScene(scene);
  }

  #showScene(scene) {
    this.#cleanupScene();
    const { camera, worldView, debugView, layers, events, settings } = this.#context;
    this.#scene = scene;
    this.#player = new Player(scene.spawn, events);
    this.#playerView = new PlayerView(layers.entities);
    this.#projectiles = new EntityCollection(layers.entities, 'projectile');
    this.#safePoint = new SafePointTracker(scene.spawn, this.#getAllSolidsForSafePoint(scene), scene.hazards);

    this.#energyCells = new EntityCollection(layers.entities, 'energy-cell');
    for (const data of scene.energyCells) {
      this.#energyCells.add(new Pickup({ type: 'energy-cell', ...data }));
    }

    this.#crewIdPickups = new EntityCollection(layers.entities, 'crew-id');
    for (const data of scene.crewIds) {
      if (!this.#session.hasFoundCrewId(data.crewId)) {
        this.#crewIdPickups.add(new Pickup({ type: 'crew-id', ...data }));
      }
    }

    this.#dummies = [];
    this.#dummyViews = [];
    this.#enemies = [];
    this.#enemyViews = [];
    this.#enemyDebugRects = [];
    this.#shootables = [];
    for (const data of scene.trainingDummies) {
      const dummy = new TrainingDummy(data);
      const view = new TrainingDummyView(layers.entities, dummy.body);
      this.#dummies.push(dummy);
      this.#dummyViews.push(view);
      this.#shootables.push(dummy);
    }

    for (const data of scene.enemies) {
      const enemy = new Enemy(data, events);
      const view = new EnemyView(layers.entities, enemy.body);
      this.#enemies.push(enemy);
      this.#enemyViews.push(view);
      this.#shootables.push(enemy);
    }

    // Plataformas móviles
    this.#movingPlatforms = [];
    this.#fallingPlatforms = [];
    this.#platformViews = [];
    this.#allPlatformBodies = [];

    for (const data of scene.movingPlatforms) {
      const mp = new MovingPlatform(data);
      this.#movingPlatforms.push(mp);
      this.#allPlatformBodies.push(mp.body);
      const view = new PlatformView(layers.entities, mp, 'moving');
      this.#platformViews.push(view);
    }

    for (const data of scene.fallingPlatforms) {
      const fp = new FallingPlatform(data);
      this.#fallingPlatforms.push(fp);
      this.#allPlatformBodies.push(fp.body);
      const view = new PlatformView(layers.entities, fp, 'falling');
      this.#platformViews.push(view);
    }

    // Decoraciones (sombra de foso, etc.)
    this.#decorationElements = [];
    for (const deco of scene.decorations) {
      if (deco.type === 'pit-shadow') {
        const el = createElement('decoration decoration--pit-shadow', layers.world);
        el.style.setProperty('--x', deco.x1);
        el.style.setProperty('--y', deco.top);
        el.style.setProperty('--w', deco.x2 - deco.x1);
        this.#decorationElements.push(el);
      }
    }

    const unShoot = events.on('player:shoot', (data) => {
      this.#projectiles.add(new Projectile(data));
    });
    const unEmpty = events.on('player:battery-empty', () => this.#onBatteryEmpty());
    const unHurt = events.on('player:hurt', ({ knockback }) => {
      if (knockback) this.#triggerShake();
    });
    const unDeathEnd = events.on('player:death-end', () => {});
    const unRespawnEnd = events.on('player:respawn-end', () => {
      this.#context.input.setGameplayEnabled(true);
    });
    const unEnemyDestroyed = events.on('enemy:destroyed', () => {
      this.#session.addScore(SCORE.enemy);
      this.#hud.showToast('+200 enemigo');
    });
    this.#unsubscribes.push(unShoot, unEmpty, unHurt, unDeathEnd, unRespawnEnd, unEnemyDestroyed);

    if (scene.tutorial.length > 0 && settings.get('showTutorial')) {
      this.#tutorial = new Tutorial(scene.tutorial, events);
      this.#tutorialView = new TutorialView(layers.world, scene.tutorial);
    }

    const level = LEVELS[this.#session.levelIndex];
    this.#hud.levelName = `Nivel ${level.id} · ${level.name}`;
    this.#hud.lives = this.#session.lives;

    worldView.showScene(scene);
    debugView.showScene(scene);
    for (const h of scene.hazards) {
      debugView.track(`hazard-${h.x}-${h.y}`, h, 'hazard');
    }
    // Puerta en depuración
    if (scene.door) {
      debugView.track('door', scene.door, 'trigger');
    }
    // Recorrido de plataformas móviles en depuración
    for (let i = 0; i < this.#movingPlatforms.length; i++) {
      const mp = this.#movingPlatforms[i];
      const minX = Math.min(mp.from.x, mp.to.x);
      const maxX = Math.max(mp.from.x + mp.body.width, mp.to.x + mp.body.width);
      const pathRect = { x: minX, y: mp.from.y, width: maxX - minX, height: 2 };
      debugView.track(`mp-path-${i}`, pathRect, 'trigger');
    }
    for (let i = 0; i < this.#enemies.length; i++) {
      const enemy = this.#enemies[i];
      const data = scene.enemies[i];
      debugView.track(`enemy-${i}`, enemy.body, 'player');
      debugView.track(`enemy-patrol-${i}`, {
        x: data.patrol.x1, y: data.y - 2,
        width: data.patrol.x2 - data.patrol.x1, height: 4,
      }, 'trigger');
      const detectRect = { x: 0, y: 0, width: 0, height: 0 };
      const strikeRect = { x: 0, y: 0, width: 0, height: 0 };
      debugView.track(`enemy-detect-${i}`, detectRect, 'trigger');
      debugView.track(`enemy-strike-${i}`, strikeRect, 'hazard');
      this.#enemyDebugRects.push({ detect: detectRect, strike: strikeRect });
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

    this.#player.startRespawn();
    this.#context.input.setGameplayEnabled(false);
  }

  // --- Plataformas ---

  #updatePlatforms(deltaTime) {
    for (const mp of this.#movingPlatforms) mp.update(deltaTime);
    for (const fp of this.#fallingPlatforms) {
      // No reaparecer encima del robot
      if (fp.isBlockedByBody(this.#player.body)) continue;
      fp.update(deltaTime);
    }
  }

  #carryRider() {
    const groundSolid = this.#player.body.groundSolid;
    if (!groundSolid) return;
    for (const mp of this.#movingPlatforms) {
      if (mp.body === groundSolid) {
        carryByPlatform(this.#player.body, mp.dx, mp.dy, this.#getAllSolids());
        return;
      }
    }
  }

  #checkFallingPlatformStep() {
    if (!this.#player.isGrounded) return;
    const groundSolid = this.#player.body.groundSolid;
    for (const fp of this.#fallingPlatforms) {
      if (fp.body === groundSolid) {
        fp.onStepped();
      }
    }
  }

  // Todos los sólidos de la escena + plataformas activas
  #getAllSolids() {
    const solids = [...this.#scene.solids];
    for (const mp of this.#movingPlatforms) {
      if (mp.isSolid) solids.push(mp.body);
    }
    for (const fp of this.#fallingPlatforms) {
      if (fp.isSolid) solids.push(fp.body);
    }
    return solids;
  }

  // Para SafePointTracker: solo sólidos fijos (las plataformas se mueven)
  #getAllSolidsForSafePoint(scene) {
    return scene.solids;
  }

  // --- Transiciones ---

  #checkEdgeExit() {
    if (!this.#scene.exit || this.#scene.exit.type !== 'edge') return;
    const cx = this.#player.body.x + this.#player.body.width / 2;
    if (cx <= this.#scene.width) return;
    this.#startEdgeTransition();
  }

  async #startEdgeTransition() {
    if (this.#transitioning) return;
    this.#transitioning = true;
    this.#context.input.setGameplayEnabled(false);

    // Fundido a negro
    this.#showFade();
    await this.#wait(TRANSITION.fadeOut);

    this.#session.sceneIndex++;
    const level = LEVELS[this.#session.levelIndex];
    const sceneData = level.scenes[this.#session.sceneIndex];

    const loadId = ++this.#loadId;
    const scene = await loadScene(sceneData);
    if (loadId !== this.#loadId) return;

    this.#showScene(scene);
    this.#preloadNextScene();

    // Fundido desde negro
    await this.#wait(0.05);
    this.#hideFade();
    await this.#wait(TRANSITION.fadeIn);
    this.#removeFade();

    this.#transitioning = false;
  }

  #checkDoorExit() {
    if (!this.#scene.door) return;
    if (this.#transitioning) return;
    if (!this.#player.isGrounded) return;
    if (this.#player.isDying || this.#player.isDead || this.#player.isRespawning) return;
    if (!rectsOverlap(this.#player.body, this.#scene.door)) return;
    this.#transitioning = true;
    this.#completeLevel();
  }

  #completeLevel() {
    // Bono de batería
    const batteryBonus = Math.round(this.#player.battery.value) * SCORE.batteryBonusPerPoint;
    this.#session.addScore(batteryBonus);

    // Contar IDs de este nivel
    const level = LEVELS[this.#session.levelIndex];
    const levelCrewIds = level.scenes.flatMap(s => s.crewIds?.map(c => c.crewId) ?? []);
    const crewThisLevel = levelCrewIds.filter(id => this.#session.hasFoundCrewId(id)).length;

    this.#context.states.push('level-complete', {
      session: this.#session,
      batteryBonus,
      crewThisLevel,
    });
  }

  // --- Fundido ---

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

  #wait(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  // --- Enemigos ---

  #updateEnemies(deltaTime) {
    const solids = this.#getAllSolids();
    for (const enemy of this.#enemies) {
      enemy.update(deltaTime, solids, this.#player.body);
    }
    this.#removeDeadEnemies();
  }

  #checkEnemyDamage() {
    if (this.#player.isInvulnerable || this.#player.isDying
      || this.#player.isDead || this.#player.isRespawning) return;
    for (const enemy of this.#enemies) {
      const originX = enemy.body.x + enemy.body.width / 2;
      const sr = enemy.strikeRect;
      if (sr && rectsOverlap(this.#player.body, sr)) {
        this.#player.takeHitWithOrigin(ENEMY.strikeDamage, originX);
        enemy.onStrikeHit();
        this.#triggerShake();
        return;
      }
      if (enemy.canDamageOnContact && rectsOverlap(this.#player.body, enemy.body)) {
        this.#player.takeHitWithOrigin(ENEMY.contactDamage, originX);
        this.#triggerShake();
        return;
      }
    }
  }

  #removeDeadEnemies() {
    for (let i = this.#enemies.length - 1; i >= 0; i--) {
      if (!this.#enemies[i].isDead) continue;
      this.#enemyViews[i].destroy();
      const removed = this.#enemies.splice(i, 1)[0];
      this.#enemyViews.splice(i, 1);
      const si = this.#shootables.indexOf(removed);
      if (si >= 0) this.#shootables.splice(si, 1);
    }
  }

  #handleSceneJump(input) {
    const level = LEVELS[this.#session.levelIndex];
    for (let i = 1; i <= 9; i++) {
      if (!input.consumePress(`scene${i}`)) continue;
      const sceneIdx = i - 1;
      if (sceneIdx >= level.scenes.length) return;
      this.#session.sceneIndex = sceneIdx;
      this.#loadCurrentScene();
      return;
    }
  }

  // --- Reglas ---

  #checkHazards() {
    if (this.#player.isDying || this.#player.isDead || this.#player.isRespawning) return;
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
    if (this.#player.isDying || this.#player.isDead || this.#player.isRespawning) return;
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
        if (target.canBeShot === false) continue;
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
          this.#panelPaused = true;
          this.#crewPanel.open(pickup.crewId);
        }
      }
    };
    this.#energyCells.forEach(check);
    this.#crewIdPickups.forEach(check);
  }

  #onBatteryEmpty() {
    this.#player.die();
    this.#context.input.setGameplayEnabled(false);
  }

  #onDeathSequenceEnd() {
    const remaining = this.#session.loseLife();
    if (this.#session.isGameOver) {
      saveHighScore(this.#session.score);
      this.#context.states.change('game-over', { session: this.#session });
      return;
    }
    // Restaurar al inicio del nivel y volver a escena 1
    this.#session.restoreLevelStart();
    this.#hud.showToast(`Batería agotada · Intentos: ${remaining}`);
    this.#loadCurrentScene();
  }

  #triggerShake() {
    if (!this.#context.settings.get('screenShake')) return;
    const gameEl = this.#context.refs.game;
    gameEl.classList.remove('is-shaking');
    void gameEl.offsetWidth;
    gameEl.classList.add('is-shaking');
    clearTimeout(this.#shakeTimer);
    this.#shakeTimer = setTimeout(() => {
      gameEl.classList.remove('is-shaking');
    }, PLAYER_FEEDBACK.shakeDuration * 1000);
  }

  #stopShake() {
    clearTimeout(this.#shakeTimer);
    this.#context.refs.game.classList.remove('is-shaking');
  }

  #autoPause() {
    if (this.#context.states.currentName === 'playing') {
      this.#context.states.push('paused');
    }
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
    for (const v of this.#enemyViews) v.destroy();
    this.#dummies = [];
    this.#dummyViews = [];
    this.#enemies = [];
    this.#enemyViews = [];
    this.#enemyDebugRects = [];
    this.#shootables = [];
    for (const v of this.#platformViews) v.destroy();
    this.#movingPlatforms = [];
    this.#fallingPlatforms = [];
    this.#platformViews = [];
    this.#allPlatformBodies = [];
    for (const el of this.#decorationElements) el.remove();
    this.#decorationElements = [];
    this.#tutorial?.dispose();
    this.#tutorial = null;
    this.#tutorialView?.destroy();
    this.#tutorialView = null;
    this.#playerView?.destroy();
    this.#playerView = null;
    this.#safePoint = null;
    this.#player = null;
    this.#scene = null;
    this.#panelPaused = false;
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

    const enemyStates = this.#enemies.map((e, i) =>
      `${i}:${e.state}(hp${e.health})`).join(' ') || '—';

    this.#context.debugView.report({
      escena: `${this.#scene.id} · ${this.#scene.name}`,
      'robot (pies)': `x ${Math.round(body.x + body.width / 2)}  y ${Math.round(body.y + body.height)}`,
      velocidad: `vx ${Math.round(body.vx)}  vy ${Math.round(body.vy)}`,
      estado: `${this.#player.isGrounded ? 'suelo' : 'aire'}  saltos ${jumpsUsed}/${PLAYER.maxJumps}  mira ${facing > 0 ? '→' : '←'}`,
      visual: this.#player.visualState,
      'batería': `${battery.value.toFixed(1)} ${battery.isLow ? '⚠ BAJA' : ''}`,
      intentos: `${this.#session.lives}/3`,
      puntos: this.#session.score,
      IDs: `${this.#session.crewFoundCount}/9`,
      disparos: this.#projectiles?.count ?? 0,
      invulnerable: this.#player.isInvulnerable ? 'sí' : 'no',
      'punto seguro': `x ${Math.round(sp.x)}  y ${Math.round(sp.y)}`,
      enemigos: enemyStates,
      listeners: this.#context.events.listenerCount,
      tutorial: tutorialStates,
      plataformas: `${this.#movingPlatforms.length}M ${this.#fallingPlatforms.length}F`,
    });

    this.#context.debugView.track('safe-point', {
      x: sp.x - 6, y: sp.y - 12, width: 12, height: 12,
    }, 'safe-point');

    for (let i = 0; i < this.#enemies.length; i++) {
      const enemy = this.#enemies[i];
      const rects = this.#enemyDebugRects[i];
      if (!rects) continue;
      const cx = enemy.body.x + enemy.body.width / 2;
      const cy = enemy.body.y + enemy.body.height / 2;
      Object.assign(rects.detect, {
        x: cx - ENEMY.detectRange, y: cy - ENEMY.detectHeight,
        width: ENEMY.detectRange * 2, height: ENEMY.detectHeight * 2,
      });
      const sr = enemy.strikeRect;
      if (sr) Object.assign(rects.strike, sr);
      else { rects.strike.width = 0; rects.strike.height = 0; }
    }
  }
}
