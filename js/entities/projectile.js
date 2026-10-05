/**
 * @module projectile
 *
 * Disparo del robot: rayo horizontal sin gravedad que viaja en línea recta.
 * Se destruye al chocar con un sólido o al recorrer su alcance máximo.
 *
 * Usado por: CombatSystem (lo crea al escuchar 'player:shoot').
 * Depende de: config.js (SHOOT), physics.js (createBody, stepBody).
 *
 * @typedef {import('../physics/physics.js').Body} Body
 */
import { SHOOT } from '../config.js';
import { createBody, stepBody } from '../physics/physics.js';

/**
 * Proyectil del robot.
 *
 * Ciclo de vida: CombatSystem lo crea y lo agrega a un EntityCollection;
 * se marca isDead al chocar o agotar su alcance; EntityCollection lo elimina.
 * Colabora con: CombatSystem (verifica impactos contra shootables).
 */
export class Projectile {
  /** @type {Body} — cuerpo físico del proyectil (sin gravedad, gravityScale = 0) */
  body;
  /** @type {boolean} — true cuando debe ser eliminado */
  isDead = false;
  /** @type {1|-1} — dirección horizontal (1 = derecha, -1 = izquierda) */
  direction;
  /** @type {number} — distancia recorrida, en px del mundo */
  #distanceTraveled = 0;

  /**
   * @param {Object} opts
   * @param {number} opts.x — posición X de la boca del arma, en px del mundo.
   * @param {number} opts.y — posición Y de la boca del arma, en px del mundo.
   * @param {1|-1} opts.direction — dirección del disparo.
   */
  constructor({ x, y, direction }) {
    this.direction = direction;
    this.body = createBody({
      x: direction > 0 ? x : x - SHOOT.width,
      y: y - SHOOT.height / 2,
      width: SHOOT.width,
      height: SHOOT.height,
      gravityScale: 0,
    });
    this.body.vx = SHOOT.speed * direction;
  }

  /**
   * Avanza el proyectil y verifica si debe morir (choque o alcance máximo).
   *
   * @param {number} deltaTime — segundos del paso actual.
   * @param {Rect[]} solids — sólidos de la escena.
   */
  update(deltaTime, solids) {
    stepBody(this.body, solids, deltaTime);
    this.#distanceTraveled += SHOOT.speed * deltaTime;
    const { left, right, ground, ceiling } = this.body.contacts;
    if (left || right || ground || ceiling) this.isDead = true;
    if (this.#distanceTraveled >= SHOOT.maxDistance) this.isDead = true;
  }
}
