import { SCENE, WORLD } from '../config.js';
import { loadImage } from '../core/assets.js';
import { rectFromSpan } from '../physics/collision.js';

// Traductor entre los datos de diseño (level1.js…) y el motor. El motor solo
// conoce rectángulos; los niveles solo conocen medidas de la imagen.
// En la etapa 3 este archivo también manejará el cambio de escenas y niveles.

export async function loadScene(sceneData) {
  await loadImage(sceneData.background);
  return buildScene(sceneData);
}

export function buildScene(sceneData) {
  return {
    id: sceneData.id,
    name: sceneData.name,
    background: sceneData.background,
    width: WORLD.width,
    height: WORLD.height,
    spawn: { ...sceneData.spawn },
    solids: [...sceneData.solids.map(toSolid), ...createEdgeWalls()],
  };
}

function toSolid(span) {
  return { ...rectFromSpan({ bottom: WORLD.height, ...span }), kind: 'solid' };
}

// Paredes invisibles a ambos lados. Son más altas que la escena para que
// tampoco se puedan saltar por encima.
function createEdgeWalls() {
  const wall = { y: -WORLD.height, width: SCENE.wallThickness, height: WORLD.height * 3, kind: 'wall' };
  return [
    { ...wall, x: -SCENE.wallThickness },
    { ...wall, x: WORLD.width },
  ];
}
