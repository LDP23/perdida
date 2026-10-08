# Etapa 9.1 — Correcciones (tercera ronda)

La prueba en el navegador de la ronda anterior dejó **dos** problemas. Esta etapa **solo corrige esos dos**: no
agregues funciones, no rediseñes nada más, no toques ninguna otra trampa.

Leé `CLAUDE.md`, `docs/SPRITES.md` y estos archivos completos antes de editar:
`js/scene/scene-world.js`, `js/traps/trap-factory.js`, `js/traps/acid-drip.js`, `js/traps/trap.js`,
`js/levels/level2.js`, `js/traps/decompression.js`, `js/view/trap-view.js`, `css/traps.css`,
`js/systems/scene-flow.js`, `js/config.js`, `tools/level-check.js`, `tools/trap-gallery.js`.

## Reglas

- Mismas reglas de siempre:
  - documentación completa, porque el código se expone en clase;
  - sin código comentado, TODOs ni `console.log`;
  - sin código, constantes, clases, keyframes ni imágenes sin uso;
  - sin duplicación.
- No modifiques las constantes de PLAYER ni de PHYSICS.
- No cambies nada de la prensa, los láseres, la torreta ni las plataformas: ya quedaron bien.

---

## 1. N2E2 no carga: pantalla negra (error, prioridad máxima)

**Síntoma**: al terminar la escena 1 del nivel 2 y pasar a la escena 2, el nivel no carga y la pantalla queda en
negro para siempre. No se recupera; hay que recargar.

### 1.1 Causa muy probable: `_surfaceY` contra la validación de claves

Según el reporte de la ronda anterior, en la misma etapa quedaron dos cambios que se contradicen entre sí:

1. `js/traps/trap-factory.js` limitó las claves válidas del goteo a `['type', 'x', 'phaseOffset']` y **lanza** si
   encuentra una clave sobrante.
2. `js/scene/scene-world.js` "enriquece los datos de `acid-drip` con `_surfaceY` vía `findSurfaceBelow`".

Es decir: el armado de la escena le **agrega** al dato una clave que la fábrica **rechaza**. N2E2 es la única escena
con goteo de ácido, así que es la única que revienta.

Además, si los objetos de nivel están congelados con `Object.freeze` (como el resto de la configuración del
proyecto), agregarles `_surfaceY` lanza `TypeError: Cannot add property _surfaceY, object is not extensible`, porque
los módulos ES corren en modo estricto. Cualquiera de las dos variantes rompe el montaje en el mismo punto.

**Confirmalo antes de editar**, no lo asumas:

1. Abrí el juego con Live Server, saltá a N2E2 con la tecla de escena de depuración y mirá la **consola del
   navegador**. Anotá el mensaje exacto, el archivo y la línea.
2. Si no podés abrir el navegador, reproducí el armado desde Node: importá `level2.js` y `trap-factory.js` y construí
   cada trampa de N2E2 (`node --experimental-default-type=module`). El error sale igual.
3. Informá en el reporte el **texto literal de la excepción**.

Revisá de paso, en el mismo diagnóstico, si quedaron referencias colgadas que puedan romper otra escena más adelante:

- a la tubería eliminada: `trampa_tuberia`, `--pipe-ceiling-h`, `pipe`, `dropStartY`;
- a las chispas eliminadas: `TRAPS.sparks`, `electric-sparks`, `trampa_chispas`;
- a cualquier otro dato de nivel con claves que la fábrica ahora rechaza.

Mostrá cada búsqueda con su resultado.

### 1.2 Corrección: la superficie no viaja dentro del dato

El problema de fondo es de diseño, no de una clave suelta. Los datos de nivel son **datos puros**: nadie los muta en
tiempo de ejecución, y menos con una clave privada con guion bajo que después tiene que atravesar una validación.

Corregilo así:

- `js/scene/scene-world.js` **no muta** los datos del nivel. Nunca.
- La superficie donde cae la gota se calcula igual con `findSurfaceBelow`, pero se pasa como **argumento explícito**
  al construir la trampa, no escondida en el dato. Elegí una de estas dos y explicá por qué:
  - la fábrica recibe un segundo parámetro con el contexto de la escena (sólidos, alto de la escena) y la trampa que
    lo necesita lo usa;
  - o el goteo calcula su superficie por sí mismo en su primer `update`, con los sólidos que ya recibe.
- La validación de claves de `trap-factory.js` **no se afloja**: es la que encontró el error. Si alguna otra trampa
  dependía de datos enriquecidos, aplicá la misma solución ahí.
- Si los datos de nivel **no** están congelados, congelalos (`Object.freeze` profundo, igual que `config.js`) para que
  este tipo de mutación falle de inmediato y no dentro de una validación tres archivos después. Documentalo en
  `docs/DATOS-DE-NIVEL.md`.

Después de corregir, verificá que el goteo siga cayendo sobre la superficie correcta y mostrá otra vez el número de la
ventana segura para tomar el ID de Elena Ruiz.

**Ojo con una cosa**: en los datos el goteo está en `x: 668` y el ID de Elena Ruiz también está en `x: 668`, o sea que
la gota cae exactamente encima del coleccionable. El cálculo de la ronda anterior dice que la ventana alcanza (5.6× lo
necesario), pero nadie lo pudo probar porque la escena nunca cargó. Probalo en el navegador y decí si se siente justo;
si se siente injusto, **no cambies la física**: avisá y lo decidimos aparte.

### 1.3 Red de seguridad: un fallo al montar nunca deja pantalla negra

Esto es lo más importante del punto. El dato se arregla una vez, pero la **pantalla negra permanente** es un defecto
del flujo de escenas: va a volver con cualquier error futuro, y no da ninguna pista de qué pasó.

Hoy, si el montaje de una escena lanza en medio de la transición por fases
(`fade-out → loading → fade-in → fade-in-wait`), nadie quita el velo y el jugador queda mirando negro.

- El montaje de la escena se hace dentro de un manejo de errores, en el archivo al que le corresponde la
  responsabilidad (`scene-flow.js` o `scene-world.js`): explicá la decisión.
- Si el montaje falla:
  - la transición **termina igual**: el velo se quita y el juego vuelve a un estado visible;
  - se muestra en pantalla un mensaje legible con la escena que falló y el motivo, usando el mecanismo de paneles que
    ya existe (no inventes uno nuevo, no uses `alert`);
  - el error se registra con `console.error` **una sola vez**, con su pila. `console.error` para un fallo real sí está
    permitido; `console.log` sigue prohibido.
- Nada de reintentos automáticos ni de cargar otra escena en silencio: el objetivo es que el fallo se **vea**.
- Verificá que al fallar no queden escuchas ni entidades a medio crear: comprobá `listenerCount` antes y después de un
  fallo provocado a propósito, igual que en la revisión de fugas de la etapa 6.

### 1.4 Verificación sin jugar

Extendé `tools/level-check.js` con una regla nueva:

- recorre **todas** las escenas de **todos** los niveles;
- para cada trampa, valida sus datos contra `trap-factory.js` usando el mismo juego de claves válidas, **sin duplicar
  la lista**: exportala desde la fábrica e importala;
- construye cada escena completa y reporta cualquier excepción, con nivel, escena, tipo de trampa y el mensaje;
- lista cada dato inválido con la clave sobrante o faltante.

Así este error se detecta sin jugar hasta la escena. Mostrá la salida **antes** de corregir (con el fallo de N2E2
visible) y **después** (en cero).

## 2. Descompresión: quitar la línea azul del centro

El diseño nuevo (rayas horizontales + chevrones) quedó bien y **no se toca**. El único problema es el marcador de
destino: se pidió "una franja vertical oscura con un leve resplandor" y salió una línea celeste brillante en el centro
de cada mitad, que se ve mal y no hace falta.

- **Quitá por completo** la pieza `destination` de `#buildDecompression` en `js/view/trap-view.js`, su CSS en
  `css/traps.css`, sus keyframes si tiene, y la constante de `config.js` si existía solo para ella.
- No la reemplaces por nada: los chevrones y las rayas ya comunican la dirección.
- Dejá exactamente igual:
  - las 12 rayas horizontales (cantidad, largos, degradado, `ease-in`, variación por `:nth-child`, espejo con
    `scaleX(-1)`);
  - los 6 chevrones que se encienden en secuencia hacia `pullX`;
  - el comportamiento con `reduced-motion`.
- Mostrá la búsqueda de referencias a lo eliminado con resultado vacío.
- Actualizá la página de descompresión de `tools/trap-gallery.js`, que mostraba esa pieza.

---

## Al terminar

1. Actualizá `CLAUDE.md` y `docs/`:
   - la regla nueva: **los datos de nivel no se mutan en tiempo de ejecución**; lo que una trampa necesita del mundo
     se le pasa como argumento;
   - la regla nueva: **un fallo al montar una escena siempre termina la transición y muestra el error**, nunca deja
     pantalla negra;
   - la regla nueva de `tools/level-check.js` que valida los datos de todas las trampas;
   - la descompresión sin marcador de destino.
2. Revisá que ningún documento ni panel diga que **H** activa la depuración: es **º / F2**; H es el daño de prueba. El
   reporte anterior volvió a decir "Panel de depuración (H)".
3. Reporte en español:
   - el **texto literal de la excepción** que rompía N2E2 y la causa explicada;
   - cuál de las dos soluciones de 1.2 elegiste y por qué;
   - archivos modificados y eliminados;
   - búsquedas de referencias;
   - salida de `tools/level-check.js` antes y después;
   - `listenerCount` antes y después del fallo provocado;
   - lista de pruebas:
     - pasar de N2E1 a N2E2 y que la escena cargue;
     - jugar N2E2 completa, con el goteo funcionando y el ID de Elena Ruiz alcanzable;
     - provocar a propósito un dato inválido en una escena y comprobar que aparece el mensaje de error en vez de
       pantalla negra (después revertí ese dato);
     - la descompresión del nivel 3 sin ninguna línea en el centro, con chevrones y rayas intactos;
     - `tools/level-check.html` en cero;
     - consola sin errores.
