// Configuración central. Si un número afecta cómo se juega, vive aquí y en ningún otro lado.
// Unidades: píxeles del mundo (los de la imagen de la escena) y segundos.

export const WORLD = Object.freeze({
  width: 2172,
  height: 724,
});

export const LOOP = Object.freeze({
  // Si la pestaña estuvo oculta, el siguiente frame traería segundos de retraso:
  // lo limitamos para que el robot no "teletransporte" a través del piso.
  maxFrameDelta: 0.1,
  // Cada frame se divide en pasos de como máximo este tamaño. Con la caída máxima
  // (1100 px/s) el robot avanza ~9 px por paso: no atraviesa plataformas delgadas.
  maxSubstep: 1 / 120,
});

export const PHYSICS = Object.freeze({
  gravity: 3600,
  maxFallSpeed: 1100,
});

// Los saltos se definen por ALTURA (fácil de medir en la imagen) y la velocidad
// inicial se calcula en physics.js. Valores verificados con simulación, hitbox de 48 px:
//   salto simple:  ~114 px horizontales · sube 100 px (escalones de hasta 76 px)
//   doble salto:   ~200 px (215 con coyote time)
//   pinchos N1E1 (228) y ácido N2E1 (233) necesitan 180-185 px  -> se cruzan
//   foso N1E3 (290) necesita 242 px                              -> imposible
//   hueco N2E3 (250 con subida de 70) necesita 202 px, se logran ~186 -> imposible
export const PLAYER = Object.freeze({
  width: 48,
  height: 112,
  runSpeed: 245,
  groundAcceleration: 2600,
  groundDeceleration: 3200,
  airAcceleration: 1800,
  jumpHeight: 100,
  doubleJumpHeight: 55,
  maxJumps: 2,
  // Margen para saltar justo después de salir del borde (se siente justo, no "robado").
  coyoteTime: 0.06,
  // Si el jugador pulsa saltar un poco antes de tocar el piso, el salto igual ocurre.
  jumpBufferTime: 0.1,
});

export const CAMERA = Object.freeze({
  // Posición horizontal del robot en pantalla (0 = borde izquierdo, 1 = derecho).
  // Menos de 0.5 porque el juego avanza hacia la derecha: se ve más de lo que viene.
  anchor: 0.38,
  // Qué tan rápido alcanza la cámara al robot (mayor = más rígida).
  followSharpness: 7,
});

export const SCENE = Object.freeze({
  // Paredes invisibles en los bordes; gruesas para que nada las atraviese.
  wallThickness: 64,
  // Distancia bajo el borde inferior a partir de la cual el robot se considera caído.
  fallMargin: 80,
});

// event.code identifica la tecla física: funciona igual con teclado en español o inglés.
export const KEY_BINDINGS = Object.freeze({
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space', 'KeyW', 'ArrowUp'],
  shoot: ['KeyJ'],
  debug: ['Backquote', 'F2'],
});

export const DEBUG = Object.freeze({
  enabledOnStart: false,
  rulerStep: 100,
  panelRefreshInterval: 0.1,
  fpsSmoothingTime: 0.5, // segundos: el contador de FPS no salta en cada frame
});
