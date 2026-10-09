# Etapa 10 — Pulido final, responsive, controles táctiles y auditoría de código

Última etapa del proyecto. El juego ya funciona completo: 3 niveles, 9 escenas, trampas, pickups, final con la consola
del capitán, secuencia de escape y pantalla de victoria. Esta etapa **no agrega funciones nuevas**: pule, optimiza,
documenta y prepara el proyecto para la presentación en clase.

Leé `CLAUDE.md` completo antes de empezar. Después, para cada parte, leé los archivos que vayas a tocar **completos**
antes de editarlos.

## Reglas

- Mismas reglas de siempre:
  - **documentación completa** (esta vez es el objetivo principal);
  - sin código comentado, TODOs ni `console.log`;
  - sin código, constantes, clases, keyframes ni imágenes sin uso;
  - sin duplicación;
  - sin abstracciones usadas una sola vez.
- No modifiques las constantes de PLAYER ni de PHYSICS.
- No cambies la lógica del juego: si algo funciona, no lo reescribas. Solo refactorizá lo que esté **duplicado**
  o sea **innecesariamente largo**.
- Esta etapa es de limpieza: si encontrás un bug, reportalo pero no lo corrijas sin confirmar. No queremos
  introducir regresiones en la última etapa.

## Forma de trabajar

Cuatro partes, en orden. El juego funciona al final de cada una.

Si el contexto se llena, terminá la parte en curso y detenete con este mensaje:
"Etapa 10 detenida al terminar la parte X. Siguiente: parte Y".

---

## PARTE A — Auditoría y documentación de todo el código

Esta es la parte más importante de toda la etapa. **El código se va a exponer en clase** y cada función, clase y
módulo debe estar documentado para que cualquier persona que lo lea entienda qué hace y por qué.

### A1. Documentación de cada archivo JS

Recorré **todos** los archivos `.js` del proyecto (en `js/` y en `tools/`) y asegurate de que cada uno tenga:

1. **Comentario de módulo** al inicio del archivo: una línea que diga qué hace ese módulo y cuál es su
   responsabilidad. Ejemplo:
   ```js
   /**
    * Sistema de peligros: detecta colisiones del robot con zonas de daño,
    * caídas al vacío y aplastamiento. Devuelve al robot al punto seguro
    * y gestiona la invulnerabilidad temporal.
    */
   ```

2. **Comentario de clase** antes de cada `class`: qué representa, qué responsabilidad tiene, y si es relevante,
   cómo se relaciona con otras clases.
   ```js
   /**
    * Trampa de goteo de ácido.
    * Ciclo: idle → warning → fall → splash.
    * La gota cae desde el techo (y=0) con gravedad hasta la superficie
    * calculada con findSurfaceBelow. Expone dangerRects con la posición
    * actual de la gota durante la fase fall.
    */
   ```

3. **Comentario de función/método** antes de cada función y cada método no trivial: qué hace, qué parámetros
   recibe (con tipo si no es obvio), qué devuelve. **No** documentes getters triviales ni métodos de una línea
   cuyo nombre ya lo dice todo (como `get x() { return this.#x; }`).
   ```js
   /**
    * Busca la primera superficie sólida debajo de un punto.
    * @param {number} x - centro horizontal de la búsqueda
    * @param {number} fromY - altura desde donde buscar hacia abajo
    * @param {Object[]} solids - lista de rectángulos sólidos {x, y, w, h}
    * @param {number} width - ancho de la franja de búsqueda
    * @returns {number} el borde superior del primer sólido encontrado, o SCENE_HEIGHT
    */
   ```

4. **Comentarios en línea** para bloques de lógica no obvia: cálculos físicos, decisiones de diseño, trucos de
   CSS, umbrales mágicos. No comentes lo obvio (`// incrementa i` → no), pero sí lo que requiere contexto
   (`// el pistón se mete 3 px dentro del collar para eliminar el hueco visual`).

5. **Sin comentarios que digan "no tocar" ni "TODO"**. Si hay una razón para no modificar algo, el comentario
   explica **por qué** (por ejemplo, "la física depende de este valor exacto para mantener la paridad entre
   30 y 144 FPS").

### A2. Documentación de cada archivo CSS

Recorré **todos** los archivos `.css` y asegurate de que cada sección tenga un comentario de encabezado que diga
qué estilos contiene. Los bloques largos de animaciones o de cálculos con `calc()` merecen un comentario que
explique la lógica.

```css
/* ── Goteo de ácido ─────────────────────────────────────────────
   Fases: idle (marca pulsa), warning (gota crece en el techo),
   fall (gota cae con gravedad), splash (salpicadura en el piso).
   La marca de superficie avisa dónde va a caer aunque el robot
   esté lejos. */
```

### A3. Eliminación de código muerto

Buscá y eliminá:

- funciones, métodos, clases o constantes que **nadie llama ni importa**;
- variables CSS (`--nombre`) que **ninguna regla usa**;
- `@keyframes` que **ninguna propiedad `animation` referencia**;
- archivos `.js` o `.css` que **ningún `import` ni `<link>` carga**;
- sprites en `assets/sprites/` que **ningún CSS referencia**;
- entradas en `docs/SPRITES.md` para sprites que ya no existen.

Para cada cosa eliminada, mostrá la búsqueda de referencias con resultado vacío.

### A4. Eliminación de código duplicado

Buscá patrones de código que se repitan en más de un lugar y extraelos a funciones o utilidades reutilizables:

- Lógica repetida entre trampas (por ejemplo, cálculos de fases, actualización de viewData).
- Patrones CSS repetidos entre tipos de trampas o entidades.
- Validaciones repetidas.
- Cálculos geométricos repetidos.

**Criterio**: si un bloque de 3+ líneas aparece (con variaciones menores) en dos o más archivos, es candidato a
extracción. Pero **no** extraigas algo que se usa una sola vez solo por "organización": eso añade indirección sin
beneficio.

Al refactorizar, **no cambies el comportamiento**: la misma entrada produce la misma salida. Verificalo.

### A5. Simplificación

Buscá oportunidades de acortar código **sin perder claridad**:

- condicionales que se pueden simplificar (ternarios claros, `??`, `?.`);
- bucles que se pueden reemplazar por `.map`, `.filter`, `.find`, `.some`, `.every`;
- valores por defecto con destructuring;
- constantes locales que se usan una vez y no aportan nombre útil.

**Criterio**: acortá solo si el resultado es **más legible**, no solo más corto. Un ternario anidado es peor que
un `if-else`. Un `.reduce` críptico es peor que un bucle `for`.

---

## PARTE B — Responsive y escalado

### B1. Escalado del juego a la ventana

El juego se diseñó para 2172 × 724 px. En pantallas más chicas (laptops, tablets, celulares), debe **escalar
proporcionalmente** para caber sin scroll ni deformación.

- El contenedor del juego usa una de estas estrategias (elegí la que funcione mejor y explicá por qué):
  1. `transform: scale()` calculado con JS al cargar y al redimensionar (`resize`), manteniendo la proporción 3:1.
  2. Un contenedor con `width: 100vw; aspect-ratio: 2172 / 724;` y `max-height: 100vh`, con todo el contenido
     escalado vía unidades relativas o un `scale` CSS.
- El juego se centra en la pantalla (horizontal y vertical) si sobra espacio.
- **Las barras negras** (letterbox/pillarbox) son aceptables y preferibles a deformar.
- El input del teclado sigue funcionando sin cambios.
- Los paneles y el HUD escalan con el juego (no quedan en tamaño fijo mientras el juego se achica).

### B2. Meta viewport

Asegurate de que `index.html` tenga:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```
Esto evita el zoom accidental en móvil y asegura que `100vw` sea el ancho real.

### B3. Prueba en distintos tamaños

Verificá que el juego se ve bien en estos tamaños (usá las DevTools del navegador):

- 1920 × 1080 (monitor Full HD)
- 1366 × 768 (laptop común)
- 768 × 1024 (tablet vertical)
- 375 × 667 (celular vertical)

En celular vertical el juego va a ser muy chico, y eso está bien — los controles táctiles (Parte C) lo hacen
jugable. Lo que **no** está bien es que se desborde, que haya scroll horizontal, o que algún elemento quede fuera
de la pantalla.

---

## PARTE C — Controles táctiles

### C1. Botones en pantalla

Para jugar en celular o tablet, el juego necesita botones táctiles que reemplacen el teclado. Aparecen **solo** en
dispositivos con pantalla táctil (`'ontouchstart' in window` o `navigator.maxTouchPoints > 0`). En desktop con
teclado, **no se muestran**.

Disposición (estilo D-pad + botones de acción, como un control de consola):

```
Lado izquierdo:           Lado derecho:
    [↑]                      [salto]
 [←] [→]                    [ataque]
    [↓]
```

- Los botones son **semitransparentes** para no tapar el juego (opacidad ~0.4, sube a ~0.7 al tocar).
- Tamaño mínimo de cada botón: **48 × 48 px CSS** (accesibilidad táctil).
- Posicionados con `position: fixed` en la parte inferior de la pantalla, con suficiente margen.
- Usan `touch-action: manipulation` para evitar delays y zoom.
- Previenen el comportamiento por defecto (`preventDefault`) para que el navegador no haga scroll ni zoom.

### C2. Integración con el input existente

- El juego ya tiene un sistema de input que lee el teclado. Los botones táctiles deben alimentar **el mismo
  sistema**, no crear uno paralelo.
- Cada botón despacha los mismos eventos o escribe las mismas flags que las teclas correspondientes:
  - ← → : movimiento
  - ↑ : interacción (consola, subir escaleras si las hay)
  - ↓ : agacharse o cerrar panel (si aplica)
  - Salto : la misma tecla de salto
  - Ataque : la misma tecla de ataque
- Los botones soportan **mantener presionado** (para caminar) y **presionar rápido** (para saltar).
- Multitouch: el jugador puede caminar y saltar al mismo tiempo (un dedo en ← y otro en salto).

### C3. Nuevo archivo

- `js/input/touch-controls.js` (o el nombre que encaje en la estructura).
- `css/touch.css` para los estilos de los botones.
- Se inicializa desde `Game` o desde el módulo de input, solo si hay pantalla táctil.
- Si el dispositivo tiene teclado **y** pantalla táctil (laptops 2-en-1), los botones táctiles **sí** aparecen
  (es preferible tenerlos de más que de menos).

### C4. Estilos

- Los botones tienen un diseño consistente con el juego: bordes rectos, colores apagados (grises con un toque
  del verde del juego), fuente del juego para los íconos (o flechas Unicode: ◀ ▶ ▲ ▼).
- Cada botón tiene un `:active` / `.is-pressed` que lo resalta al tocar.
- Con `reduced-motion`: sin transiciones en los botones.

---

## PARTE D — Optimización de rendimiento y limpieza final

### D1. Revisión de FPS

- Abrí el juego en el navegador **con la depuración apagada** (sin el panel de debug).
- Jugá una escena con trampas activas (N3E1 o N3E3, que tienen descompresión + plataformas + otros efectos).
- Reportá los FPS que marca el navegador (Performance tab o `requestAnimationFrame` timing).
- Si los FPS están **por debajo de 50** de forma sostenida:
  - revisá si alguna animación CSS fuerza reflow (layout thrashing);
  - revisá si algún `update()` hace trabajo innecesario (recalcular algo que no cambió);
  - revisá si hay demasiados elementos DOM en una escena;
  - aplicá las optimizaciones que encuentres y reportá el antes/después.
- Si los FPS están bien (50+), reportá el número y seguí.

### D2. Limpieza de la consola

- Jugá el juego completo (N1E1 hasta la pantalla de victoria) y verificá que la consola del navegador esté
  **completamente limpia**: sin warnings, sin errores, sin mensajes de ningún tipo.
- Los únicos `console.error` permitidos son los de la red de seguridad de `scene-flow.js` (que solo saltan si
  hay un error real de montaje).
- Si hay warnings del navegador que no son del juego (extensiones, Live Server), ignoralos y mencionalo.

### D3. Validación de HTML

- Asegurate de que `index.html` tenga:
  - `<!DOCTYPE html>` y `<html lang="es">`;
  - charset UTF-8;
  - meta viewport (B2);
  - título del juego: `<title>Señal Perdida</title>`;
  - todos los `<link>` de CSS y `<script type="module">` necesarios, sin archivos sobrantes.

### D4. Revisión final de docs

- `CLAUDE.md`: verificá que esté al día con **todo** lo implementado en las 10 etapas. Sin referencias a cosas
  eliminadas (chispas, tubería, etc.), sin etapas marcadas como pendientes si ya están hechas.
- `docs/ARQUITECTURA.md`: diagrama actualizado con todos los módulos actuales.
- `docs/DATOS-DE-NIVEL.md`: formato de cada tipo de dato, con la consola del capitán y la cápsula de escape.
- `docs/SPRITES.md`: solo los sprites que existen.
- `docs/ESTADOS.md`: todas las fases de cada trampa.
- `docs/FISICA.md`: todos los números actuales.
- Ningún documento debe decir que **H** activa la depuración: es **º / F2**; H es el daño de prueba.

### D5. Verificación de herramientas

- `tools/level-check.html`: abrilo y verificá que pase todo en cero.
- `tools/trap-gallery.html`: verificá que cada trampa se vea correcta en cada fase, incluyendo la consola del
  capitán si aparece como interactable.
- `tools/physics-check.html`: verificá que todas las simulaciones pasen.

---

## Al terminar

1. Actualizá `CLAUDE.md`:
   - etapa 10 ✅;
   - controles táctiles;
   - responsive;
   - todo lo que haya cambiado en la auditoría.
2. Reporte en español:
   - **resumen de la auditoría de código**:
     - cantidad de archivos revisados;
     - cantidad de funciones/métodos documentados;
     - código muerto eliminado (lista con búsquedas de referencias);
     - código duplicado encontrado y refactorizado (antes/después);
     - simplificaciones aplicadas (antes/después);
   - **responsive**:
     - estrategia elegida y por qué;
     - capturas o descripción del resultado en los 4 tamaños;
   - **controles táctiles**:
     - cómo se integran con el input existente;
     - prueba en emulador móvil;
   - **rendimiento**:
     - FPS medidos con depuración apagada;
     - optimizaciones aplicadas (si las hubo);
   - **archivos creados, modificados y eliminados**;
   - **lista de pruebas completa**:
     - jugar el juego completo de N1E1 a la pantalla de victoria;
     - recoger los 9 identificadores y ver el mensaje especial;
     - verificar la documentación de al menos 5 archivos JS (que tengan comentarios de módulo, clase y función);
     - redimensionar la ventana y verificar que el juego escale;
     - probar con emulación de celular (375 × 667) y verificar los controles táctiles;
     - `reduced-motion` en los controles táctiles;
     - `tools/level-check.html` en cero;
     - `tools/trap-gallery.html` correcta;
     - `tools/physics-check.html` correcta;
     - consola del navegador limpia;
     - ningún `console.log` en el código;
     - ningún TODO ni código comentado;
     - ningún archivo, constante, clase, keyframe ni sprite sin uso.
