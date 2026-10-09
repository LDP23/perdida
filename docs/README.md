# Señal Perdida — Documentación técnica

Juego de plataformas 2D en pixel art. Proyecto universitario (UJCV, 2026).
Solo HTML, CSS y JavaScript puro: sin frameworks, sin librerías, sin `<canvas>`, sin build, sin npm.

## Equipo
- Jafet Antonio Sevilla Ayala
- Roy David Urtecho
- Luis David Palomo

## Documentos de arquitectura

| Documento | Descripción |
|---|---|
| [ARQUITECTURA.md](ARQUITECTURA.md) | Estructura de archivos y capas del sistema |
| [BUCLE-DE-JUEGO.md](BUCLE-DE-JUEGO.md) | Ciclo requestAnimationFrame, subpasos y orden de update |
| [ESTADOS.md](ESTADOS.md) | Máquina de estados con pila (push/pop) |
| [EVENTOS.md](EVENTOS.md) | Sistema de eventos (pub/sub) y lista de eventos |
| [DATOS-DE-NIVEL.md](DATOS-DE-NIVEL.md) | Formato de datos de escena y cómo agregar niveles |
| [FISICA.md](FISICA.md) | Gravedad, colisiones AABB, saltos y restricciones |
| [SPRITES.md](SPRITES.md) | Referencia de tamaños, frames y anclas de sprites |

## Cómo probar

1. Abrir `index.html` con Live Server (clic derecho → Open with Live Server).
2. Los módulos ES (`import/export`) no funcionan con `file://`.
3. Modo de depuración: tecla `º` (backtick) o `F2`.

## Herramientas

- `tools/physics-check.html`: verificador de física (simula saltos a 30/120/144 FPS).
- `tools/level-check.html`: verificador de niveles (escalones trampa, separación de plataformas, validación de trampas).
- `tools/trap-gallery.html`: galería visual de trampas en cada fase.
- `tools/process_assets.py`: conversión de assets originales (ya aplicada una vez).
