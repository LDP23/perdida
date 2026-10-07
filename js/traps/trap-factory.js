/**
 * @module trap-factory
 *
 * Fábrica de trampas: traduce el campo type de los datos de escena a la clase
 * concreta. Agregar un tipo nuevo = crear su archivo y sumar una línea al mapa.
 *
 * Usado por: SceneWorld (al construir las trampas de la escena).
 * Depende de: HydraulicPress, IntermittentLaser.
 */
import { AcidDrip } from './acid-drip.js';
import { HydraulicPress } from './hydraulic-press.js';
import { IntermittentLaser } from './intermittent-laser.js';

/** @type {Map<string, new(data: Object) => Trap>} */
const TRAP_CLASSES = new Map([
  ['press', HydraulicPress],
  ['laser', IntermittentLaser],
  ['acid-drip', AcidDrip],
]);

/**
 * Crea una trampa a partir de sus datos de escena.
 * @param {Object} data — datos de la trampa (incluye type).
 * @returns {Trap}
 * @throws {Error} si el tipo no está registrado.
 */
export function createTrap(data) {
  const TrapClass = TRAP_CLASSES.get(data.type);
  if (!TrapClass) {
    throw new Error(`Tipo de trampa desconocido: "${data.type}". Registralo en trap-factory.js.`);
  }
  return new TrapClass(data);
}
