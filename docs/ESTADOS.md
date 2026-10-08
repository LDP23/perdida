# Máquina de estados

## Concepto

El juego usa una máquina de estados con pila para gestionar las pantallas.
Cada estado tiene su propio ciclo de vida (`enter`, `exit`, `update`, `render`)
y el CSS controla la visibilidad según los atributos `data-state` y `data-overlay`.

## Diagrama de estados

```mermaid
stateDiagram-v2
    [*] --> menu: Arranque
    menu --> playing: Nueva partida
    menu --> off: Salir

    playing --> paused: Escape (push)
    paused --> playing: Continuar (pop)
    paused --> playing: Reiniciar nivel (change)
    paused --> menu: Salir al menú (change)

    playing --> level_complete: Puerta de salida (push)
    level_complete --> playing: Continuar (change)
    level_complete --> menu: Salir al menú (change)

    playing --> game_over: Sin intentos (change)
    game_over --> playing: Reiniciar (change)
    game_over --> menu: Salir al menú (change)

    off --> menu: Encender (change)
```

## Operaciones de la pila

| Operación | Efecto | Ejemplo |
|---|---|---|
| `change(name)` | Vacía la pila, pone el nuevo estado como base | Ir al menú |
| `push(name)` | Apila sobre el estado actual (pausa el de abajo) | Abrir pausa |
| `pop()` | Quita el de arriba y reanuda el de abajo | Cerrar pausa |

## Atributos en el DOM

- `data-state`: estado base de la pila (menu, playing, game-over, off).
- `data-overlay`: estado superpuesto (paused, level-complete).
- `data-sub`: subpantalla activa (how-to-play, options, credits).
- `data-confirm`: tipo de confirmación activa (restart, exit).

El CSS usa selectores de atributo para mostrar/ocultar pantallas.
JS nunca escribe `display` directamente.

## Ciclo de vida de un estado

```
constructor(context)  → se crea una vez al arrancar el juego
enter(params)         → se activa (registra listeners, crea sistemas)
update(deltaTime)     → se llama cada frame mientras está activo
render(frameDelta)    → se llama una vez por frame para sincronizar DOM
pause()               → otro estado se apiló encima (push)
resume()              → el estado de encima se desapiló (pop)
exit()                → se desactiva (limpia listeners, destruye sistemas)
```

## Sprites por fase

Cada trampa muestra un frame de su hoja según la fase actual:

| Trampa | idle | warning | on/slam/discharge | hold | Otros |
|---|---|---|---|---|---|
| Prensa (bloque) | frame 1 | frame 1 + tiembla | frame 1 | frame 2 (golpe) | — |
| Láser (emisor) | frame 1 | frame 1 | frame 2 | — | — |
| Láser (rayo) | oculto | frame 1 (hilo) | frame 2 | — | — |
| Chispas | frame 1 | frame 2 (parpadeo) | frames 3↔4 (steps) | — | — |
| Torreta | frame 1 | — | — | — | frame 2 (destruida) |
| Tubería ácido | frame 1 | frame 2 | — | — | — |

Los láseres (intermitente y barrido) calculan la longitud del rayo en cada paso con `findSurfaceBelow`, ajustándose dinámicamente a sólidos y plataformas.

## Fases de la prensa hidráulica

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> warning: timerEnd
    warning --> slam: timerEnd
    slam --> hold: timerEnd
    hold --> rise: timerEnd
    rise --> idle: timerEnd

    note right of idle: Seguro (1.4 s)
    note right of warning: Seguro, tiembla + luz roja (0.6 s)
    note right of slam: PELIGROSO, baja de golpe (0.12 s)
    note right of hold: PELIGROSO, quieta abajo (0.4 s)
    note right of rise: PELIGROSO, sube lento (1.2 s)
```

## Fases del láser intermitente

```mermaid
stateDiagram-v2
    [*] --> off
    off --> warning: timerEnd
    warning --> on: timerEnd
    on --> off: timerEnd

    note right of off: Seguro (1.6 s)
    note right of warning: Seguro, hilo rojo parpadea (0.5 s)
    note right of on: PELIGROSO, rayo completo (1.2 s)
```

## Fases de las chispas eléctricas

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> warning: timerEnd
    warning --> discharge: timerEnd
    discharge --> idle: timerEnd

    note right of idle: Seguro (1.6 s)
    note right of warning: Seguro, puntos cian parpadean (0.7 s)
    note right of discharge: PELIGROSO, descarga eléctrica (0.5 s)
```

## Fases del láser de barrido

```mermaid
stateDiagram-v2
    [*] --> warning_left
    warning_left --> sweep_right: timerEnd
    sweep_right --> pause_right: timerEnd
    pause_right --> warning_right: timerEnd
    warning_right --> sweep_left: timerEnd
    sweep_left --> pause_left: timerEnd
    pause_left --> warning_left: timerEnd

    note right of warning_left: Seguro, hilo parpadea en x1 (0.6 s)
    note right of sweep_right: PELIGROSO, rayo va → (calculado)
    note right of pause_right: Seguro, apagado en x2 (1.2 s)
    note right of warning_right: Seguro, hilo parpadea en x2 (0.6 s)
    note right of sweep_left: PELIGROSO, rayo va ← (calculado)
    note right of pause_left: Seguro, apagado en x1 (1.2 s)
```

## Fases de la torreta

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> aiming: timerEnd
    aiming --> fire: timerEnd
    fire --> cooldown: timerEnd
    cooldown --> idle: timerEnd

    note right of idle: Inactiva (1.0 s)
    note right of aiming: Luz roja parpadea (0.9 s)
    note right of fire: Emite turret:fire (0.1 s)
    note right of cooldown: Enfriamiento (0.8 s)
```

Cuando la torreta recibe suficientes impactos (health = 2), queda destruida: sin fases, sin peligro, sin ser disparable.

## Descompresión

La descompresión no tiene fases cíclicas: siempre está activa. Expone `pullFor(body)` que devuelve la velocidad externa hacia `pullX`. `dangerRects` es siempre vacío; su `zone` cuenta para el punto seguro.
