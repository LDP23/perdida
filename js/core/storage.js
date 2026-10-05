/**
 * @module storage
 *
 * Persistencia en localStorage con protección contra modo privado o Storage deshabilitado.
 * Todas las claves usan el prefijo 'señal-perdida:' para no colisionar con otras apps.
 *
 * Usado por: settings.js (preferencias), screens.js (récord).
 * Depende de: nada.
 */

/** Prefijo de namespace para evitar colisiones en localStorage */
const PREFIX = 'señal-perdida:';

/**
 * Lee un valor de localStorage. Si no existe o hay error (modo privado, JSON inválido),
 * devuelve el valor por defecto.
 *
 * @param {string} key — clave sin prefijo.
 * @param {*} fallback — valor por defecto si la clave no existe o falla la lectura.
 * @returns {*} valor parseado o fallback.
 */
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Guarda un valor en localStorage como JSON. Si falla (modo privado, cuota llena),
 * el juego sigue sin guardar — la partida no se interrumpe.
 *
 * @param {string} key — clave sin prefijo.
 * @param {*} value — valor serializable a JSON.
 */
export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Modo privado o cuota llena: el juego sigue sin guardar.
  }
}
