# Etapa 9.1 — Sprites de trampas y plataformas + correcciones del nivel 3

Prerrequisito: etapa 9 terminada. Los sprites nuevos ya están en `assets/sprites/` y su especificación está en
**`docs/SPRITES.md`**, que es la fuente de verdad para tamaños, frames y anclas.

Todo el código nuevo o modificado sigue el **estándar de documentación de `CLAUDE.md`**, y `docs/` se actualiza.

Leé `CLAUDE.md` y `docs/SPRITES.md`, y después cada archivo que vayas a tocar, completo, antes de editarlo.
Mirá las imágenes de las escenas que vayas a corregir.

## Reglas

- No modifiques PLAYER ni PHYSICS.
- No reproceses ni redimensiones los sprites.
- No instales nada.
- Prohibido:
  - código comentado;
  - TODOs;
  - `console.log`;
  - `setTimeout`/`setInterval` en la lógica;
  - código, constantes, clases, keyframes o imágenes sin uso;
  - duplicación;
  - abstracciones usadas una sola vez.
- **Limpieza obligatoria**: todo el dibujo hecho con CSS que estos sprites reemplazan (degradados, pseudo-elementos,
  keyframes de las trampas y las plataformas) se elimina. Al final, buscá en todo el proyecto referencias a lo eliminado
  y mostrá el resultado vacío.
- Las trampas siguen sin aplicar daño ni crear entidades: exponen `dangerRects`, `solidRects` y `zone`, y emiten eventos.

## Forma de trabajar

Cinco partes, en orden; el juego funciona al final de cada una.

Si el contexto se llena, terminá la parte en curso y detenete con este mensaje:
"Etapa 9.1 detenida al terminar la parte X. Siguiente: parte Y".

---

## PARTE A — Herramientas compartidas para sprites

1. **Hojas**: todo frame se elige con el mecanismo `.sprite-sheet` existente (`--sheet-cols`, `--sheet-rows`,
   `--frame-col`, `--frame-row`). Ninguna trampa escribe `background-position` a mano.
2. **Piezas repetibles** (pistón, rayo del láser, tramo de tubería, riel, corriente):
   - una sola regla CSS genérica para "pieza que se repite en un eje", con su tamaño de mosaico como variable;
   - el largo lo da la geometría (`--w` o `--h`) que escribe la vista.
3. **Plataformas de ancho variable**: `border-image` con los cortes de `docs/SPRITES.md`. Los extremos no se deforman.
4. **Medidas en la configuración**: las medidas de `docs/SPRITES.md` que afecten la lógica (alto del bloque de la prensa,
   rectángulo de los arcos, posición de la boca de la torreta, tamaño de la gota) van a `config.js`, con un comentario que
   cite `docs/SPRITES.md`. Las puramente visuales van como variables CSS. Nada se repite entre CSS y JS (si el CSS
   necesita un valor de la lógica, `Game` lo escribe una vez).

## PARTE B — Láseres desde el techo, en todo el juego

1. **Función de superficie**: agregá en `js/physics/collision.js` la función
   `findSurfaceBelow(x, fromY, solids, width)`. Devuelve el `y` del primer sólido cuyo borde superior está por debajo de
   `fromY` y que se superpone horizontalmente con la franja `[x − width/2, x + width/2]`. Si no encuentra ninguno,
   devuelve el alto de la escena. Documentala y reutilizala; no escribas otra búsqueda igual.
2. **Láser intermitente**:
   - los datos pasan a ser solo `{ type: 'laser', x, phaseOffset? }`;
   - el emisor cuelga del borde superior de la escena (y = 0);
   - el rayo va desde la boca del emisor hasta `findSurfaceBelow`, calculado en cada paso con los sólidos actuales,
     incluidas las plataformas; si algo físico se interpone, el rayo se corta ahí;
   - el aviso y el rayo encendido usan el mismo largo;
   - el impacto se dibuja solo en `on`.
3. **Láser de barrido**:
   - datos `{ type: 'sweep-laser', x1, x2 }`;
   - el riel (extremo izquierdo + tramo repetido + extremo derecho) va en y = 0, de `x1` a `x2`;
   - el emisor se desliza por el riel;
   - el largo del rayo se recalcula en cada paso según la `x` actual.
4. **Datos**: quitá `top` y `bottom` de los láseres en `level1.js`, `level2.js` y `level3.js`. Un dato con claves sobrantes
   debe lanzar un error claro desde `trap-factory.js`.
5. **Peligro**: `dangerRects` usa el rectángulo real del rayo (de la boca a la superficie), con el ancho de `TRAPS`.
6. **Punto seguro**:
   - agregá a `Trap` el getter `safePointExclusions`, que por defecto devuelve `[this.zone]`;
   - el láser de barrido lo sobrescribe y devuelve solo el rayo actual, ensanchado con `HAZARD.safePointHazardMargin`;
   - `SafePointTracker` usa `safePointExclusions`;
   - así, un golpe del barrido no devuelve al robot antes de la brecha.
   - Si esto ya quedó hecho en una corrección anterior, verificalo y seguí.

## PARTE C — Sprites de cada trampa y plataforma

Usá exactamente las piezas, frames y anclas de `docs/SPRITES.md`.

- **Chispas**:
  - frame 1 en `idle`;
  - frame 2 parpadeando en `warning`;
  - frames 3 ↔ 4 alternando con `steps()` en `discharge`.
  - La zona de daño pasa a ser el rectángulo de los arcos: de 36 px a la izquierda a 30 px a la derecha del centro, y
    58 px de alto desde el piso. Así el robot puede saltarla (el salto llega a 100 px).
  - Actualizá `TRAPS.sparks` y la verificación de recorrido.
- **Prensa**:
  - el soporte va en `ceiling`;
  - el pistón se repite desde el borde inferior del soporte hasta el borde superior del bloque, y su largo cambia con la
    posición del bloque;
  - el bloque usa el frame 1, y el frame 2 durante `hold` (el golpe);
  - la hitbox y el sólido son el bloque visible (121 × 67), centrado en `x1–x2`;
  - verificá que en reposo siga pasando el robot por debajo (`restBottom`) y recalculá si hace falta.
  - El temblor de `warning` se mantiene con CSS.
- **Goteo de ácido**:
  - la tubería cuelga desde y = 0, con tramos repetidos hasta la boca;
  - el frame 1 en `idle` y el 2 en `warning`;
  - la gota del sprite durante `fall` (su hitbox con el tamaño de la gota);
  - la salpicadura en `splash`.
- **Torreta**:
  - frame 1 activa y frame 2 destruida;
  - la placa de la pared va pegada al borde derecho de la escena, y la boca se calcula con el ancla de `docs/SPRITES.md`;
  - los datos guardan la posición de la boca: corregí la torreta de N3E2;
  - verificá que el proyectil siga pasando a la altura del robot parado en la saliente `1499–1614`;
  - el destello del disparo y la luz de apuntado, con CSS sobre el sprite.
- **Plataformas**: la móvil usa `plataforma_movil.png` y la que cae usa `plataforma_cae.png`, las dos con `border-image`.
  El aviso de la que cae se mantiene: temblor más un tinte rojo con `filter`.
- **Descompresión**:
  - la corriente es fondo repetido, desplazado sin parar hacia `pullX` con CSS; la mitad derecha usa `scaleX(-1)`, con
    una opacidad moderada;
  - escombros: la vista crea una cantidad fija de piezas por zona (en `config.js`), cada una con un frame de
    `descompresion_escombros.png`; cruzan hacia `pullX` girando lento, con animaciones CSS distintas por `:nth-child`
    (sin JS por frame);
  - con `reduced-motion`: corriente estática y sin escombros.

## PARTE D — Correcciones del nivel 3

1. **Una sola plataforma que cae por brecha, centrada en `pullX`**, en N3E1 y en N3E3. Calculá el ancho (entre 80 y 120)
   con la simulación de `tools/physics-check.js` con `externalVx`. Deben cumplirse estas tres condiciones, cada una con al
   menos 15 px de margen:
   - el salto de entrada (fuerza a favor) es posible;
   - el salto de salida (fuerza en contra) es posible;
   - la brecha **no** se puede cruzar sin la plataforma.
   Si no alcanza con el ancho, bajá `TRAPS.decompression.strength` y explicalo. Mostrá los números.
2. **El escalón de N3E2**: la base del transmisor (`575–760`, top 370) y la saliente (`763–871`, top 374) dejan un desnivel
   de 4 px. El robot lo toma como pared al caminar hacia atrás. Compará con la imagen y unificalas en un solo sólido, o
   alineá sus `top` y cerrá la separación de 3 px.
3. **Herramienta `tools/level-check.js`** (+ `tools/level-check.html`, como `physics-check`):
   - recorre todos los niveles;
   - lista los pares de sólidos vecinos (separación horizontal menor que `PLAYER.width`) con una diferencia de `top`
     entre 1 y 10 px: son escalones que traban al robot.
   - Corrégí todos los que encuentre. Si podés, ejecutala con `node --experimental-default-type=module` y mostrá el
     resultado antes y después.
4. **Barrido de N3E3**: acortalo a x `1060–1400`. Recalculá con números el tiempo de barrido, la ventana de pausa más
   aviso y el tiempo de cruce. Si no alcanza, ajustá tiempos o datos y explicalo.

## PARTE E — Pendientes de la revisión anterior (verificá; si ya están hechos, seguí)

1. **Caídas e invulnerabilidad**: caer debajo de la escena o tocar un peligro **siempre** devuelve al punto seguro. Solo
   el daño depende de `canBeHurt`. Excepciones: muriendo, muerto o reapareciendo. Sin bucles de vueltas al punto seguro.
2. **Decoraciones**: los estilos de `pit-shadow`, `opening-door` y `eyes` van juntos en un solo archivo (nunca en
   `screens.css`).
3. **Medidas**: compará con las imágenes, en depuración, todo lo que cambió de posición en esta etapa. Corregí lo que
   difiera en más de ~10 px y listalo con el valor anterior y el nuevo.
4. **Documentación**: ningún documento debe decir que la tecla H activa la depuración. Es º/F2; H es el daño de prueba.

---

## Al terminar

1. Actualizá `CLAUDE.md`:
   - etapa 9.1 ✅;
   - `docs/SPRITES.md` como referencia de sprites;
   - nuevo formato de los láseres;
   - `findSurfaceBelow`;
   - `safePointExclusions`;
   - la regla de piezas repetibles y `border-image`;
   - `tools/level-check`.
2. Actualizá `docs/`:
   - `DATOS-DE-NIVEL.md`: láseres, torreta, plataformas;
   - `ESTADOS.md`: frames por fase;
   - `ARQUITECTURA.md`;
   - `FISICA.md`: ancho de las plataformas que caen y los números de la Parte D.
3. Reporte en español:
   - archivos creados, modificados y eliminados;
   - CSS eliminado;
   - búsquedas de referencias;
   - números de la Parte D;
   - medidas corregidas;
   - lista de pruebas:
     - cada trampa con su sprite en cada fase;
     - los láseres desde el borde superior hasta el piso, cortándose sobre una plataforma;
     - saltar sobre la descarga de chispas;
     - la prensa con el pistón que se estira;
     - la torreta dentro de la escena y su chatarra;
     - las plataformas de distintos anchos sin deformarse;
     - la corriente y los escombros hacia la brecha;
     - una plataforma por brecha y los dos saltos posibles;
     - caminar hacia atrás en N3E2 sin trabarse;
     - un golpe del barrido que no te devuelve antes de la brecha;
     - caer al vacío justo después de un golpe;
     - `reduced-motion`;
     - FPS con la depuración apagada;
     - consola sin errores.
