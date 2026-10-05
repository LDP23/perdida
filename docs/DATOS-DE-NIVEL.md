# Formato de datos de nivel

## Principio

Los niveles son solo datos. Agregar o cambiar una escena no toca el motor.
`level-loader.js` traduce las medidas de diseño a rectángulos del motor.

## Estructura de un nivel

```javascript
export const LEVEL_N = {
  id: 1,                    // número del nivel
  name: 'Nombre del nivel', // texto para el HUD
  scenes: [ /* array de escenas */ ],
};
```

## Estructura de una escena

```javascript
{
  id: 'n1e1',                    // identificador único
  name: 'Nombre de la escena',
  background: 'assets/scenes/imagen.webp',  // fondo 2172×724
  spawn: { x: 190, y: 564 },    // pies del robot (centro inferior)

  // Sólidos: plataformas y pisos (se convierten a rectángulos)
  solids: [
    { x1: 0, x2: 1000, top: 564 },           // bottom omitido = 724
    { x1: 100, x2: 300, top: 400, bottom: 450 }, // con bottom explícito
  ],

  // Zonas de daño
  hazards: [
    { x1: 1000, x2: 1228, top: 570, bottom: 590, type: 'spikes' },
  ],

  // IDs de tripulante (coleccionables que cuentan para la historia)
  crewIds: [
    { crewId: 'lucia-ferrer', x: 896, y: 400 },
  ],

  // Celdas de energía (recargan batería)
  energyCells: [
    { x: 1640, y: 350 },
  ],

  // Maniquíes de práctica (blanco de tiro)
  trainingDummies: [
    { x: 400, y: 564 },
  ],

  // Enemigos: x/y son los pies; patrol son los límites de patrulla
  enemies: [
    { x: 760, y: 378, patrol: { x1: 560, x2: 900 } },
  ],

  // Plataformas móviles: se mueven entre from y to
  movingPlatforms: [
    { from: { x: 905, y: 440 }, to: { x: 1175, y: 440 }, width: 120 },
  ],

  // Plataformas que caen al pisarlas
  fallingPlatforms: [
    { x: 985, y: 395, width: 80 },
  ],

  // Decoraciones (solo visual, sin colisión)
  decorations: [
    { type: 'pit-shadow', x1: 935, x2: 1218, top: 420 },
  ],

  // Tutorial: carteles que aparecen cerca del robot
  tutorial: [
    { id: 'move', x: 150, y: 390,
      keys: { keyboard: 'A / D', touch: '◀ ▶' },
      text: 'Moverse',
      dismiss: { event: 'player:move' } },
  ],

  // Trampas del escenario (exponen dangerRects al hazard-system)
  traps: [
    // Prensa: ceiling=soporte, restBottom=bloque arriba, bottom=bloque abajo
    { type: 'press', x1: 1480, x2: 1600, ceiling: 100, restBottom: 270, bottom: 395 },
    // Láser: x=centro del rayo, top=emisor, bottom=impacto
    { type: 'laser', x: 1400, top: 120, bottom: 378 },
    // phaseOffset opcional (segundos) para desfasar trampas iguales cercanas
  ],

  // Salida: por el borde derecho o por una puerta
  exit: { type: 'edge' },
  // o: exit: { type: 'door', x1: 1985, x2: 2150, top: 109, bottom: 269 },
}
```

## Coordenadas

```mermaid
graph LR
    A["(0, 0)"] -->|"x crece →"| B["(2172, 0)"]
    A -->|"y crece ↓"| C["(0, 724)"]
```

- Origen: esquina superior izquierda de la imagen.
- Unidades: píxeles de la imagen de escena (2172 × 724).
- `top`: borde superior del sólido/hazard.
- `bottom`: borde inferior (omitido = 724, el fondo).
- `spawn.x/y`: posición de los pies del robot (centro inferior).

## Cómo agregar un nivel

1. Crear `js/levels/level2.js` con los datos de las escenas.
2. Importarlo en `js/levels/levels.js` y agregarlo al array `LEVELS`.
3. No tocar ningún otro archivo.
