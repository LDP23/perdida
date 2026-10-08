/**
 * @module level2
 *
 * Datos del Nivel 2 — Laboratorio. SOLO datos: agregar o corregir una escena
 * no toca el motor. Coordenadas en píxeles de la imagen (2172 × 724).
 *
 * Usado por: levels.js (lo agrega al array LEVELS).
 * Depende de: nada (datos puros).
 */

export const LEVEL_2 = {
  id: 2,
  name: 'Laboratorio',
  theme: 'lab',
  story: {
    title: 'Nivel 2 · Laboratorio',
    lines: [
      'La señal se hace más fuerte.',
      'Las puertas del laboratorio fueron forzadas desde adentro.',
      'Un rastro verde cruza el pasillo.',
    ],
  },
  scenes: [
    {
      id: 'n2e1',
      name: 'Entrada y descontaminación',
      background: 'assets/scenes/nivel2_escena1.webp',
      spawn: { x: 80, y: 502 },
      solids: [
        { x1: 0, x2: 345, top: 502 },
        { x1: 578, x2: 1385, top: 502 },
        { x1: 1085, x2: 1195, top: 432 },
        { x1: 1195, x2: 1255, top: 395 },
        { x1: 1255, x2: 1370, top: 364 },
        { x1: 1385, x2: 1780, top: 364 },
        { x1: 1400, x2: 1500, top: 305 },
        { x1: 1555, x2: 1695, top: 280 },
        { x1: 1765, x2: 2172, top: 502 },
        { x1: 1785, x2: 1925, top: 422 },
      ],
      hazards: [
        { x1: 345, x2: 578, top: 522, bottom: 724, type: 'acid' },
      ],
      traps: [
        { type: 'laser', x: 800 },
        { type: 'laser', x: 960, phaseOffset: 1.2 },
      ],
      enemies: [
        { x: 850, y: 502, patrol: { x1: 620, x2: 1070 }, dropsCrewId: 'marco-ibarra' },
      ],
      energyCells: [
        { x: 1625, y: 240 },
      ],
      exit: { type: 'edge' },
    },

    {
      id: 'n2e2',
      name: 'Sala de tanques inundada',
      background: 'assets/scenes/nivel2_escena2.webp',
      spawn: { x: 80, y: 498 },
      solids: [
        { x1: 0, x2: 285, top: 498 },
        { x1: 405, x2: 505, top: 497 },
        { x1: 619, x2: 717, top: 458 },
        { x1: 830, x2: 932, top: 497 },
        { x1: 1245, x2: 1785, top: 373 },
        { x1: 1785, x2: 1850, top: 418 },
        { x1: 1850, x2: 1905, top: 461 },
        { x1: 1905, x2: 2172, top: 498 },
      ],
      hazards: [
        { x1: 285, x2: 1765, top: 576, bottom: 724, type: 'acid' },
      ],
      decorations: [
        { type: 'opening-door', x1: 0, x2: 80, top: 340, bottom: 498 },
      ],
      traps: [
        { type: 'acid-drip', x: 668, top: 265, bottom: 458 },
      ],
      movingPlatforms: [
        { from: { x: 960, y: 470 }, to: { x: 1131, y: 400 }, width: 110 },
      ],
      enemies: [
        { x: 1500, y: 373, patrol: { x1: 1290, x2: 1740 } },
      ],
      crewIds: [
        { crewId: 'elena-ruiz', x: 668, y: 420 },
      ],
      energyCells: [
        { x: 1100, y: 380 },
      ],
      exit: { type: 'edge' },
    },

    {
      id: 'n2e3',
      name: 'Núcleo de contención',
      background: 'assets/scenes/nivel2_escena3.webp',
      spawn: { x: 80, y: 509 },
      solids: [
        { x1: 0, x2: 465, top: 509 },
        { x1: 553, x2: 650, top: 522 },
        { x1: 750, x2: 840, top: 466 },
        { x1: 945, x2: 1035, top: 417 },
        { x1: 1122, x2: 1595, top: 390 },
        { x1: 1845, x2: 2172, top: 320 },
      ],
      hazards: [
        { x1: 465, x2: 1938, top: 612, bottom: 724, type: 'acid' },
      ],
      traps: [
        { type: 'laser', x: 990 },
      ],
      movingPlatforms: [
        { from: { x: 1620, y: 360 }, to: { x: 1741, y: 360 }, width: 100 },
      ],
      enemies: [
        { x: 1260, y: 390, patrol: { x1: 1160, x2: 1360 }, dropsCrewId: 'samuel-okoro' },
        { x: 1470, y: 390, patrol: { x1: 1380, x2: 1560 } },
      ],
      energyCells: [
        { x: 795, y: 430 },
      ],
      exit: { type: 'door', x1: 1980, x2: 2145, top: 160, bottom: 320 },
    },
  ],
};
