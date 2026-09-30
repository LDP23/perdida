"""Prepara los assets originales para el juego (se corre una sola vez).

Uso:  python tools/process_assets.py <carpeta_Assets_original>
Requiere: pip install pillow numpy

- Escenas: PNG -> WebP calidad 90 (mismo tamaño 2172x724). Sin pérdida pesaban
  ~1.1 MB cada una; con calidad 90 pesan ~130 KB y la diferencia no se nota.
- Sprites: limpia el ruido del canal alfa, recorta al contenido y reduce
  al doble del tamaño en pantalla (2x) para que se vean nítidos en pantallas grandes.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ALPHA_THRESHOLD = 30  # por debajo de esta opacidad el píxel es ruido, no parte del dibujo
RENDER_SCALE = 2      # exportamos al doble del tamaño en el mundo
SCENE_QUALITY = 90
SPRITES = {
    # archivo original -> (nombre de salida, alto en el mundo en px)
    "characters/main_character/robo.png": ("robo.webp", 120),
    "characters/enemy/main_enemy.png": ("main_enemy.webp", 138),  # 1.15 x robot
}


def convert_scenes(source: Path, output: Path) -> None:
    for png in sorted(source.glob("escenas/*/*.png")):
        target = output / "scenes" / f"{png.stem}.webp"
        Image.open(png).convert("RGB").save(target, "WEBP", quality=SCENE_QUALITY, method=6)
        print(f"escena  {target.name:24} {target.stat().st_size // 1024} KB")


def clean_sprite(image: Image.Image) -> Image.Image:
    pixels = np.array(image.convert("RGBA"))
    alpha = pixels[:, :, 3]
    alpha[alpha < ALPHA_THRESHOLD] = 0
    pixels[alpha == 0] = 0
    ys, xs = np.nonzero(alpha)
    cropped = pixels[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
    return Image.fromarray(cropped, "RGBA")


def convert_sprites(source: Path, output: Path) -> None:
    for relative, (name, world_height) in SPRITES.items():
        sprite = clean_sprite(Image.open(source / relative))
        height = world_height * RENDER_SCALE
        width = round(sprite.width * height / sprite.height)
        resized = sprite.resize((width, height), Image.LANCZOS)
        target = output / "sprites" / name
        resized.save(target, "WEBP", lossless=True, method=6)
        print(f"sprite  {name:24} {width}x{height} (mundo: {width / RENDER_SCALE:.0f}x{world_height})")


if __name__ == "__main__":
    source_dir = Path(sys.argv[1])
    output_dir = Path(__file__).resolve().parent.parent / "assets"
    convert_scenes(source_dir, output_dir)
    convert_sprites(source_dir, output_dir)
