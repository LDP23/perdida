# Etapa 7.1 — Sistema de trampas + trampas del nivel 1

Prerrequisito: etapa 7 (documentación) terminada.

Todo el código de esta etapa sigue el **estándar de documentación de `CLAUDE.md`** desde la primera línea: encabezado
de módulo, JSDoc completo y comentarios del porqué. Además, actualizá `docs/` con lo nuevo.

Leé `CLAUDE.md`, `docs/ARQUITECTURA.md` y `docs/BUCLE-DE-JUEGO.md`, y luego estos archivos completos:
`js/states/playing-state.js`, `js/scene/scene-world.js`, `js/systems/hazard-system.js`, `js/entities/safe-point.js`,
`js/systems/debug-tools.js`, `js/levels/level1.js`, `js/levels/level-loader.js`, `js/core/timer.js`, `js/config.js`.
Mirá también `assets/scenes/nivel1_escena2.webp` y `nivel1_escena3.webp`.

## Alcance

- La base del sistema de trampas.
- Las dos trampas del nivel 1:
  - **prensa hidráulica** en N1E2;
  - **láser intermitente** en N1E3.
- Las demás trampas (goteo de ácido, láser de barrido, chispas, torreta, descompresión) se harán en las etapas 8 y 9,
  junto con las escenas donde se pueden probar. **No las crees ahora**, ni siquiera vacías.
- Prohibido: modificar PLAYER o PHYSICS, instalar nada, cambiar el comportamiento existente.

---

## 1. Regla de diseño (del documento original)

"Todas las trampas avisan antes de activarse" y "quitan batería y el robot vuelve al último punto seguro".

Por eso, una trampa **no implementa su propio daño**: entrega sus rectángulos peligrosos y el `hazard-system` existente
aplica la misma respuesta que con las púas. Cero duplicación de la lógica de daño.

## 2. Arquitectura

### `js/traps/trap.js` — clase base

Todo lo común a cualquier trampa:

- **Ciclo de fases** definido por la subclase como una lista ordenada `[{ name, duration }]` que se repite, con un
  único `Timer` (el de `js/core/timer.js`).
- `phaseOffset` opcional (segundos, desde los datos) para desfasar trampas iguales cercanas.
- **Getters**:
  - `phase`;
  - `phaseProgress` (0–1);
  - `dangerRects`: rectángulos que dañan **en este instante** (arreglo vacío si no daña);
  - `zone`: el área total que la trampa puede llegar a ocupar. Es fija y la usa el punto seguro.
- `update(deltaTime)` avanza el ciclo. Las subclases solo agregan lo propio (por ejemplo, la posición de la prensa).
- No toca el DOM ni el robot.

### `js/traps/trap-factory.js`

- Un mapa `type → clase` y una función `createTrap(data)`.
- Agregar un tipo de trampa nuevo = crear su archivo y sumar una línea a este mapa.
- Un `type` desconocido lanza un error claro que dice qué escena y qué `type`.

### `js/systems/trap-system.js` — sistema nuevo

- En cada paso:
  - actualiza todas las trampas del mundo;
  - escribe sus `dangerRects` en `world.dynamicHazards`, un arreglo que se reemplaza en cada paso.
- **Orden de actualización**: inmediatamente después de `platformSystem.afterPlayer` y antes de `combatSystem`.
  Agregalo al arreglo de sistemas y a la lista de orden en `CLAUDE.md` y `docs/BUCLE-DE-JUEGO.md`.
- No llama a otros sistemas: se comunica a través del `world`.

### Cambios mínimos en lo existente

- **`hazard-system.js`**: revisa los peligros estáticos de la escena **y** `world.dynamicHazards` con la misma función.
  No se duplica el chequeo.
- **`SafePointTracker`**: además de los peligros estáticos, excluye las `zone` de las trampas con el mismo margen.
  Así el robot nunca reaparece debajo de una prensa ni dentro de un láser.
- **`scene-world.js`**: crea las trampas con `createTrap` y sus vistas, y las libera en `dispose()`.
- **`level-loader.js`**: copia `traps` (arreglo vacío si no existe).

## 3. Trampas del nivel 1

### 3.1 Prensa hidráulica — `js/traps/hydraulic-press.js`

- **Datos** (N1E2), sobre el contenedor largo:
  `{ type: 'press', x1: 1480, x2: 1600, ceiling: <y del techo>, restBottom: <y del borde inferior arriba>, bottom: 395 }`.
  - Medí `ceiling` y `restBottom` en la imagen: dónde está el soporte de la prensa y qué tan arriba descansa.
  - `restBottom` tiene que dejar pasar al robot por debajo: como mínimo `395 − PLAYER.height − 10`.
- **Fases**:
  `idle → warning → slam → hold → rise → idle`
  - `warning`: tiembla y se enciende una luz roja; no se mueve todavía.
  - `slam`: baja de golpe.
  - `hold`: queda abajo.
  - `rise`: sube lento.
- **Peligro**: el bloque de la prensa, en su posición actual, es peligroso durante `slam`, `hold` y `rise`, y también si
  el robot lo toca de costado. En `idle` y `warning` no daña.
- **Vista (CSS, sin imágenes)**:
  - bloque de acero oscuro con franjas de advertencia ámbar;
  - pistón que une el bloque con el techo, cuya altura se calcula con `--h` (geometría);
  - luz roja que parpadea en `warning`;
  - temblor con `translate`;
  - al terminar `slam`, un destello breve de polvo o chispas en la base.

### 3.2 Láser intermitente — `js/traps/intermittent-laser.js`

- **Datos** (N1E3), sobre la pasarela `1222–1618`:
  `{ type: 'laser', x: 1400, top: <y del emisor>, bottom: 378 }`.
  Buscá en la imagen dónde queda bien el emisor.
- **Fases**: `off → warning → on → off`.
  - `warning`: un hilo rojo delgado que parpadea; no daña.
  - `on`: rayo completo; daña.
- **Peligro**: el rectángulo del rayo, solo en `on`.
- **Vista (CSS)**:
  - emisor arriba (pequeña caja metálica con luz);
  - rayo con núcleo blanco-rojizo y resplandor `--color-alarm`;
  - en `warning`, línea de 1–2 px parpadeando;
  - en `on`, chispas en el punto de contacto con la pasarela (pseudo-elementos animados).

### 3.3 Constantes en `config.js`

Valores iniciales, documentados con unidad y efecto:

```js
TRAPS = {
  press: { idleTime: 1.4, warningTime: 0.6, slamTime: 0.12, holdTime: 0.4, riseTime: 1.2 },
  laser: { offTime: 1.6, warningTime: 0.5, onTime: 1.2, beamWidth: 10 },
}
```

Las duraciones que necesite el CSS se escriben una vez como variables, igual que las demás.

## 4. Vistas y estilos

- `js/view/trap-view.js`: una sola vista genérica que pone la clase del tipo y la de la fase actual (`is-warning`,
  `is-on`…) y escribe la geometría. Si alguna trampa necesita algo propio, extendela; no la dupliques.
- `css/traps.css` (nuevo, enlazado en `index.html`): una sección por tipo de trampa, con encabezado y comentarios.
- `reduced-motion`: sin temblor ni chispas animadas. Los avisos se mantienen como cambios de color fijos.

## 5. Depuración

- Dibujá la `zone` de cada trampa (color nuevo `--debug-trap` en `debug.css`) y sus `dangerRects` activos en rojo.
- Reportá en el panel la fase y el tiempo restante de cada trampa.

## 6. Verificación de recorrido

Calculá y escribí en el reporte:

- **Prensa**: cuánto tiempo seguro hay en cada ciclo para pasar por debajo. El robot necesita
  `(ancho de la prensa + PLAYER.width) / PLAYER.runSpeed` segundos.
  - La ventana segura debe ser al menos **el doble** de ese tiempo.
  - Indicá también si se puede esperar a salvo justo antes de la prensa (la `zone` no debe abarcar el lugar de espera).
- **Láser**: lo mismo con el ancho del rayo, la ventana de `off`, y si se puede esperar sobre la pasarela fuera del rayo.
- Si alguna ventana no alcanza, ajustá los **tiempos de `TRAPS`** o los **datos de la escena**, nunca la física, y explicá el cambio.

---

## Limpieza y documentación

- Reglas estrictas de siempre:
  - sin código comentado;
  - sin TODOs;
  - sin `console.log`;
  - sin `setTimeout`;
  - sin código, constantes, clases ni keyframes sin uso;
  - sin duplicación.
- Actualizá en `docs/`:
  - `ARQUITECTURA.md`: carpeta `js/traps/` y cómo agregar una trampa nueva paso a paso;
  - `ESTADOS.md`: diagrama de fases de cada trampa;
  - `BUCLE-DE-JUEGO.md`: nuevo sistema en el orden;
  - `DATOS-DE-NIVEL.md`: formato `traps` con ejemplos;
  - `EVENTOS.md`: si agregaste eventos.

## Al terminar

1. Actualizá `CLAUDE.md`:
   - etapa 7.1 ✅;
   - archivos nuevos;
   - formato `traps`;
   - orden de actualización;
   - regla: "las trampas no aplican daño: exponen `dangerRects` y `zone`".
2. Reporte en español:
   - archivos creados y modificados;
   - medidas tomadas de las imágenes;
   - verificación de recorrido con números;
   - decisiones y su porqué;
   - lista de pruebas:
     - aviso visible antes de cada activación;
     - daño y vuelta al punto seguro (nunca debajo de la prensa ni dentro del láser);
     - pasar en la ventana segura;
     - sin daño en `idle`, `warning` ni `off`;
     - limpieza al cambiar de escena y al reiniciar (`listenerCount` y elementos en la capa);
     - teclas 2 y 3 en depuración para ir directo a cada trampa;
     - pausa a mitad de un ciclo;
     - `reduced-motion`;
     - consola sin errores.
