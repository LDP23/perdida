# Etapa 5 — Nivel 1 completo: escenas, transiciones, puerta de salida y plataformas

Prerrequisito: etapa 4 terminada y la revisión de sprites (hitbox entre 40 y 54 px, verificador en ✅) aplicada.

Leé `CLAUDE.md` y estos archivos completos antes de escribir código:
`js/levels/level1.js`, `js/levels/level-loader.js`, `js/states/playing-state.js`, `js/core/session.js`,
`js/physics/physics.js`, `js/physics/collision.js`, `js/entities/safe-point.js`, `js/entities/entity-collection.js`,
`js/core/timer.js`, `js/view/debug-view.js`, `js/config.js`, `css/entities.css`.

Mirá también las imágenes `assets/scenes/nivel1_escena2.webp` y `nivel1_escena3.webp` para comparar los datos con el dibujo.

## Prohibido en esta etapa

- No crees trampas (prensa, láser) ni enemigos: son las etapas 6 y 7.
- No dejes datos "para después" de esos elementos.
- No modifiques las constantes de PLAYER ni de PHYSICS.
- No instales nada.

---

## Tarea 1 — Registro de niveles y progreso

- **`js/levels/levels.js`** (nuevo): `export const LEVELS = [LEVEL_1]`. Es el único lugar que conoce todos los niveles.
- **Cada nivel** declara `id`, `name` y `scenes` (ya existe).
- **`PlayingState`**:
  - toma la escena con `session.levelIndex` y `session.sceneIndex`;
  - el HUD toma el nombre del nivel de los datos, no de un texto fijo.
- **Precarga**: mientras se juega una escena, precargá en segundo plano la imagen de la siguiente con `loadImage`.
  Así el cambio de escena no muestra una pantalla negra.

## Tarea 2 — Datos de las escenas 2 y 3 del nivel 1 (`js/levels/level1.js`)

Copiá estos datos. Son aproximados: compará cada sólido con la imagen. Si alguno no coincide por más de ~10 px,
corregilo y anotá en el reporte qué cambiaste y por qué.

Las pasarelas elevadas que tienen espacio vacío debajo en el dibujo llevan `bottom` (su grosor visible).
Las demás bajan hasta el fondo.

### N1E2 — Bodega de contenedores

- **id**: `n1e2`.
- **Spawn**: `{ x: 60, y: 378 }`.
- **Sólidos**:
  - `0–222` top `378`
  - `228–347` top `398`
  - `352–463` top `484`
  - `470–599` top `452`
  - `606–740` top `394`
  - `748–892` top `333`
  - `1320–1762` top `395`
  - `1768–1890` top `420`
  - `1895–1972` top `488`
  - `1975–2172` top `546`
- **Peligro**: hueco con púas `900–1296`, top `592`, `type: 'spikes'`. Las puntas están en 586; se agregan 6 px de margen, igual que en N1E1.
- **Plataforma móvil horizontal**: ancho 120, top 440, recorre de x 905 a x 1295 (borde izquierdo de 905 a 1175).
- **ID**: `tomas-arce` en `{ x: 820, y: 290 }` (sobre el contenedor más alto).
- **Celda**: `{ x: 1100, y: 395 }`. Queda sobre el recorrido de la plataforma, para recogerla viajando en ella.
- **Salida**: `{ type: 'edge' }`.

### N1E3 — Zona de cuarentena

- **id**: `n1e3`.
- **Spawn**: `{ x: 60, y: 519 }`.
- **Sólidos**:
  - piso `0–742` top `519`
  - cajas `350–422` top `462` y `428–497` top `418`
  - pasarela `518–932` top `378`
  - pasarela `1222–1618` top `378`
  - escalones `1655–1768` top `366` y `1780–1890` top `310`
  - plataforma de salida `1922–2172` top `269`
  - piso inferior `1410–2172` top `588`
- **Peligros**:
  - Púas `1622–1922`, top `551` (puntas en 545 + margen) y bottom `588`.
  - El foso `935–1218` no tiene fondo: caer debajo de la escena ya cuenta como peligro.
- **Oscurecer el foso**: un `<div>` decorativo con degradado CSS de transparente a `--color-void`, dentro de la escena.
  Va en los datos como `decorations: [{ type: 'pit-shadow', x1: 935, x2: 1218, top: 420 }]`.
- **Plataformas que caen**: ancho 80, top 395, en x 985 y x 1105 (borde izquierdo).
- **ID**: `ingrid-solano`, sobre la caja verde rota del piso izquierdo. Buscá su posición en la imagen.
- **Celda**: `{ x: 1300, y: 340 }`.
- **Salida**: `{ type: 'door', x1: 1985, x2: 2150, top: 109, bottom: 269 }`.

## Tarea 3 — Cambio de escena por el borde derecho

- **`level-loader.js`**: solo crea la pared derecha si la salida NO es `edge`.
- **Cuando el centro del robot pasa el ancho de la escena**:
  1. Se congela la jugabilidad.
  2. Fundido a negro corto, con CSS (clase en `.game`).
  3. `session.sceneIndex++`.
  4. Se carga la siguiente escena con el mismo camino de carga de siempre.
  5. El robot aparece en el `spawn`, conservando la batería.
  6. El punto seguro se reinicia al spawn.
  7. Se vuelve del negro.
- **Duraciones**: en `config.js` como `TRANSITION.fadeOut` y `fadeIn`. Se escriben una vez como variables CSS, igual que `--collect-duration`.
- **No se puede volver** a la escena anterior: la pared izquierda sigue existiendo.
- **Al salir de la escena**, se limpian todas sus entidades, vistas y suscripciones. Comprobalo con `listenerCount` en el panel de depuración.

## Tarea 4 — Puerta de salida y fin de nivel

- **Activación**: cuando la hitbox del robot toca la zona de la puerta estando en el suelo, se completa el nivel.
  Dibujá la zona en depuración (`kind: 'trigger'`).
- **Bono**: `Math.round(battery.value) * SCORE.batteryBonusPerPoint` se suma a la sesión.
- **Pantalla superpuesta** (estado `level-complete`, con `push`): muestra "Nivel 1 completado · Bahía de carga", el bono
  de batería, "IDs de este nivel: x/3" y los puntos.
  - Botón Continuar, con foco al abrir.
  - Mismo estilo que la pausa; reutilizá las clases existentes.
- **Al continuar**:
  - si existe un nivel siguiente, `levelIndex++` y `sceneIndex = 0`;
  - si no existe (por ahora), guardar el récord y volver al menú, con el comentario
    `// Provisional: niveles 2 y 3 en la etapa 9`.

## Tarea 5 — Reinicio de nivel coherente

El diseño dice: "si la batería llega a 0, se reinicia el nivel y se pierde un intento".

- **Instantánea al empezar cada nivel**: `GameSession` guarda `score` y `foundCrewIds` (`snapshotLevelStart()`) y los
  repone con `restoreLevelStart()`.
- **Batería en 0** (después de la animación de muerte):
  - `loseLife()`;
  - restaurar la instantánea;
  - volver a la escena 1 del nivel actual.
- **"Reiniciar nivel" desde la pausa**: lo mismo, pero sin perder intento.
- **Por qué**: evita sumar puntos infinitos recogiendo la misma celda una y otra vez tras reiniciar. Además cumple el texto
  de confirmación "se pierde el progreso del nivel": los IDs encontrados en ese intento vuelven a aparecer.

## Tarea 6 — Sólidos que se mueven (física)

En `js/physics/physics.js`:

- Cuando un cuerpo aterriza sobre un sólido, guardá la referencia en `body.groundSolid`, o `null` si no hay contacto.
- **Orden de actualización por paso**:
  1. Mover las plataformas.
  2. Desplazar a cada cuerpo cuyo `groundSolid` sea una plataforma, con el mismo `dx/dy` que ella movió en ese paso,
     resolviendo colisiones como cualquier movimiento.
  3. Paso normal del robot.
- **Si una plataforma, al moverse, queda superpuesta con el robot**: empujarlo hacia afuera por el lado de menor
  penetración. Si eso lo mete en otro sólido (aplastado), aplicá la regla de peligro.
- Las funciones nuevas reutilizan `rectsOverlap` y el mismo `moveAxis`. Nada de una segunda resolución de colisiones.

## Tarea 7 — Plataformas

- **Clase base**: `js/entities/platform.js` con lo común (rectángulo, desplazamiento del último paso `dx/dy`, `kind: 'solid'`).
  Dos clases hijas:
  - **`MovingPlatform`** (`moving-platform.js`): va y vuelve entre `from` y `to`, a `PLATFORMS.moving.speed`, con una pausa
    de `PLATFORMS.moving.endPause` en cada extremo. Debe servir también para la diagonal del nivel 2: la posición se
    interpola entre dos puntos.
  - **`FallingPlatform`** (`falling-platform.js`). Ciclo:
    `idle → shaking` (al pisarla, dura `PLATFORMS.falling.shakeTime`)
    `→ falling` (cae con gravedad y deja de ser sólida para el robot apenas empieza a caer)
    `→ hidden` (fuera de la escena)
    `→ respawning` (tras `PLATFORMS.falling.respawnTime`, reaparece con un fundido)
    `→ idle`.
    No reaparece si el robot está ocupando su lugar: espera a que se libere.
- **Valores iniciales en `config.js`**:
  ```js
  PLATFORMS = {
    thickness: 20,
    moving: { speed: 90, endPause: 0.6 },
    falling: { shakeTime: 0.5, respawnTime: 3, fallGravityScale: 1 },
  }
  ```
- **Datos**:
  - `movingPlatforms: [{ from: {x, y}, to: {x, y}, width }]`.
  - `fallingPlatforms: [{ x, y, width }]`.
  - En `y` va el borde superior.
- **Vistas (CSS, sin imágenes), en `css/platforms.css` (nuevo)**:
  - **Móvil**: placa metálica oscura con franja de advertencia ámbar (`repeating-linear-gradient`) y un resplandor de
    propulsor cian debajo que pulsa.
  - **Que cae**: placa con grietas sugeridas y un borde rojo.
    - `is-shaking`: temblor rápido con `translate` y una luz roja intermitente (el aviso antes de caer).
    - `is-respawning`: fundido de entrada.
- **Depuración**: dibujá el recorrido de cada plataforma móvil como una línea discontinua entre `from` y `to`.

## Tarea 8 — Verificación de recorrido

- **Recorrido**: escribí en el reporte cómo se cruza cada escena, con las distancias horizontales y verticales de cada salto
  usando los valores del verificador de física. Confirmá que:
  - N1E2: el hueco de púas no se cruza sin la plataforma móvil.
  - N1E3: el foso no se cruza sin las plataformas que caen.
  - Cada escalón se sube con salto simple.
- **Si algo es imposible, o demasiado fácil**: proponé el ajuste en los DATOS de la escena, nunca en la física.

---

## Al terminar

1. Actualizá `CLAUDE.md`:
   - etapa 5 ✅;
   - nueva numeración:
     - 5 Nivel 1 completo y plataformas ✅
     - 6 Trampas
     - 7 Enemigos
     - 8 Táctil y responsive
     - 9 Niveles 2 y 3, victoria y pulido;
   - formato de datos de escena (todas las claves);
   - orden de actualización de las plataformas.
2. Reporte en español:
   - archivos creados y modificados;
   - correcciones de datos frente a las imágenes;
   - el recorrido de la Tarea 8;
   - lista numerada de pruebas que cubra:
     - recorrer N1E1 → N1E2 → N1E3 → puerta;
     - fundidos sin pantalla negra prolongada;
     - viajar sobre la plataforma móvil y saltar desde ella;
     - quedar en el camino de la plataforma;
     - plataformas que caen: aviso, caída y reaparición, sin reaparecer encima del robot;
     - recoger la celda en movimiento;
     - perder un intento en N1E3 y volver a N1E1 con puntos e IDs restaurados;
     - "Reiniciar nivel" sin perder intento;
     - pantalla de nivel completado y su bono;
     - `listenerCount` estable después de cambiar de escena varias veces;
     - consola sin errores.
