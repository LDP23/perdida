/**
 * @module trap-factory
 *
 * Fábrica de trampas: traduce el campo type de los datos de escena a la clase
 * concreta. Agregar un tipo nuevo = crear su archivo y sumar una línea al mapa.
 * Valida las claves de los datos para detectar claves sobrantes (errores de diseño).
 *
 * Usado por: SceneWorld (al construir las trampas de la escena).
 * Depende de: todas las subclases de Trap.
 */
import { AcidDrip } from './acid-drip.js';
import { Decompression } from './decompression.js';
import { ElectricSparks } from './electric-sparks.js';
import { HydraulicPress } from './hydraulic-press.js';
import { IntermittentLaser } from './intermittent-laser.js';
import { SweepingLaser } from './sweeping-laser.js';
import { Turret } from './turret.js';

/** @type {Map<string, {cls: new(data: Object) => Trap, keys: Set<string>}>} */
const TRAP_REGISTRY = new Map([
  ['press',         { cls: HydraulicPress,  keys: new Set(['type', 'x1', 'x2', 'ceiling', 'restBottom', 'bottom', 'phaseOffset']) }],
  ['laser',         { cls: IntermittentLaser, keys: new Set(['type', 'x', 'phaseOffset']) }],
  ['acid-drip',     { cls: AcidDrip,         keys: new Set(['type', 'x', 'top', 'bottom', 'phaseOffset']) }],
  ['sparks',        { cls: ElectricSparks,   keys: new Set(['type', 'x', 'bottom', 'width', 'height', 'phaseOffset']) }],
  ['sweep-laser',   { cls: SweepingLaser,    keys: new Set(['type', 'x1', 'x2', 'phaseOffset']) }],
  ['turret',        { cls: Turret,           keys: new Set(['type', 'x', 'y', 'direction', 'phaseOffset']) }],
  ['decompression', { cls: Decompression,    keys: new Set(['type', 'x1', 'x2', 'top', 'bottom', 'pullX']) }],
]);

/**
 * Crea una trampa a partir de sus datos de escena.
 * @param {Object} data — datos de la trampa (incluye type).
 * @returns {Trap}
 * @throws {Error} si el tipo no está registrado o tiene claves sobrantes.
 */
export function createTrap(data) {
  const entry = TRAP_REGISTRY.get(data.type);
  if (!entry) {
    throw new Error(`Tipo de trampa desconocido: "${data.type}". Registralo en trap-factory.js.`);
  }
  const extra = Object.keys(data).filter((k) => !entry.keys.has(k));
  if (extra.length > 0) {
    throw new Error(`Trampa "${data.type}" tiene claves sobrantes: ${extra.join(', ')}. Revisá los datos.`);
  }
  return new entry.cls(data);
}
