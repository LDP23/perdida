# Etapa 9.1 — Correcciones (segunda ronda)

La prueba en el navegador de la ronda anterior dejó cinco pendientes. Esta etapa **solo corrige y quita**: no
agregues funciones fuera de lo pedido.

Leé `CLAUDE.md`, `docs/SPRITES.md` y estos archivos completos antes de editar:
`js/systems/platform-system.js`, `js/systems/hazard-system.js`, `js/physics/physics.js`,
`js/entities/moving-platform.js`, `js/traps/acid-drip.js`, `js/traps/decompression.js`,
`js/traps/hydraulic-press.js`, `js/traps/trap-factory.js`, `js/view/trap-view.js`, `css/traps.css`,
`js/levels/level2.js`, `js/levels/level3.js`, `js/config.js`, `tools/trap-gallery.js`, `tools/level-check.js`.

## Reglas

- Mismas reglas de siempre:
  - documentación completa;
  - sin código comentado, TODOs ni `console.log`;
  - sin código, constantes, clases, keyframes ni imágenes sin uso;
  - sin duplicación.
- No modifiques las constantes de PLAYER ni de PHYSICS.
- Todo lo que se quite se elimina por completo (código, datos, CSS, sprites, docs, galería). Al final mostrá la búsqueda
  de referencias con resultado vacío.

---

## 1. Plataformas móviles que devuelven al robot al punto seguro (error, prioridad alta)

**Síntoma**: viajando sobre las plataformas móviles de N2E2 (diagonal) y N2E3, a veces el robot vuelve al punto seguro
como si se hubiera caído, sin perder batería.

**Hipótesis a confirmar**:

- El robot puede pararse con su hitbox (48 px) sobresaliendo hasta 24 px del borde de la plataforma.
- La plataforma frena a solo 4 px de la pared (`wallClearance`), pero su borde superior queda más bajo que la parte
  superior de esa pared:
  - N2E2: plataforma en top ≈ 400, pared en top 373;
  - N2E3: plataforma en top 360, pared en top 320.
- Al arrastrar al robot hacia la pared, su cuerpo queda dentro de ella. La regla de "aplastamiento" lo interpreta como
  peligro y lo devuelve al punto seguro. Como esa vuelta ya no depende de `canBeHurt`, no pierde batería.

### 1.1 Diagnóstico

1. Agregá al panel de depuración la línea `último regreso: <motivo> @ <escena> x,y`, donde el motivo es `hazard`,
   `fall`, `crush` o el que corresponda. Cada lugar que devuelve al robot al punto seguro informa su motivo. Sirve para
   este error y para cualquier otro futuro.
2. Agregá a `tools/level-check.js` una simulación determinista con el `Player`, la física y el `PlatformSystem` reales:
   - para cada plataforma móvil de todos los niveles, pará al robot sobre su **borde izquierdo**, su **centro** y su
     **borde derecho** (con la hitbox sobresaliendo lo máximo posible);
   - simulá dos ciclos completos de ida y vuelta sin entrada del jugador;
   - informá cada regreso al punto seguro con su motivo.
3. Confirmá o corregí la hipótesis con esa salida.

### 1.2 Corrección

- Al arrastrar al jugador, una pared **frena** al robot como frenaría cualquier movimiento (`moveAxis`). La plataforma
  sigue de largo por debajo y, si el robot queda sin apoyo, simplemente cae.
- Eso **no** es aplastamiento.
- **Aplastamiento real** solo es cuando, después de resolver el movimiento, el robot queda superpuesto con sólidos por
  **dos lados opuestos** (arriba y abajo, o izquierda y derecha) sin salida posible.
- Documentá la diferencia en `docs/FISICA.md`.

### 1.3 Verificación

La simulación de 1.1 debe terminar con **cero** regresos en las tres posiciones de cada plataforma. Mostrá la salida
antes y después.

### 1.4 De paso

Confirmá en los datos que las plataformas que caen de N3E1 y N3E3 quedaron **centradas** en `pullX`. En los datos, `x`
es el borde izquierdo, así que con ancho 100 corresponde N3E1 `x 544` y N3E3 `x 437`. Si no, corregilo y repetí la
verificación de `tools/physics-check.js` de esas brechas.

## 2. Quitar la trampa de chispas eléctricas

Eliminala por completo:

- `js/traps/electric-sparks.js`;
- su entrada en `trap-factory.js`;
- `TRAPS.sparks`;
- su CSS;
- `assets/sprites/trampa_chispas.png`;
- los datos de N3E1 y N3E3;
- su página en la galería;
- su sección en `docs/` (SPRITES, ESTADOS, DATOS-DE-NIVEL, FISICA) y en `CLAUDE.md`;
- cualquier variable CSS que escriba `Game` solo para ella.

No la reemplaces con otra trampa.

## 3. Goteo de ácido: sin tubería, la gota cae desde el techo y más rápido

- **Eliminá la tubería**: `trampa_tuberia.png`, `trampa_tuberia_tramo.png`, su CSS, su estructura en `trap-view.js`, sus
  constantes (`pipe*`, `dropStartY`) y la variable `--pipe-ceiling-h`.
- **Datos**: `{ type: 'acid-drip', x, phaseOffset? }`, igual que los láseres.
  - La superficie donde cae se calcula con `findSurfaceBelow`. No hay `top` ni `bottom` en los datos;
    `trap-factory.js` los rechaza.
  - Actualizá N2E2.
- **Fases**: `idle → warning → fall → splash`. Constantes nuevas en `TRAPS.acidDrip`:
  - `idleTime`: 0.5;
  - `warningTime`: 0.35;
  - `splashTime`: el actual.
- **Aviso** (obligatorio, aunque sea más corto):
  - en `warning`, la gota del sprite crece colgando del borde superior de la escena (y = 0), escalando desde arriba
    (`transform-origin: top`), con un brillo verde en el techo;
  - además, en la superficie donde va a caer aparece una marca verde pulsante: una elipse baja hecha con CSS, del ancho
    de la salpicadura. Así el jugador ve dónde va a caer aunque esté mirando al robot.
- **Caída**: en `fall`, la gota cae desde y = 0 con `fallGravity`. La duración sale del cálculo físico; la hitbox es la
  gota en su posición actual.
- **Salpicadura**: en `splash`, la salpicadura del sprite sobre la superficie.
- **Verificación**: calculá la ventana segura para tomar el ID de Elena Ruiz bajo el goteo. La ventana dura
  `idle + warning + tiempo hasta que la gota llega a la altura de la cabeza del robot`. Debe ser al menos el doble del
  tiempo de cruce de la columna, que es `(ancho de la salpicadura + PLAYER.width) / PLAYER.runSpeed`. Si no alcanza,
  ajustá `idleTime`, nunca la física. Mostrá los números.

## 4. Descompresión: que se entienda hacia dónde jala

El efecto actual son rayas diagonales que no indican dirección. Reemplazalo por uno que se lea al instante.

- **Rayas horizontales** (nada diagonal):
  - cantidad fija por mitad de la zona (`TRAPS.decompression.streaks`, valor inicial 12);
  - cada raya mide 2 px de alto y entre 40 y 120 px de largo;
  - son un degradado de transparente (cola) a celeste brillante (cabeza), con la **cabeza hacia `pullX`**;
  - viajan desde el borde exterior de la zona hasta `pullX` **acelerando** (curva `ease-in`, que comunica succión) y se
    desvanecen al llegar;
  - alturas, largos, duraciones y retrasos variados con `:nth-child`, sin JS por frame;
  - la mitad derecha es la izquierda volteada con `scaleX(-1)`.
- **Chevrones**: una fila de tres chevrones (`›` o `‹`, hechos con bordes o `clip-path`), a la altura del pecho del robot
  sobre cada orilla. Se encienden en secuencia hacia `pullX`, como una flecha animada. Es el indicador principal.
- **Destino**: una franja vertical oscura con un leve resplandor en `pullX`, que marca hacia dónde va todo.
- **Rendimiento**: solo `transform` y `opacity` en las animaciones.
- **`reduced-motion`**: chevrones fijos apuntando a `pullX`, sin rayas animadas.
- Eliminá el efecto anterior por completo.

## 5. Prensa: el pistón no llega al bloque

- **Error**: en todas las fases queda un hueco entre el extremo inferior del pistón y el bloque.
- **Corrección**: el pistón se repite desde el borde inferior del soporte hasta el **borde superior de los píxeles
  visibles del bloque** (su collar). Usá las medidas de `docs/SPRITES.md`: bloque visible de 121 × 67, apoyado en el
  borde inferior de su celda de 202 × 76.
  - El pistón se mete 2–3 px dentro del collar para que no se vea ninguna línea entre las piezas.
  - Ese solapamiento va como constante en `config.js`.
- **Las dos piezas siempre unidas**: soporte–pistón y pistón–bloque, en las cinco fases, incluido el frame de golpe.

## 6. Galería

Actualizá `tools/trap-gallery.js`:

- sin chispas;
- goteo nuevo con su marca en la superficie;
- descompresión nueva;
- prensa en cada fase.

Agregá a la galería un modo **"zoom ×3"** (botón) para revisar uniones de piezas píxel por píxel.

---

## Al terminar

1. Actualizá `CLAUDE.md` y `docs/`:
   - diferencia entre "frenar" y "aplastar";
   - motivo del último regreso;
   - formato del goteo sin `top`/`bottom`;
   - descompresión nueva;
   - solapamiento del pistón;
   - todo lo eliminado.
2. Reporte en español:
   - confirmación de la causa del punto 1, con la salida de la simulación antes y después;
   - números del goteo;
   - archivos modificados y eliminados;
   - búsquedas de referencias;
   - lista de pruebas:
     - viajar parado en el borde de cada plataforma móvil hasta la pared;
     - el goteo con su aviso y la marca en el piso;
     - tomar el ID bajo el goteo;
     - la descompresión mostrando claramente la dirección;
     - la prensa unida en todas sus fases (galería con zoom ×3);
     - el nivel 3 sin chispas;
     - consola sin errores.
