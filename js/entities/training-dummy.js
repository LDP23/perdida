/**
 * @module training-dummy
 *
 * Maniquí de práctica (espantapájaros): no es sólido, cuenta impactos y destella
 * al recibir un disparo. Implementa la interfaz "shootable" (tiene body y onShot).
 *
 * Usado por: CombatSystem (verifica impactos), SceneWorld (lo crea).
 * Depende de: config.js (TRAINING_DUMMY), timer.js.
 */
import { TRAINING_DUMMY } from '../config.js';
import { Timer } from '../core/timer.js';

/**
 * Maniquí de práctica (espantapájaros).
 *
 * Ciclo de vida: SceneWorld lo crea; CombatSystem lo registra como shootable;
 * nunca muere (isDead siempre false).
 * Colabora con: CombatSystem, TrainingDummyView.
 */
export class TrainingDummy {
  /** @type {Rect} — hitbox (más pequeña que el sprite, con offset desde arriba) */
  body;
  /** @type {number} — cantidad de impactos recibidos */
  hitCount = 0;
  /** @type {boolean} — siempre false (el maniquí no se destruye) */
  isDead = false;
  /** @type {Timer} — destello breve al recibir un impacto */
  #hitFlash = new Timer();

  /**
   * @param {Object} opts
   * @param {number} opts.x — centro horizontal, en px del mundo (pies del maniquí).
   * @param {number} opts.y — base del sprite (piso), en px del mundo.
   */
  constructor({ x, y }) {
    // Hitbox centrada dentro del sprite, con offset desde arriba
    const hw = TRAINING_DUMMY.hitboxWidth;
    const hh = TRAINING_DUMMY.hitboxHeight;
    this.body = {
      x: x - hw / 2,
      y: y - TRAINING_DUMMY.spriteHeight + TRAINING_DUMMY.hitboxTopOffset,
      width: hw,
      height: hh,
    };
  }

  /** @returns {boolean} true durante el destello de impacto */
  get isHit() { return this.#hitFlash.active; }

  /**
   * Interfaz shootable: recibe un impacto. Incrementa el contador y activa el destello.
   */
  onShot() {
    this.hitCount++;
    this.#hitFlash.start(0.12);
  }

  /**
   * Avanza el temporizador del destello.
   * @param {number} dt — deltaTime en segundos.
   */
  update(dt) {
    this.#hitFlash.update(dt);
  }
}
