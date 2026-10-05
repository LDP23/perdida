/**
 * @module device
 *
 * Detecta el tipo de dispositivo (táctil o no) y refleja el resultado como clase CSS
 * en el elemento .game. Escucha cambios en tiempo real (p.ej. conectar un teclado
 * a una tablet) y se limpia al destruir el juego.
 *
 * Usado por: Game (game.js).
 * Depende de: nada.
 */

/**
 * Agrega o quita la clase `is-touch` en el elemento del juego según el puntero principal.
 * CSS usa esta clase para mostrar u ocultar controles táctiles.
 *
 * @param {HTMLElement} gameElement — el elemento raíz .game.
 * @returns {function(): void} función de limpieza que desuscribe el listener de cambio.
 */
export function setupDeviceClass(gameElement) {
  const mq = window.matchMedia('(pointer: coarse)');
  const apply = () => gameElement.classList.toggle('is-touch', mq.matches);
  apply();
  mq.addEventListener('change', apply);
  return () => mq.removeEventListener('change', apply);
}
