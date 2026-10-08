/**
 * @module level3
 *
 * Datos del Nivel 3 — Puente de mando. SOLO datos: agregar o corregir una escena
 * no toca el motor. Coordenadas en píxeles de la imagen (2172 × 724).
 *
 * Usado por: levels.js (lo agrega al array LEVELS).
 * Depende de: nada (datos puros).
 */

export const LEVEL_3 = {
  id: 3,
  name: 'Puente de mando',
  theme: 'bridge',
  story: {
    title: 'Nivel 3 · Puente de mando',
    lines: [
      'La señal sale del puente de mando.',
      'Hay grietas abiertas al espacio: el vacío arrastra todo lo que no se sujeta.',
      'La cápsula de escape sigue en línea.',
    ],
  },
  scenes: [
    // ========== N3E1 — Corredor del puente ==========
    {
      id: 'n3e1',
      name: 'Corredor del puente',
      background: 'assets/scenes/nivel3_escena1.webp',
      spawn: { x: 80, y: 472 },
      solids: [
        { x1: 0, x2: 383, top: 472 },
        { x1: 805, x2: 1406, top: 472 },
        { x1: 1405, x2: 1449, top: 427 },
        { x1: 1448, x2: 1494, top: 393 },
        { x1: 1494, x2: 1896, top: 356 },
        { x1: 1893, x2: 1941, top: 393 },
        { x1: 1939, x2: 1988, top: 427 },
        { x1: 1983, x2: 2172, top: 472 },
      ],
      fallingPlatforms: [
        { x: 544, y: 455, width: 100 },
      ],
      traps: [
        { type: 'decompression', x1: 300, x2: 900, top: 0, bottom: 724, pullX: 594 },
        { type: 'sweep-laser', x1: 1510, x2: 1880 },
      ],
      enemies: [
        { x: 1100, y: 472, patrol: { x1: 850, x2: 1350 }, dropsCrewId: 'nadia-varga' },
      ],
      energyCells: [
        { x: 950, y: 432 },
      ],
      exit: { type: 'edge' },
    },

    // ========== N3E2 — Sala de comunicaciones ==========
    {
      id: 'n3e2',
      name: 'Sala de comunicaciones',
      background: 'assets/scenes/nivel3_escena2.webp',
      spawn: { x: 80, y: 430 },
      solids: [
        { x1: 0, x2: 640, top: 430 },
        { x1: 575, x2: 871, top: 370 },
        { x1: 1047, x2: 1337, top: 290 },
        { x1: 1499, x2: 1614, top: 358 },
        { x1: 1775, x2: 2172, top: 430 },
      ],
      traps: [
        { type: 'decompression', x1: 640, x2: 1775, top: 0, bottom: 724, pullX: 1207 },
        { type: 'laser', x: 1190 },
        { type: 'turret', x: 2150, y: 300, direction: -1 },
      ],
      crewIds: [
        { crewId: 'pablo-rivas', x: 668, y: 330 },
      ],
      energyCells: [
        { x: 1100, y: 250 },
      ],
      exit: { type: 'edge' },
    },

    // ========== N3E3 — Puente de mando ==========
    {
      id: 'n3e3',
      name: 'Puente de mando',
      background: 'assets/scenes/nivel3_escena3.webp',
      spawn: { x: 80, y: 411 },
      solids: [
        { x1: 0, x2: 331, top: 411 },
        { x1: 643, x2: 1416, top: 405 },
        { x1: 1414, x2: 1492, top: 385 },
        { x1: 1498, x2: 1543, top: 347 },
        { x1: 1547, x2: 2172, top: 333 },
      ],
      fallingPlatforms: [
        { x: 437, y: 395, width: 100 },
      ],
      traps: [
        { type: 'decompression', x1: 250, x2: 720, top: 0, bottom: 724, pullX: 487 },
        { type: 'sweep-laser', x1: 1060, x2: 1400 },
      ],
      enemies: [
        { x: 850, y: 405, patrol: { x1: 700, x2: 1000 } },
        { x: 1200, y: 405, patrol: { x1: 1050, x2: 1380 } },
      ],
      energyCells: [
        { x: 1000, y: 365 },
      ],
      decorations: [
        { type: 'eyes', x: 1570, y: 65 },
        { type: 'eyes', x: 1640, y: 42 },
      ],
    },
  ],
};
