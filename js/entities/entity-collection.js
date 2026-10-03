import { EntityView } from '../view/entity-view.js';

// Colección genérica de entidades con su vista asociada.
// Elimina automáticamente las que tengan isDead. Se usa para disparos, enemigos y recolectables.
export class EntityCollection {
  #layer;
  #modifier;
  #entries = [];

  constructor(layer, modifier) {
    this.#layer = layer;
    this.#modifier = modifier;
  }

  get count() { return this.#entries.length; }

  add(entity) {
    const view = new EntityView(this.#layer, this.#modifier, entity.body);
    this.#entries.push({ entity, view });
  }

  update(fn) {
    for (const { entity } of this.#entries) fn(entity);
    this.#removeDeadEntries();
  }

  sync(flagsFn) {
    for (const { entity, view } of this.#entries) {
      view.sync(entity.body, flagsFn ? flagsFn(entity) : {});
    }
  }

  forEach(fn) {
    for (const { entity } of this.#entries) fn(entity);
  }

  clear() {
    for (const { view } of this.#entries) view.destroy();
    this.#entries.length = 0;
  }

  #removeDeadEntries() {
    for (let i = this.#entries.length - 1; i >= 0; i--) {
      if (this.#entries[i].entity.isDead) {
        this.#entries[i].view.destroy();
        this.#entries.splice(i, 1);
      }
    }
  }
}
