# Señal Perdida — guía del proyecto para Claude Code

Juego de plataformas 2D en pixel art, proyecto universitario (UJCV) en equipo:
Jafet Antonio Sevilla Ayala, Roy David Urtecho, Luis David Palomo.
Solo HTML, CSS y JavaScript puro: sin frameworks, sin librerías, sin `<canvas>`, sin build, sin npm.

## Cómo se trabaja

- Por etapas. Cada etapa llega en un prompt; hacé solo lo que pide esa etapa.
- Antes de editar un archivo, leelo completo. No reescribas módulos que funcionan: extendelos.
- Explicaciones al usuario en español, paso a paso y con el PORQUÉ de cada decisión.
- Al terminar cada etapa, entregá: (1) archivos creados/modificados con una línea sobre cada uno,
  (2) decisiones tomadas y por qué, (3) lista numerada de qué probar en el navegador.
- No hagas commits de git salvo que te lo pidan.
- El juego se prueba con Live Server (módulos ES no funcionan con `file://`).

## Estado de las etapas

1. ✅ Motor: bucle, entrada, física, colisiones, cámara, depuración (N1E1). Incluye doble salto, coyote time y buffer de salto.
2. ✅ Robot completo: batería, disparo, animaciones CSS, tutorial.
3. ✅ Sistemas de juego en N1E1: sesión (vidas, puntos), peligros, punto seguro, coleccionables (celdas + IDs), maniquí de práctica, HUD, panel de bitácoras, tutorial secuencial con tiempos.
4. ✅ Pantallas y menús: inicio, pausa, opciones, cómo jugar, créditos, game over, apagado. Máquina de estados con pila (push/pop), preferencias con localStorage, récord.
4.1. ✅ Sprites nuevos (robot.png 3×3 hoja, espantapajaros.png), sistema de animaciones por frames CSS, estados de muerte/respawn/knockback, sacudida de pantalla, limpieza total de robo.webp.
4.2. ✅ Tira de correr dedicada (robot_correr.png), espantapájaros alineado al piso, doble salto sin giro (frames 4/5), aura roja de daño.
5. ✅ Nivel 1 completo y plataformas: 3 escenas, transiciones por borde, puerta de salida, nivel completado, reinicio coherente (snapshot/restore), plataformas móviles y que caen, precarga de imágenes.
6. ✅ Enemigos: criatura con patrulla/persecución/zarpazo, hoja 4×2, sistema de hojas generalizado, herramienta de escena por número.
6.2. ✅ Reorganización: PlayingState dividido en SceneWorld + 7 sistemas (screen-shake, platform, combat, pickup, hazard, scene-flow, debug-tools). PlayingState solo orquesta.
7. ✅ Documentación: JSDoc en español en todos los módulos JS, encabezados descriptivos en CSS, comentarios de estructura en index.html, docs/ con 6 documentos de arquitectura (Mermaid).
7.1. ✅ Sistema de trampas y trampas del nivel 1: clase base Trap (ciclo de fases + Timer), prensa hidráulica (N1E2), láser intermitente (N1E3), TrapSystem, TrapView, css/traps.css.
8. Nivel 2 y sus trampas.
9. Nivel 3, sus trampas, cápsula y victoria.
10. Táctil, responsive y pulido.

## Arquitectura (qué hace cada archivo)

```
index.html                 capas: game > viewport > world > scene, entities, debug-layer; hud; panels; pantallas (screen--*); debug-panel; boot-message
css/base.css               tokens (--color-*, --font-*), fuentes locales, reset, mensaje de arranque
css/world.css              escala (--world-scale) y cámara (--camera-x) con transform; fondo (--scene-image)
css/entities.css           .entity, .entity__sprite, .sprite-sheet (hojas genéricas con @property --frame-col/--frame-row), .robot-sprite, .creature-sprite, animaciones del robot y la criatura, sacudida de pantalla, disparo, coleccionables, espantapájaros
css/hud.css                HUD: batería (--ratio, is-low), vidas, nivel, puntos, IDs, toast
css/panels.css             panel de ID de tripulante (CRT, ámbar, barra --ratio, scanlines)
css/tutorial.css           carteles del tutorial: appear/dismiss, teclado vs táctil
css/platforms.css          plataformas: móvil (franja ámbar + propulsor cian), que cae (grietas + borde rojo + temblor + fundido)
css/screens.css            pantallas de menú: visibilidad por data-state/data-overlay/data-sub, glitch, estrellas, estática TV, CRT off; nivel completado; fundido de transición; decoración pit-shadow
css/traps.css              trampas: prensa (franjas ámbar, pistón, temblor, destello), láser (emisor, rayo, chispas); reduced-motion
css/debug.css              modo depuración (solo visible con .game.is-debug); safe-point, hazard, trigger, platform, trap
js/main.js                 arranque: new Game(document).start()
js/config.js               TODAS las constantes de jugabilidad
js/core/game.js            raíz de composición: crea Input, Camera, vistas, StateMachine, GameLoop; destroy() limpia todo
js/core/game-loop.js       rAF + delta time repartido en subpasos (LOOP.maxSubstep); hooks update(step), render(frame), endFrame()
js/core/input.js           acciones, no teclas: isHeld, consumePress, setGameplayEnabled; pause/debug activos siempre
js/core/camera.js          escala = alto de pantalla / 724; follow(), jumpTo(), snappedX, screenToWorld()
js/core/state-machine.js   pila de estados: change (vacía pila), push/pop (overlay), data-state + data-overlay en .game
js/core/assets.js          loadImage(url) con caché y decode()
js/core/math-utils.js      clamp, approach, damp (suavizado independiente de FPS)
js/physics/collision.js    rectsOverlap (ÚNICA prueba de colisión), rectFromSpan
js/physics/physics.js      createBody, velocityForHeight, stepBody (gravedad + resolución por eje + groundSolid), moveAxis (exportada), carryByPlatform
js/core/event-bus.js       EventBus: on → unsub, emit, clear; getter listenerCount para prueba de fugas
js/core/storage.js         load(key, fallback) y save(key, value) sobre localStorage con try/catch
js/core/settings.js        Settings: showTutorial, screenShake, crtEffect, reducedMotion; clases en .game
js/core/timer.js           Timer reutilizable de cuenta regresiva (active, start, reset, update)
js/core/device.js          setupDeviceClass: pone is-touch en .game según pointer: coarse
js/entities/player.js      lógica del robot: correr, salto, batería, disparo, daño (con/sin knockback, aura roja), muerte, respawn, visualState, canBeHurt
js/entities/battery.js     Battery(max): drain, spend, recharge, refill; getters value, ratio, isEmpty, isLow
js/entities/projectile.js  Projectile: cuerpo sin gravedad, se destruye al chocar o recorrer maxDistance
js/entities/entity-collection.js  EntityCollection: pares {entity, view} con fábrica de vista opcional, limpieza automática de isDead, forEach, syncCustom
js/entities/pickup.js      Pickup(type, x, y, crewId?): collect() → isCollected → isDead tras collectDuration
js/entities/platform.js    Platform (base): body rect, dx/dy del último paso, isSolid, savePrevious()
js/entities/moving-platform.js  MovingPlatform: interpola entre from y to, pausa en extremos
js/entities/falling-platform.js  FallingPlatform: idle → shaking → falling → hidden → respawning → idle; onStepped(), isBlockedByBody()
js/entities/safe-point.js  SafePointTracker: grounded + ambos pies + lejos de hazards y trap zones → guarda punto seguro
js/entities/enemy.js       Enemy: patrulla/persecución/zarpazo, interfaz shootable, estados patrol→chase→windup→strike→recover (+hurt, dying, dead)
js/entities/training-dummy.js  TrainingDummy: hitbox TRAINING_DUMMY (100×90), hitCount, onShot (interfaz shootable)
js/levels/level1.js        datos de las 3 escenas del nivel 1: solids, hazards, crewIds, energyCells, enemies, exit, movingPlatforms, fallingPlatforms, decorations, traps
js/levels/levels.js        LEVELS = [LEVEL_1]: único lugar que conoce todos los niveles
js/levels/level-loader.js  datos -> escena del motor; convierte hazards, exit (sin pared derecha si edge), door (rectFromSpan), plataformas, decoraciones, traps
js/levels/crew-logs.js     CREW_LOGS[9]: id, sceneId, name, role, log; VICTORY_MESSAGE
js/core/session.js         GameSession: score, lives, foundCrewIds; snapshotLevelStart/restoreLevelStart; emite session:* events
js/states/menu-state.js    menú principal: nueva partida, subpantallas, récord
js/traps/trap.js           Trap (base): ciclo de fases con Timer, phaseOffset, getters phase/phaseProgress/dangerRects/zone
js/traps/hydraulic-press.js  HydraulicPress: fases idle→warning→slam→hold→rise, bloque interpola entre restBottom y bottom, viewData --block-y
js/traps/intermittent-laser.js  IntermittentLaser: fases off→warning→on, rayo vertical fijo
js/traps/trap-factory.js   createTrap(data): mapa type→clase, error claro si tipo desconocido
js/scene/scene-world.js    SceneWorld: construye todas las entidades, trampas y vistas de una escena, getAllSolids(), dispose(). Sin reglas de juego, sin suscripciones.
js/systems/screen-shake.js ScreenShake: sacudida por player:hurt (único listener), Timer, respeta screenShake
js/systems/platform-system.js PlatformSystem: beforePlayer (mover + arrastrar rider), afterPlayer (pisadas)
js/systems/combat-system.js CombatSystem: enemigos, proyectiles, dummies, shootables, checkProjectileHits, checkEnemyDamage. Suscribe player:shoot, enemy:destroyed
js/systems/pickup-system.js PickupSystem: celdas e IDs, panel de registro, updatePanel (corta frame si abierto). Suscribe scene:mounted
js/systems/trap-system.js  TrapSystem: actualiza trampas, escribe world.dynamicHazards. Orden: después de platformSystem.afterPlayer, antes de combatSystem
js/systems/hazard-system.js HazardSystem: safePoint.update, checkHazards (estáticos + dynamicHazards), handleFall
js/systems/scene-flow.js   SceneFlow: salidas, transiciones por fases, loadCurrentScene, onDeathSequenceEnd, completeLevel, fundido. Suscribe player:battery-empty, player:respawn-end, debug:jump-scene
js/systems/debug-tools.js  DebugTools: reportDebug, handleInput (H, 1–9 → emite debug:jump-scene), setupScene. Suscribe scene:mounted
js/states/playing-state.js orquestador: enter/exit/pause/resume, crea SceneWorld y sistemas, update en orden fijo, render, mountScene (emite scene:mounted)
js/states/paused-state.js  pausa superpuesta: continuar, reiniciar nivel (restoreLevelStart sin perder intento), subpantallas
js/states/level-complete-state.js  overlay al completar nivel: bono de batería, IDs del nivel, continuar o volver al menú
js/states/game-over-state.js  resumen final: puntos, IDs, récord, reiniciar o salir al menú
js/states/off-state.js     pantalla de apagado: intenta window.close(), muestra "sistema apagado" con CRT
js/ui/menu-navigator.js    navegación por teclado en menús: flechas/WS mueven foco circular, Escape = volver
js/ui/screens.js           utilidades: getHighScore, saveHighScore, formatScore, fullscreen
js/ui/tutorial.js          Tutorial secuencial: de a uno, minVisible, linger, pendingDismiss, passX
js/ui/hud.js               Hud: datos para la vista (battery, lives, score, crew, toast con Timer)
js/ui/crew-log-panel.js    CrewLogPanel: abre panel de ID, pausa juego, cierra con confirm tras closeDelay
js/view/dom-utils.js       createElement, setPosition, setSize, setRect, queryRefs
js/view/entity-view.js     EntityView(layer, modifier, {width,height}).sync(body, flags) / destroy()
js/view/player-view.js     PlayerView: traduce Player.visualState a una clase is-*, aplica robot-sprite al sprite, has-hurt-aura
js/view/enemy-view.js      EnemyView: traduce Enemy.visualState a clase is-*, aplica creature-sprite + sprite-sheet, is-fading
js/view/training-dummy-view.js  TrainingDummyView: sprite de imagen (centrado, mayor que hitbox, alineado al piso) + etiqueta de impactos
js/view/trap-view.js       TrapView: clase de tipo + fase (is-*), geometría de zona, viewData, hijo .trap__block para prensa
js/view/platform-view.js   PlatformView: posiciona con --x/--y, clases is-* según visualState
js/view/hud-view.js        HudView: dibuja HUD, solo toca DOM cuando un valor cambia
js/view/tutorial-view.js   TutorialView: crea carteles en capa tutorial, alterna is-visible/is-dismissed
js/view/world-view.js      showScene(), applyScale(), render(camera)
js/view/debug-view.js      showScene, track(id, rect, kind), report({clave: valor}), isEnabled, toggle
tools/process_assets.py    conversión de assets originales (ya aplicada)
tools/physics-check.html   verificador de física: simula saltos a 30/120/144 FPS y compara requisitos
tools/physics-check.js     lógica del verificador, importa Player y physics reales
```

Contexto compartido que reciben los estados: `{ input, camera, events, settings, worldView, debugView, loop, layers: { entities, world, hud, panels }, refs, states }`.
Carpeta `js/traps/`: clase base `Trap` + una subclase por tipo + fábrica `createTrap`.

Sistemas reciben `{ context, getWorld, session, hud }` en el constructor. `getWorld()` devuelve el `SceneWorld` actual (nunca guardar la referencia).
Contrato: `constructor(deps)`, `update(deltaTime)` (si lo necesita), `dispose()` (libera suscripciones y temporizadores).
Orden de update en PlayingState: screenShake → sceneFlow.updateTransition → pausa → pickupSystem.updatePanel → debugTools.handleInput → muerte/respawn → platformSystem.beforePlayer → player → platformSystem.afterPlayer → trapSystem → combatSystem → pickupSystem → hazardSystem → sceneFlow.checkExits → tutorial → HUD → cámara.
Agregar un sistema nuevo = crear archivo en `js/systems/`, agregarlo al arreglo `#systems` en `PlayingState.enter()` y en el orden de update.

## Convenciones obligatorias

- Módulos ES (import/export). `const`/`let`, nunca `var`. Sin variables globales.
- Nombres en inglés; comentarios y JSDoc en español, explicando el porqué.
- Documentación JSDoc: cada módulo JS tiene un encabezado `@module` con descripción, "Usado por", "Depende de" y técnicas notables. Cada clase tiene un bloque JSDoc con descripción y ciclo de vida. Cada CSS tiene un encabezado con técnicas usadas.
- Una responsabilidad por archivo, clase y función. Funciones cortas. Campos privados `#` para el estado interno.
- Cero duplicación: si algo se repite, se extrae (clase base de trampas, `rectsOverlap`, un temporizador de ciclos).
- Sin números mágicos: jugabilidad en `config.js` (objetos `Object.freeze`); medidas visuales como variables CSS.
- `PlayingState` solo orquesta; toda regla de juego nueva va en un sistema; los sistemas se comunican por el `world` o por eventos, nunca llamándose entre sí.
- Niveles = datos. Agregar o cambiar una escena no debe tocar el motor.
- Lógica y dibujo separados: las entidades no tocan el DOM. Las vistas solo escriben variables CSS de
  geometría (`--x --y --w --h`) y clases de estado (`is-*`). Única excepción: `--scene-image`.
- `data-ref` para JavaScript, clases para CSS. Nunca seleccionar elementos por clase desde JS.
- Todo lo visual (celdas, bitácoras, láseres, trampas, HUD, carteles) se dibuja con CSS, no con imágenes.
- Animaciones de sprites: usar las propiedades individuales `translate`, `rotate`, `scale` para no pisar
  el `transform` que posiciona y voltea (`scaleX(var(--facing))`).
- Al salir de un estado o reiniciar: quitar vistas, listeners, suscripciones y temporizadores.
- Coordenadas del mundo = píxeles de la imagen de escena (2172 × 724), "y" hacia abajo, `top` = borde superior.
- Variables CSS `--ratio` para barras de progreso (0–1); `--collect-duration` para sincronizar CSS con config.js.
- Entidades "shootable": tienen `body` (rect) y `onShot(projectile)`. PlayingState itera shootables y prueba `rectsOverlap` con cada proyectil.
- Hojas de sprites genéricas: `.sprite-sheet` calcula `background-size` y `background-position` a partir de `--sheet-cols`, `--sheet-rows`, `--frame-col`, `--frame-row`. Las variables `--frame-col` y `--frame-row` están registradas con `@property` como `<integer>`, lo que permite animarlas con `steps()` sin interpolar valores intermedios. Una sola fórmula de posición en todo el proyecto.
- Hoja de sprites del robot (`assets/sprites/robot.png`): 3×3 celdas de 276×244 px (exportadas al doble), se muestran a 138×122 en el mundo. Frames en uso: 1 reposo, 4 subiendo, 5 cayendo, 6 ataque, 7 daño, 8 arrodillado, 9 tirado. Frames 2-3 ya no se usan (la corrida usa tira dedicada).
- Tira de correr (`assets/sprites/robot_correr.png`): 828×244, 3 frames en fila de 276×244 cada uno (misma escala que `robot.png`). Animación con `cycle-3-frames` y `steps(3)`, `--run-cycle = 3 / runFps`.
- Hoja de la criatura (`assets/sprites/criatura.png`): 4×2 celdas de 498×310 px (al doble), 249×155 en el mundo. Frames: 1 reposo, 2–3 caminar, 4 preparar ataque, 5 zarpazo, 6 daño, 7 muriendo, 8 muerta. Contorno rojo con `drop-shadow`.
- Doble salto: usa los mismos frames 4 (subiendo) y 5 (cayendo) del salto normal. Sin giro ni destello.
- Aura roja de daño: `has-hurt-aura` en el elemento `.entity--player` (no el sprite), `drop-shadow` rojo que pulsa y se desvanece en `hurtAuraDuration` (2 s). Se reinicia con cada golpe. Con `reduced-motion`: aura fija sin pulso.
- Prioridad de estados visuales del robot (de mayor a menor): `dying > respawning > hurt-frame > attacking > rising > falling > running > idle`. Una sola clase `is-*` activa a la vez; la decide `Player.visualState`.
- Espantapájaros (`assets/sprites/espantapajaros.png`): 114×132 en el mundo, hitbox 100×90 con offset 6 px desde arriba. Sprite alineado al piso (`bottom: calc(--dummy-bottom-offset * -1px)`), no a la hitbox. Medidas en `config.js` como `TRAINING_DUMMY`.
- `SHOOT.muzzleOffset = { x: 58, y: 49 }`: medido en el frame 6 de la hoja nueva. Fogonazo CSS en `::after` del sprite.
- Los menús usan `<button>` reales y foco nativo; `Input` solo captura durante el juego (`setGameplayEnabled`). Las acciones `debug` y `pause` funcionan siempre.
- Máquina de estados con pila: `change()` vacía la pila, `push()` superpone (pausa), `pop()` vuelve al anterior. `data-state` = base, `data-overlay` = superpuesto.
- Pantallas: `<section class="screen screen--X">` controladas por CSS según `data-state`/`data-overlay`/`data-sub`/`data-confirm`. JS nunca escribe `display`.
- Diálogo de confirmación en pausa: un solo bloque `.confirm-dialog` reutilizado por "Reiniciar nivel" y "Salir al menú". El atributo `data-confirm="restart"|"exit"` en `.screen--paused` muestra la confirmación y oculta los botones. El foco empieza en "No" (opción segura). Escape en la confirmación la cierra sin cerrar la pausa.
- Formato de datos de escena: `id`, `name`, `background`, `spawn`, `solids`, `hazards`, `crewIds`, `energyCells`, `trainingDummies`, `enemies` (`[{x, y, patrol: {x1, x2}}]`, donde x/y son los pies y patrol los límites de patrulla), `tutorial`, `exit` (`{type:'edge'}` o `{type:'door', x1, x2, top, bottom}`), `movingPlatforms` (`[{from:{x,y}, to:{x,y}, width}]`), `fallingPlatforms` (`[{x, y, width}]`), `decorations` (`[{type, x1, x2, top}]`), `traps` (`[{type:'press', x1, x2, ceiling, restBottom, bottom}]` o `[{type:'laser', x, top, bottom}]`, con `phaseOffset` opcional).
- Trampas no aplican daño: exponen `dangerRects` (arreglo de Rect) y `zone` (Rect fijo). TrapSystem escribe `world.dynamicHazards` cada frame; HazardSystem los revisa igual que los hazards estáticos. SafePointTracker excluye las `zone` con el mismo margen. Agregar una trampa = subclase de Trap + línea en trap-factory + datos en la escena.
- Orden de actualización por paso: (1) mover plataformas, (2) arrastrar rider con `carryByPlatform`, (3) paso normal del robot (`player.update` con todos los sólidos + plataformas activas).
- `body.groundSolid`: referencia al sólido sobre el que descansa el cuerpo. Se usa para detectar plataformas y arrastrar al rider.
- Transiciones de escena: fundido a negro con `.scene-fade` (clase `is-showing`/`is-hiding`), duraciones `TRANSITION.fadeOut`/`fadeIn`. Máquina de fases con `Timer` (no `setTimeout`): `fade-out → loading → fade-in → fade-in-wait`. Se detiene durante la pausa.
- `GameSession.snapshotLevelStart()` / `restoreLevelStart()`: al morir se restaura al inicio del nivel y se pierde un intento; al reiniciar desde pausa se restaura sin perder intento.
- Estados del enemigo: `patrol → chase → windup → strike → recover`, más `hurt`, `dying`, `dead`. No usa `StateMachine` (diseñada para UI con pila), sino estado simple con `Timer`. Prioridad visual (de mayor a menor): `dead > dying > hurt > strike > windup > walking > idle`.
- `EntityCollection` con fábrica de vista: el tercer parámetro opcional `viewFactory(layer, entity)` permite crear vistas especializadas (`EnemyView`, `TrainingDummyView`, `PlatformView`). `syncCustom(fn)` itera pares {entity, view} para vistas que no siguen la interfaz `sync(body, flags)`. La lista de shootables es también un `EntityCollection`: las entidades muertas se eliminan automáticamente.
- `Player.canBeHurt`: getter que centraliza `!isInvulnerable && !isDying && !isDead && !isRespawning`. Se usa en `takeHit`, `takeHitWithOrigin`, y en `PlayingState` para guardas de daño, peligros y caídas.
- Herramienta de depuración: con depuración activa, las teclas `Digit1`…`Digit9` cargan la escena con ese número del nivel actual (atajos `scene1`…`scene9` en `KEY_BINDINGS`).
- Nada de `setTimeout`/`setInterval` para la lógica del juego: usar `Timer` actualizado en `update`. Un `setTimeout` sigue corriendo durante la pausa y puede dispararse después de reiniciar o salir al menú.

## Física: restricciones verificadas (NO romper)

Hitbox del robot 48 × 112. Gravedad 3600, velocidad 245, salto 100 px, doble salto 55 px, coyote 0.06 s.
Medido con el código real, idéntico a 30/60/144 FPS:

| Medida | Valor | Requisito |
|---|---|---|
| Salto simple | 114 px horiz., 100 alto | escalones de hasta 76 px |
| Doble salto (con coyote) | 202 (217) | pinchos N1E1 ≥ 180, ácido N2E1 ≥ 185, foso N1E3 < 242 |
| Doble salto subiendo 70 px (con coyote) | 188 | hueco N2E3 < 202 (plataforma obligatoria) |

Si cambiás cualquier constante de PLAYER o PHYSICS, volvé a medir y reportá la tabla.
Caer de un borde y saltar en el aire consume el doble salto (evita cruzar el foso con 2 saltos aéreos).

## Paleta (css/base.css)

Fondo `--color-void` y `--color-deep` · robot `--color-signal` (cian) · alarmas `--color-alarm` (rojo) ·
nivel 1 `--color-amber` · ácido `--color-acid`. Fuentes: `--font-terminal` (VT323) y `--font-display` (Silkscreen).
