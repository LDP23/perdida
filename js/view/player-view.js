import { PLAYER } from '../config.js';
import { EntityView } from './entity-view.js';

// Traduce el estado lógico del Player a clases CSS para que PlayingState no arme flags.
const STATE_CLASSES = [
  'is-facing-left', 'is-walking', 'is-jumping',
  'is-falling', 'is-landing', 'is-shooting', 'is-hurt',
];

export class PlayerView {
  #view;

  constructor(layer) {
    this.#view = new EntityView(layer, 'player', PLAYER);
  }

  sync(player) {
    this.#view.sync(player.body, {
      'is-facing-left': player.facing < 0,
      'is-walking': player.isWalking,
      'is-jumping': player.isJumping,
      'is-falling': player.isFalling,
      'is-landing': player.isLanding,
      'is-shooting': player.isShooting,
      'is-hurt': player.isHurt,
    });
  }

  destroy() {
    this.#view.destroy();
  }
}
