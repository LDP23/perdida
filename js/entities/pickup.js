/**
 * @module pickup
 *
 * Objeto recogible del mundo: puede ser una celda de energía (recarga batería) o
 * un ID de tripulante (suma puntos y progreso). Al ser tocado por el robot se marca
 * isCollected, reproduce una animación CSS de collectDuration y luego isDead.
 *
 * Usado por: PickupSystem (verifica colisión y llama collect()), SceneWorld (los crea).
 * Depende de: config.js (PICKUP), timer.js.
 */
import { PICKUP } from '../config.js';
import { Timer } from '../core/timer.js';

/**
 * Objeto recogible en el mundo.
 *
 * Ciclo de vida: SceneWorld lo crea a partir de los datos de escena;
 * PickupSystem llama collect() al colisionar con el robot;
 * tras collectDuration se marca isDead y EntityCollection lo elimina.
 */
export class Pickup {
  /** @type {Rect} — hitbox cuadrada centrada en la posición dada */
  body;
  /** @type {'energy-cell'|'crew-id'} — tipo de recogible */
  type;
  /** @type {number|null} — ID del tripulante (solo para type='crew-id') */
  crewId;
  /** @type {boolean} — true cuando el robot lo tocó (inicia animación de recolección) */
  isCollected = false;
  /** @type {boolean} — true si fue soltado por una criatura (animación de salto) */
  isDropped = false;
  /** @type {boolean} — true cuando debe ser eliminado */
  isDead = false;
  /** @type {Timer} — cuenta regresiva de la animación de recolección */
  #deathTimer = new Timer();

  /**
   * @param {Object} opts
   * @param {'energy-cell'|'crew-id'} opts.type — tipo de recogible.
   * @param {number} opts.x — centro X, en px del mundo.
   * @param {number} opts.y — centro Y, en px del mundo.
   * @param {number} [opts.crewId] — ID del tripulante (solo si type='crew-id').
   */
  constructor({ type, x, y, crewId }) {
    this.type = type;
    this.crewId = crewId ?? null;
    const half = PICKUP.size / 2;
    this.body = { x: x - half, y: y - half, width: PICKUP.size, height: PICKUP.size };
  }

  /** Marca como recogido e inicia la animación de recolección. */
  collect() {
    if (this.isCollected) return;
    this.isCollected = true;
    this.#deathTimer.start(PICKUP.collectDuration);
  }

  /**
   * Avanza la animación de recolección. Marca isDead cuando termina.
   * @param {number} dt — deltaTime en segundos.
   */
  update(dt) {
    this.#deathTimer.update(dt);
    if (this.isCollected && !this.#deathTimer.active) this.isDead = true;
  }
}
