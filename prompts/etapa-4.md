# Etapa 4 — Pantallas y menús: inicio, pausa, opciones, cómo jugar, créditos, game over y salir

Prerrequisito: la etapa 3 está terminada y probada.

Leé `CLAUDE.md` y estos archivos completos antes de escribir código:
`js/core/game.js`, `js/core/state-machine.js`, `js/core/input.js`, `js/core/session.js`,
`js/states/playing-state.js`, `js/config.js`, `index.html`, `css/base.css`, `css/hud.css`.

## Prohibido en esta etapa

- No toques la física, el movimiento ni las animaciones del robot.
- No crees enemigos.
- No instales nada.

---

## Tarea 1 — Máquina de estados con capas

Extendé `js/core/state-machine.js` con `push(name, params)` y `pop()` para estados superpuestos (la pausa):

- **`push`**:
  - llama `pause?()` del estado actual sin llamar `exit()`;
  - entra al nuevo estado;
  - solo el estado de arriba recibe `update`;
  - todos los de la pila reciben `render`, para que el juego se siga viendo detrás de la pausa.
- **`pop`**: sale del superpuesto y llama `resume?()` del de abajo.
- **`change`**: vacía la pila completa llamando `exit()` en cada estado, de arriba hacia abajo.
- **Atributos en `.game`**:
  - `data-state` = estado base;
  - `data-overlay` = estado superpuesto, o se elimina si no hay.
- Al reanudar, el delta time no debe "saltar" el tiempo que duró la pausa.

## Tarea 2 — Entrada en menús vs. juego

- Agregá a `Input` un modo: `setGameplayEnabled(boolean)`.
- **Desactivado** (en menús):
  - ignora el teclado;
  - NO llama `preventDefault`, para que Enter, Espacio y Tab funcionen de forma nativa en los botones;
  - suelta todas las acciones.
- **Activado**: solo en `playing`.
- **Nueva acción `pause: ['Escape', 'KeyP']`**:
  - en `playing` hace `push('paused')`;
  - en `paused`, Escape vuelve al juego.
- **`js/ui/menu-navigator.js`** (nuevo): los menús usan `<button>` reales.
  - Flechas arriba/abajo (y W/S) mueven el foco entre los botones visibles de la pantalla activa, de forma circular.
  - Escape ejecuta la acción "volver" de esa pantalla.
  - El navegador se activa y desactiva con su pantalla; `dispose()` quita el listener.
  - Una sola clase para todas las pantallas.
- **Foco**: al abrir una pantalla, el primer botón recibe el foco. `:focus-visible` muestra un cursor ">" parpadeante
  a la izquierda del texto.

## Tarea 3 — Preferencias y récord

- **`js/core/storage.js`** (nuevo): `load(key, fallback)` y `save(key, value)` sobre `localStorage`, con `try/catch`.
  Si el almacenamiento falla (modo privado), el juego sigue funcionando sin guardar.
- **`js/core/settings.js`** (nuevo) con estas opciones, valores por defecto en `config.js` (`SETTINGS_DEFAULTS`):
  - `showTutorial` (true);
  - `screenShake` (true), que se usará con los efectos;
  - `crtEffect` (true);
  - `reducedMotion` (por defecto según `prefers-reduced-motion`).
- Cada opción se refleja como clase en `.game` (`no-crt`, `no-shake`, `reduced-motion`). El CSS decide qué apagar.
- **Pantalla completa**: botón que usa la Fullscreen API. Se oculta si el navegador no la soporta.
- **Récord** (`highScore`): se guarda al terminar una partida, sea game over o victoria.
- `PlayingState` respeta `showTutorial` (si está apagado, no crea el tutorial).

## Tarea 4 — Pantallas en `index.html` + `js/ui/screens.js` + `css/screens.css`

Cada pantalla es una `<section class="screen screen--X" data-ref="screen-X">` fuera del mundo.
El CSS las muestra según `data-state` y `data-overlay`, con un fundido corto. El JS nunca escribe `display`.

### Inicio (`menu`, nuevo estado inicial del juego)

- **Fondo**:
  - campo de estrellas hecho con CSS: dos o tres capas de `radial-gradient` repetidas, a distinta velocidad y con
    desplazamiento lento;
  - líneas CRT sutiles.
- **Título "Señal Perdida"** con `--font-display` y efecto glitch:
  - dos copias en `::before` y `::after` desplazadas en cian y rojo;
  - se cortan con `clip-path` animado en ráfagas breves e irregulares, no constantes.
- **Elemento distintivo**: debajo del título, una onda de señal débil dibujada con CSS que late cada pocos segundos,
  como la baliza de la historia. Es lo único que se mueve de forma llamativa; el resto, quieto.
- **Botones**: Nueva partida · Cómo jugar · Opciones · Créditos · Salir.
- **Pie**: "Récord: 000000" (si existe).
- **Nueva partida**: crea `new GameSession()` y hace `change('playing', { session })`.

### Cómo jugar (subpantalla del menú; también accesible desde la pausa)

- **Objetivo**: descubrir qué pasó con la tripulación y escapar.
- **Controles**: tabla con teclado. Dejá preparada una columna "Táctil" con ◀ ▶ SALTAR DISPARAR.
- **Reglas**:
  - batería (baja con el tiempo, los golpes y los disparos);
  - celdas;
  - 3 intentos;
  - IDs de tripulante (x/9);
  - púas y peligros (te devuelven al último lugar seguro).
- **Botón**: Volver.

### Opciones (subpantalla; también desde la pausa)

- Interruptores accesibles (`<button aria-pressed>`) para cada opción.
- Botón Pantalla completa.
- Botón Volver.
- Los cambios se aplican al instante y se guardan.

### Créditos (subpantalla)

- "Señal Perdida — Universidad José Cecilio del Valle, 2026".
- Equipo: Jafet Antonio Sevilla Ayala · Roy David Urtecho · Luis David Palomo.
- Fuentes: VT323 y Silkscreen (SIL Open Font License).
- Botón Volver.

### Pausa (`paused`, estado superpuesto)

- El juego queda congelado y oscurecido detrás.
- **Título**: "Pausa".
- **Botones**: Continuar · Reiniciar nivel · Cómo jugar · Opciones · Salir al menú.
- "Reiniciar nivel" y "Salir al menú" piden confirmación en la misma pantalla:
  "¿Seguro? Se pierde el progreso del nivel." con Sí y No.
  - Reiniciar nivel no gasta un intento.
- **Pausa automática** al perder el foco de la ventana o al ocultarse la pestaña (`visibilitychange`), solo si se está jugando.

### Game Over (`game-over`)

- Reemplazá el reinicio provisional de la etapa 3: cuando la sesión emite `session:game-over`, `change('game-over', { session })`.
- **Título**: "Señal perdida", con el mismo glitch y la línea "La batería del robot se agotó por última vez.".
- **Resumen**:
  - puntos;
  - "IDs encontrados: x/9";
  - récord, con la marca "¡Nuevo récord!" si se superó.
- **Botones**:
  - Reiniciar: nueva sesión desde el nivel 1;
  - Salir al menú.
- **Entrada**: estática de TV con CSS (ruido con `repeating-linear-gradient` animado), que se disuelve y deja ver el resumen.
  Sin imágenes.

### Salir

- Los navegadores no dejan cerrar una pestaña que el usuario abrió (`window.close()` solo funciona si la abrió un script).
- Intentá `window.close()`. Si la página sigue abierta, mostrá el estado `off`:
  - **Animación de apagado de monitor CRT**: la imagen se aplasta a una línea horizontal brillante, luego a un punto, y se apaga.
  - **Texto**: "Sistema apagado. Ya podés cerrar esta pestaña."
  - **Botón**: Encender, que vuelve al menú.
- Comentá en el código por qué existe esta pantalla.

## Tarea 5 — Limpieza al cambiar de pantalla

- Cada estado limpia en `exit()` todo lo que creó: navegadores de menú, suscripciones al bus, timers y vistas.
- `EventBus` gana un getter `listenerCount`. Mostralo en el panel de depuración.
- **Prueba de fugas**: jugá, perdé hasta Game Over, reiniciá, salí al menú y entrá de nuevo cinco veces seguidas.
  `listenerCount` y la cantidad de elementos en las capas deben volver siempre a los mismos valores.
- El modo de depuración (º/F2) funciona en todas las pantallas.

## Tarea 6 — Diseño

- Usá solo los tokens de `css/base.css`. Si necesitás uno nuevo, agregalo ahí.
- **Botones**: `--font-terminal` grande, sin bordes redondeados, fondo transparente.
  - Al recibir foco o con el mouse encima: texto `--color-signal`, cursor ">" y un leve brillo.
  - Pensados para mouse y teclado por igual.
- **Contenido**: centrado, con ancho máximo legible (unos 40 caracteres en las subpantallas).
- **Con `reduced-motion`**: sin glitch, sin desplazamiento de estrellas y sin estática animada. Quedan solo los fundidos.
- Revisá que todo se vea bien a 1280×720, 1920×1080 y 844×390 (celular horizontal).

---

## Al terminar

1. Actualizá `CLAUDE.md`:
   - etapa 4 ✅;
   - nueva arquitectura de estados (pila, `data-state`/`data-overlay`);
   - archivos nuevos;
   - regla: "los menús usan `<button>` y foco nativo; `Input` solo captura durante el juego".
2. Reporte en español:
   - archivos creados y modificados;
   - decisiones y su porqué;
   - lista numerada de pruebas manuales que cubra:
     - navegar todos los menús solo con teclado y solo con mouse;
     - pausa con Escape/P y pausa automática al cambiar de pestaña;
     - confirmaciones de reiniciar y de salir;
     - que las opciones se guarden tras recargar la página;
     - pantalla completa;
     - Game Over con récord;
     - Reiniciar y Salir al menú;
     - la pantalla de apagado;
     - la prueba de fugas de la Tarea 5;
     - consola sin errores.
