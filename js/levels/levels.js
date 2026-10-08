/**
 * @module levels
 *
 * Registro de niveles del juego. Único lugar que conoce todos los niveles.
 * Para agregar un nivel basta importarlo aquí y añadirlo al array.
 *
 * Los datos se congelan en profundidad para impedir mutaciones accidentales
 * en tiempo de ejecución: un intento de escribir sobre ellos falla de inmediato
 * en modo estricto (módulos ES), en vez de provocar errores crípticos más tarde.
 *
 * Usado por: SceneFlow, PlayingState, DebugTools, LevelCompleteState.
 * Depende de: level1.js, level2.js, level3.js.
 */
import { LEVEL_1 } from './level1.js';
import { LEVEL_2 } from './level2.js';
import { LEVEL_3 } from './level3.js';

/** Congela un objeto y todos sus descendientes recursivamente */
function deepFreeze(obj) {
  Object.freeze(obj);
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

export const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3].map(deepFreeze);
