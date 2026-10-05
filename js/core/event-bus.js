/**
 * @module event-bus
 *
 * Canal de comunicación desacoplado entre sistemas que no se conocen entre sí.
 * Por ejemplo, el robot emite 'player:shoot' y el CombatSystem crea el proyectil,
 * sin que el robot sepa que CombatSystem existe.
 *
 * Usado por: todos los sistemas, entidades y estados del juego.
 * Depende de: nada (módulo autónomo).
 *
 * Patrón: publicar/suscribir (pub/sub). on() devuelve una función de desuscripción
 * que el sistema debe guardar y llamar en su dispose() para evitar fugas.
 */

/**
 * Bus de eventos con suscripción/emisión y limpieza automática.
 *
 * Ciclo de vida: Game lo crea una vez; los sistemas se suscriben con on() y
 * guardan la función de desuscripción para llamarla en dispose(). Game llama
 * clear() al destruir todo.
 *
 * Colabora con: todos los módulos que necesitan comunicarse sin importarse mutuamente.
 */
export class EventBus {
  /** @type {Map<string, Set<Function>>} — mapa de evento → conjunto de handlers */
  #listeners = new Map();

  /** @returns {number} cantidad total de listeners registrados (útil para detectar fugas en tests) */
  get listenerCount() {
    let count = 0;
    for (const set of this.#listeners.values()) count += set.size;
    return count;
  }

  /**
   * Registra un handler para un evento. Devuelve una función que lo desuscribe.
   *
   * @param {string} name — nombre del evento (p.ej. 'player:shoot').
   * @param {Function} handler — función que recibe el payload del evento.
   * @returns {function(): void} función de desuscripción: llamarla elimina este handler.
   */
  on(name, handler) {
    if (!this.#listeners.has(name)) this.#listeners.set(name, new Set());
    const set = this.#listeners.get(name);
    set.add(handler);
    return () => set.delete(handler);
  }

  /**
   * Emite un evento: llama a todos los handlers registrados con el payload dado.
   *
   * @param {string} name — nombre del evento.
   * @param {*} [payload] — datos asociados al evento (varía por evento).
   */
  emit(name, payload) {
    const set = this.#listeners.get(name);
    if (!set) return;
    for (const handler of set) handler(payload);
  }

  /**
   * Elimina todos los listeners de todos los eventos. Se llama al destruir el juego.
   */
  clear() {
    this.#listeners.clear();
  }
}
