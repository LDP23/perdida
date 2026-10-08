# Etapa 8 — Nivel 2: Laboratorio (+ pantallas de historia e IDs que sueltan las criaturas)

Prerrequisito: etapa 7.1 terminada y probada.

Todo el código nuevo sigue el **estándar de documentación de `CLAUDE.md`**, y `docs/` se actualiza con lo nuevo.

Leé `CLAUDE.md` y `docs/ARQUITECTURA.md`, y después los archivos que vayas a tocar, completos, antes de editarlos.
Mirá las imágenes `assets/scenes/nivel2_escena1.webp`, `nivel2_escena2.webp` y `nivel2_escena3.webp`.

## Reglas

- No modifiques PLAYER ni PHYSICS.
- No instales nada.
- No crees nada del nivel 3 (ni datos, ni textos, ni trampas): eso es la etapa 9.
- Prohibido:
  - código comentado;
  - TODOs;
  - `console.log`;
  - `setTimeout`/`setInterval` en la lógica;
  - código, constantes, clases o keyframes sin uso;
  - duplicación;
  - abstracciones usadas una sola vez.

## Forma de trabajar (la etapa es grande)

Hacela en **tres partes, en orden**. Al final de cada parte el juego debe funcionar.

**Si el contexto se está llenando**, terminá la parte en curso y detenete con un mensaje claro:
"Etapa 8 detenida al terminar la parte X. Siguiente: parte Y". No dejes una parte a medias.

---

## PARTE A — Mejoras generales

### A1. La prensa como techo sólido en reposo

Hoy, si el robot salta debajo de la prensa en `idle` o `warning`, su cabeza atraviesa el bloque. El salto llega a
y ≈ 183 y el bloque descansa en y = 270.

- **Clase base `Trap`**: agregá un getter `solidRects`, que devuelve un arreglo vacío por defecto. La prensa lo sobrescribe
  y devuelve su bloque en `idle` y `warning`, cuando está quieta.
- **`trap-system`**: escribe `world.dynamicSolids` en cada paso, igual que `dynamicHazards`.
- **`world.getAllSolids()`**: los incluye. Así el robot choca la cabeza (contacto `ceiling`) y los disparos se detienen en el
  bloque.
- **En `slam`, `hold` y `rise`**: el bloque deja de ser sólido y sigue siendo peligro, como hoy.
- **Verificación**: saltar bajo la prensa en reposo hace chocar la cabeza; pasar caminando sigue funcionando; la tabla de
  física no cambia.

### A2. IDs que sueltan algunas criaturas

- **Datos**: un enemigo puede llevar `dropsCrewId: '<id>'` (opcional).
- **Evento**: `enemy:destroyed` pasa a enviar `{ x, y, dropsCrewId }`, donde `x` e `y` son los pies de la criatura.
  Actualizá a quien ya lo escucha sin romperlo.
- **`pickup-system`**: escucha ese evento. Si trae `dropsCrewId` y la sesión todavía no lo tiene, crea un `Pickup` de tipo
  `crew-id` en `world.crewIdPickups`, unos 60 px sobre los pies de la criatura.
  - No dupliques la creación de pickups: reutilizá la misma función que usa `scene-world` para los IDs de los datos.
- **Vista**: el ID aparece con un pequeño salto hacia arriba y luego queda flotando como los demás (animación CSS nueva
  `is-dropped`, sección de coleccionables).
- **Reinicio**: si el robot pierde un intento, la instantánea del nivel restaura los IDs y la criatura vuelve con su tarjeta.
  Comprobalo.
- Un ID que se suelta **no** aparece además en `crewIds` de los datos de esa escena.

### A3. Pantallas de historia entre niveles

- **Estado nuevo `story`** (con `change`), en `js/states/story-state.js`:
  - aparece al empezar una **partida nueva**, antes del nivel 1;
  - aparece al **continuar** desde "nivel completado", antes del nivel siguiente;
  - **no** aparece al perder un intento ni al reiniciar el nivel.
- **Datos**: cada nivel declara `story: { title, lines: [...] }`. Textos exactos (no los cambies):
  - Nivel 1:
    - título: "Nivel 1 · Bahía de carga";
    - líneas: "Sistema reactivado. Batería al 100 %." / "La estación no responde. Solo llega una señal débil que se repite." / "Origen: más adentro."
  - Nivel 2:
    - título: "Nivel 2 · Laboratorio";
    - líneas: "La señal se hace más fuerte." / "Las puertas del laboratorio fueron forzadas desde adentro." / "Un rastro verde cruza el pasillo."
- **Vista** (`index.html` + `css/screens.css`, reutilizando las clases de pantalla existentes):
  - fondo negro con la primera escena del nivel muy oscurecida;
  - título con `--font-display`;
  - las líneas aparecen una por una con un fundido; el retraso de cada línea se resuelve en CSS con `:nth-child`;
  - abajo, "Enter / E para continuar" y un botón **Continuar**.
- **Imagen de fondo**: pasala como variable CSS `--story-image`, con la misma excepción documentada que `--scene-image`.
- **Tiempos**: usan las reglas de `MESSAGES`, igual que el panel de los IDs.
  - Duración = `clamp(caracteres / readingCharsPerSecond, readingMin, readingMax)`.
  - `confirm` solo funciona después de `closeDelay`.
  - Se cierra sola al terminar el tiempo.
  - La tecla que la cierra no debe llegar al juego como salto ni disparo.
- **`reduced-motion`**: las líneas aparecen sin fundido.
- **Preferencia**: si `showTutorial` está apagado, la historia **sí** se muestra. Es narrativa, no tutorial.

### A4. Paleta por nivel

- **Datos**: cada nivel declara `theme`: `'cargo'` para el nivel 1 (ámbar) y `'lab'` para el nivel 2 (gris azulado).
- **Aplicación**: `PlayingState` y `StoryState` escriben `data-theme` en `.game`.
- **CSS**: en `base.css`, cada tema redefine **solo** `--color-level-accent`, usado por:
  - el nombre del nivel en el HUD;
  - el título de la historia;
  - el título de "nivel completado".
- Verde (`--color-acid`) solo para el ácido.

---

## PARTE B — Trampa nueva: goteo de ácido (`js/traps/acid-drip.js`)

- **Fases**: `idle → warning → fall → splash → idle`.
  - **`warning`**: una gota verde crece en la boca de la tubería. Es el aviso, y no daña.
  - **`fall`**: la gota cae acelerando desde la tubería hasta `bottom`. Es peligro: el rectángulo de la gota en su
    posición actual.
  - **`splash`**: salpicadura breve en `bottom`. Es peligro: un rectángulo de `splashWidth` de ancho, centrado y bajo.
- **Datos**: `{ type: 'acid-drip', x, top, bottom }`.
  - `top` = boca de la tubería, medida en la imagen.
  - `bottom` = superficie donde cae.
  - `phaseOffset` opcional.
- **Zona** (`zone`): la columna completa de `top` a `bottom`, del ancho de la salpicadura.
- **Constantes**:
  ```js
  TRAPS.acidDrip = { idleTime: 1.2, warningTime: 0.8, fallGravity: 2400, splashTime: 0.25, dropSize: 14, splashWidth: 40 }
  ```
  La duración de `fall` sale del cálculo físico: `√(2·distancia/gravedad)`. No es una constante aparte.
- **Vista** (CSS):
  - gota con degradado `--color-acid` y brillo;
  - gota que crece con `scale` en `warning`;
  - salpicadura con pseudo-elementos que se abren;
  - un leve resplandor verde en la boca de la tubería.
  - Registrala en `trap-factory.js`.
- **`reduced-motion`**: sin salpicadura animada; la gota en `warning` se muestra fija.

---

## PARTE C — Datos del nivel 2 (`js/levels/level2.js`) y registro

Copiá los datos. Son aproximados: compará cada medida con la imagen en depuración. Si alguna difiere en más de ~10 px,
corregila y anotala en el reporte.

Lo que no está en la lista (posición de tuberías y emisores, puerta de la escena 2) se mide en la imagen.

### N2E1 — Entrada y descontaminación (`n2e1`)

- **Spawn**: `{ x: 80, y: 502 }` (junto a la puerta izquierda).
- **Sólidos**:
  - pisos `0–345` top `502` y `578–1385` top `502`;
  - escalones `1085–1195` top `432`, `1195–1255` top `395` y `1255–1370` top `360`;
  - plataforma elevada `1385–1780` top `364`, con cajas `1400–1500` top `305` y `1555–1695` top `280`;
  - piso `1765–2172` top `502`;
  - caja `1785–1925` top `422`.
- **Peligro**: charco de ácido `345–578`, top `522`, `type: 'acid'`. La superficie está en 516; se agregan 6 px de margen,
  como en las púas.
- **Trampas**: láseres intermitentes en x ≈ 800 y x ≈ 960 sobre el piso (`bottom: 502`), con `phaseOffset` distinto
  para que no se sincronicen.
- **Criatura**: patrulla `620–1070` sobre el piso, con `dropsCrewId: 'marco-ibarra'`.
- **Celda**: `{ x: 1625, y: 240 }` (sobre la caja alta).
- **Salida**: `edge`.

### N2E2 — Sala de tanques inundada (`n2e2`)

- **Spawn**: `{ x: 80, y: 498 }`.
- **Puerta de entrada**: hay una puerta a la izquierda en el dibujo. Agregá una decoración `{ type: 'opening-door', x1, x2,
  top, bottom }` medida en la imagen. Al entrar a la escena, dos hojas metálicas hechas con CSS se abren hacia los lados,
  una sola vez y sin bloquear el paso.
- **Sólidos**:
  - piso `0–285` top `498`;
  - pilares `405–505` top `497`, `619–717` top `458` y `830–932` top `497`;
  - plataforma ancha `1245–1785` top `373`;
  - escalones `1785–1850` top `418` y `1850–1905` top `461`;
  - piso `1905–2172` top `498`.
- **Peligro**: lago de ácido `285–1765`, top `576`, `type: 'acid'`.
- **Trampa**: goteo de ácido sobre el pilar central, x ≈ 668, con `bottom: 458`.
- **Plataforma móvil en diagonal**: de `(960, 470)` a `(1180, 400)`, ancho 110.
- **Criatura**: patrulla `1290–1740` sobre la plataforma ancha, sin ID.
- **ID**: `elena-ruiz` en `{ x: 668, y: 420 }`. Está sobre el pilar central, debajo del goteo: la recompensa exige leer
  el aviso.
- **Celda**: `{ x: 1100, y: 380 }`, sobre el recorrido de la plataforma diagonal.
- **Salida**: `edge`.

### N2E3 — Núcleo de contención (`n2e3`)

- **Spawn**: `{ x: 80, y: 509 }`.
- **Sólidos**:
  - piso `0–465` top `509`;
  - salientes `553–650` top `522`, `750–840` top `466` y `945–1035` top `417`;
  - pasarela `1122–1595` top `390`;
  - plataforma de salida `1845–2172` top `320`.
- **Peligro**: lago de ácido `465–1938`, top `612`, `type: 'acid'`.
- **Trampa**: láser intermitente sobre la saliente `945–1035` (x ≈ 990, `bottom: 417`).
- **Plataforma móvil horizontal**: top 360, recorre de x 1620 a x 1800, ancho 100.
- **Criaturas** (dos, sobre la pasarela):
  - patrulla `1160–1360`, con `dropsCrewId: 'samuel-okoro'`;
  - patrulla `1380–1560`, sin ID.
- **Celda**: `{ x: 795, y: 430 }`.
- **Salida**: `{ type: 'door', x1: 1980, x2: 2145, top: 160, bottom: 320 }`.

### Registro y flujo

- Agregá `LEVEL_2` a `LEVELS`.
- Al completar el nivel 1, "Continuar" lleva a la historia del nivel 2 y luego a N2E1.
- Al completar el nivel 2, mantené el comportamiento provisional de volver al menú, con el comentario `// Provisional:
  nivel 3 en la etapa 9`.

### Verificación de recorrido

Escribila en el reporte, salto por salto, con los valores del verificador de física. Confirmá:

- **N2E1**:
  - el charco de 233 px se cruza con doble salto;
  - hay espacio seguro entre los dos láseres (o justificá por qué no hace falta);
  - la criatura no entra en el charco.
- **N2E2**:
  - cada salto entre pilares es posible con salto simple;
  - la plataforma diagonal conecta el tercer pilar con la plataforma ancha en algún punto de su recorrido;
  - el ID del pilar central se puede tomar en una ventana segura del goteo.
- **N2E3**:
  - cada saliente se alcanza;
  - el hueco de 250 px con subida de 70 **no** se cruza sin la plataforma móvil;
  - con la plataforma sí se cruza.

Si algo falla, ajustá **datos o tiempos de trampas**, nunca la física, y explicalo.

---

## Al terminar

1. Actualizá `CLAUDE.md`:
   - etapa 8 ✅;
   - archivos nuevos;
   - claves nuevas de datos (`dropsCrewId`, `story`, `theme`, `opening-door`, trampa `acid-drip`);
   - `solidRects` en las trampas;
   - estado `story` en la máquina de pantallas;
   - excepción `--story-image`.
2. Actualizá `docs/`:
   - `ESTADOS.md`: estado `story` en el diagrama de pantallas y fases del goteo;
   - `EVENTOS.md`: nueva carga de `enemy:destroyed`;
   - `DATOS-DE-NIVEL.md`: todas las claves nuevas con ejemplo;
   - `ARQUITECTURA.md`, si cambió algo.
3. Reporte en español:
   - archivos creados y modificados;
   - medidas corregidas frente a las imágenes;
   - recorrido completo con números;
   - decisiones y su porqué;
   - lista de pruebas:
     - historia al empezar y entre niveles (no al morir);
     - tiempos de lectura y Enter/E sin saltar;
     - tema de color por nivel;
     - prensa como techo;
     - criatura que suelta el ID, y el ID restaurado tras perder un intento;
     - goteo: aviso, caída, salpicadura y ventana segura;
     - plataforma diagonal;
     - puerta animada de N2E2;
     - las 3 escenas del nivel 2 con las teclas 1–3;
     - "IDs de este nivel: x/3" en nivel completado;
     - `listenerCount` estable;
     - consola sin errores.
