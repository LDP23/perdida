// Todo en el juego colisiona como rectángulo alineado a los ejes (AABB): es barato,
// predecible y suficiente para un plataformas. Esta es la ÚNICA prueba de colisión;
// trampas, enemigos, disparos y recolectables la reutilizan.
// Un rectángulo es cualquier objeto con { x, y, width, height }.

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function rectFromSpan({ x1, x2, top, bottom }) {
  return { x: x1, y: top, width: x2 - x1, height: bottom - top };
}
