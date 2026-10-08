# Etapa 9.1 — Correcciones de sprites de trampas y plataformas

Pruebas en el navegador (con capturas) de la etapa 9.1 encontraron errores visuales y de datos. Esta etapa **solo
corrige**: no agregues funciones nuevas.

Leé `CLAUDE.md`, `docs/SPRITES.md` y estos archivos completos antes de editar:
`js/view/trap-view.js`, `css/traps.css`, `css/platforms.css`, `css/entities.css` (sección `.sprite-sheet`),
`js/entities/entity-collection.js`, `js/systems/combat-system.js`, todos los archivos de `js/traps/`,
`js/levels/level2.js`, `js/levels/level3.js`, `tools/level-check.js`.

## Reglas

- Mismas reglas de siempre:
  - documentación completa;
  - sin código comentado, TODOs ni `console.log`;
  - sin código, constantes, clases, keyframes ni imágenes sin uso;
  - sin duplicación.
- No modifiques PLAYER ni PHYSICS.

---

## Errores reportados

| # | Dónde | Qué pasa |
|---|---|---|
| 1 | Prensa (N1E2) | En reposo falta el bloque y el pistón llega hasta el piso. Al bajar, la prensa desaparece por completo; en otra fase el bloque aparece separado del pistón. El soporte flota en lugar de estar pegado al techo. |
| 2 | Láser intermitente | Cuando dispara, el emisor desaparece y vuelve al apagarse. |
| 3 | Goteo de ácido (N2E2) | Cuando aparece la gota, la tubería desaparece. La tubería flota, no llega al techo. La gota debería salir un poco por debajo de la boca. |
| 4 | Plataforma diagonal (N2E2) | Se mete dentro de la plataforma ancha (`1245–1785`) y una "pared invisible" empuja al robot fuera de ella. |
| 5 | Plataforma móvil (N2E3) | Se mete dentro de la plataforma de salida (`1845–2172`). |
| 6 | Descompresión (nivel 3) | El sprite de corriente y escombros no se ve bien. |
| 7 | Chispas | En la descarga, la caja desaparece y no se ve ningún arco, pero sí hace daño (trampa invisible). |
| 8 | Láser de barrido | Cuando dispara, desaparece el emisor del riel. |
| 9 | Torreta (N3E2) | Al destruirla desaparece por completo; no se ve el frame de destruida. |

---

## Parte A — Causa común de las piezas que desaparecen (2, 3, 7, 8, 9 y parte de 1)

Casi todas las piezas desaparecen justo cuando la trampa cambia de fase o de frame. Eso apunta a una causa común,
no a nueve errores distintos.

### A1. Diagnóstico (antes de editar)

Encontrá y explicá la causa. Revisá, como mínimo:

1. **Variables de frame**: si `--frame-col`, `--frame-row`, `--sheet-cols` o `--sheet-rows` están registradas con
   `@property` y `inherits: false`, un valor puesto en el contenedor `.trap` **no llega** a las piezas hijas. Entonces la
   pieza calcula su posición con valores iniciales y queda fuera de la imagen. Verificá también que ningún frame pida
   una columna mayor que `--sheet-cols − 1`.
2. **Reglas de fase**: reglas como `.is-on .trap__emitter`, `.is-discharge ...` o `.is-destroyed ...` que cambian
   `background-image`, `display`, `opacity`, `visibility`, `width/height` o `background-position` de una pieza base y la
   dejan vacía.
3. **Torreta**: si al destruirse se marca `isDead`, `EntityCollection` destruye su vista. "Destruida" no es "muerta":
   debe dejar de ser disparable y de disparar, pero seguir existiendo y dibujándose con el frame 2.

### A2. Regla de diseño, a agregar en `CLAUDE.md`

- **Toda pieza visual de una trampa es un elemento permanente**: emisor, riel, soporte, pistón, bloque, tubería, caja,
  torreta.
- **Una fase solo puede**:
  - cambiar el frame de una pieza;
  - mostrar u ocultar piezas **efímeras**: rayo, impacto, gota, salpicadura, fogonazo;
  - cambiar variables de geometría.
- Nunca oculta ni reemplaza una pieza permanente.
- Las variables de frame se escriben en el **mismo elemento** que muestra la hoja, o se registran con `inherits: true`.
  Elegí una opción, aplicala en todo el proyecto (robot, criatura, trampas) y documentala.

### A3. Corrección por trampa

- **Láser intermitente**:
  - el emisor se ve siempre: frame 1 en `off` y `warning`, frame 2 en `on`;
  - el rayo y el impacto son efímeros.
- **Láser de barrido**:
  - el emisor se ve siempre y se desliza por el riel en todas las fases;
  - el rayo sale de su boca.
- **Chispas**:
  - la caja se ve siempre;
  - frame 1 en `idle`, frame 2 parpadeando en `warning`, frames 3 ↔ 4 en `discharge`;
  - el daño nunca puede existir sin que se vea la descarga.
- **Goteo de ácido**:
  - la tubería se ve siempre: frame 1 en `idle` y `fall`, frame 2 en `warning`;
  - la gota es un elemento aparte que aparece en `fall`, **unos px por debajo de la boca**. Ese desplazamiento va en
    `config.js` y la hitbox de la gota parte del mismo punto;
  - la salpicadura aparece en `splash`.
- **Torreta**: frame 1 activa y frame 2 destruida, que queda dibujada para siempre en esa escena.

## Parte B — Todo lo que cuelga del techo empieza en y = 0

- **Prensa**:
  - el soporte va pegado al borde superior de la escena (y = 0);
  - quitá `ceiling` de los datos (`trap-factory` debe rechazarlo);
  - el pistón se repite desde el borde inferior del soporte hasta el borde **superior** del bloque, en todas las fases;
  - el bloque se ve siempre;
  - `restBottom` y `bottom` no cambian: verificá que en reposo el robot siga pasando por debajo.
- **Tubería**: los tramos se repiten desde y = 0 hasta la boca (`top`); la tubería nunca flota.
- **Láseres y riel**: ya empiezan en y = 0; verificá que siga siendo así.

## Parte C — Plataformas que se meten en las paredes (4 y 5)

### C1. Regla en `tools/level-check.js`

En todo su recorrido, una plataforma móvil nunca debe superponerse con un sólido estático, y debe dejar una separación
de al menos `PLATFORMS.wallClearance` px (nuevo en `config.js`, valor inicial 4).

- En un recorrido diagonal, revisá posiciones intermedias: muestreá el recorrido cada pocos píxeles.
- Aplicá la misma revisión a las plataformas que caen en reposo.
- La herramienta debe listar cada caso con la escena, la plataforma y el sólido.

### C2. Corrección de los datos

Ejecutala y corregí todo lo que encuentre, empezando por:

- **N2E2**: la diagonal termina con su borde derecho en x 1290, dentro de la plataforma ancha (`1245–1785`, top 373).
  Acortá el recorrido para que su borde derecho llegue como máximo a `1245 − wallClearance`.
- **N2E3**: la plataforma llega a un borde derecho de x 1900, dentro de la plataforma de salida (`1845–2172`, top 320).
  Acortá el recorrido para que su borde derecho llegue como máximo a `1845 − wallClearance`.

### C3. Verificación de recorrido

Volvé a verificar con `tools/physics-check.js` que cada plataforma acortada siga conectando los dos lados:

- en N2E2, del tercer pilar a la plataforma ancha;
- en N2E3, de la pasarela a la plataforma de salida (subir de top 360 a 320).

El hueco de N2E3 debe seguir siendo imposible sin la plataforma. Mostrá los números.

## Parte D — Descompresión: volver al efecto anterior (6)

1. Recuperá con git el efecto de la descompresión de la etapa 9, el que estaba hecho con CSS, antes de la 9.1:
   - usá `git log` para encontrar el commit de la etapa 9;
   - usá `git show <commit>:css/traps.css` (y los archivos que hagan falta) para recuperar las reglas y la estructura que
     tenía su vista.
2. Restauralo tal como estaba, adaptado a la estructura actual de `trap-view.js` y sin duplicar nada.
3. Eliminá por completo el sprite de corriente y escombros:
   - `assets/sprites/descompresion_corriente.png` y `descompresion_escombros.png`;
   - sus entradas en `docs/SPRITES.md`;
   - las constantes de `config.js` que solo usaban ellos (por ejemplo, la cantidad de escombros);
   - su CSS.
   Buscá referencias y mostrá el resultado vacío.

## Parte E — Herramienta para verificar trampas sin jugar

Creá `tools/trap-gallery.html` + `tools/trap-gallery.js`:

- una página que muestra **cada tipo de trampa en cada una de sus fases, congelada**, una al lado de la otra, con su
  nombre y fase;
- usa las clases reales de `js/traps/` y la vista real `TrapView`, sin copiar código, para que lo que se ve ahí sea
  exactamente lo que se ve en el juego;
- sirve para revisar de un vistazo que ninguna pieza desaparece en ninguna fase;
- documentala en `docs/ARQUITECTURA.md`.

---

## Al terminar

1. Actualizá `CLAUDE.md`:
   - regla de piezas permanentes y efímeras;
   - variables de frame;
   - todo lo que cuelga empieza en y = 0;
   - regla de separación de plataformas;
   - `trap-gallery`;
   - descompresión con CSS.
2. Actualizá `docs/`:
   - `SPRITES.md`, sin los sprites de descompresión;
   - `DATOS-DE-NIVEL.md`, sin `ceiling`;
   - `ESTADOS.md`, con frames por fase;
   - `FISICA.md`, con los números de la Parte C.
3. Reporte en español:
   - causa común encontrada en A1, explicada;
   - archivos modificados y eliminados;
   - resultado de `level-check` antes y después;
   - números de la Parte C;
   - lista de pruebas:
     - abrir `tools/trap-gallery.html` y revisar cada trampa en cada fase;
     - en el juego, cada trampa de los 9 errores reportados;
     - viajar en las plataformas de N2E2 y N2E3 sin que nada empuje al robot;
     - la descompresión con el efecto anterior;
     - consola sin errores.
