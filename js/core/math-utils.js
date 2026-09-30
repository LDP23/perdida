// Funciones matemáticas pequeñas que usan varios módulos (cámara, jugador, enemigos).

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Mueve un valor hacia el objetivo sin pasarse: aceleración y frenado lineales.
export function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  return Math.max(current - maxDelta, target);
}

// Suavizado exponencial que da el mismo resultado sin importar los FPS
// (un lerp con factor fijo iría más rápido en pantallas de 144 Hz).
export function damp(current, target, sharpness, deltaTime) {
  return current + (target - current) * (1 - Math.exp(-sharpness * deltaTime));
}
