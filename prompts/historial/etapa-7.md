# Etapa 7 — Documentación completa del código (para exponerlo en clase)

El proyecto se va a presentar en clase. Todo el código debe poder leerse y explicarse sin el autor al lado.

Esta etapa **solo documenta**: no cambia ni una línea de lógica.

Leé `CLAUDE.md` antes de empezar.

## Reglas

- **Cero cambios de código.** Solo se agregan o mejoran comentarios, JSDoc y archivos de `docs/`.
  - No se renombra nada, no se reordena nada y no se "aprovecha" para arreglar algo.
  - Si encontrás un error o algo confuso, anotalo en el reporte y seguí.
- **Idioma**:
  - descripciones en **español**;
  - etiquetas JSDoc en su forma estándar (`@param`, `@returns`, `@typedef`…);
  - nombres de código sin cambios (en inglés).
- **Comentarios útiles**: explican el **qué hace la pieza en el juego** y el **porqué de cada decisión**.
  Prohibido narrar lo obvio ("incrementa i", "devuelve el valor").
- No instales nada. No agregues herramientas de generación de documentación.

---

## 1. Estándar de documentación

Agregalo a `CLAUDE.md` como convención obligatoria para todo código futuro.

### Archivos JavaScript

1. **Encabezado del módulo** (bloque al inicio de cada archivo):
   - qué responsabilidad tiene;
   - quién lo usa;
   - de qué depende;
   - en qué etapa del bucle participa, si aplica.
2. **Cada clase**:
   - qué representa en el juego;
   - su ciclo de vida (quién la crea, quién la destruye y cuándo);
   - con quién colabora.
3. **Cada método o función pública**:
   - JSDoc con descripción;
   - `@param {tipo} nombre` con unidad cuando corresponda (px del mundo, segundos, 0–1);
   - `@returns`;
   - efectos secundarios ("mueve el cuerpo", "escribe en el DOM");
   - eventos que emite, con un renglón `Emite: 'player:shoot' { x, y, direction }`.
4. **Métodos privados (`#`)**: una línea de JSDoc con su propósito. Si la lógica no es obvia, explicala.
5. **Getters**: una línea con lo que devuelven y en qué unidad.
6. **Campos privados no obvios**: comentario de una línea con su propósito y unidad.
7. **Tipos compartidos**: `@typedef` en el módulo dueño del tipo y referencias con
   `@typedef {import('../physics/physics.js').Body} Body` donde se usen. Como mínimo:
   - `Rect`, `Body`;
   - `SceneData` (cada clave de los datos de escena) y `Scene` (la escena del motor);
   - `SystemDeps`;
   - la forma de cada dato de nivel (`enemies`, `crewIds`, `movingPlatforms`…).
8. **`config.js`**: cada constante con su unidad, qué cambia en el juego si se aumenta o se reduce, y de dónde salió el
   valor. Por ejemplo, la tabla de física verificada.
9. **Archivos de datos** (`level1.js`, `crew-logs.js`): un comentario inicial con el formato completo de cada clave y un
   ejemplo.
10. **Algoritmos clave**: un bloque explicativo de varias líneas, en el lugar donde ocurre, para:
    - integración de la gravedad y por qué es independiente de los FPS (`physics.js`);
    - resolución de colisiones eje por eje (`physics.js`);
    - subpasos del bucle y límite de delta (`game-loop.js`);
    - suavizado de cámara y redondeo a píxeles (`camera.js`);
    - pulsaciones consumibles y `endFrame` (`input.js`);
    - pila de estados, `push` y `pop` (`state-machine.js`);
    - punto seguro y sus tres condiciones (`safe-point.js`);
    - arrastre de plataformas y aplastamiento (`platform-system.js`);
    - fases de la transición de escena (`scene-flow.js`);
    - máquina de estados de la criatura (`enemy.js`);
    - coyote time, buffer de salto y doble salto (`player.js`);
    - compuertas del orden de actualización (`playing-state.js`).

### Archivos CSS

- Encabezado con la responsabilidad del archivo y qué variables recibe desde JS.
- Un comentario por sección.
- Explicación de cada técnica no obvia:
  - hojas de sprites con `@property`;
  - glitch con `clip-path`;
  - líneas CRT;
  - estrellas con degradados;
  - estática de TV;
  - apagado de monitor;
  - materialización;
  - `steps()`.

### `index.html`

Comentario por capa explicando qué contiene y por qué está en ese orden.

### Herramientas

`tools/physics-check.js` y `tools/process_assets.py` documentados con el mismo nivel de detalle.

### Ejemplo del nivel esperado

Usalo para calibrar:

```js
/**
 * Prueba de colisión entre dos rectángulos alineados a los ejes (AABB).
 * Es la ÚNICA prueba de colisión del juego: robot, criaturas, disparos, trampas y
 * coleccionables la reutilizan, así que cualquier ajuste de "qué cuenta como choque"
 * se hace en un solo lugar.
 *
 * Los bordes que solo se tocan NO cuentan como superposición: un robot parado
 * exactamente sobre el piso no "choca" con él de costado.
 *
 * @param {Rect} a - Primer rectángulo, en px del mundo.
 * @param {Rect} b - Segundo rectángulo, en px del mundo.
 * @returns {boolean} true si comparten área.
 */
export function rectsOverlap(a, b) { ... }
```

---

## 2. Carpeta `docs/` (material para la exposición)

Los diagramas se hacen en **Mermaid** dentro de los `.md`, porque GitHub y VS Code los muestran.

1. **`docs/ARQUITECTURA.md`**:
   - visión general en un párrafo;
   - diagrama de módulos por carpeta y sus dependencias;
   - qué hace cada carpeta;
   - la regla "lógica / vista / datos";
   - cómo se agrega una escena, un sistema o un tipo de entidad, paso a paso.
2. **`docs/BUCLE-DE-JUEGO.md`**:
   - el frame completo, de `requestAnimationFrame` a `endFrame`;
   - los subpasos;
   - el orden de actualización con sus compuertas, como diagrama de flujo;
   - por qué ese orden.
3. **`docs/ESTADOS.md`**:
   - diagrama de estados de las pantallas (menú, jugando, pausa, nivel completado, game over, apagado);
   - diagrama de estados de la criatura;
   - diagrama del ciclo de la plataforma que cae;
   - fases de la transición de escena.
4. **`docs/EVENTOS.md`**:
   - tabla de TODOS los eventos del bus: nombre, quién lo emite, carga útil (payload), quién lo escucha y dónde se libera;
   - los eventos que hoy nadie escucha, marcados como pendientes.
5. **`docs/DATOS-DE-NIVEL.md`**:
   - formato completo de una escena con un ejemplo comentado;
   - coordenadas del mundo;
   - cómo medir con el modo de depuración.
6. **`docs/FISICA.md`**:
   - valores, tabla de restricciones verificadas, fórmula `v = √(2gh)`, por qué la integración es exacta;
   - cómo usar `tools/physics-check.html`.
7. **`README.md`**: actualizado con enlaces a estos documentos, cómo ejecutar el juego, controles y estructura.

---

## 3. Forma de trabajar (el proyecto es grande)

- Avanzá **carpeta por carpeta**, en este orden:
  1. `js/core`
  2. `js/physics`
  3. `js/entities`
  4. `js/scene`
  5. `js/systems`
  6. `js/states`
  7. `js/ui`
  8. `js/view`
  9. `js/levels`
  10. `js/config.js` y `js/main.js`
  11. `css/`
  12. `index.html`
  13. `tools/`
  14. `docs/`
- Al terminar cada carpeta, corré `node --check` (o `node --input-type=module --check <`) en sus `.js`.
- **Si el contexto se está llenando**, terminá la carpeta en curso y detenete con un mensaje claro:
  "Etapa 7 detenida al terminar <carpeta>. Siguiente: <carpeta>". Yo abriré una sesión nueva y te diré que continúes
  desde ahí. No dejes un archivo a medio documentar.

## 4. Verificación

- Revisá con `git diff` que **solo cambiaron comentarios**.
- Listá en el reporte cualquier línea modificada que no sea comentario. Debería ser ninguna.
- `node --check` en todos los `.js`.
- Búsqueda de comentarios obsoletos: menciones a archivos, funciones o valores que ya no existen (por ejemplo `robo.png`,
  `main_enemy`, "provisional", números que no coinciden con `config.js`). Corregí el comentario, no el código.

## Al terminar

1. `CLAUDE.md`:
   - estándar de documentación como convención obligatoria;
   - reemplazá la convención "comentarios breves" por: "JSDoc completo en todo lo público; comentarios del porqué en
     la lógica no obvia; nunca narrar lo obvio";
   - etapa 7 ✅;
   - la nueva numeración que figura abajo.
2. Reporte en español:
   - archivos documentados, por carpeta;
   - documentos creados en `docs/`;
   - errores o confusiones encontrados y no corregidos;
   - resultado del `git diff` (solo comentarios);
   - comentarios obsoletos corregidos.

### Nueva numeración de etapas

| Etapa | Contenido |
|---|---|
| 7 ✅ | Documentación |
| 7.1 | Sistema de trampas y trampas del nivel 1 |
| 8 | Nivel 2 y sus trampas |
| 9 | Nivel 3, sus trampas, cápsula y victoria |
| 10 | Táctil, responsive y pulido |
