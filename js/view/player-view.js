import { PLAYER } from '../config.js';
import { EntityView } from './entity-view.js';

// Todas las clases de estado posibles; se limpian cada frame y solo una se activa
// segun la prioridad definida en Player.visualState.
const VISUAL_CLASSES = [
  'is-idle', 'is-running', 'is-rising', 'is-falling', 'is-landing',
  'is-attacking', 'is-hurt-frame', 'is-invulnerable', 'is-dying',
  'is-respawning', 'is-muzzle-flash',
];

export class PlayerView {
  #view;
  #element;
  #sprite;
  #lastVisual = '';
  #lastAuraCount = 0;

  constructor(layer) {
    this.#view = new EntityView(layer, 'player', PLAYER);
    this.#element = this.#view.element;
    this.#sprite = this.#view.sprite;
    this.#sprite.classList.add('sprite-sheet', 'robot-sprite');
  }

  sync(player) {
    this.#view.sync(player.body, {
      'is-facing-left': player.facing < 0,
    });

    const visual = player.visualState;
    if (visual !== this.#lastVisual) {
      for (const cls of VISUAL_CLASSES) {
        this.#element.classList.remove(cls);
      }
      this.#element.classList.add(`is-${visual}`);
      this.#lastVisual = visual;
    }

    // Aterrizar se superpone al estado actual (aplastamiento breve)
    this.#element.classList.toggle('is-landing', player.isLanding);
    // Invulnerabilidad: parpadeo despues del frame de dano
    this.#element.classList.toggle('is-invulnerable',
      player.isHurt && !player.isHurtFrame && !player.isDying);
    // Fogonazo en el aire (no hay frame de ataque, solo el flash)
    this.#element.classList.toggle('is-muzzle-flash',
      player.isShooting && !player.isGrounded && visual !== 'attacking');
    // Aura roja: reiniciar animacion CSS si el contador de golpes cambio
    const auraCount = player.hurtAuraCount;
    if (auraCount !== this.#lastAuraCount) {
      this.#lastAuraCount = auraCount;
      this.#element.classList.remove('has-hurt-aura');
      void this.#element.offsetWidth;
    }
    this.#element.classList.toggle('has-hurt-aura', player.hasHurtAura);
  }

  destroy() {
    this.#view.destroy();
  }
}
