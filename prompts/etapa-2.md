# Etapa 2 — Robot completo: batería, disparo, animaciones CSS y tutorial

Leé `CLAUDE.md` y después estos archivos completos antes de escribir código:
`js/config.js`, `js/core/game.js`, `js/physics/physics.js`, `js/entities/player.js`,
`js/states/playing-state.js`, `js/view/entity-view.js`, `js/view/debug-view.js`,
`js/levels/level1.js`, `css/entities.css`, `index.html`.

Trabajá en el orden de las tareas. No cambies el comportamiento de movimiento ni de salto que ya existe.

---

## Tarea 1 — Constantes nuevas en `js/config.js`

Agregá estos bloques (valores iniciales; comentá en cada uno el porqué):

```js
BATTERY = { max: 100, drainPerSecond: 0.8, shotCost: 2, hitCost: 15, lowThreshold: 25 }
SHOOT = { cooldown: 0.3, speed: 720, width: 26, height: 6, maxDistance: 900,
          muzzleOffset: { x: 40, y: 65 } }   // x: desde el centro de la hitbox hacia donde mira; y: desde el borde superior de la hitbox
PLAYER_FEEDBACK = { walkSpeedThreshold: 20, landDuration: 0.12, shootPoseDuration: 0.12, hurtInvulnerability: 1 }
TUTORIAL = { showDistance: 300 }
```

En `KEY_BINDINGS` agregá `debugHurt: ['KeyH']` (solo funciona con la depuración activa).

## Tarea 2 — Bus de eventos: `js/core/event-bus.js` (nuevo)

- Clase `EventBus` con `on(name, handler)` que **devuelve una función para desuscribirse**, `emit(name, payload)` y `clear()`.
- `Game` crea una instancia y la agrega al contexto como `events`. En `destroy()` llama `clear()`.
- Nombres de eventos en formato `entidad:acción`: `player:move`, `player:jump`, `player:double-jump`,
  `player:land`, `player:shoot`, `player:hurt`, `player:battery-empty`.
- Por qué: el tutorial, el HUD y la puntuación reaccionarán a lo que hace el robot sin que el robot los conozca.

## Tarea 3 — Batería: `js/entities/battery.js` (nuevo)

- Clase `Battery(max)`: getters `value`, `ratio` (0–1), `isEmpty`, `isLow` (usa `BATTERY.lowThreshold`).
- Métodos: `drain(amount)`, `spend(amount)` (devuelve `false` y no gasta si no alcanza), `recharge(amount)`, `refill()`.
- Todo valor queda limitado entre 0 y max con `clamp` de `math-utils.js`.
- Sin DOM y sin eventos: el `Player` decide qué emitir.

## Tarea 4 — Física: cuerpos sin gravedad en `js/physics/physics.js`

- `createBody` acepta `gravityScale` (por defecto 1) y la gravedad se multiplica por ese valor.
- El resultado para el robot debe quedar idéntico (gravityScale 1). Los disparos usan 0.

## Tarea 5 — Player: batería, disparo, daño y estados de animación (`js/entities/player.js`)

- El constructor recibe `(spawn, events)`. Crea `this.battery = new Battery(BATTERY.max)`.
- Emite eventos en los momentos exactos:
  - `player:move` cuando hay entrada horizontal.
  - `player:jump` en el salto desde el suelo o por coyote time.
  - `player:double-jump` en el salto aéreo.
  - `player:land` al pasar de aire a suelo.
- **Batería por tiempo**: `drain(drainPerSecond * dt)` en cada paso. Al llegar a 0, emite `player:battery-empty` una sola vez.
- **Disparo**: con `consumePress('shoot')`, si el enfriamiento terminó y `battery.spend(shotCost)` es true,
  emite `player:shoot` con `{ x, y, direction }` calculados desde `SHOOT.muzzleOffset` según `facing`.
- **Daño**: método público `takeHit(amount)`.
  - Si está invulnerable, no hace nada.
  - Si no, drena la batería, activa la invulnerabilidad (`hurtInvulnerability`) y emite `player:hurt`.
  - En la etapa 4 lo usarán los peligros.
- **Estado de animación**: getters de solo lectura `isWalking`, `isJumping` (vy < 0), `isFalling` (vy > 0 y no está en el suelo),
  `isLanding`, `isShooting`, `isHurt`. Los tres últimos se basan en temporizadores de `PLAYER_FEEDBACK`.
- Temporizadores: usá un único patrón de cuenta regresiva. No repitas la misma resta en cinco lugares:
  extraé una función o una pequeña clase `Timer` en `js/core/timer.js` si hace falta. Ese mismo timer lo usarán las trampas.
- Separá el trabajo en métodos privados cortos: `#updateBattery`, `#updateShoot`, `#updateTimers`, `#detectLanding`.

## Tarea 6 — Disparos

- `js/entities/projectile.js` (nuevo): clase `Projectile({ x, y, direction })`.
  - Usa `createBody` con `gravityScale: 0` y `stepBody`, centrado verticalmente en `y`.
  - Se marca `isDead` si toca cualquier sólido (cualquier contacto en true) o si recorrió `SHOOT.maxDistance`.
- `js/entities/entity-collection.js` (nuevo): clase `EntityCollection(layer, modifier)` que:
  - guarda pares `{ entity, view }` y crea el `EntityView` al agregar;
  - `update(fn)` recorre las entidades;
  - `sync(flagsFn)` sincroniza vistas;
  - elimina automáticamente las que tengan `isDead` (destruyendo su vista);
  - tiene `clear()`.
  - Esta misma clase se usará para enemigos y recolectables en la etapa 5: no la hagas específica de disparos.
- `PlayingState` se suscribe a `player:shoot` y agrega un `Projectile` a la colección.
- Vista del disparo en `css/entities.css` (`.entity--projectile`): rayo cian hecho con degradado y `box-shadow`, sin imágenes.
  Voltea con `is-facing-left`.

## Tarea 7 — Animaciones del robot con CSS

- `js/view/player-view.js` (nuevo): envuelve un `EntityView` y traduce el estado del `Player` a clases:
  `is-facing-left`, `is-walking`, `is-jumping`, `is-falling`, `is-landing`, `is-shooting`, `is-hurt`.
  Así `PlayingState` no arma la lista de clases.
- En `css/entities.css`, sobre `.entity--player .entity__sprite`:
  - `transform-origin: center bottom` para que estirar y aplastar mantenga los pies en el piso.
  - Caminar: balanceo con `translate` vertical de 2–3 px y `rotate` de ±2°, ciclo corto y continuo.
  - Saltar: estirar con `scale: 0.9 1.1`. Caer: `scale: 0.95 1.05`.
  - Aterrizar: aplastar con `scale: 1.2 0.8` volviendo a 1 (dura lo mismo que `landDuration`).
  - Disparar: retroceso con `translate: calc(var(--facing) * -4px) 0`.
  - Daño: parpadeo de opacidad con `steps()` mientras dure `is-hurt`, más un contorno rojo con otro `drop-shadow`.
  - Usá SOLO `translate`, `rotate` y `scale` individuales en las animaciones: el `transform` del sprite
    ya posiciona y voltea, y no debe cambiar.
  - Duraciones como variables CSS al inicio del bloque, no dispersas.
  - `@media (prefers-reduced-motion: reduce)`: sin balanceo, estirar/aplastar ni retroceso. El parpadeo de daño
    se mantiene (comunica invulnerabilidad), pero más lento.

## Tarea 8 — Tutorial (nivel 1, escena 1)

- **Datos** en `js/levels/level1.js`, dentro de la escena `n1e1`, un arreglo `tutorial` con 5 carteles:

  | id | x | y | teclado | táctil | texto | se descarta con |
  |---|---|---|---|---|---|---|
  | move | 150 | 390 | A / D | ◀ ▶ | Moverse | `player:move` |
  | jump | 480 | 390 | ESPACIO | SALTAR | Saltar | `player:jump` |
  | double-jump | 760 | 360 | ESPACIO en el aire | SALTAR en el aire | Doble salto | `player:double-jump` |
  | spikes | 930 | 390 | — | — | ¡Pinchos! Saltalos | pasar x > 1228 |
  | shoot | 1600 | 214 | J | DISPARAR | Disparar · La batería baja con el tiempo, recogé celdas | `player:shoot` |

  Formato sugerido: `{ id, x, y, keys: { keyboard, touch }, text, dismiss: { event } | { passX } }`.
  El `y` es el borde superior del cartel; ajustalo si tapa algo del fondo.

- **Lógica**: `js/ui/tutorial.js`, clase `Tutorial(signsData, events)`.
  - Cada cartel pasa por los estados `hidden → visible → dismissed`.
  - Se vuelve visible cuando el centro del robot está a menos de `TUTORIAL.showDistance` de su `x`.
  - Se descarta (para siempre) cuando ocurre su acción **mientras está visible**.
  - Guarda las funciones de desuscripción y las ejecuta en `dispose()`.
  - `update(playerBody)` evalúa distancias y `passX`.
- **Vista**: `js/view/tutorial-view.js`. Crea los carteles una vez en una nueva capa del mundo
  (`<div class="layer layer--tutorial" data-ref="tutorial">`, entre entidades y depuración) y solo alterna las clases `is-visible` / `is-dismissed`.
- **Teclado o táctil**: el cartel contiene los dos textos de tecla. `js/core/device.js` (nuevo) pone la clase `is-touch`
  en `.game` según `matchMedia('(pointer: coarse)')`, escucha cambios y devuelve una función para dejar de escuchar.
  El CSS muestra la etiqueta correcta. JS no elige textos.
- **Estilo**: `css/tutorial.css` (nuevo, enlazado en `index.html`).
  - Cartel pixel pequeño de una línea: fondo oscuro semitransparente, borde de 2 px en `--color-signal`,
    la tecla como una "tecla" con fondo cian y texto oscuro, texto en `--font-terminal`.
  - Aparece con opacidad + un desplazamiento vertical corto; desaparece con fundido.
  - Sin textos en mayúsculas forzadas por CSS: el texto se escribe tal cual en los datos.
- `level-loader.js` copia `tutorial` a la escena (arreglo vacío si no existe). `PlayingState` crea y destruye el tutorial con la escena.

## Tarea 9 — Integración en `PlayingState` y depuración

- Si la batería se agota: por ahora recargarla y volver al spawn, con un comentario `// Provisional: intentos en la etapa 5`.
  Suscribite a `player:battery-empty` para hacerlo.
- En `exit()`: limpiar colección de disparos, tutorial, suscripciones y vistas. Nada debe quedar duplicado al volver a entrar.
- Depuración:
  - reportar batería (valor y si está baja), número de disparos activos, invulnerabilidad y el estado de cada cartel del tutorial;
  - dibujar la zona de aparición de cada cartel con `track`/rect de tipo `trigger` (agregá el color en `debug.css`);
  - con la depuración activa, `H` llama `player.takeHit(BATTERY.hitCost)` para probar el parpadeo.

## Tarea 10 — Verificador de física: `tools/physics-check.html` + `tools/physics-check.js`

- Página que importa el `Player` real y lo simula con una entrada falsa (mantiene "derecha" y pulsa saltar en pasos elegidos),
  sobre un piso infinito. Antes de saltar, un paso para tocar el piso.
- Mide a tres tamaños de paso (1/120, 1/144, 1/30 repartido en subpasos de `LOOP.maxSubstep`):
  - salto simple;
  - mejor doble salto probando todos los momentos del segundo salto;
  - mejor doble salto terminando 70 px más arriba.
  - Sumá `coyoteTime * runSpeed`.
  - Un aterrizaje se detecta con `vy > 0 || isGrounded`.
- Muestra una tabla con ✅/❌ contra los requisitos de `CLAUDE.md`. Se abre con Live Server en `/tools/physics-check.html`.
- Los requisitos van como constantes con nombre en ese archivo (son datos de los niveles, no del motor).

---

## Restricciones

- No instales nada, no agregues `package.json` ni herramientas de build.
- No uses `<canvas>`, imágenes nuevas ni estilos en línea (salvo variables CSS de geometría).
- No modifiques `camera.js`, `game-loop.js` ni `input.js` salvo que sea imprescindible; si lo hacés, explicá por qué.
- Mantené todos los resultados de la tabla de física de `CLAUDE.md`.

## Al terminar

1. Actualizá `CLAUDE.md`: marcá la etapa 2 como hecha y agregá los archivos nuevos a la arquitectura.
2. Entregá el reporte en español:
   - archivos creados y modificados;
   - decisiones y su porqué;
   - resultado del verificador de física;
   - lista numerada de pruebas manuales que cubra: batería bajando, disparo y su costo, disparo sin batería suficiente,
     enfriamiento, cada animación, los 5 carteles apareciendo y desapareciendo, cambio de etiquetas en modo táctil
     (DevTools → modo dispositivo), `H` en depuración y que no haya errores en consola.
