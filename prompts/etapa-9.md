# Etapa 9 — Nivel 3: Puente de mando (escenas y trampas nuevas)

Prerrequisito: etapa 8 terminada y probada.

El cierre del juego (consola del capitán, cápsula de escape y pantalla de victoria) es la **etapa 9.1**: no lo hagas ahora.
Todo el código nuevo sigue el **estándar de documentación de `CLAUDE.md`**, y `docs/` se actualiza.

Leé `CLAUDE.md`, `docs/ARQUITECTURA.md` y `docs/DATOS-DE-NIVEL.md`, y después cada archivo que vayas a tocar,
completo, antes de editarlo. Mirá `assets/scenes/nivel3_escena1.webp`, `nivel3_escena2.webp` y `nivel3_escena3.webp`.

## Reglas

- No modifiques las constantes de PLAYER ni de PHYSICS.
- La única modificación permitida al motor de física es la de la Parte C.
- No instales nada.
- Prohibido:
  - código comentado;
  - TODOs;
  - `console.log`;
  - `setTimeout`/`setInterval` en la lógica;
  - código, constantes, clases o keyframes sin uso;
  - duplicación;
  - abstracciones usadas una sola vez.
- **Las trampas no aplican daño ni crean entidades**:
  - exponen `dangerRects`, `solidRects` y `zone`;
  - cuando necesitan crear algo, emiten un evento;
  - cada sistema hace su parte.

## Forma de trabajar

Cuatro partes, en orden; el juego funciona al final de cada una.

Si el contexto se llena, terminá la parte en curso y detenete con este mensaje:
"Etapa 9 detenida al terminar la parte X. Siguiente: parte Y".

---

## PARTE A — Chispas eléctricas y láser de barrido

### A1. Chispas eléctricas — `js/traps/electric-sparks.js`

- **Fases**: `idle → warning → discharge → idle`.
  - `warning`: chispas pequeñas y aisladas en el panel. Es el aviso.
  - `discharge`: una descarga que cubre un área desde el piso hacia arriba. Es peligro.
- **Datos**: `{ type: 'sparks', x, bottom, width?, height? }`. Ancho y alto por defecto desde `config.js`.
- **Constantes**:
  ```js
  TRAPS.sparks = { idleTime: 1.6, warningTime: 0.7, dischargeTime: 0.5, width: 90, height: 120 }
  ```
- **Vista** (CSS):
  - una caja de conexiones en la base;
  - en `warning`, puntos cian que parpadean al azar (varios pseudo-elementos con `animation-delay` distintos);
  - en `discharge`, arcos eléctricos hechos con `clip-path` en zigzag y un destello azul-blanco.

### A2. Láser de barrido — `js/traps/sweeping-laser.js`

- **Comportamiento**: un rayo vertical recorre una plataforma de lado a lado.
- **Fases**: `warning-left → sweep-right → pause-right → warning-right → sweep-left → pause-left`.
  - `warning-*`: el hilo delgado parpadea en el extremo donde va a arrancar. No daña.
  - `sweep-*`: el rayo completo se mueve a velocidad constante. Es peligro.
  - `pause-*`: apagado.
- **Datos**: `{ type: 'sweep-laser', x1, x2, top, bottom }`.
- **Constantes**:
  ```js
  TRAPS.sweepLaser = { speed: 160, warningTime: 0.6, pauseTime: 1.2, beamWidth: 10 }
  ```
  - La velocidad debe ser **menor** que `PLAYER.runSpeed`. Así el jugador puede seguir al rayo por detrás y pasarlo
    durante la pausa.
  - La duración de cada barrido se calcula: `(x2 − x1) / speed`.
- **Vista**: reutilizá los estilos del láser intermitente (rayo, emisor, chispas en el punto de contacto). Extraé la parte
  común en `traps.css` en lugar de copiarla. Agregá un riel horizontal en `top` por donde se mueve el emisor.

---

## PARTE B — Torreta y proyectiles enemigos

### B1. Proyectiles generalizados

- `Projectile` pasa a recibir `{ x, y, direction, speed, width, height, maxDistance, owner }`, donde
  `owner` es `'player'` o `'enemy'`.
  - Los disparos del robot siguen usando `SHOOT`, sin cambios de comportamiento.
- **Vista**: `.entity--projectile` y una variante `.is-enemy`: una esfera roja pulsante, más lenta y visible que el disparo
  del robot.
- **`combat-system`**:
  - los proyectiles `player` impactan disparables, igual que hoy;
  - los proyectiles `enemy` impactan al robot y ambos mueren contra sólidos.
  - El daño de un proyectil enemigo es `player.takeHit(TRAPS.turret.projectileDamage)` **sin origen**, así que no hay empuje.
    Motivo: la torreta apunta a salientes estrechas sobre el vacío y un empuje tiraría al robot a la brecha.
  - Una sola colección de proyectiles para ambos dueños.

### B2. Torreta — `js/traps/turret.js`

- Es una trampa y además implementa la interfaz `shootable` (`hitbox`, `onShot`). La destruye el disparo del robot.
- **Fases**: `idle → aiming → fire → cooldown`.
  - `aiming`: la luz roja de apuntado parpadea cada vez más rápido. Es el aviso.
  - `fire`: emite `turret:fire { x, y, direction }` una vez, y `combat-system` crea el proyectil `enemy`.
  - `cooldown`.
- **Vida**: `TRAPS.turret.health` disparos.
  - Cada impacto produce un destello.
  - Al destruirse:
    - emite `turret:destroyed { x, y }`;
    - `combat-system` suma `SCORE.turret`;
    - la torreta queda como chatarra apagada (sin peligro y sin ser disparable).
- **Datos**: `{ type: 'turret', x, y, direction }`. `x`, `y` es la boca del cañón; `direction` vale `-1` para disparar a la izquierda.
- **Constantes**:
  ```js
  TRAPS.turret = { idleTime: 1.0, aimTime: 0.9, cooldownTime: 0.8, health: 2,
                   projectileSpeed: 200, projectileSize: 16, projectileDamage: 12, maxDistance: 1800 }
  ```
- **Vista** (CSS):
  - base atornillada a la pared;
  - cañón;
  - luz de apuntado;
  - destello en la boca al disparar;
  - estado destruido con humo leve.

---

## PARTE C — Descompresión

### C1. Fuerza externa en la física (única excepción permitida)

- `createBody` agrega `externalVx = 0` (px/s).
- `stepBody` suma `externalVx` al desplazamiento horizontal del paso, sin tocar `vx`. Así no interfiere con la aceleración
  ni el frenado del robot.
- Con `externalVx = 0` el resultado es idéntico al actual. Corré `tools/physics-check` y confirmá que la tabla no cambia.
- Documentá en `docs/FISICA.md` por qué la fuerza es una velocidad externa y no se mezcla con `vx`.

### C2. Trampa de descompresión — `js/traps/decompression.js`

- **No daña**:
  - `dangerRects` es siempre un arreglo vacío;
  - su `zone` sí cuenta para el punto seguro, para que el robot nunca reaparezca dentro de la corriente.
- **Datos**: `{ type: 'decompression', x1, x2, top, bottom, pullX }`.
  - `pullX` es el centro de la brecha. La fuerza empuja hacia ese punto desde ambos lados.
- **Getter `pullFor(body)`**: devuelve la velocidad externa (px/s) para un cuerpo:
  - 0 fuera de la zona;
  - `TRAPS.decompression.strength` dentro, con signo hacia `pullX`.
- **`trap-system`**: después de actualizar las trampas, asigna a `world.player.body.externalVx` la suma de los `pullFor`
  (0 si no hay ninguno). Se aplica en el paso siguiente.
- **Constantes**:
  ```js
  TRAPS.decompression = { strength: 80 }
  ```
  - Debe ser bastante menor que `PLAYER.runSpeed`: el robot resiste caminando en contra, pero si se queda quieto en la
    orilla, lo arrastra.
- **Vista** (CSS, sin JS por partícula): dos mitades con rayas que viajan hacia `pullX`, hechas con
  `repeating-linear-gradient` animado, de baja opacidad.
- **`reduced-motion`**: rayas estáticas con flechas.

---

## PARTE D — Datos del nivel 3 (`js/levels/level3.js`) y registro

Copiá los datos y compará cada medida con la imagen en depuración. Corregí lo que difiera en más de ~10 px y anotalo
en el reporte.

Las piezas que flotan sobre el vacío (salientes, pasarelas, base del transmisor) llevan `bottom` según su grosor
visible. Las brechas no tienen piso: caer cuenta como peligro (regla existente).

**Nivel**:

- `id: 3`;
- `theme: 'bridge'` (azul estelar y rojo; agregalo en `base.css`);
- historia (texto exacto):
  - título: "Nivel 3 · Puente de mando";
  - líneas: "La señal sale del puente de mando." / "Hay grietas abiertas al espacio: el vacío arrastra todo lo que no se sujeta." / "La cápsula de escape sigue en línea."

### N3E1 — Corredor del puente (`n3e1`)

- **Spawn**: `{ x: 80, y: 472 }`.
- **Sólidos**:
  - piso `0–383` top `472`;
  - piso `805–1406` top `472`;
  - escalones `1405–1449` top `427` y `1448–1494` top `393`;
  - plataforma elevada `1494–1896` top `356`;
  - escalones `1893–1941` top `393` y `1939–1988` top `427`;
  - piso `1983–2172` top `472`.
- **Brecha**: `383–805`. Plataformas que caen en x ≈ 520 y x ≈ 680, top ≈ 455, ancho 80.
- **Trampas**:
  - descompresión `x1: 300, x2: 900`, con `pullX` en el centro de la brecha;
  - chispas en x ≈ 1100 sobre el piso;
  - láser de barrido de 1510 a 1880 sobre la plataforma elevada (`bottom: 356`).
- **Criatura**: patrulla `850–1350`, con `dropsCrewId: 'nadia-varga'`.
- **Celda**: `{ x: 950, y: 432 }`.
- **Salida**: `edge`.

### N3E2 — Sala de comunicaciones (`n3e2`)

- **Spawn**: `{ x: 80, y: 430 }`.
- **Sólidos**:
  - piso `0–640` top `430`. Desde x 390 no tiene franjas en el dibujo, pero es sólido;
  - base del transmisor `575–760` top `370`;
  - saliente `763–871` top `374`;
  - pasarela `1047–1337` top `290`;
  - saliente `1499–1614` top `358`;
  - piso `1775–2172` top `430`.
- **Brecha**: `640–1775`, por debajo de y 470.
- **Trampas**:
  - descompresión en todo el vacío (`x1: 640, x2: 1775`), con `pullX` en el centro;
  - láser intermitente en x ≈ 1190 sobre la pasarela;
  - torreta en la pared derecha, x ≈ 2150, y ≈ 300, `direction: -1`. Debe alcanzar la saliente `1499–1614`: comprobá que
    el proyectil pasa a la altura del robot parado ahí.
- **ID**: `pablo-rivas` sobre la base del transmisor. Es el registro que revela que la señal era la baliza del capitán.
- **Celda**: `{ x: 1100, y: 250 }`, sobre la pasarela.
- **Salida**: `edge`.

### N3E3 — Puente de mando (`n3e3`, solo terreno y peligros en esta etapa)

- **Spawn**: `{ x: 80, y: 411 }`.
- **Sólidos**:
  - piso `0–331` top `411`;
  - cubierta `643–1416` top `405`;
  - escalones `1414–1492` top `385` y `1498–1543` top `347`;
  - plataforma de mando `1547–2172` top `333`.
- **Brecha**: `331–643`. Plataformas que caen en x ≈ 420 y x ≈ 545, top ≈ 395, ancho 80.
- **Trampas**:
  - descompresión `250–720`;
  - láser de barrido de 660 a 1400 sobre la cubierta;
  - chispas en x ≈ 1470 sobre el escalón.
- **Criaturas**: patrullas `700–1000` y `1050–1380` sobre la cubierta, ambas sin ID.
- **Celda**: `{ x: 1000, y: 365 }`.
- **Decoración nueva `eyes`**: `{ type: 'eyes', x, y }` en (1570, 65) y (1640, 42). Son ojos rojos con resplandor y
  parpadeo lento, hechos con CSS, sobre la masa orgánica del techo.
- **Sin salida en esta etapa**: la consola del capitán, la cápsula y la victoria son la 9.1. Sin `exit`, la pared derecha
  queda cerrada, que es el comportamiento normal del cargador.

### Registro

- Agregá `LEVEL_3` a `LEVELS`.
- Al completar el nivel 2, "Continuar" lleva a la historia del nivel 3 y luego a N3E1. Quitá el comentario provisional
  de la etapa 8 en ese punto.

### Verificación de recorrido

Con números, usando los valores del verificador **y la fuerza de la descompresión**.

1. **Simulación**: extendé `tools/physics-check.js` con una función que simule un salto con `externalVx` constante.
   Reutilizá la simulación existente: un parámetro más, no una copia.
2. **Saltos a confirmar**:
   - **N3E1**:
     - 383 → primera plataforma que cae;
     - entre plataformas;
     - última plataforma → 805.
     - Considerá que la fuerza ayuda antes de `pullX` y frena después.
   - **N3E2**:
     - 871 → pasarela 1047 (hueco de 176 px subiendo 84): con doble salto y con la fuerza a favor;
     - 1337 → saliente 1499 (bajando 68): con la fuerza en contra;
     - 1614 → piso 1775 (bajando 72): con la fuerza en contra.
   - **N3E3**: la brecha con sus plataformas.
3. **Otras comprobaciones**:
   - quedarse quieto en una orilla dentro de la zona arrastra al robot;
   - caminar en contra lo mantiene;
   - el punto seguro nunca queda dentro de una zona de descompresión.
4. **Ventanas de las trampas**:
   - barrido: el jugador puede seguir al rayo y pasar en la pausa, en N3E1 y en N3E3 con las criaturas;
   - chispas: ventana para pasar;
   - torreta: se puede destruir desde la saliente o esquivar.
5. **Si algo falla**: ajustá datos, `strength` o tiempos de trampas, nunca PLAYER ni PHYSICS, y explicalo.

---

## Al terminar

1. Actualizá `CLAUDE.md`:
   - etapa 9 ✅;
   - archivos nuevos;
   - trampas nuevas y su formato de datos;
   - `externalVx`;
   - proyectiles con `owner`;
   - eventos `turret:*`;
   - decoración `eyes`;
   - tema `bridge`.
2. Actualizá `docs/`:
   - `ESTADOS.md`: fases de cada trampa nueva;
   - `EVENTOS.md`;
   - `DATOS-DE-NIVEL.md`;
   - `FISICA.md`: fuerza externa y verificación con descompresión;
   - `ARQUITECTURA.md`.
3. Reporte en español:
   - archivos creados y modificados;
   - medidas corregidas;
   - recorrido completo con números;
   - decisiones y su porqué;
   - lista de pruebas:
     - historia del nivel 3 y su tema;
     - chispas, barrido, torreta y descompresión: aviso, peligro, ventana;
     - destruir la torreta (+150) y que sus proyectiles no empujen;
     - el arrastre y resistirlo;
     - el punto seguro fuera de las corrientes;
     - la criatura de N3E1 suelta el ID de Nadia;
     - el ID de Pablo;
     - los ojos del techo;
     - las 3 escenas con las teclas 1–3;
     - `listenerCount` estable;
     - consola sin errores.
