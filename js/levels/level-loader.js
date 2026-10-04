import { SCENE, WORLD } from '../config.js';
import { loadImage } from '../core/assets.js';
import { rectFromSpan } from '../physics/collision.js';

// Traductor entre los datos de diseño (level1.js…) y el motor. El motor solo
// conoce rectángulos; los niveles solo conocen medidas de la imagen.

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
