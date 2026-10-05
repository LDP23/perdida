/**
 * @module math-utils
 *
 * Funciones matemáticas puras reutilizadas por varios módulos (cámara, jugador, enemigos).
 *
 * Usado por: camera.js (damp, clamp), player.js (approach, clamp), enemy.js (clamp).
 * Depende de: nada.
 */

/**
 * Restringe un valor al rango [min, max].
 *
 * @param {number} value — valor a restringir.
 * @param {number} min — límite inferior.
 * @param {number} max — límite superior.
 * @returns {number} valor restringido.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Mueve un valor linealmente hacia el objetivo sin pasarse.
 * Se usa para aceleración y frenado del robot: cada frame avanza como máximo maxDelta.
 *
 * @param {number} current — valor actual.
 * @param {number} target — valor objetivo.
 * @param {number} maxDelta — máximo cambio permitido (positivo).
 * @returns {number} nuevo valor, más cerca del objetivo.
 */
export function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  return Math.max(current - maxDelta, target);
}

/**
 * Suavizado exponencial independiente de los FPS.
 * A diferencia de un lerp con factor fijo (que iría más rápido a 144 Hz que a 30 Hz),
 * esta fórmula produce el mismo recorrido visual sin importar la frecuencia de la pantalla.
 *
 * Fórmula: current + (target − current) × (1 − e^(−sharpness × dt))
 *
 * @param {number} current — valor actual.
 * @param {number} target — valor objetivo.
 * @param {number} sharpness — qué tan rápido converge (mayor = más rígido). En 1/s.
 * @param {number} deltaTime — tiempo del paso, en segundos.
 * @returns {number} nuevo valor suavizado.
 */
export function damp(current, target, sharpness, deltaTime) {
  return current + (target - current) * (1 - Math.exp(-sharpness * deltaTime));
}
