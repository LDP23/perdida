# Etapa 6.2 — Reorganización: dividir `PlayingState` en sistemas

## Objetivo

`js/states/playing-state.js` hoy maneja escenas, transiciones, plataformas, enemigos, disparos, coleccionables,
peligros, punto seguro, intentos, tutorial, sacudida y depuración. Eso rompe la regla "una responsabilidad por archivo"
y hará muy difícil agregar las trampas (etapa 7) y los niveles 2 y 3 (etapa 8).

Esta etapa **solo reorganiza**: el juego debe comportarse EXACTAMENTE igual que antes.

## Reglas de esta etapa

- **Cero cambios de comportamiento**: ninguna función nueva, ningún cambio de valores, física, datos de niveles, CSS
  visual ni textos.
- Si encontrás un error mientras reorganizás, **no lo corrijas**: anotalo en el reporte para una etapa aparte.
  Mezclar arreglos con una reorganización hace imposible saber qué rompió qué.
- No renombres formatos de datos ni eventos del bus.
- No instales nada.

---

## Paso 1 — Inventario (sin editar nada)

Leé `CLAUDE.md` y `js/states/playing-state.js` completo, junto con cada archivo que importa. Entregame:

1. **Responsabilidades actuales**: lista de cada cosa que hace `PlayingState`, con los métodos y campos que corresponden a cada una.
2. **Orden exacto de actualización** en `update()`, paso por paso, tal como está hoy. Este orden es parte del
   comportamiento y debe conservarse idéntico.
3. **Suscripciones al bus de eventos**: quién emite cada evento, quién lo escucha y dónde se libera la suscripción.
4. **Dependencias cruzadas**: qué responsabilidad lee o modifica el estado de otra (por ejemplo, los peligros mueven al
   robot, los coleccionables abren el panel).
5. **Línea base para comparar**: con el modo de depuración activo, anotá el valor de `listenerCount` en estos
   momentos: menú, N1E1 al empezar, N1E3 después de cargarla con la tecla 3, y de nuevo en el menú tras salir.
   Si no podés ejecutar el juego, calculalos leyendo el código.
6. Cantidad de líneas actual de `playing-state.js`.

## Paso 2 — Plan (esperá mi aprobación)

Proponé la división siguiendo esta estructura. Ajustala si el inventario muestra una razón y explicala:

```
js/scene/scene-world.js       crea, a partir de los datos de la escena, TODAS sus entidades y vistas
                              (robot, plataformas, enemigos, maniquíes, coleccionables, disparos,
                              lista de disparables, tutorial) y las libera en dispose().
                              No tiene reglas de juego: solo construye, guarda y destruye.
js/systems/platform-system.js mover plataformas, arrastrar al robot, pisadas en plataformas que caen
js/systems/combat-system.js   disparos contra disparables; zarpazos y contacto de enemigos contra el robot
js/systems/pickup-system.js   recoger celdas e IDs: sesión, aviso del HUD, panel de registro
js/systems/hazard-system.js   peligros, caídas y punto seguro
js/systems/scene-flow.js      salidas (borde y puerta), transiciones por fases, nivel completado,
                              muerte → intento perdido → reinicio, instantánea del nivel, precarga
js/systems/screen-shake.js    sacudida de pantalla (escucha eventos; respeta la opción screenShake)
js/systems/debug-tools.js     reporte y rectángulos de depuración, tecla H, teclas 1–9
js/states/playing-state.js    solo orquesta: enter/exit/pause/resume, crea el mundo y los sistemas,
                              llama a update en el orden fijo, render, y libera todo al salir
```

**Contrato común de cada sistema**:
- `constructor(context, world)`;
- `update(deltaTime)`, si lo necesita;
- `dispose()`, que libera TODAS sus suscripciones y temporizadores.

Detalles del diseño:
- **Comunicación entre sistemas**: por el estado del `world` o por el bus de eventos. Un sistema **no** llama métodos de
  otro sistema. Si hoy existe esa llamada directa, convertila en evento y anotalo.
- **Orden de actualización**: en `PlayingState` se define una sola vez, como un arreglo ordenado de sistemas.
  Debe reproducir el orden del Paso 1. Así, agregar el sistema de trampas en la etapa 7 será agregar un elemento a ese arreglo.
- **Código compartido entre sistemas**: solo si es código real repetido (por ejemplo, guardar y liberar suscripciones).
  Nada de clases base vacías ni abstracciones usadas una sola vez.
- **Tamaño**: ningún archivo de más de ~200 líneas y ninguna función de más de ~25.
  `PlayingState` debería quedar por debajo de ~150 líneas.

En el plan, indicá para cada método actual de `PlayingState` a qué archivo va.

## Paso 3 — Implementación

- Mové el código; no lo reescribas. Mantené nombres, valores y orden.
- Hacelo en pasos pequeños: un sistema a la vez, dejando el juego funcionando después de cada uno.
- `PlayingState.exit()` llama `dispose()` de todos los sistemas y del mundo, en orden inverso al de creación.

## Paso 4 — Verificación

1. **Sintaxis**: `node --check` (o `node --input-type=module --check <`) en cada archivo nuevo o modificado.
2. **Imports**: que no haya imports sin usar, exports que nadie importa ni métodos privados huérfanos.
3. **Eventos**: cada suscripción tiene su liberación en un `dispose()`. Mostrá la lista.
4. **`listenerCount`**: debe dar exactamente los mismos números de la línea base del Paso 1 en los mismos momentos.
5. **Física**: `tools/physics-check.js` sin cambios en sus resultados.
6. **Búsquedas finales**: sin código comentado, TODOs, `console.log`, `setTimeout` ni `setInterval` en la lógica del juego.

## Al terminar

1. Actualizá `CLAUDE.md`:
   - nueva arquitectura (carpetas `js/scene/` y `js/systems/`, una línea por archivo);
   - contrato de los sistemas;
   - orden de actualización;
   - regla nueva: "`PlayingState` solo orquesta; toda regla de juego nueva va en un sistema; los sistemas se comunican
     por el `world` o por eventos, nunca llamándose entre sí";
   - etapa 6.2 ✅.
2. Reporte en español:
   - tabla "método anterior → archivo nuevo";
   - líneas por archivo, antes y después;
   - llamadas directas convertidas en eventos;
   - errores encontrados y NO corregidos;
   - resultado de cada verificación del Paso 4;
   - lista de pruebas de regresión: recorrer N1E1 → N1E3 → puerta, el tutorial completo, disparar al espantapájaros,
     matar la criatura, recoger una celda y un ID (con su panel), caer en púas, perder un intento, pausa con reinicio
     y salida, Game Over, nivel completado, teclas H y 1–3, y consola sin errores.
