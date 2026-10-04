# Etapa 6 — Enemigos: las criaturas

Prerrequisito: etapa 5 terminada y probada (nivel 1 completo, con escenas y plataformas).

Leé `CLAUDE.md` y estos archivos completos antes de escribir código:
`js/entities/player.js`, `js/entities/training-dummy.js`, `js/entities/entity-collection.js`,
`js/view/player-view.js`, `js/states/playing-state.js`, `js/levels/level1.js`, `js/levels/level-loader.js`,
`js/core/state-machine.js`, `js/core/timer.js`, `js/config.js`, `css/entities.css`.

## Prohibido en esta etapa

- No modifiques PLAYER ni PHYSICS.
- No crees trampas.
- No instales nada.

---

## 1. Hoja de sprites: `assets/sprites/criatura.png` (ya procesada, usala tal cual)

- **Tamaño**: 1992 × 620 px, en **4 columnas × 2 filas**, con celdas de **498 × 310 px**.
  Está exportada al doble: cada celda se ve de **249 × 155 en el mundo**.
- **Normalización**: ya está hecha.
  - Todos los frames apoyan los pies en el **borde inferior de la celda**.
  - **El punto medio entre los pies está centrado horizontalmente** en cada celda.
  - En reposo, la criatura mide 116 × 138 en el mundo (1.15 veces el robot).
  - La celda es ancha porque el zarpazo llega lejos: es normal que tenga mucho espacio transparente.
- **Dirección**: mira a la derecha. Para mirar a la izquierda, `scaleX(-1)`.
- **Frames**:
  1. reposo
  2. caminar A
  3. caminar B
  4. preparar ataque (brazo en alto)
  5. zarpazo
  6. daño
  7. muriendo (se desploma)
  8. muerta (montón en el piso)
- **Selección de frames**: generalizá el mecanismo del robot para cualquier hoja (columnas y filas como variables CSS de
  la hoja). Robot, tira de correr y criatura usan la misma regla. Cero estilos duplicados.
- **Contorno**: rojo con `drop-shadow`, para separarla del fondo.
- **Archivos viejos**: `main_enemy.webp` (y su entrada en `tools/process_assets.py`) queda obsoleto. Eliminalo.

## 2. Datos

- **Formato** en cada escena: `enemies: [{ x, y, patrol: { x1, x2 } }]`.
  - `x`, `y` = los pies.
  - `patrol` = los límites que la criatura nunca cruza. Así no cae a fosos ni se mete en peligros.
- **N1E3** (la criatura "de adelanto"): `{ x: 760, y: 378, patrol: { x1: 560, x2: 900 } }`, sobre la pasarela
  `518–932`. Verificá en depuración que la patrulla no salga de la pasarela.

## 3. Constantes en `config.js` (valores iniciales, comentá el porqué)

```js
ENEMY = {
  width: 60, height: 125,          // hitbox centrada sobre los pies; verificada con los 8 frames
  health: 3,                        // disparos para destruirla
  patrolSpeed: 55, chaseSpeed: 105,
  detectRange: 380, detectHeight: 90,   // ve al robot si está a esa distancia y a una altura parecida
  attackRange: 95,                  // distancia horizontal a la que empieza a atacar
  windupTime: 0.55, strikeTime: 0.25, recoverTime: 0.6,
  strikeReach: 110, strikeHeight: 70,   // rectángulo del zarpazo, delante de la criatura
  contactDamage: 10, strikeDamage: 20,
  hurtTime: 0.25, dyingTime: 0.45, corpseTime: 1.2, fadeTime: 0.5,
  walkFps: 5,
}
```

## 4. Lógica: `js/entities/enemy.js`

- **Cuerpo**: usa `createBody` y `stepBody` con gravedad, igual que el robot. Camina sobre los sólidos.
- **Estados**: `patrol → chase → windup → strike → recover → (chase | patrol)`. En cualquier momento: `hurt`, `dying`, `dead`.
  - Reutilizá `StateMachine` de `js/core/` si encaja. Si no encaja, usá un estado simple con `Timer` y explicá por qué.
    No crees una segunda máquina de estados genérica.
  - **`patrol`**: camina de un límite al otro y gira al llegar.
  - **`chase`**: si el robot está dentro de `detectRange` horizontal y `detectHeight` vertical, camina hacia él a
    `chaseSpeed`, sin salir de `patrol`. Si lo pierde, vuelve a patrullar.
  - **`windup`** (el aviso, obligatorio como en las trampas): se detiene, mira al robot y muestra el frame 4 durante
    `windupTime`.
  - **`strike`**: frame 5. Solo durante este estado existe el rectángulo del zarpazo (`strikeReach × strikeHeight`,
    delante de la criatura). Si toca al robot: `player.takeHit(strikeDamage)` con origen en la criatura, para que el
    empuje funcione. Un solo golpe por zarpazo.
  - **`recover`**: frame 1 durante `recoverTime`. Es la ventana para que el jugador contraataque.
- **Contacto**: tocar el cuerpo de la criatura, salvo en `dying` o `dead`, hace `contactDamage` con empuje.
  La invulnerabilidad del robot evita golpes repetidos.
- **Disparos**: implementa la interfaz `shootable` existente (`hitbox` + `onShot`). Es el mismo camino del espantapájaros.
  - Cada impacto resta 1 de `health` y pasa a `hurt` (frame 6) durante `hurtTime`.
  - **Un disparo durante `windup` cancela el ataque**: premia reaccionar al aviso.
  - Con `health` en 0:
    - pasa a `dying`;
    - suma `SCORE.enemy` a la sesión;
    - emite `enemy:destroyed`;
    - deja de ser disparable y de dañar.
- **Muerte**: `dying` (frame 7) → `dead` (frame 8) durante `corpseTime` → desvanecido en `fadeTime` → `isDead`.
  Recién ahí `EntityCollection` la elimina.
- **Métodos cortos**: uno por estado y uno por chequeo (detección, contacto, zarpazo).

## 5. Vista: `js/view/enemy-view.js` + estilos en `css/entities.css` (sección propia)

- **Estado visual**: igual que `player-view.js`, una sola función decide el estado visual.
  Prioridad: `dead > dying > hurt > strike > windup > caminando (patrol/chase) > reposo`.
- **Caminar**: frames 2 ↔ 3 con `steps()` a `ENEMY.walkFps`.
- **Preparar ataque**: frame 4 con un pulso rojo intenso en el contorno, para que el aviso se lea claramente.
- **Daño**: frame 6 con un destello blanco breve.
- **Desaparición**: opacidad a 0 en `fadeTime`.
- **Duraciones**: se escriben una sola vez desde `config.js`, como las demás.
- **`reduced-motion`**: sin pulso; el aviso se comunica con el frame y un contorno rojo fijo.

## 6. Integración

- `level-loader.js` copia `enemies` (arreglo vacío si no existe).
- `PlayingState` crea una `EntityCollection` de enemigos y los agrega a la lista de disparables.
  - Al cambiar de escena o reiniciar, todo se limpia.
  - Comprobalo con `listenerCount` y con la cantidad de elementos en la capa.
- **Depuración**:
  - dibujá la hitbox de cada criatura, el rectángulo del zarpazo solo mientras está activo, la línea de patrulla y el
    rango de detección;
  - reportá el estado y la vida de cada criatura.
- **Herramienta de prueba**: con la depuración activa, las teclas `Digit1`…`Digit9` cargan la escena con ese número
  dentro del nivel actual (por el camino normal de carga). Sirve para probar cualquier escena sin recorrer las anteriores.

---

## Limpieza (reglas estrictas de la etapa 4.1)

- **Prohibido**:
  - código comentado;
  - TODOs;
  - `console.log`;
  - código, constantes, clases o keyframes sin uso;
  - duplicación;
  - abstracciones usadas una sola vez.
- **Búsqueda final**: confirmá que no queden referencias a `main_enemy` en ningún archivo y mostrá el resultado de la búsqueda.

## Al terminar

1. Actualizá `CLAUDE.md`:
   - etapa 6 ✅;
   - nueva numeración:
     - 6 Enemigos ✅
     - 7 Trampas
     - 8 Niveles 2 y 3
     - 9 Táctil, responsive y pulido;
   - hoja de la criatura;
   - estados del enemigo;
   - formato `enemies`;
   - mecanismo de hojas generalizado;
   - herramienta de depuración por números.
2. Reporte en español: archivos creados, modificados y eliminados, decisiones y su porqué, y pruebas:
   - criatura patrullando sin salir de la pasarela;
   - detección y persecución;
   - aviso visible antes de cada zarpazo;
   - daño y empuje del zarpazo y del contacto;
   - cancelar el ataque disparando durante el aviso;
   - 3 disparos para destruirla, con su secuencia de muerte y +200 puntos;
   - que no dañe mientras muere;
   - limpieza al cambiar de escena;
   - teclas 1–3 en depuración;
   - frames sin "saltos" de posición en ambas direcciones;
   - consola sin errores.
