/**
 * @module entity-collection
 *
 * Colección genérica de entidades con su vista asociada. Elimina automáticamente
 * las que tengan isDead (limpieza de vistas incluida). Se usa para disparos, enemigos,
 * maniquíes, plataformas y recolectables — cualquier grupo homogéneo.
 *
 * Usado por: SceneWorld, CombatSystem, PickupSystem.
 * Depende de: entity-view.js (vista por defecto).
 */
import { EntityView } from '../view/entity-view.js';

/**
 * Colección de pares {entidad, vista} con limpieza automática de muertos.
 *
 * Ciclo de vida: SceneWorld o un sistema la crean; se llama clear() al cambiar de escena.
 * Colabora con: EntityView o vistas especializadas (EnemyView, PlatformView, etc.).
 *
 * Si se pasa un viewFactory al constructor, se usa para crear vistas especializadas
 * (p.ej. EnemyView en vez de EntityView genérica).
 */
export class EntityCollection {
  /** @type {HTMLElement} — capa del DOM donde se insertan las vistas */
  #layer;
  /** @type {string} — modificador CSS para las vistas (p.ej. 'projectile') */
  #modifier;
  /** @type {Array<{entity: Object, view: Object}>} — pares entidad/vista */
  #entries = [];
  /** @type {Function|null} — fábrica de vistas especializadas */
  #viewFactory;

  /**
   * @param {HTMLElement} layer — capa del DOM para las vistas.
   * @param {string} modifier — modificador CSS (p.ej. 'projectile', 'enemy').
   * @param {Function|null} [viewFactory=null] — (layer, entity) => vista especializada.
   */
  constructor(layer, modifier, viewFactory = null) {
    this.#layer = layer;
    this.#modifier = modifier;
    this.#viewFactory = viewFactory;
  }

  /** @returns {number} cantidad de entidades vivas en la colección */
  get count() { return this.#entries.length; }

  /**
   * Agrega una entidad y crea su vista (genérica o con viewFactory).
   * @param {Object} entity — entidad con body y opcionalmente isDead.
   */
  add(entity) {
    const view = this.#viewFactory
      ? this.#viewFactory(this.#layer, entity)
      : new EntityView(this.#layer, this.#modifier, entity.body);
    this.#entries.push({ entity, view });
  }

  /**
   * Llama fn(entity) en cada entidad y luego elimina las que tengan isDead.
   * @param {function(Object): void} fn — función de actualización.
   */
  update(fn) {
    for (const { entity } of this.#entries) fn(entity);
    this.#removeDeadEntries();
  }

  /**
   * Sincroniza las vistas con la posición de sus entidades (para EntityView estándar).
   * @param {Function} [flagsFn] — (entity) => objeto de flags para la vista.
   */
  sync(flagsFn) {
    for (const { entity, view } of this.#entries) {
      view.sync(entity.body, flagsFn ? flagsFn(entity) : {});
    }
  }

  /**
   * Itera pares {entity, view} para vistas especializadas que no siguen sync(body, flags).
   * @param {function(Object, Object): void} fn — (entity, view) => void.
   */
  syncCustom(fn) {
    for (const { entity, view } of this.#entries) fn(entity, view);
  }

  /**
   * Itera solo las entidades (sin vista), para lógica pura.
   * @param {function(Object): void} fn
   */
  forEach(fn) {
    for (const { entity } of this.#entries) fn(entity);
  }

  /** Destruye todas las vistas y vacía la colección. Se llama al cambiar de escena. */
  clear() {
    for (const { view } of this.#entries) view.destroy();
    this.#entries.length = 0;
  }

  /** Recorre de atrás hacia adelante y elimina entidades con isDead (destruye sus vistas) */
  #removeDeadEntries() {
    for (let i = this.#entries.length - 1; i >= 0; i--) {
      if (this.#entries[i].entity.isDead) {
        this.#entries[i].view.destroy();
        this.#entries.splice(i, 1);
      }
    }
  }
}
