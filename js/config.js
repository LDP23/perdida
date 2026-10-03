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

// Energía del robot: se drena con el tiempo y al disparar/recibir daño.
export const BATTERY = Object.freeze({
  max: 100,
  drainPerSecond: 0.8,   // consumo pasivo: obliga a buscar celdas
  shotCost: 2,           // cada disparo gasta poco, pero suma
  hitCost: 15,           // los golpes duelen: esquivar > tanquear
  lowThreshold: 25,      // bajo este valor el HUD avisa al jugador
});

// Disparo: rayo horizontal que viaja recto (sin gravedad).
export const SHOOT = Object.freeze({
  cooldown: 0.3,         // evita ametrallar sin pensar
  speed: 720,
  width: 26,
  height: 6,
  maxDistance: 900,       // desaparece antes de llegar al borde de la escena
  // Desde el centro de la hitbox hacia donde mira (x) y desde el borde superior (y).
  muzzleOffset: { x: 40, y: 65 },
});

// Duraciones de las animaciones de retroalimentación al jugador.
export const PLAYER_FEEDBACK = Object.freeze({
  walkSpeedThreshold: 20, // vx mínimo para que la animación de caminar se active
  landDuration: 0.12,     // aplastamiento al aterrizar
  shootPoseDuration: 0.12,// retroceso del disparo
  hurtInvulnerability: 1, // parpadeo de invulnerabilidad
});

// Carteles de instrucciones que aparecen cerca del jugador.
export const TUTORIAL = Object.freeze({
  showDistance: 220,           // distancia en px para que aparezca el cartel
});

// Partida: 3 intentos. Se gastan al agotar la batería.
export const SESSION = Object.freeze({
  lives: 3,
});

// Puntuación por tipo de evento.
export const SCORE = Object.freeze({
  crewId: 500,                // cada ID de tripulante hallado
  energyCell: 50,             // cada celda de energía recogida
  enemy: 200,                 // cada enemigo destruido
  turret: 150,                // cada torreta destruida
  batteryBonusPerPoint: 10,   // batería sobrante al final del nivel
});

// Objetos recogibles del mundo.
export const PICKUP = Object.freeze({
  size: 48,                   // hitbox cuadrada
  energyCellRecharge: 30,     // batería que restaura una celda
  collectDuration: 0.45,      // tiempo que dura la animación antes de eliminar la vista
});

// Peligros: margen para que el punto seguro quede lejos del borde.
export const HAZARD = Object.freeze({
  safePointHazardMargin: 40,  // la hitbox inflada no debe tocar ningún hazard
});

// Tiempos de mensajes, carteles y paneles.
export const MESSAGES = Object.freeze({
  tutorialMinVisible: 2,      // segundos mínimos que un cartel permanece visible
  lingerAfterLeaving: 3,      // segundos que se mantiene si el robot se aleja
  readingCharsPerSecond: 15,  // velocidad de lectura para la duración de paneles
  readingMin: 5,              // duración mínima del panel en segundos
  readingMax: 12,             // duración máxima del panel en segundos
  closeDelay: 0.8,            // espera antes de permitir cerrar con Enter/E
  toastDuration: 3,           // duración del aviso breve en el HUD
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
  confirm: ['Enter', 'KeyE'], // cierra paneles de lectura (ID de tripulante)
  debug: ['Backquote', 'F2'],
  debugHurt: ['KeyH'],      // solo con depuración activa: prueba el parpadeo de daño
});

export const DEBUG = Object.freeze({
  enabledOnStart: false,
  rulerStep: 100,
  panelRefreshInterval: 0.1,
  fpsSmoothingTime: 0.5, // segundos: el contador de FPS no salta en cada frame
});
