# Etapa 4.2 — Ajustes de sprites: correr, espantapájaros, doble salto y aura de daño

Leé `CLAUDE.md` antes de empezar. Son 4 cambios puntuales. No toques nada fuera de ellos, salvo para eliminar lo que quede obsoleto.

## 1. Nueva tira de correr: `assets/sprites/robot_correr.png`

- **Formato**: 828 × 244 px, con **3 frames en una fila**, en celdas de **276 × 244**. Es la misma celda y la misma escala
  que `robot.png`: cada frame se ve de 138 × 122 en el mundo.
- **Normalización**: ya está hecha (pies en el borde inferior de la celda, casco centrado). No la proceses.
- **Animación**: correr usa esta tira en bucle 1 → 2 → 3, con la constante de fps de correr que ya existe en `config.js`.
  - Mismo elemento del sprite: el estado "corriendo" cambia `background-image` a esta tira, con
    `background-size: 300% 100%` y una animación `steps()` sobre la posición horizontal.
  - Reutilizá la clase o regla compartida de selección de frames; no dupliques estilos.
- **Balanceo vertical**: eliminá el balanceo CSS al correr. La tira ya trae el movimiento vertical dibujado y sumarlos
  se vería exagerado. Borrá sus keyframes si nadie más los usa.
- **Frames 2 y 3 de `robot.png`**: dejan de usarse. La imagen no se modifica, porque recortarla movería los demás frames.
  Eliminá toda regla CSS, constante o lógica que los referencie.
- **Prioridad de estados**: no cambia, "corriendo" sigue en el mismo lugar.

## 2. Espantapájaros flotando

- **Error**: el sprite está apoyado en el borde inferior de la **hitbox**. Pero la hitbox termina más arriba que la base del
  poste, así que el dibujo queda flotando a unos 36 px del piso.
- **Corrección**: el borde inferior del **sprite** debe coincidir con el `y` de los datos (la base del poste). La hitbox
  queda dentro del sprite: 6 px bajo su borde superior y de 90 px de alto.
- **Cálculo**: la distancia entre el fondo de la hitbox y el fondo del sprite se calcula a partir de las constantes
  existentes (alto del sprite − desplazamiento superior − alto de la hitbox). No la escribas como 36 fijo.
  - Si el CSS la necesita, `Game` la escribe una vez como variable CSS, como las demás.
- **Verificación**: en depuración, la base del poste toca la franja del piso y el rectángulo de la hitbox cubre el cuerpo de paja.

## 3. Doble salto

- **Animación**: el doble salto usa los **mismos frames que el salto normal**: frame 4 mientras sube y frame 5 mientras cae.
- **Eliminar por completo** el giro y el destello cian del doble salto: keyframes, clases, constantes de `config.js` y
  cualquier temporizador o getter creado solo para eso.
- **Se mantiene**: el evento `player:double-jump`, porque lo usa el tutorial.

## 4. Aura roja al recibir daño

- **Efecto**: al recibir daño, el robot muestra un aura roja durante `PLAYER_FEEDBACK.hurtAuraDuration` (nuevo en
  `config.js`, valor inicial `2` segundos), además del frame de daño y el parpadeo actuales.
- **Lógica**: un getter `hasHurtAura` en `Player`, basado en el `Timer` existente. Se reinicia con cada golpe.
- **Vista**: la clase `has-hurt-aura`, que se combina con cualquier frame (no forma parte de la prioridad de estados).
  - **CSS**: reemplaza el contorno cian por un `drop-shadow` rojo (`--color-alarm`) que pulsa suavemente y se desvanece
    al terminar.
  - **Con `reduced-motion`**: aura fija, sin pulso.

## Limpieza

- Mismas reglas estrictas de la etapa 4.1: sin código comentado, sin TODOs, sin `console.log`, sin variables,
  constantes ni keyframes sin uso, sin duplicación.
- Después de los cambios, buscá en todo el proyecto referencias a lo eliminado (giro del doble salto, balanceo de
  correr, frames 2 y 3 de `robot.png`) y mostrá que el resultado está vacío.

## Al terminar

1. Actualizá `CLAUDE.md`:
   - tira de correr (archivo, celdas, orden);
   - frames de `robot.png` que siguen en uso;
   - doble salto con frames 4/5;
   - aura de daño;
   - alineación del espantapájaros.
2. Reporte en español: archivos modificados, qué se eliminó y pruebas:
   - correr en ambas direcciones sin saltos de posición entre frames;
   - pasar de correr a reposo, a salto y a ataque;
   - el doble salto solo con frames 4/5;
   - el aura roja con H en depuración, que dura 2 s y se reinicia con otro golpe;
   - el espantapájaros apoyado en el piso y recibiendo impactos;
   - consola sin errores.
