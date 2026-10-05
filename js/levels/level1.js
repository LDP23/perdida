/**
 * @module level1
 *
 * Datos del Nivel 1 — Bahía de carga. SOLO datos: agregar o corregir una escena
 * no toca el motor. Coordenadas en píxeles de la imagen (2172 × 724). Se usa la
 * misma notación del documento de diseño (x1–x2 y borde superior "top") para copiar
 * las medidas tal cual.
 *
 * Convenciones de los datos:
 * - "bottom" es opcional: si no se indica, el sólido llega hasta el fondo (724).
 * - "spawn" es el punto donde quedan los PIES del robot (centro inferior).
 * - "enemies[].x/y": posición de los pies de la criatura.
 * - "enemies[].patrol": límites horizontales de la patrulla.
 * - "exit.type = 'edge'": el robot sale por el borde derecho.
 * - "exit.type = 'door'": zona rectangular de la puerta.
 *
 * Usado por: levels.js (lo agrega al array LEVELS).
 * Depende de: nada (datos puros).
 */

export const LEVEL_1 = {
  id: 1,
  name: 'Bahía de carga',
  scenes: [
    {
      id: 'n1e1',
      name: 'Muelle de llegada',
      background: 'assets/scenes/nivel1_escena1.webp',
      spawn: { x: 190, y: 564 },
      solids: [
        { x1: 0, x2: 1000, top: 564 },      // piso de llegada
        { x1: 573, x2: 660, top: 499 },     // caja simple
        { x1: 853, x2: 940, top: 439 },     // pila de dos cajas
        { x1: 1000, x2: 1228, top: 590 },   // fondo del foso (los pinchos llegan en la etapa 4)
        { x1: 1228, x2: 1510, top: 564 },   // piso tras los pinchos
        { x1: 1285, x2: 1370, top: 488 },   // caja escalón baja
        { x1: 1373, x2: 1460, top: 412 },   // caja escalón alta
        { x1: 1510, x2: 2172, top: 388 },   // plataforma elevada
      ],
      hazards: [
        // top 6 px bajo el piso (564): pararse en el borde no daña, solo caer al foso.
        { x1: 1000, x2: 1228, top: 570, bottom: 590, type: 'spikes' },
      ],
      crewIds: [
        { crewId: 'lucia-ferrer', x: 896, y: 400 },
      ],
      energyCells: [
        { x: 1640, y: 350 },
      ],
      trainingDummies: [
        { x: 400, y: 564 },
      ],
      tutorial: [
        { id: 'move',        x: 150,  y: 390, keys: { keyboard: 'A / D',              touch: '◀ ▶' },          text: 'Moverse',                                                                       dismiss: { event: 'player:move' } },
        { id: 'shoot',       x: 400,  y: 360, keys: { keyboard: 'J',                   touch: 'DISPARAR' },              text: 'Disparale al maniquí',                                                     dismiss: { event: 'player:shoot' } },
        { id: 'jump',        x: 500,  y: 390, keys: { keyboard: 'ESPACIO',             touch: 'SALTAR' },                text: 'Saltar',                                                                        dismiss: { event: 'player:jump' } },
        { id: 'double-jump', x: 760,  y: 360, keys: { keyboard: 'ESPACIO en el aire',  touch: 'SALTAR en el aire' },     text: 'Doble salto',                                                                   dismiss: { event: 'player:double-jump' } },
        { id: 'spikes',      x: 930,  y: 390, keys: { keyboard: null,                  touch: null },                    text: '¡Púas! Saltalas',                                                     dismiss: { passX: 1228 } },
        { id: 'cell',        x: 1640, y: 214, keys: { keyboard: null,                  touch: null },                    text: 'Celda de energía: la batería baja con el tiempo y con cada disparo',   dismiss: { event: 'pickup:energy-cell' } },
      ],
      exit: { type: 'edge' },
    },

    {
      id: 'n1e2',
      name: 'Bodega de contenedores',
      background: 'assets/scenes/nivel1_escena2.webp',
      spawn: { x: 60, y: 378 },
      solids: [
        { x1: 0,    x2: 222,  top: 378 },   // piso de entrada
        { x1: 228,  x2: 347,  top: 398 },   // contenedor bajo
        { x1: 352,  x2: 463,  top: 484 },   // contenedor aún más bajo
        { x1: 470,  x2: 599,  top: 452 },   // contenedor medio
        { x1: 606,  x2: 740,  top: 394 },   // contenedor alto
        { x1: 748,  x2: 892,  top: 333 },   // pila más alta
        { x1: 1320, x2: 1762, top: 395 },   // piso tras el foso
        { x1: 1768, x2: 1890, top: 420 },   // contenedor descendente 1
        { x1: 1895, x2: 1972, top: 488 },   // contenedor descendente 2
        { x1: 1975, x2: 2172, top: 546 },   // piso de salida
      ],
      hazards: [
        // Púas en el fondo del foso; puntas en 586, +6 px de margen
        { x1: 900, x2: 1296, top: 592, bottom: 724, type: 'spikes' },
      ],
      movingPlatforms: [
        { from: { x: 905, y: 440 }, to: { x: 1175, y: 440 }, width: 120 },
      ],
      crewIds: [
        { crewId: 'tomas-arce', x: 820, y: 290 },
      ],
      energyCells: [
        { x: 1100, y: 395 },
      ],
      traps: [
        // Prensa sobre el contenedor largo (1320–1762). El bloque descansa arriba
        // y baja de golpe hasta la superficie (395). restBottom deja 125 px libres
        // (robot = 112 + 10 de margen).
        { type: 'press', x1: 1480, x2: 1600, ceiling: 100, restBottom: 270, bottom: 395 },
      ],
      exit: { type: 'edge' },
    },

    {
      id: 'n1e3',
      name: 'Zona de cuarentena',
      background: 'assets/scenes/nivel1_escena3.webp',
      spawn: { x: 60, y: 519 },
      solids: [
        { x1: 0,    x2: 742,  top: 519 },   // piso izquierdo
        { x1: 350,  x2: 422,  top: 462 },   // caja baja
        { x1: 428,  x2: 497,  top: 418 },   // caja alta
        { x1: 518,  x2: 932,  top: 378 },   // pasarela izquierda
        { x1: 1222, x2: 1618, top: 378 },   // pasarela derecha
        { x1: 1655, x2: 1768, top: 366 },   // escalón bajo
        { x1: 1780, x2: 1890, top: 310 },   // escalón alto
        { x1: 1922, x2: 2172, top: 269 },   // plataforma de la puerta
        { x1: 1410, x2: 2172, top: 588 },   // piso inferior derecho
      ],
      hazards: [
        // Púas bajo los escalones; puntas en 545 + 6 px de margen
        { x1: 1622, x2: 1922, top: 551, bottom: 588, type: 'spikes' },
      ],
      decorations: [
        { type: 'pit-shadow', x1: 935, x2: 1218, top: 420 },
      ],
      fallingPlatforms: [
        { x: 985,  y: 395, width: 80 },
        { x: 1105, y: 395, width: 80 },
      ],
      enemies: [
        { x: 760, y: 378, patrol: { x1: 560, x2: 900 } },
      ],
      crewIds: [
        // Sobre la caja verde rota del piso izquierdo
        { crewId: 'ingrid-solano', x: 150, y: 420 },
      ],
      energyCells: [
        { x: 1300, y: 340 },
      ],
      traps: [
        // Láser sobre la pasarela derecha (1222–1618). El emisor está arriba,
        // el rayo impacta en la superficie (378).
        { type: 'laser', x: 1400, top: 120, bottom: 378 },
      ],
      exit: { type: 'door', x1: 1985, x2: 2150, top: 109, bottom: 269 },
    },
  ],
};
