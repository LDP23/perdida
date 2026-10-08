# Etapa 9.2 — Final del juego

Última etapa de gameplay. Después de N3E3, el robot encuentra la consola personal del capitán, lee su registro final,
recoge su identificador, la estación entra en alerta y el jugador escapa en la cápsula. La pantalla de victoria muestra
los resultados y los créditos.

Leé `CLAUDE.md` y estos archivos completos antes de editar:
`js/config.js`, `js/levels/level3.js`, `js/systems/scene-flow.js`, `js/systems/pickup-system.js`,
`js/states/playing-state.js`, `js/core/game.js`, `js/scene/scene-world.js`, `js/view/hud-view.js` (si existe),
todos los archivos en `js/states/`, `css/screens.css`, `css/game.css`, `css/entities.css`.

Mirá también la imagen de fondo de N3E3 para saber **dónde** colocar la consola y la cápsula (después de los
obstáculos, en una zona segura).

## Reglas

- Mismas reglas de siempre:
  - documentación completa, porque el código se expone en clase;
  - sin código comentado, TODOs ni `console.log`;
  - sin código, constantes, clases, keyframes ni imágenes sin uso;
  - sin duplicación.
- No modifiques las constantes de PLAYER ni de PHYSICS.
- No toques las trampas ni los niveles 1 y 2: ya están bien.
- Los datos de nivel no se mutan en tiempo de ejecución (regla de la etapa 9.1.3).

## Forma de trabajar

Si el contexto se llena, terminá la parte en curso y detenete con este mensaje:
"Etapa 9.2 detenida al terminar la parte X. Siguiente: parte Y".

---

## 1. Consola del capitán (N3E3)

### 1.1 Datos de nivel

- En los datos de N3E3, **reemplazá** el coleccionable de tripulante que haya ahora por un nuevo tipo de elemento
  interactivo: `{ type: 'captain-console', x: <después del último obstáculo> }`.
  - Si N3E3 no tiene coleccionable, agregalo.
  - La `y` se calcula con `findSurfaceBelow` (apoyado en el piso), igual que otros elementos.
- El total de identificadores del juego sigue siendo **9**: 8 regulares (uno por escena en las otras 8 escenas) + el
  del capitán en la consola.
- La consola **NO** es una trampa. No pasa por `trap-factory.js`. Va en la lista de pickups/interactables del nivel,
  o en una lista nueva si no encaja. Elegí lo más limpio con la arquitectura actual y explicá la decisión.

### 1.2 Interacción

- La consola tiene una **zona de interacción** (~80 px de ancho centrados en su posición).
- Cuando el robot está dentro de esa zona, aparece un indicador flotante encima de la consola: **"↑ ACCEDER"**.
  - Si el juego ya tiene indicadores de interacción, usá el mismo estilo.
  - Si no, creá uno: un `<div>` posicionado sobre la consola con texto blanco, fondo semitransparente, bordes
    redondeados, y un `animation` suave de rebote vertical. Con `reduced-motion`, sin rebote.
- Al presionar **↑** dentro de la zona, se abre el panel del registro del capitán (punto 2).
- Mientras el panel está abierto, **el robot no se mueve y los sistemas de juego están pausados**.
- La consola se activa **una sola vez**. Después de usarla, el indicador desaparece y la consola queda como
  decoración estática.

### 1.3 Vista de la consola (CSS puro, sin sprite)

- Un rectángulo oscuro de ~80 × 60 px en el mundo, con borde de 1 px verde tenue (`#0f0` con baja opacidad).
- Apoyado en el piso (su borde inferior toca la superficie).
- Una "pantalla" interior (un `<div>` más pequeño) con un brillo verde pulsante, simulando un terminal encendido.
- Después de usarla, el brillo se apaga y el borde se atenúa (la consola se "apagó").
- Con `reduced-motion`: el brillo es fijo (sin pulso), y al apagarse simplemente cambia de color.
- Los estilos van en la misma sección CSS donde estén los otros pickups o interactables, no en un archivo nuevo.

---

## 2. Registro del capitán

### 2.1 Panel narrativo

Usá el **mecanismo de paneles que ya existe** en el juego (el del registro de tripulantes o el de depuración). Si
ninguno sirve para texto largo, creá un panel narrativo basado en el existente: fondo oscuro, texto verde claro,
fuente monoespaciada, estilo terminal.

El panel es **scrolleable** si el texto no cabe (aunque debería caber). **No** uses `alert` ni ningún mecanismo del
navegador.

Contenido del registro (**texto exacto**; ajustá el nombre del capitán):

```
REGISTRO FINAL — CAPITÁN ALEJANDRO REYES
DÍA 847 DESDE EL INCIDENTE

La señal que interceptamos no era un pedido de
auxilio. No sé qué era. Algo cambió en la
tripulación desde que la decodificamos. Primero
los ojos... después dejaron de responder.
Uno por uno.

Intenté la cuarentena. La purga de comunicaciones.
El protocolo Omega. Nada funcionó.

Dejé los identificadores de cada tripulante
repartidos por la estación. Si alguien llega
hasta aquí, al menos sabrán quiénes fuimos.

La señal sigue activa. Hay que cortarla.

Si estás leyendo esto, no te quedes. La estación
ya no es segura. Activé la cápsula de escape en
este sector.

— Reyes, fuera.
```

- Si el nombre "Alejandro Reyes" no encaja con los nombres de los otros tripulantes del juego, adaptalo al mismo
  estilo. Lo que importa es que sea consistente.

### 2.2 Al cerrar el panel

El panel se cierra con **ESC**, **↓**, o la misma tecla/botón que cierren los otros paneles. Al cerrarlo, **en este
orden**:

1. Se recoge automáticamente el identificador del capitán (el 9.º). El HUD actualiza el contador.
2. Se emite un evento `'captain-log-read'` (o el nombre que encaje en la convención de eventos del juego).
3. Comienza la secuencia de escape (punto 3).

---

## 3. Secuencia de escape

### 3.1 Alerta de la estación

Cuando el evento del registro se dispara:

- La escena entra en modo **alerta**. Efectos visuales:
  1. **Overlay rojo** semitransparente que pulsa (opacidad entre 0.05 y 0.15, ciclo ~1.5 s). Es un `<div>` que cubre
     toda la escena, con `pointer-events: none`.
  2. **Temblor de pantalla** leve y continuo. Si el juego ya tiene `ScreenShake`, usá una amplitud baja (~2 px). Si
     no, aplicá un `animation` de translate en el contenedor de la escena.
  3. **Texto "⚠ EVACUACIÓN ⚠"** centrado arriba del viewport, parpadeando. Fuente del juego, color rojo/naranja.
- Solo `transform` y `opacity` en las animaciones (rendimiento).
- Con `reduced-motion`: overlay rojo fijo (sin pulso), sin temblor, texto fijo (sin parpadeo).
- Constantes de alerta en `config.js` bajo `ESCAPE`:
  ```js
  ESCAPE: {
      countdownSeconds: 30,
      alertPulseMin: 0.05,
      alertPulseMax: 0.15,
      alertPulseCycle: 1.5,
      shakeAmplitude: 2
  }
  ```

### 3.2 Temporizador

- Un temporizador descendente de **30 segundos** aparece centrado arriba, debajo del texto de evacuación.
- Usa la clase `Timer` del juego. **No** `setTimeout` ni `setInterval`.
- Formato: `0:30`, `0:29`, ..., `0:01`, `0:00`.
- El temporizador **se pausa** cuando:
  - un panel está abierto;
  - el robot está en la animación de daño o invulnerabilidad;
  - la transición de escena está en curso.
- Cuando llega a `0:00`:
  - el robot **pierde una vida** (misma lógica que un peligro: invulnerabilidad, parpadeo, regreso al punto seguro);
  - el temporizador se reinicia a 30 s;
  - el punto seguro durante la alerta es **la consola** (no el inicio de la escena), para que el jugador no tenga
    que repetir todo N3E3.
- Si el robot **cae al vacío** o **toca un peligro** durante la alerta, el temporizador **no se reinicia** (solo el
  daño del temporizador reinicia el temporizador). El robot vuelve al punto seguro de la consola con el tiempo
  restante intacto.

### 3.3 Cápsula de escape

- Un nuevo elemento visual aparece **al borde derecho de la escena** (o en la zona segura más allá de la consola):
  una compuerta o arco luminoso que indica "salida".
- **CSS puro**: un rectángulo alto (~48 × 112 px mínimo, para que el robot quepa) con borde luminoso pulsante
  (blanco/celeste), fondo oscuro con un degradado vertical. Con `reduced-motion`, borde fijo.
- Tiene una **zona de salida**: cuando el robot la toca, se dispara la transición a `VictoryState`.
- **Antes** de interactuar con la consola, la cápsula **no existe** en la escena (ni visual ni zona). Aparece al
  activarse la alerta.

### 3.4 Opción en el menú (solo si ya existe menú de opciones)

- Si el juego ya tiene un menú de opciones o pantalla de ajustes, agregá un toggle:
  **"Escape cronometrado"** — activado por defecto.
  - Si está desactivado: no hay temporizador ni texto de evacuación. La alerta visual (overlay rojo, temblor) sigue
    para la ambientación, pero no hay presión de tiempo. La cápsula está disponible de inmediato.
  - Se guarda en `settings`, igual que `reducedMotion`.
- Si **no** hay menú de opciones, **no lo crees**: dejá el temporizador siempre activo. No vale la pena crear un
  menú de opciones entero solo para esto.

---

## 4. Pantalla de victoria

### 4.1 Nuevo estado: VictoryState

- Archivo nuevo: `js/states/victory-state.js`.
- Se activa al tocar la zona de la cápsula de escape.
- Evaluá si se apila sobre `PlayingState` (`push`) o lo reemplaza (`change`). La opción más limpia: `change`,
  porque el juego terminó y no hay que volver al estado de juego. Explicá la decisión.
- Al entrar, desactiva todos los sistemas de juego (movimiento, trampas, pickups, hazards).
- Renderiza en la capa de paneles o HUD, **encima de todo**.
- Limpia los listeners y entidades de la escena al entrar (para no dejar fugas).

### 4.2 Transición de entrada

- La transición usa el **mismo velo de fundido** que las transiciones entre escenas.
- Flujo: `fade-out` (el juego se oscurece) → cargar victoria → `fade-in` (la pantalla de victoria aparece).
- El estado de alerta (overlay rojo, temblor, temporizador) se quita durante el fade-out.

### 4.3 Contenido visual

Fondo negro con **estrellas sutiles** (5–10 puntos blancos de ~1–2 px, posicionados con CSS, no un sprite). Encima,
el contenido centrado:

1. **Título**: "SEÑAL RESTAURADA" en grande (el tamaño más grande que use el juego), color blanco.
2. **Subtítulo**:
   - Si el jugador encontró los **9 de 9**: "Tripulación identificada: 9 de 9 — COMPLETA" en verde.
   - Si encontró menos: "Tripulación identificada: X de 9" en blanco.
3. **Lista de tripulantes**: cada uno en una línea.
   - Los encontrados: con un indicador verde (●) y su nombre.
   - Los no encontrados: con un indicador gris (●) y "— Desconocido —".
   - El orden es el del juego (N1E1 primero, capitán último).
4. **Mensaje especial** (solo si 9/9), debajo de la lista, en letra más chica, itálica o con otro estilo sutil:
   "Gracias al robot de mantenimiento, la identidad de cada miembro de la tripulación fue recuperada. Sus nombres
   no se perderán."
5. **Créditos**:
   ```
   SEÑAL PERDIDA

   Desarrollado por
   Jafet Antonio Sevilla Ayala
   Roy David Urtecho
   Luis David Palomo

   Universidad José Cecilio del Valle
   Ingeniería del Software — 2026
   ```
6. **Navegación**: "ENTER — Volver al menú" al pie, parpadeando suavemente.

### 4.4 Estilo visual

- Fuente del juego, monoespaciada si el juego la usa.
- Colores: blanco y verde sobre negro (consistente con la estética terminal/espacial).
- Cada bloque de texto aparece con un fundido de entrada suave, **escalonado** (el título primero, la lista después,
  los créditos al final). Intervalo de ~0.4 s entre bloques.
- Con `reduced-motion`: todo aparece de inmediato, sin fundidos escalonados.
- Todo el contenido debe caber en 2172 × 724 **sin scroll**.

### 4.5 Volver al menú

- Al presionar **ENTER**, se vuelve al menú principal con una transición de fundido.
- Al volver al menú, el juego se reinicia completamente: progreso de niveles, pickups, batería, vidas, todo a
  cero. Un "Nuevo juego" empieza desde N1E1.
- Si el juego no tiene un estado de menú (si empieza directamente en el nivel 1), el ENTER recarga la página. Es
  lo más simple y no hay nada malo en eso para un proyecto de clase.

---

## 5. Integración con el flujo existente

### 5.1 scene-flow.js

- Actualmente, cuando el jugador toca la zona de salida de una escena, `scene-flow.js` carga la siguiente escena
  (o el siguiente nivel). Para N3E3, siendo la última escena del último nivel, **no hay siguiente**.
- La salida a la victoria **no** usa la zona de salida normal de la escena. Usa la zona de la **cápsula de escape**,
  que solo existe después de interactuar con la consola.
- `scene-flow.js` escucha el evento de la cápsula (`'escape-pod'` o `'game-complete'`) y transiciona a
  `VictoryState` en lugar de buscar una escena siguiente.
- **Asegurate** de que la zona de salida normal de N3E3 (si existe) quede desactivada o no exista. El jugador no
  puede terminar el juego sin leer el registro del capitán.

### 5.2 pickup-system.js

- El conteo de identificadores **persiste entre niveles y escenas** (no se reinicia al cambiar de nivel).
- El conteo y la **lista de nombres** de los tripulantes encontrados están disponibles para `VictoryState` (vía un
  getter en el sistema, el contexto compartido, o el evento de victoria).
- El capitán aparece último en la lista.

### 5.3 Punto seguro durante la alerta

- Cuando la alerta se activa, el punto seguro de la escena se mueve a la **posición de la consola**.
- Así, si el temporizador expira o el robot cae, reaparece junto a la consola y no tiene que repetir los obstáculos
  de N3E3.

---

## Al terminar

1. Actualizá `CLAUDE.md` y `docs/`:
   - la consola del capitán como elemento interactivo (tipo, zona, interacción);
   - la secuencia de escape (alerta, temporizador, cápsula);
   - `VictoryState` y el flujo completo de final del juego;
   - constantes de `ESCAPE` en `config.js`;
   - que N3E3 no tiene salida normal: la única salida es la cápsula;
   - diagrama de estados actualizado si hay uno.
2. Reporte en español:
   - nombre elegido para el capitán y los tripulantes (todos, con su escena);
   - archivos creados y modificados;
   - cómo se integra la consola con el sistema existente (pickup, interactable, o sistema nuevo), y por qué;
   - `change` vs `push` para `VictoryState`, y por qué;
   - lista de pruebas:
     - llegar a la consola en N3E3 y ver el indicador "↑ ACCEDER";
     - abrir el registro, leerlo, cerrarlo;
     - verificar que el 9.º identificador se recoge al cerrar;
     - la alerta se activa (overlay rojo, temblor, texto de evacuación);
     - el temporizador cuenta hacia atrás;
     - llegar a la cápsula y pasar a la pantalla de victoria;
     - dejar que el temporizador llegue a 0: el robot pierde una vida, el temporizador se reinicia, el robot
       reaparece junto a la consola;
     - pantalla de victoria con los identificadores recogidos;
     - jugar recogiendo los 9 y verificar el mensaje especial y la lista completa;
     - volver al menú desde la pantalla de victoria y empezar un juego nuevo;
     - `reduced-motion` en la consola, la alerta y la victoria;
     - consola del navegador sin errores.
