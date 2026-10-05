# Etapa 6.1 — Cierre de la etapa 6 (se interrumpió por un error de la API)

La ejecución de `prompts/etapa-6.md` se cortó mientras actualizabas `CLAUDE.md`. El código de enemigos ya está escrito,
pero faltan la verificación, parte de `CLAUDE.md` y el reporte. Además, la revisión del registro encontró duplicaciones
que hay que corregir.

No agregues funciones nuevas. Leé `CLAUDE.md` y `prompts/etapa-6.md` antes de empezar.

## 1. Verificar que no quedó nada a medias

- Releé completos los archivos tocados en la etapa 6:
  - `js/config.js`
  - `js/entities/enemy.js`
  - `js/view/enemy-view.js`
  - `js/view/player-view.js`
  - `js/states/playing-state.js`
  - `js/levels/level1.js`
  - `js/levels/level-loader.js`
  - `js/core/game.js`
  - `css/entities.css`
  - `tools/process_assets.py`
  - `CLAUDE.md`
- Buscá ediciones incompletas: llaves o paréntesis sin cerrar, líneas cortadas, imports que no existen,
  constantes usadas pero no definidas (o al revés).
- Verificá la sintaxis de cada `.js` modificado con `node --check <archivo>`.
  Si `node --check` falla por ser un módulo ES, usá `node --input-type=module --check < <archivo>`.
- Confirmá que `assets/sprites/main_enemy.webp` ya no existe y que no queda ninguna referencia a `main_enemy`
  fuera de la carpeta `prompts/`.

## 2. Corregir duplicaciones detectadas

1. **Enemigos fuera de `EntityCollection`.** `PlayingState` maneja arreglos paralelos (`#enemies`, `#enemyViews`) y
   tiene su propio `#removeDeadEnemies` con `splice`, pero `EntityCollection` ya hace exactamente eso.
   - Extendé `EntityCollection` para que acepte una fábrica de vista opcional. Así puede crear un `EnemyView`,
     un `TrainingDummyView` o un `PlatformView` en lugar del `EntityView` genérico.
   - Usala para enemigos, maniquíes y plataformas.
   - Eliminá los arreglos paralelos de vistas. También la dependencia "las vistas se crearon en el mismo orden"
     de las plataformas, que es frágil.
   - La lista de disparables debe actualizarse sola cuando una entidad muere, sin `indexOf` + `splice` manual.
2. **Hojas de sprites con reglas repetidas.**
   - `.robot-sprite` repite `background-size` y `background-position`, que ya calcula `.sprite-sheet`. Dejá en
     `.robot-sprite` solo la imagen y `--sheet-cols/--sheet-rows`.
   - El estado "corriendo" repite `background-size: 300% 100%`: alcanza con cambiar `--sheet-cols/--sheet-rows`.
   - Los keyframes de correr y de caminar escriben porcentajes de `background-position` a mano (33.33%, 66.67%).
     Hacé que animen `--frame-col` con `steps()`, registrando la variable con `@property` (sintaxis `<integer>`)
     para que cambie de forma discreta.
   - Una sola fórmula de posición en todo el proyecto.
3. **Número mágico en texto.** El aviso `'+200 enemigo'` debe construirse con `SCORE.enemy`.
4. **Temporizadores fuera del bucle.** Revisá `playing-state.js` (y todo `js/`) buscando `setTimeout` y `setInterval`.
   - Si controlan el flujo del juego (transiciones, esperas), reemplazalos por `Timer` actualizado en `update`.
   - Motivo: un `setTimeout` sigue corriendo durante la pausa y puede dispararse después de reiniciar o de salir al menú.
   - Explicá cada caso en el reporte.
5. **Guardas de daño repetidas.** Si las condiciones "invulnerable, muriendo, muerto, reapareciendo" se repiten en más
   de un lugar, creá un getter `canBeHurt` en `Player` y usalo en todos ellos.

## 3. Terminar `CLAUDE.md`

Agregá lo que faltó:
- formato de `enemies` en los datos de escena;
- estados del enemigo y su prioridad visual;
- mecanismo genérico de hojas (`.sprite-sheet`, variables, `@property`);
- `EntityCollection` con fábrica de vista;
- herramienta de depuración con las teclas 1–9;
- convención: "nada de `setTimeout`/`setInterval` para la lógica del juego; usar `Timer`".

Revisá que no queden líneas duplicadas o contradictorias. El registro muestra que en la sección de arquitectura
quedaron dos líneas para `css/entities.css`, `level1.js` y `playing-state.js`: dejá una sola, actualizada.

## 4. Limpieza

- Mismas reglas estrictas de las etapas anteriores:
  - sin código comentado;
  - sin TODOs;
  - sin `console.log`;
  - sin código, constantes, clases ni keyframes sin uso;
  - sin duplicación.
- Mostrá las búsquedas finales y su resultado.

## Reporte (en español)

1. Qué estaba incompleto, si había algo.
2. Correcciones realizadas, con su porqué.
3. Archivos modificados.
4. Pruebas manuales de la etapa 6 (sección "Al terminar" de `etapa-6.md`), más estas:
   - pausar justo durante una transición de escena y continuar;
   - salir al menú durante una transición y comprobar que no ocurre nada después;
   - correr y caminar sin cambios visuales respecto de antes;
   - consola sin errores.
