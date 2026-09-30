# Señal Perdida

Juego de plataformas 2D en pixel art hecho solo con HTML, CSS y JavaScript (sin canvas ni librerías).
Equipo: Jafet Antonio Sevilla Ayala, Roy David Urtecho, Luis David Palomo (UJCV).

## Cómo ejecutarlo

El juego usa módulos ES (`import`/`export`), que el navegador bloquea si se abre `index.html` con doble clic.
Hay que servirlo con un servidor local:

1. Abrir la carpeta del proyecto en VS Code.
2. Instalar la extensión **Live Server** (de Ritwick Dey).
3. Clic derecho en `index.html` → **Open with Live Server**.

Si aparece el mensaje "Buscando señal…" y no desaparece, el juego se abrió sin servidor.

## Controles

| Acción | Teclas |
|---|---|
| Moverse | A / D o flechas |
| Saltar (en el aire: doble salto) | Espacio, W o flecha arriba |
| Modo de depuración | º (la tecla a la izquierda del 1) o F2 |

## Modo de depuración

Muestra las cajas de colisión con sus medidas, una regla cada 100 px y un cursor con las coordenadas
de la imagen. **Clic = copiar "x, y"** para pegarlo directo en los datos del nivel.

## Estructura

```
index.html
css/     base · world · entities · debug   (luego: screens, hud, traps, effects, responsive)
js/
  main.js            arranque
  config.js          TODAS las constantes del juego
  core/              bucle, entrada, cámara, estados, carga de imágenes, utilidades
  physics/           física y la única función de colisión
  entities/          lógica de robot, enemigos, disparos, recolectables (sin DOM)
  levels/            datos de los niveles y su cargador
  states/            un archivo por pantalla (jugando, inicio, game over, victoria)
  view/              dibujo del mundo y las entidades (solo variables CSS y clases)
assets/  scenes (WebP) · sprites · fonts
tools/   process_assets.py: convierte los assets originales (ya están convertidos)
```

## Convenciones

- Nombres en inglés; comentarios en español explicando el porqué.
- Ningún número suelto: va en `config.js` (jugabilidad) o como variable en el CSS (aspecto).
- Los niveles son datos: medidas tomadas de la imagen de 2172 × 724, con la misma notación del documento.
- La lógica no toca el DOM; las vistas solo escriben variables CSS (`--x`, `--y`…) y clases.
- `data-ref` en el HTML es para JavaScript; las clases son para el CSS.
