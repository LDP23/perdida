/**
 * @module scene-world
 *
 * Construye todas las entidades y vistas de una escena a partir de sus datos.
 * No tiene reglas de juego ni suscripciones: solo construye, guarda y destruye.
 * Los sistemas acceden a las entidades a través de getWorld() que devuelve esta instancia.
 *
 * Usado por: PlayingState (crea una instancia por escena mediante mountScene).
 * Depende de: todas las entidades, todas las vistas, Tutorial, dom-utils.
 */
import { Enemy } from '../entities/enemy.js';
import { EntityCollection } from '../entities/entity-collection.js';
import { FallingPlatform } from '../entities/falling-platform.js';
import { MovingPlatform } from '../entities/moving-platform.js';
import { Pickup } from '../entities/pickup.js';
import { Player } from '../entities/player.js';
import { SafePointTracker } from '../entities/safe-point.js';
import { TrainingDummy } from '../entities/training-dummy.js';
import { createTrap } from '../traps/trap-factory.js';
import { Tutorial } from '../ui/tutorial.js';
import { createElement } from '../view/dom-utils.js';
import { EnemyView } from '../view/enemy-view.js';
import { PlatformView } from '../view/platform-view.js';
import { PlayerView } from '../view/player-view.js';
import { TrainingDummyView } from '../view/training-dummy-view.js';
import { TrapView } from '../view/trap-view.js';
import { TutorialView } from '../view/tutorial-view.js';

/** Vista nula para shootables (no necesitan vista propia, solo se rastrean en la colección) */
const NULL_VIEW = { sync() {}, destroy() {} };

/**
 * Contenedor de todas las entidades y vistas de una escena.
 *
 * Ciclo de vida: PlayingState.mountScene() crea una nueva por escena;
 * dispose() destruye todas las vistas y colecciones al cambiar de escena.
 * Colabora con: todos los sistemas (acceden mediante getWorld()).
 */
export class SceneWorld {
  scene;
  player;
  playerView;
  projectiles;
  energyCells;
  crewIdPickups;
  dummies;
  enemies;
  shootables;
  movingPlatforms;
  fallingPlatforms;
  traps = [];
  trapViews = [];
  /** @type {Rect[]} — peligros dinámicos de las trampas, reemplazado cada frame por TrapSystem */
  dynamicHazards = [];
  /** @type {Rect[]} — sólidos dinámicos de las trampas (bloque en reposo), reemplazado cada frame */
  dynamicSolids = [];
  safePoint;
  tutorial = null;
  tutorialView = null;
  #decorationElements = [];

  /**
   * @param {Object} scene — escena cargada por level-loader (solids, hazards, spawn, etc.).
   * @param {Object} deps — dependencias del contexto.
   */
  constructor(scene, { layers, events, settings, session }) {
    this.scene = scene;
    this.player = new Player(scene.spawn, events);
    this.playerView = new PlayerView(layers.entities);
    this.projectiles = new EntityCollection(layers.entities, 'projectile');

    for (const data of scene.traps) {
      const trap = createTrap(data);
      this.traps.push(trap);
      this.trapViews.push(new TrapView(layers.entities, trap));
    }

    const trapZones = this.traps.map((t) => t.zone);
    this.safePoint = new SafePointTracker(scene.spawn, scene.solids, scene.hazards, trapZones);

    this.energyCells = new EntityCollection(layers.entities, 'energy-cell');
    for (const data of scene.energyCells) {
      this.energyCells.add(new Pickup({ type: 'energy-cell', ...data }));
    }

    this.crewIdPickups = new EntityCollection(layers.entities, 'crew-id');
    for (const data of scene.crewIds) {
      if (!session.hasFoundCrewId(data.crewId)) {
        this.crewIdPickups.add(new Pickup({ type: 'crew-id', ...data }));
      }
    }

    this.shootables = new EntityCollection(layers.entities, 'shootable',
      () => NULL_VIEW);

    this.dummies = new EntityCollection(layers.entities, 'training-dummy',
      (layer, dummy) => new TrainingDummyView(layer, dummy.body));
    for (const data of scene.trainingDummies) {
      const dummy = new TrainingDummy(data);
      this.dummies.add(dummy);
      this.shootables.add(dummy);
    }

    this.enemies = new EntityCollection(layers.entities, 'enemy',
      (layer, enemy) => new EnemyView(layer, enemy.body));
    for (const data of scene.enemies) {
      const enemy = new Enemy(data, events);
      this.enemies.add(enemy);
      this.shootables.add(enemy);
    }

    this.movingPlatforms = new EntityCollection(layers.entities, 'moving',
      (layer, mp) => new PlatformView(layer, mp, 'moving'));
    this.fallingPlatforms = new EntityCollection(layers.entities, 'falling',
      (layer, fp) => new PlatformView(layer, fp, 'falling'));

    for (const data of scene.movingPlatforms) {
      this.movingPlatforms.add(new MovingPlatform(data));
    }
    for (const data of scene.fallingPlatforms) {
      this.fallingPlatforms.add(new FallingPlatform(data));
    }

    for (const deco of scene.decorations) {
      if (deco.type === 'pit-shadow') {
        const el = createElement('decoration decoration--pit-shadow', layers.world);
        el.style.setProperty('--x', deco.x1);
        el.style.setProperty('--y', deco.top);
        el.style.setProperty('--w', deco.x2 - deco.x1);
        this.#decorationElements.push(el);
      } else if (deco.type === 'opening-door') {
        const el = createElement('decoration decoration--opening-door', layers.world);
        el.style.setProperty('--x', deco.x1);
        el.style.setProperty('--y', deco.top);
        el.style.setProperty('--w', deco.x2 - deco.x1);
        el.style.setProperty('--h', deco.bottom - deco.top);
        this.#decorationElements.push(el);
      }
    }

    if (scene.tutorial.length > 0 && settings.get('showTutorial')) {
      this.tutorial = new Tutorial(scene.tutorial, events);
      this.tutorialView = new TutorialView(layers.world, scene.tutorial);
    }
  }

  /**
   * Devuelve todos los sólidos de la escena (estáticos + plataformas activas).
   * Se llama en cada paso de física para construir la lista contra la que colisionan
   * el robot, los enemigos y los proyectiles.
   *
   * @returns {Rect[]}
   */
  getAllSolids() {
    const solids = [...this.scene.solids];
    this.movingPlatforms.forEach((mp) => { if (mp.isSolid) solids.push(mp.body); });
    this.fallingPlatforms.forEach((fp) => { if (fp.isSolid) solids.push(fp.body); });
    for (const r of this.dynamicSolids) solids.push(r);
    return solids;
  }

  /** Destruye todas las vistas, colecciones, decoraciones y tutorial. */
  dispose() {
    this.projectiles.clear();
    this.energyCells.clear();
    this.crewIdPickups.clear();
    this.dummies.clear();
    this.enemies.clear();
    this.shootables.clear();
    this.movingPlatforms.clear();
    this.fallingPlatforms.clear();
    for (const view of this.trapViews) view.destroy();
    this.trapViews = [];
    this.traps = [];
    this.dynamicHazards = [];
    this.dynamicSolids = [];
    for (const el of this.#decorationElements) el.remove();
    this.#decorationElements = [];
    this.tutorial?.dispose();
    this.tutorialView?.destroy();
    this.playerView.destroy();
  }
}
