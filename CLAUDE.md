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
4. Pantallas y menús.
5. Cargador de niveles y escenas.
6. Trampas y plataformas.
7. Enemigos (cuando lleguen los sprites de movimiento).
8. Táctil y responsive.
9. Niveles 2 y 3, victoria y pulido.

## Arquitectura (qué hace cada archivo)

```
index.html                 capas: [data-ref] game > viewport > world > scene, entities, debug-layer; debug-panel; boot-message
css/base.css               tokens (--color-*, --font-*), fuentes locales, reset, mensaje de arranque
css/world.css              escala (--world-scale) y cámara (--camera-x) con transform; fondo (--scene-image)
css/entities.css           .entity, .entity__sprite, animaciones de robot/disparo/coleccionables/maniquí
css/hud.css                HUD: batería (--ratio, is-low), vidas, nivel, puntos, IDs, toast
css/panels.css             panel de ID de tripulante (CRT, ámbar, barra --ratio, scanlines)
css/tutorial.css           carteles del tutorial: appear/dismiss, teclado vs táctil
css/debug.css              modo depuración (solo visible con .game.is-debug); safe-point, hazard, trigger
js/main.js                 arranque: new Game(document).start()
js/config.js               TODAS las constantes de jugabilidad
js/core/game.js            raíz de composición: crea Input, Camera, vistas, StateMachine, GameLoop; destroy() limpia todo
js/core/game-loop.js       rAF + delta time repartido en subpasos (LOOP.maxSubstep); hooks update(step), render(frame), endFrame()
js/core/input.js           acciones, no teclas: isHeld, consumePress, press, release, releaseAll, endFrame, dispose
js/core/camera.js          escala = alto de pantalla / 724; follow(), jumpTo(), snappedX, screenToWorld()
js/core/state-machine.js   estados con enter/exit/update/render; onChange escribe data-state en .game
js/core/assets.js          loadImage(url) con caché y decode()
js/core/math-utils.js      clamp, approach, damp (suavizado independiente de FPS)
js/physics/collision.js    rectsOverlap (ÚNICA prueba de colisión), rectFromSpan
js/physics/physics.js      createBody, velocityForHeight, stepBody (gravedad exacta + resolución por eje, contactos)
js/core/event-bus.js       EventBus: on(name, handler) → unsub, emit(name, payload), clear()
js/core/timer.js           Timer reutilizable de cuenta regresiva (active, start, reset, update)
js/core/device.js          setupDeviceClass: pone is-touch en .game según pointer: coarse
js/entities/player.js      lógica del robot: correr, salto, batería, disparo, daño, estados de animación
js/entities/battery.js     Battery(max): drain, spend, recharge, refill; getters value, ratio, isEmpty, isLow
js/entities/projectile.js  Projectile: cuerpo sin gravedad, se destruye al chocar o recorrer maxDistance
js/entities/entity-collection.js  EntityCollection: pares {entity, view}, limpieza automática de isDead, forEach
js/entities/pickup.js      Pickup(type, x, y, crewId?): collect() → isCollected → isDead tras collectDuration
js/entities/safe-point.js  SafePointTracker: grounded + ambos pies + lejos de hazards → guarda punto seguro
js/entities/training-dummy.js  TrainingDummy: hitbox 40×100, hitCount, onShot (interfaz shootable)
js/levels/level1.js        datos de escenas: solids, hazards, crewIds, energyCells, trainingDummies, tutorial
js/levels/level-loader.js  datos -> escena del motor; convierte hazards con rectFromSpan; copia arrays
js/levels/crew-logs.js     CREW_LOGS[9]: id, sceneId, name, role, log; VICTORY_MESSAGE
js/core/session.js         GameSession: score, lives, foundCrewIds; emite session:* events
js/states/playing-state.js estado "jugando": sesión, hazards, punto seguro, pickups, maniquís, shootables, HUD, panel, tutorial, vidas/retry, debug completo
js/ui/tutorial.js          Tutorial secuencial: de a uno, minVisible, linger, pendingDismiss, passX
js/ui/hud.js               Hud: datos para la vista (battery, lives, score, crew, toast con Timer)
js/ui/crew-log-panel.js    CrewLogPanel: abre panel de ID, pausa juego, cierra con confirm tras closeDelay
js/view/dom-utils.js       createElement, setPosition, setSize, setRect, queryRefs
js/view/entity-view.js     EntityView(layer, modifier, {width,height}).sync(body, flags) / destroy()
js/view/player-view.js     PlayerView: traduce estado del Player a clases CSS
js/view/training-dummy-view.js  TrainingDummyView: sprite CSS + etiqueta de impactos, is-hit, has-hits
js/view/hud-view.js        HudView: dibuja HUD, solo toca DOM cuando un valor cambia
js/view/tutorial-view.js   TutorialView: crea carteles en capa tutorial, alterna is-visible/is-dismissed
js/view/world-view.js      showScene(), applyScale(), render(camera)
js/view/debug-view.js      showScene, track(id, rect, kind), report({clave: valor}), isEnabled, toggle
tools/process_assets.py    conversión de assets originales (ya aplicada)
tools/physics-check.html   verificador de física: simula saltos a 30/120/144 FPS y compara requisitos
tools/physics-check.js     lógica del verificador, importa Player y physics reales
```

Contexto compartido que reciben los estados: `{ input, camera, events, worldView, debugView, layers: { entities, world, hud, panels } }`.
Carpetas previstas: `js/traps/` (clase base + una por trampa).

## Convenciones obligatorias

- Módulos ES (import/export). `const`/`let`, nunca `var`. Sin variables globales.
- Nombres en inglés; comentarios en español, breves, explicando el porqué.
- Una responsabilidad por archivo, clase y función. Funciones cortas. Campos privados `#` para el estado interno.
- Cero duplicación: si algo se repite, se extrae (clase base de trampas, `rectsOverlap`, un temporizador de ciclos).
- Sin números mágicos: jugabilidad en `config.js` (objetos `Object.freeze`); medidas visuales como variables CSS.
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
- No hay animaciones de movimiento del sprite (caminar/saltar) hasta que los sprites finales lleguen: las animaciones actuales son de retroalimentación (aplastamiento, parpadeo, retroceso).

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
