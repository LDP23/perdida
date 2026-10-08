/**
 * @module decompression
 *
 * Descompresión: trampa del nivel 3 que arrastra al robot hacia una brecha
 * en el casco. No causa daño directo — su peligro es empujar al robot
 * hacia el vacío.
 *
 * No tiene fases cíclicas: siempre está activa. Extiende Trap con una
 * sola fase permanente para que TrapSystem la actualice y su zone excluya
 * el punto seguro.
 *
 * pullFor(body) devuelve la velocidad externa (px/s) que el robot sufre.
 * TrapSystem asigna la suma de todos los pullFor al body.externalVx.
 *
 * Usado por: trap-factory.js (mapa type → clase), TrapSystem.
 * Depende de: config.js (TRAPS.decompression), trap.js, collision.js.
 */
import { TRAPS } from '../config.js';
import { rectsOverlap } from '../physics/collision.js';
import { Trap } from './trap.js';

const D = TRAPS.decompression;

/**
 * Trampa de descompresión.
 *
 * Datos de escena: { type: 'decompression', x1, x2, top, bottom, pullX }
 * - x1, x2: extremos horizontales de la zona de corriente.
 * - top, bottom: altura de la zona (bottom omitido = 724).
 * - pullX: centro de la brecha. La fuerza empuja hacia ese punto.
 */
export class Decompression extends Trap {
  #zone;
  #pullX;

  constructor(data) {
    const bottom = data.bottom ?? 724;
    const zone = {
      x: data.x1,
      y: data.top ?? 0,
      width: data.x2 - data.x1,
      height: bottom - (data.top ?? 0),
    };

    super([
      { name: 'active', duration: 99999 },
    ], zone, 0);

    this.#zone = zone;
    this.#pullX = data.pullX ?? (data.x1 + data.x2) / 2;
  }

  get type() { return 'decompression'; }

  get dangerRects() { return []; }

  get viewData() {
    return { '--pull-x': this.#pullX - this.#zone.x };
  }

  /**
   * Calcula la velocidad externa que la corriente ejerce sobre un cuerpo.
   * @param {Body} body — cuerpo a evaluar.
   * @returns {number} velocidad en px/s (con signo hacia pullX), 0 si está fuera.
   */
  pullFor(body) {
    if (!rectsOverlap(body, this.#zone)) return 0;
    const bodyCx = body.x + body.width / 2;
    return bodyCx < this.#pullX ? D.strength : -D.strength;
  }
}
