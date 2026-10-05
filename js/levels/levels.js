/**
 * @module levels
 *
 * Registro de niveles del juego. Único lugar que conoce todos los niveles.
 * Para agregar un nivel basta importarlo aquí y añadirlo al array.
 *
 * Usado por: SceneFlow, PlayingState, DebugTools, LevelCompleteState.
 * Depende de: level1.js (y futuros level2.js, level3.js).
 */
import { LEVEL_1 } from './level1.js';

export const LEVELS = [LEVEL_1];
