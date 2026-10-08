/**
 * @module projectile
 *
 * Proyectil genérico: rayo horizontal sin gravedad que viaja en línea recta.
 * Se destruye al chocar con un sólido o al recorrer su alcance máximo.
 * El campo owner ('player' o 'enemy') distingue quién lo disparó.
 *
 * Usado por: CombatSystem (lo crea al escuchar 'player:shoot' o 'turret:fire').
 * Depende de: config.js (SHOOT), physics.js (createBody, stepBody).
 *
 * @typedef {import('../physics/physics.js').Body} Body
 */
import { SHOOT } from '../config.js';
import { createBody, stepBody } from '../physics/physics.js';

/**
 * Proyectil del juego.
 *
 * Ciclo de vida: CombatSystem lo crea y lo agrega a un EntityCollection;
 * se marca isDead al chocar o agotar su alcance; EntityCollection lo elimina.
 * Colabora con: CombatSystem (verifica impactos según owner).
 */
export class Projectile {
  /** @type {Body} — cuerpo físico del proyectil (sin gravedad, gravityScale = 0) */
  body;
  /** @type {boolean} — true cuando debe ser eliminado */
  isDead = false;
  /** @type {1|-1} — dirección horizontal (1 = derecha, -1 = izquierda) */
  direction;
  /** @type {'player'|'enemy'} — quién disparó el proyectil */
  owner;
  /** @type {number} — distancia recorrida, en px del mundo */
  #distanceTraveled = 0;
  /** @type {number} — velocidad del proyectil, en px/s */
  #speed;
  /** @type {number} — alcance máximo, en px */
  #maxDistance;

  /**
   * @param {Object} opts
   * @param {number} opts.x — posición X de la boca del arma, en px del mundo.
   * @param {number} opts.y — posición Y de la boca del arma, en px del mundo.
   * @param {1|-1} opts.direction — dirección del disparo.
   * @param {number} [opts.speed] — velocidad en px/s (defecto: SHOOT.speed).
   * @param {number} [opts.width] — ancho en px (defecto: SHOOT.width).
   * @param {number} [opts.height] — alto en px (defecto: SHOOT.height).
   * @param {number} [opts.maxDistance] — alcance en px (defecto: SHOOT.maxDistance).
   * @param {'player'|'enemy'} [opts.owner='player'] — dueño del proyectil.
   */
  constructor({ x, y, direction, speed, width, height, maxDistance, owner }) {
    const w = width ?? SHOOT.width;
    const h = height ?? SHOOT.height;
    this.#speed = speed ?? SHOOT.speed;
    this.#maxDistance = maxDistance ?? SHOOT.maxDistance;
    this.owner = owner ?? 'player';
    this.direction = direction;
    this.body = createBody({
      x: direction > 0 ? x : x - w,
      y: y - h / 2,
      width: w,
      height: h,
      gravityScale: 0,
    });
    this.body.vx = this.#speed * direction;
  }

  /**
   * Avanza el proyectil y verifica si debe morir (choque o alcance máximo).
   *
   * @param {number} deltaTime — segundos del paso actual.
   * @param {Rect[]} solids — sólidos de la escena.
   */
  update(deltaTime, solids) {
    stepBody(this.body, solids, deltaTime);
    this.#distanceTraveled += this.#speed * deltaTime;
    const { left, right, ground, ceiling } = this.body.contacts;
    if (left || right || ground || ceiling) this.isDead = true;
    if (this.#distanceTraveled >= this.#maxDistance) this.isDead = true;
  }
}
