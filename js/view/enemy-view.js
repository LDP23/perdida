/**
 * @module enemy-view
 *
 * Vista de la criatura enemiga: traduce Enemy.visualState a una clase is-*,
 * aplica la hoja de sprites creature-sprite, y maneja el desvanecimiento is-fading.
 *
 * Usado por: SceneWorld (la crea vía EntityCollection con viewFactory).
 * Depende de: EntityView.
 */
import { EntityView } from './entity-view.js';

/** Clases de estado visual de la criatura. */
const VISUAL_CLASSES = [
  'is-idle', 'is-walking', 'is-windup', 'is-strike',
  'is-hurt', 'is-dying', 'is-dead',
];

/**
 * Vista de la criatura enemiga.
 *
 * Ciclo de vida: EntityCollection la crea vía viewFactory; destroy() remueve del DOM.
 */
export class EnemyView {
  #view;
  #element;
  #lastVisual = '';

  constructor(layer, body) {
    this.#view = new EntityView(layer, 'enemy', body);
    this.#element = this.#view.element;
    this.#view.sprite.classList.add('sprite-sheet', 'creature-sprite');
  }

  sync(enemy) {
    this.#view.sync(enemy.body, {
      'is-facing-left': enemy.facing < 0,
    });

    const visual = enemy.visualState;
    if (visual !== this.#lastVisual) {
      for (const cls of VISUAL_CLASSES) this.#element.classList.remove(cls);
      this.#element.classList.add(`is-${visual}`);
      this.#lastVisual = visual;
    }

    this.#element.classList.toggle('is-fading', enemy.isFading);
  }

  destroy() {
    this.#view.destroy();
  }
}
