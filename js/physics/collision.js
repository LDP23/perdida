/**
 * @module collision
 *
 * Pruebas de colisión del juego. Todo colisiona como rectángulo alineado a los ejes
 * (AABB — Axis-Aligned Bounding Box): es barato, predecible y suficiente para un
 * plataformas en pixel art.
 *
 * Usado por: physics.js, CombatSystem, PickupSystem, HazardSystem, SafePointTracker.
 * Depende de: nada.
 */

/**
 * @typedef {Object} Rect
 * @property {number} x — borde izquierdo, en px del mundo.
 * @property {number} y — borde superior, en px del mundo ("y" crece hacia abajo).
 * @property {number} width — ancho, en px del mundo.
 * @property {number} height — alto, en px del mundo.
 */

/**
 * Prueba de colisión entre dos rectángulos alineados a los ejes (AABB).
 * Es la ÚNICA prueba de colisión del juego: robot, criaturas, disparos, trampas y
 * coleccionables la reutilizan, así que cualquier ajuste de "qué cuenta como choque"
 * se hace en un solo lugar.
 *
 * Los bordes que solo se tocan NO cuentan como superposición: un robot parado
 * exactamente sobre el piso no "choca" con él de costado.
 *
 * @param {Rect} a — primer rectángulo, en px del mundo.
 * @param {Rect} b — segundo rectángulo, en px del mundo.
 * @returns {boolean} true si comparten área.
 */
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Convierte un span (definido por bordes) a un Rect (definido por posición y tamaño).
 * Los datos de nivel usan spans porque es más intuitivo marcar bordes en la imagen.
 *
 * @param {Object} span
 * @param {number} span.x1 — borde izquierdo, en px del mundo.
 * @param {number} span.x2 — borde derecho, en px del mundo.
 * @param {number} span.top — borde superior, en px del mundo.
 * @param {number} span.bottom — borde inferior, en px del mundo.
 * @returns {Rect}
 */
export function rectFromSpan({ x1, x2, top, bottom }) {
  return { x: x1, y: top, width: x2 - x1, height: bottom - top };
}
