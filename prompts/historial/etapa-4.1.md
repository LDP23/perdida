# Etapa 4.1 — Sprites nuevos del robot y del espantapájaros + limpieza total

Contexto: se reemplazaron los sprites y en la prueba **el robot es invisible**. Esta etapa:

1. corrige eso;
2. integra la hoja de animaciones del robot y el espantapájaros;
3. deja el proyecto sin código ni archivos basura.

Leé `CLAUDE.md` antes de empezar.

## Archivos de imagen (ya procesados, usalos tal cual)

En `assets/sprites/` ya están las versiones definitivas, que reemplazan a cualquier otra anterior.
No las vuelvas a procesar ni a redimensionar.

| Archivo | Tamaño | Detalle |
|---|---|---|
| `robot.png` | 828 × 732 px | Hoja de **3 × 3 celdas de 276 × 244 px**. Exportada al doble: cada celda se ve de **138 × 122 en el mundo**. Ya normalizada: todos los frames apoyan los pies en el **borde inferior de la celda** y tienen el **casco centrado horizontalmente**. Si un frame "salta" al animarse, el error está en el código, no en la imagen. |
| `espantapajaros.png` | 228 × 264 px | Exportado al doble: se ve de **114 × 132 en el mundo**, con la base del poste en el borde inferior. |

Importante: las medidas 780 × 762 y 260 × 254 que circularon antes **son incorrectas**. Usá solo las de esta tabla.

## Forma de trabajar

1. **Diagnóstico** (sin editar nada):
   - Explicá por qué el robot es invisible hoy: ruta de imagen, `background-size` o `background-position`,
     tamaño del elemento, una animación de opacidad atascada u otra causa.
   - Decime dónde se dibuja y anima el robot, dónde está el maniquí, y qué archivos, clases, estilos, keyframes,
     constantes, funciones e imágenes quedan obsoletos.
   - Confirmá que existen los dos archivos de la tabla y que miden lo indicado.
2. **Inventario de basura** de TODO el proyecto (ver la sección Limpieza), presentado como lista.
3. **Plan breve. Esperá mi aprobación** antes de editar.
4. Implementá.
5. Limpieza y búsqueda final de referencias.
6. Reporte (ver el final).

---

## 1. Robot (`robot.png`)

### Hoja de sprites

- **Orden de los frames** (izquierda a derecha, arriba a abajo):
  1. reposo
  2. correr A
  3. correr B
  4. subiendo
  5. cayendo
  6. ataque
  7. daño
  8. arrodillado
  9. tirado
- **Tamaño del sprite**: 138 × 122 en el mundo, con `background-size: 300% 300%`. La columna y la fila se eligen con
  `background-position` en porcentajes (0%, 50%, 100%).
- **Selección del frame**: la vista escribe UNA variable CSS (`--frame`) o UNA clase de estado. El CSS traduce eso a
  `background-position`.
  - Nada de estilos en línea, salvo variables CSS.
  - La alternancia de correr (2 ↔ 3, unos 8 fps) es una animación CSS con `steps()`, sin temporizador en JS.
- **Posición**: el sprite queda centrado horizontalmente sobre la hitbox y apoyado en su borde inferior.
- **Dirección**: el robot mira a la derecha; a la izquierda se voltea con `scaleX(-1)`, como hoy.

### Prioridad de estados

La decide una sola función en `js/view/player-view.js`, que devuelve un único estado visual. Nunca puede haber dos
frames en conflicto. De mayor a menor prioridad:

`muerto > reapareciendo > daño > ataque en el suelo > subiendo/cayendo > corriendo > reposo`

### Animaciones

- **Correr**: frames 2 y 3 alternados, más el balanceo vertical existente.
- **Saltar**:
  - frame 4 al subir y frame 5 al caer;
  - estirar al despegar y aplastar al aterrizar (ya existen: reutilizalos).
  - **Doble salto**: frame 4 con un giro rápido y un destello cian.
- **Ataque**: frame 6 durante unos 0.15 s al disparar en el suelo, con fogonazo hecho en CSS en la boca del cañón.
  En el aire se mantiene el frame del salto y solo se muestra el fogonazo.
- **Daño**:
  - frame 7 durante unos 0.3 s, parpadeo rojo/blanco, empuje hacia atrás y sacudida de pantalla;
  - luego, alrededor de 1 s de invulnerabilidad parpadeando (ya existe: reutilizalo).
- **Muerte** (batería en 0): frame 8, luego frame 9, con chispas, humo y el visor apagándose, todo en CSS.
- **Reaparecer**: frame 8 con materialización de líneas cian de abajo hacia arriba (`clip-path` + líneas con degradado),
  luego frame 1. Ocurre al iniciar una partida y después de cada muerte.
  - Volver al punto seguro tras un peligro **no** usa esta secuencia: solo el parpadeo de invulnerabilidad.

### Reglas de juego asociadas

- **Empuje**:
  - Solo se aplica con daño que tenga origen (enemigo o proyectil, y la tecla H de depuración). Su dirección es
    opuesta al origen; con H, opuesta a hacia donde mira el robot.
  - El daño de peligros (púas, caída) **nunca** empuja: el robot vuelve al punto seguro.
  - Mientras dura el frame de daño, el control horizontal queda bloqueado.
- **Sacudida de pantalla**: una clase en `.game` con una animación CSS sobre el viewport. Se desactiva con la opción
  `screenShake` (clase `no-shake`).
- **Muerte**: la jugabilidad se congela. La recarga del nivel, o el Game Over, ocurre **recién cuando termina la
  secuencia**. La pausa funciona durante la secuencia y la retoma donde estaba.
- **Reaparición**: la entrada del jugador queda desactivada hasta que termina.
- **Movimiento reducido** (`reduced-motion`):
  - sin giro, balanceo, sacudida ni estirar/aplastar;
  - los cambios de frame se mantienen, porque comunican estado;
  - el parpadeo es más lento.

### Hitbox y disparo

- **Hitbox**: `PLAYER.width = 48`, `PLAYER.height = 112`, **sin cambios**. Se verificó contra los 9 frames de la hoja
  nueva y cubre el cuerpo en todas las poses.
  - Si en depuración ves una diferencia clara, el ancho solo puede moverse entre **40 y 54 px**: fuera de ese rango
    se rompen los huecos diseñados (ver Verificación).
- **Boca del cañón**: `SHOOT.muzzleOffset = { x: 58, y: 49 }`, medida en el frame 6 de la hoja nueva.
  `x` se mide desde el centro de la hitbox hacia donde mira el robot, y `y` desde su borde superior.
  El fogonazo y el disparo salen de ese punto.

### Íconos de intentos del HUD

Usan el **frame 1 de `robot.png`** con la misma regla CSS de selección de frame que el robot. Extraé una clase
compartida para no duplicar `background-size` ni posiciones.

### Configuración

Todas las duraciones, fps, tamaños, el empuje y la sacudida van en `config.js`. Si el CSS necesita alguno,
`Game` lo escribe UNA vez como variable CSS (igual que `--collect-duration`). Ningún número repetido entre CSS y JS.

---

## 2. Espantapájaros (`espantapajaros.png`)

- Reemplaza la diana dibujada con CSS. Se ve de 114 × 132 en el mundo, con la base del poste en el `y` de los datos (los pies).
- **Hitbox**: 100 × 90, centrada horizontalmente, con su borde superior 6 px debajo del borde superior del sprite.
  Cubre cabeza, cuerpo de paja y brazos, y deja afuera el poste y las puntas de paja. Medidas en `config.js`.
  - El disparo sale a 63 px sobre el piso, así que impacta en el cuerpo. Comprobalo en depuración.
- **Comportamiento**: igual que hoy.
- **Al recibir un disparo**: reutilizá el destello y la etiqueta "Impactos: n" que ya existen, y agregá una sacudida
  corta con `translate`. Es un objeto, así que está permitida.

---

## 3. Limpieza (estricta, sin excepciones)

### Inventario (antes del plan)

Recorré TODO el proyecto y listá:

- **Imágenes sin referencias**: `robo.webp`/`robo.png`, versiones `.png` duplicadas de imágenes que ya tienen `.webp`
  en uso o al revés, originales sobrantes en `assets/source/` y cualquier otra.
- **Archivos sin uso**: `.bak`, copias, pruebas sueltas, logs, carpetas vacías.
- **CSS muerto**: clases, keyframes y variables que ningún HTML ni JS usa, incluida la diana CSS del maniquí y las
  reglas del sprite anterior del robot.
- **JS muerto**:
  - exports nunca importados e imports sin usar;
  - funciones, métodos, constantes de `config.js`, parámetros o variables sin uso;
  - eventos emitidos que nadie escucha y suscripciones a eventos que nadie emite.
- **Duplicaciones**: lógica repetida que ya tenga una versión compartida (temporizadores, colisiones, creación de
  elementos, selección de frames, estilos repetidos).
- **Entradas obsoletas en `tools/process_assets.py`**: por ejemplo, la entrada de `robo.png`.

### Qué se elimina sin preguntar y qué no

- Todo lo que quede obsoleto **por esta tarea** se elimina directamente.
- Lo que está sin uso pero **no tiene relación con esta tarea** (por ejemplo `main_enemy.webp`, que se usará en la
  etapa de enemigos): listalo en el plan con una recomendación y eliminá solo lo que yo apruebe.

### Prohibido

- código comentado;
- TODOs;
- `console.log` de depuración;
- variables o parámetros sin usar;
- funciones vacías;
- código "por si acaso";
- compatibilidad con el sprite anterior;
- abstracciones usadas una sola vez;
- números mágicos.

### Después de eliminar

Buscá en todo el proyecto (HTML, CSS, JS, `CLAUDE.md`, README) que no quede **ninguna** referencia a lo eliminado.
Mostrá en el reporte las búsquedas realizadas y su resultado vacío.

### Respetar

- La arquitectura y las convenciones de `CLAUDE.md`.
- No modifiques código no relacionado, salvo para eliminar basura aprobada.
- Nombres en inglés; comentarios en español, breves, solo para explicar el porqué.
- Funciones cortas, con una responsabilidad.

---

## 4. Verificación de física

- En `tools/physics-check.js`, los requisitos deben **calcularse a partir de `PLAYER.width`**, no estar escritos como
  números fijos:
  - un hueco es cruzable si el recorrido es ≥ (hueco − ancho);
  - es imposible si el recorrido es < (hueco − ancho).
- **Huecos**:

  | Hueco | Medida | Debe ser |
  |---|---|---|
  | Púas N1E1 | 228 | cruzable |
  | Ácido N2E1 | 233 | cruzable |
  | Foso N1E3 | 290 | imposible |
  | Hueco N2E3 | 250, con subida de 70 | imposible |

- Mostrá en el reporte la tabla que produce el verificador, aunque no puedas abrir un navegador: calculá los valores
  con la misma lógica.

## 5. `CLAUDE.md`

- Eliminá la regla "no tocar animaciones de movimiento hasta tener los sprites".
- Documentá:
  - la hoja del robot (archivo, celda, escala 1/2, orden de frames, normalización del piso y del casco);
  - la prioridad de estados visuales;
  - el espantapájaros (tamaño e hitbox);
  - `SHOOT.muzzleOffset`.
- Eliminá cualquier mención a `robo.png`/`robo.webp`. Los sprites viven en `assets/sprites/`.
- Actualizá la arquitectura con los archivos eliminados y creados.
- Agregá esta etapa como **4.1 ✅**.

---

## Reporte final (en español)

1. Causa de la invisibilidad.
2. Archivos modificados.
3. Archivos eliminados.
4. Qué se eliminó dentro de cada archivo modificado: clases, keyframes, funciones, constantes.
5. Búsquedas de referencias con resultado vacío.
6. Valores de la hitbox y tabla del verificador (✅/❌).
7. Lista numerada de pruebas manuales que cubra:
   - robot visible al iniciar, con la materialización;
   - cada frame: reposo, correr, subir, caer, ataque en el suelo y en el aire, daño con H, muerte, reaparecer;
   - doble salto con giro;
   - que ningún frame "salte" de posición;
   - el robot mirando a la izquierda;
   - las púas sin empuje;
   - sacudida desactivada con la opción;
   - pausa durante la muerte;
   - Game Over después de la animación;
   - íconos del HUD;
   - espantapájaros: impactos, sacudida y que el disparo pegue en el cuerpo;
   - consola sin errores.
