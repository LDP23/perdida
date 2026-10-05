/**
 * @module level-loader
 *
 * Traductor entre los datos de diseño (level1.js…) y el motor. Los niveles definen
 * medidas con la notación del diseño (x1, x2, top, bottom); el motor solo conoce
 * rectángulos {x, y, width, height}. Este módulo convierte de un formato al otro,
 * precarga la imagen de fondo y genera las paredes invisibles de los bordes.
 *
 * Usado por: SceneFlow (loadScene para cargar la escena con imagen).
 * Depende de: config.js (SCENE, WORLD), assets.js (loadImage), collision.js (rectFromSpan).
 */
import { SCENE, WORLD } from '../config.js';
import { loadImage } from '../core/assets.js';
import { rectFromSpan } from '../physics/collision.js';

/**
 * Carga la imagen de fondo y construye la escena del motor.
 * @param {Object} sceneData - datos crudos del nivel (level1.js).
 * @returns {Promise<Object>} escena lista para el motor.
 */
export async function loadScene(sceneData) {
  await loadImage(sceneData.background);
  return buildScene(sceneData);
}

export function buildScene(sceneData) {
  const exit = sceneData.exit ?? null;
  return {
    id: sceneData.id,
    name: sceneData.name,
    background: sceneData.background,
    width: WORLD.width,
    height: WORLD.height,
    spawn: { ...sceneData.spawn },
    solids: [...sceneData.solids.map(toSolid), ...createEdgeWalls(exit)],
    hazards: sceneData.hazards ? sceneData.hazards.map(toHazard) : [],
    tutorial: sceneData.tutorial ? [...sceneData.tutorial] : [],
    crewIds: sceneData.crewIds ? [...sceneData.crewIds] : [],
    energyCells: sceneData.energyCells ? [...sceneData.energyCells] : [],
    trainingDummies: sceneData.trainingDummies ? [...sceneData.trainingDummies] : [],
    enemies: sceneData.enemies ? [...sceneData.enemies] : [],
    movingPlatforms: sceneData.movingPlatforms ? [...sceneData.movingPlatforms] : [],
    fallingPlatforms: sceneData.fallingPlatforms ? [...sceneData.fallingPlatforms] : [],
    decorations: sceneData.decorations ? [...sceneData.decorations] : [],
    traps: sceneData.traps ? [...sceneData.traps] : [],
    exit,
    // Si la puerta existe, convertir su zona a rectángulo para chequeo de colisión
    door: exit?.type === 'door' ? rectFromSpan(exit) : null,
  };
}

function toSolid(span) {
  return { ...rectFromSpan({ bottom: WORLD.height, ...span }), kind: 'solid' };
}

function toHazard(span) {
  return { ...rectFromSpan(span), kind: 'hazard', type: span.type };
}

// Sin pared derecha cuando la salida es por el borde
function createEdgeWalls(exit) {
  const wall = { y: -WORLD.height, width: SCENE.wallThickness, height: WORLD.height * 3, kind: 'wall' };
  const walls = [{ ...wall, x: -SCENE.wallThickness }];
  if (!exit || exit.type !== 'edge') {
    walls.push({ ...wall, x: WORLD.width });
  }
  return walls;
}
