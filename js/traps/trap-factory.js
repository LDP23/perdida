/**
 * @module trap-factory
 *
 * Fábrica de trampas: traduce el campo type de los datos de escena a la clase
 * concreta. Agregar un tipo nuevo = crear su archivo y sumar una línea al mapa.
 * Valida las claves de los datos para detectar claves sobrantes (errores de diseño).
 *
 * El segundo parámetro opcional sceneContext lleva información del mundo que alguna
 * trampa necesita en su constructor (p.ej. los sólidos para calcular superficies).
 * Los datos de nivel nunca se mutan: lo que la trampa necesita del mundo se le pasa
 * como argumento.
 *
 * Usado por: SceneWorld (al construir las trampas de la escena), level-check.js.
 * Depende de: todas las subclases de Trap.
 */
import { AcidDrip } from './acid-drip.js';
import { Decompression } from './decompression.js';
import { HydraulicPress } from './hydraulic-press.js';
import { IntermittentLaser } from './intermittent-laser.js';
import { SweepingLaser } from './sweeping-laser.js';
import { Turret } from './turret.js';

/** @type {Map<string, {cls: new(data: Object, sceneContext?: Object) => Trap, keys: Set<string>}>} */
const TRAP_REGISTRY = new Map([
  ['press',         { cls: HydraulicPress,  keys: new Set(['type', 'x1', 'x2', 'restBottom', 'bottom', 'phaseOffset']) }],
  ['laser',         { cls: IntermittentLaser, keys: new Set(['type', 'x', 'phaseOffset']) }],
  ['acid-drip',     { cls: AcidDrip,         keys: new Set(['type', 'x', 'phaseOffset']) }],
  ['sweep-laser',   { cls: SweepingLaser,    keys: new Set(['type', 'x1', 'x2', 'phaseOffset']) }],
  ['turret',        { cls: Turret,           keys: new Set(['type', 'x', 'y', 'direction', 'phaseOffset']) }],
  ['decompression', { cls: Decompression,    keys: new Set(['type', 'x1', 'x2', 'top', 'bottom', 'pullX']) }],
]);

/** Registro de tipos y claves válidas, exportado para validación en herramientas */
export { TRAP_REGISTRY };

/**
 * Crea una trampa a partir de sus datos de escena.
 * @param {Object} data — datos de la trampa (incluye type).
 * @param {Object} [sceneContext] — contexto del mundo: { solids }.
 * @returns {Trap}
 * @throws {Error} si el tipo no está registrado o tiene claves sobrantes.
 */
export function createTrap(data, sceneContext) {
  const entry = TRAP_REGISTRY.get(data.type);
  if (!entry) {
    throw new Error(`Tipo de trampa desconocido: "${data.type}". Registralo en trap-factory.js.`);
  }
  const extra = Object.keys(data).filter((k) => !entry.keys.has(k));
  if (extra.length > 0) {
    throw new Error(`Trampa "${data.type}" tiene claves sobrantes: ${extra.join(', ')}. Revisá los datos.`);
  }
  return new entry.cls(data, sceneContext);
}
