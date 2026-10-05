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
