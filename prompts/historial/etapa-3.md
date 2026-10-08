# Etapa 3 — Sistemas de juego en N1E1: HUD, intentos, peligros, coleccionables y maniquí

Leé `CLAUDE.md` y estos archivos completos antes de escribir código:
`js/config.js`, `js/core/game.js`, `js/core/event-bus.js`, `js/core/timer.js`, `js/entities/player.js`,
`js/entities/battery.js`, `js/entities/projectile.js`, `js/entities/entity-collection.js`,
`js/states/playing-state.js`, `js/ui/tutorial.js`, `js/view/tutorial-view.js`, `js/levels/level1.js`,
`js/levels/level-loader.js`, `tools/process_assets.py`, `css/entities.css`, `css/tutorial.css`, `index.html`.

Todo se prueba en la escena N1E1. Trabajá en el orden de las tareas.

## Prohibido en esta etapa

- **No toques el movimiento ni sus animaciones.** No modifiques la física, el salto, la velocidad ni las
  animaciones CSS existentes del robot, y no crees animaciones de movimiento nuevas para ningún personaje.
  Los sprites de movimiento llegarán más adelante.
- No crees enemigos todavía.
- No instales nada sin preguntarme, ni agregues `package.json`.

---

## Tarea 1 — Preparar las imágenes de los coleccionables

Las imágenes originales están en `assets/source/` (`id_tripulante.png` y `celda_energia.png`). Si no están, detenete y avisame.

1. Extendé `tools/process_assets.py` con un subcomando: `python tools/process_assets.py items assets/source`.
2. Quitá el fondo magenta (#FF00FF):
   - Todo píxel cuya distancia de color a (255, 0, 255) sea menor que una tolerancia pasa a transparente.
   - Además, eliminá el halo rosado de los bordes (despill): en píxeles semitransparentes o vecinos de un píxel
     eliminado, si R y B dominan sobre G, bajá R y B hacia G.
   - Constantes con nombre al inicio del script.
3. Recortá al contenido y reducí a 96 px de alto (el doble de 48 px en el mundo):
   - LANCZOS si la imagen es grande;
   - NEAREST si ya es pixel art de baja resolución, para no difuminarla.
4. Guardá como `assets/items/id_tripulante.webp` y `assets/items/celda_energia.webp`, sin pérdida.
5. Si Python o Pillow no están instalados, avisame antes de instalarlos.

## Tarea 2 — Constantes nuevas en `js/config.js`

```js
SESSION = { lives: 3 }
SCORE = { crewId: 500, energyCell: 50, enemy: 200, turret: 150, batteryBonusPerPoint: 10 }
PICKUP = { size: 48, energyCellRecharge: 30, collectDuration: 0.45 }
HAZARD = { safePointHazardMargin: 40 }
MESSAGES = { tutorialMinVisible: 2, lingerAfterLeaving: 3, readingCharsPerSecond: 15,
             readingMin: 5, readingMax: 12, closeDelay: 0.8, toastDuration: 3 }
```

- Agregá `TUTORIAL.showDistance: 220`.
- En `KEY_BINDINGS` agregá `confirm: ['Enter', 'KeyE']`.
- Comentá el porqué de cada valor.

**Una sola fuente para tiempos que usan CSS y JS.** `Game`, al arrancar, escribe una sola vez en `.game` las
variables CSS de duración que también usa la lógica (por ejemplo `--collect-duration`). Lo hace igual que
ya escribe `--world-width`. El CSS nunca repite esos números.

## Tarea 3 — Sesión de juego: `js/core/session.js` (nuevo)

- Clase `GameSession` con todo lo que dura una partida completa y sobrevive a cambios de escena y a perder un intento:
  - `score`, `lives` y `foundCrewIds` (un `Set`);
  - `levelIndex` y `sceneIndex` (por ahora 0 y 0).
- Métodos:
  - `addScore(points)`;
  - `collectCrewId(id)`, que devuelve `false` si ya estaba;
  - `loseLife()`, que devuelve las vidas restantes;
  - getters `isGameOver` y `crewFoundCount`.
- Emite por el bus: `session:score`, `session:crew-id`, `session:life-lost`, `session:game-over`.
- `PlayingState` recibe la sesión en `enter({ session })`. Si no llega, crea una nueva; en la etapa 4 la creará el menú.

## Tarea 4 — Peligros y punto seguro

- **Datos**: en la escena `n1e1` agregá `hazards`:
  `[{ x1: 1000, x2: 1228, top: 570, bottom: 590, type: 'spikes' }]`.
  - El `top` está 6 px BAJO la línea del piso (564) a propósito: pararse en el borde del piso no debe dañar.
    Solo duele caer en el foso. Comentalo en el dato.
  - Las púas ya están dibujadas en el fondo: no necesitan vista.
- **Carga**: `level-loader.js` convierte `hazards` a rectángulos con `kind: 'hazard'` (arreglo vacío si no existe).
  El modo de depuración los dibuja en rojo.
- **Punto seguro**: `js/entities/safe-point.js` (nuevo), clase `SafePointTracker`. En cada paso guarda la posición
  de los pies del robot solo si se cumplen tres condiciones:
  - (a) está en el suelo;
  - (b) AMBOS bordes inferiores de la hitbox tienen un sólido debajo (dos sondas finas bajo los pies), para no
    reaparecer en la orilla y volver a caer;
  - (c) la hitbox agrandada en `HAZARD.safePointHazardMargin` no toca ningún peligro.
  El valor inicial es el `spawn` de la escena.
- **Reglas** (en `PlayingState`, en un método corto por regla). Si el robot toca un peligro o cae debajo de la escena:
  - `player.takeHit(BATTERY.hitCost)`, que respeta la invulnerabilidad;
  - **siempre** vuelve al último punto seguro con velocidad 0;
  - emite `player:hazard`.
  - Esto reemplaza al respawn provisional de las etapas anteriores.

## Tarea 5 — Intentos (3)

- Cuando se emite `player:battery-empty`:
  - `session.loseLife()`;
  - si quedan vidas, reiniciar la escena: robot en el spawn con batería llena, celdas de energía de nuevo en su
    lugar, IDs ya encontrados sin reaparecer, maniquí reiniciado;
  - mostrar un aviso breve en el HUD: "Batería agotada · Intentos: 2".
- Si `isGameOver`: por ahora, `console.info` y una sesión nueva desde cero, con el comentario
  `// Provisional: pantalla de Game Over en la etapa 4`.
- Reiniciar la escena debe reutilizar el mismo camino que la carga inicial, sin duplicar código.
  Al reiniciar no deben quedar suscripciones, disparos ni vistas duplicadas.

## Tarea 6 — HUD: `js/ui/hud.js` (lógica) + `js/view/hud-view.js` + `css/hud.css`

- **Capa nueva**: `<div class="hud" data-ref="hud">` en `index.html`. Va FUERA del mundo para que no se mueva con la cámara.
- **Distribución**:
  - Arriba a la izquierda: batería e intentos.
  - Arriba al centro: "Nivel 1 · Bahía de carga".
  - Arriba a la derecha: puntos y "IDs: x/9".
  - Respetá `env(safe-area-inset-*)`.
- **Batería**: barra dibujada con CSS, dividida en 10 segmentos con `repeating-linear-gradient`, más el número.
  - El relleno usa una variable `--ratio` (0–1).
  - Con `isLow`: color `--color-alarm` y pulso lento.
  - Agregá a `CLAUDE.md` la excepción: "variables de proporción (`--ratio`) para barras".
- **Intentos**: 3 íconos con `assets/sprites/robo.webp` en miniatura. Los perdidos se ven apagados (gris y opacidad baja).
- **Puntos**: 6 dígitos con ceros a la izquierda.
- **IDs**: ícono `assets/items/id_tripulante.webp` + `x/9`.
- **Rendimiento**: la vista guarda el último valor de cada dato y solo toca el DOM cuando cambia.
- **Aviso breve (toast)**: método `showToast(text)` que dura `MESSAGES.toastDuration`. Lo usan los intentos y las celdas
  ("+30 batería").
- **Estilo**: terminal CRT con `--font-terminal`, fondo oscuro semitransparente, borde fino `--color-signal`.
  Discreto: el escenario es el protagonista.

## Tarea 7 — Coleccionables: IDs de tripulante y celdas de energía

- **Lógica**: `js/entities/pickup.js` (nuevo), clase `Pickup({ type, x, y, crewId? })`.
  - `x` e `y` son el CENTRO del objeto; hitbox `PICKUP.size`.
  - Al tocar al robot (`rectsOverlap`) pasa a `isCollected`.
  - Pasa a `isDead` tras `PICKUP.collectDuration` (usá `Timer`), para que la animación de recogida termine antes de quitar la vista.
  - Usá `EntityCollection` con modificadores `crew-id` y `energy-cell`.
- **Efectos al recoger**:
  - **Celda**: `player.battery.recharge(PICKUP.energyCellRecharge)`, `SCORE.energyCell` y toast "+30 batería".
  - **ID**: `session.collectCrewId(id)`, `SCORE.crewId` y el panel de registro (Tarea 8).
- **Vista** en `css/entities.css` (sección nueva y separada de la del robot):
  - El sprite usa la imagen de su tipo.
  - Flotación suave: `translate` vertical de 6 px, unos 2 s.
  - Brillo pulsante: `filter: drop-shadow`, cian para la celda y ámbar para el ID.
  - Con `is-collected`: destello (brillo fuerte + `scale` hacia arriba) y desaparición con opacidad, en `var(--collect-duration)`.
  - Una sola imagen por tipo, sin frames extra.
  - Estas animaciones son de objetos, no de personajes: están permitidas.
- **Datos de N1E1**:
  - `crewIds: [{ crewId: 'lucia-ferrer', x: 896, y: 400 }]` — encima de la pila de dos cajas; premia el doble salto.
  - `energyCells: [{ x: 1640, y: 350 }]` — en la plataforma elevada.
- **Persistencia**: los IDs ya encontrados en la sesión no se crean al recargar la escena.

## Tarea 8 — Registros de la tripulación

- **Datos**: `js/levels/crew-logs.js` (nuevo, solo datos). 9 entradas `{ id, name, role, sceneId, log }`, con este
  texto exacto. Es la historia del juego: no lo cambies.

| id | sceneId | nombre | rol | último registro |
|---|---|---|---|---|
| lucia-ferrer | n1e1 | Lucía Ferrer | Jefa de muelle | Turno 412. Llegó el contenedor de suministros con dos días de retraso. Todo en orden. El robot de mantenimiento sigue en recarga; mañana lo reactivo. |
| tomas-arce | n1e2 | Tomás Arce | Logística | Recibimos una caja sellada que no figura en el manifiesto. Etiqueta de riesgo biológico, remitente borrado. El capitán ordenó llevarla a cuarentena hasta que la revise el laboratorio. |
| ingrid-solano | n1e3 | Ingrid Solano | Oficial de seguridad | El sello de la caja amaneció roto. Nadie la abrió: se rompió desde adentro. Hay una película verde en el piso que no sale con nada. |
| marco-ibarra | n2e1 | Dr. Marco Ibarra | Médico de a bordo | Tres casos de fiebre en dos días; todos pasaron por cuarentena. Les cuesta hablar, pero repiten lo mismo: oyen una frecuencia constante, como una señal. |
| elena-ruiz | n2e2 | Dra. Elena Ruiz | Bióloga | Las muestras de tejido siguen creciendo fuera del cuerpo y se buscan entre sí. Ibarra ya no viene al laboratorio. Lo oigo respirar detrás de la puerta del tanque 3. |
| samuel-okoro | n2e3 | Samuel Okoro | Ingeniero de contención | La masa del núcleo empujó el vidrio toda la noche. Subí la presión al máximo. Si estás leyendo esto, el vidrio ganó. No abras el núcleo. |
| nadia-varga | n3e1 | Nadia Varga | Piloto | El capitán activó la baliza de auxilio y selló el puente: nadie sale hasta que llegue ayuda. Del otro lado de la puerta están los demás. Me llaman por mi nombre. |
| pablo-rivas | n3e2 | Pablo Rivas | Comunicaciones | La señal que todos oyen es nuestra baliza, repitiéndose en bucle. Los transformados se juntan bajo la antena. Ya no son varios: se mueven como uno solo. |
| andres-molina | n3e3 | Capitán Andrés Molina | Capitán | Última grabación. Activé la baliza para pedir ayuda, pero la señal los atrae y los une. No vengan. Robot de mantenimiento: si despertás, la cápsula está lista. Llevate esta grabación. Que alguien sepa quiénes fuimos. |

- Mensaje extra para el final (se usará en la pantalla de victoria; dejalo exportado en el mismo archivo):
  > "Tripulación identificada: 9/9. La cápsula transmite sus nombres hacia la Tierra. Esta vez la señal no atrae a nadie: los recuerda."

- **Panel**: `js/ui/crew-log-panel.js` (lógica) + vista + estilos en `css/panels.css` (nuevo).
  - Capa `<div class="panel-layer" data-ref="panels">` fuera del mundo.
  - Se ve como una tarjeta de identificación: la imagen del ID, nombre, rol, la etiqueta "Último registro" y el texto.
    Usá `--font-terminal`, borde ámbar y líneas CRT sutiles con `repeating-linear-gradient`.
  - **Mientras el panel está abierto, el juego se pausa**: el robot, la batería, los disparos y los temporizadores no avanzan.
    El render sigue. Implementalo como un flag interno de `PlayingState`; no uses la máquina de estados todavía.
  - **Duración de lectura**: `clamp(caracteres / readingCharsPerSecond, readingMin, readingMax)` segundos.
  - Se cierra solo al terminar, o antes con `confirm` (Enter/E). La tecla solo funciona después de `closeDelay`,
    para no cerrarlo sin querer.
  - Usá `consumePress`: la tecla que cierra el panel no debe hacer saltar ni disparar al robot.
  - Una barra fina muestra el tiempo restante (`--ratio`).
  - Pie del panel: "Enter / E para continuar".

## Tarea 9 — Maniquí de práctica

- **Lógica**: `js/entities/training-dummy.js` (nuevo).
  - No es sólido: el robot lo atraviesa.
  - Tiene hitbox de 40 × 100.
  - Cuenta impactos y se marca como recién golpeado durante un instante (`Timer`).
- **Concepto "disparable"**: define una interfaz `shootable`. Cualquier entidad con `hitbox` y `onShot(projectile)`
  puede recibir disparos.
  - `PlayingState` revisa disparos contra la lista de disparables con `rectsOverlap`.
  - El disparo muere al impactar.
  - Escribilo genérico: las criaturas y torretas usarán exactamente este camino en el futuro.
- **Vista**: hecha solo con CSS, sin imágenes. Es una diana de entrenamiento: poste metálico gris, base, y un blanco
  con anillos `--color-alarm` y `--color-text`.
  - Al recibir un disparo: destello blanco breve y una etiqueta "Impactos: n" encima.
  - No lo muevas ni lo animes de lado a lado: solo el destello.
- **Datos de N1E1**: `trainingDummies: [{ x: 400, y: 564 }]` (pies).
- No da puntos.

## Tarea 10 — Tutorial: orden y tiempos de lectura

- **Carteles** de N1E1 (6), en este orden:

| id | x | y | teclado | táctil | texto | se descarta con |
|---|---|---|---|---|---|---|
| move | 150 | 390 | A / D | ◀ ▶ | Moverse | `player:move` |
| shoot | 400 | 360 | J | DISPARAR | Disparale al maniquí | `player:shoot` |
| jump | 500 | 390 | ESPACIO | SALTAR | Saltar | `player:jump` |
| double-jump | 760 | 360 | ESPACIO en el aire | SALTAR en el aire | Doble salto | `player:double-jump` |
| spikes | 930 | 390 | — | — | ¡Púas! Saltalas | pasar x > 1228 |
| cell | 1640 | 214 | — | — | Celda de energía: la batería baja con el tiempo y con cada disparo | recoger la celda (`pickup:energy-cell`) |

- **De a uno**: los carteles se muestran en orden. Uno solo puede aparecer cuando todos los anteriores fueron
  descartados o quedaron atrás.
- **Tiempos de lectura**. Aplicalos también a cualquier mensaje futuro:
  - Una vez visible, un cartel no se descarta antes de `MESSAGES.tutorialMinVisible`, aunque la acción ocurra antes.
    En ese caso se descarta al cumplirse ese tiempo.
  - Si el robot se aleja más allá de `showDistance`, el cartel se mantiene `MESSAGES.lingerAfterLeaving` segundos
    y luego se desvanece.
  - Si el robot vuelve antes de que se desvanezca, sigue visible.
  - Un cartel que quedó atrás sin completarse no vuelve a aparecer.
- Que el bus de eventos tenga un evento por cada recolección: `pickup:crew-id` y `pickup:energy-cell`.

## Tarea 11 — Depuración

- Reportá en el panel:
  - intentos, puntos e IDs;
  - el punto seguro actual, dibujado además como un marcador en el mundo (`kind: 'safe-point'`, color nuevo en `debug.css`);
  - los peligros, los coleccionables activos y el estado de cada cartel con su temporizador.

---

## Al terminar

1. Actualizá `CLAUDE.md`:
   - **Etapas**:

     1 ✅ Motor
     2 ✅ Robot
     3 ✅ Sistemas en N1E1
     4 Pantallas y menús
     5 Cargador de niveles y escenas
     6 Trampas y plataformas
     7 Enemigos (cuando lleguen los sprites de movimiento)
     8 Táctil y responsive
     9 Niveles 2 y 3, victoria y pulido

   - **Coleccionables**: bitácoras → IDs de tripulante.
   - **Regla**: "no tocar animaciones de movimiento hasta tener los sprites".
   - **Excepciones de variables CSS**: `--ratio` y tiempos escritos una vez desde `config.js`.
   - **Archivos nuevos** en la arquitectura.

2. Reporte en español:
   - archivos creados y modificados;
   - decisiones y su porqué;
   - lista numerada de pruebas manuales que cubra:
     - púas: daño y vuelta al punto seguro, incluso estando invulnerable;
     - reaparecer lejos de la orilla;
     - perder un intento al agotar la batería, con el aviso;
     - el HUD con cada valor y la batería baja en rojo;
     - celda: recarga, aviso y puntos;
     - ID: panel, pausa, cierre automático y con Enter/E sin saltar;
     - el ID no reaparece al perder un intento;
     - el maniquí con su contador;
     - los 6 carteles de a uno y su permanencia de 3 s;
     - consola sin errores.
