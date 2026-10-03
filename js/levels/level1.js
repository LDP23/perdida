// Nivel 1: Bahía de carga. SOLO datos: agregar o corregir una escena no toca el motor.
// Coordenadas en píxeles de la imagen (2172 × 724). Se usa la misma notación del
// documento de diseño (x1–x2 y borde superior "top") para copiar las medidas tal cual.
// "bottom" es opcional: si no se indica, el sólido llega hasta el fondo de la imagen.
// "spawn" es el punto donde quedan los PIES del robot (centro inferior).

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
        { crewId: 'lucia-ferrer', x: 896, y: 400 },  // encima de la pila de dos cajas; premia el doble salto
      ],
      energyCells: [
        { x: 1640, y: 350 },  // en la plataforma elevada
      ],
      trainingDummies: [
        { x: 400, y: 564 },  // pies sobre el piso de llegada
      ],
      tutorial: [
        { id: 'move',        x: 150,  y: 390, keys: { keyboard: 'A / D',              touch: '◀ ▶' },          text: 'Moverse',                                                                       dismiss: { event: 'player:move' } },
        { id: 'shoot',       x: 400,  y: 360, keys: { keyboard: 'J',                   touch: 'DISPARAR' },              text: 'Disparale al maniquí',                                                     dismiss: { event: 'player:shoot' } },
        { id: 'jump',        x: 500,  y: 390, keys: { keyboard: 'ESPACIO',             touch: 'SALTAR' },                text: 'Saltar',                                                                        dismiss: { event: 'player:jump' } },
        { id: 'double-jump', x: 760,  y: 360, keys: { keyboard: 'ESPACIO en el aire',  touch: 'SALTAR en el aire' },     text: 'Doble salto',                                                                   dismiss: { event: 'player:double-jump' } },
        { id: 'spikes',      x: 930,  y: 390, keys: { keyboard: null,                  touch: null },                    text: '¡Púas! Saltalas',                                                     dismiss: { passX: 1228 } },
        { id: 'cell',        x: 1640, y: 214, keys: { keyboard: null,                  touch: null },                    text: 'Celda de energía: la batería baja con el tiempo y con cada disparo',   dismiss: { event: 'pickup:energy-cell' } },
      ],
    },
  ],
};
