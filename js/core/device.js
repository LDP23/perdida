// Detecta si el dispositivo es táctil y pone la clase is-touch en .game.
// Escucha cambios (p.ej. conectar un teclado) y devuelve función para limpiar.

export function setupDeviceClass(gameElement) {
  const mq = window.matchMedia('(pointer: coarse)');
  const apply = () => gameElement.classList.toggle('is-touch', mq.matches);
  apply();
  mq.addEventListener('change', apply);
  return () => mq.removeEventListener('change', apply);
}
