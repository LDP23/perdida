// Canal de comunicación entre sistemas que no se conocen entre sí.
// El tutorial, HUD y puntuación escuchan sin que el robot los importe.

export class EventBus {
  #listeners = new Map();

  on(name, handler) {
    if (!this.#listeners.has(name)) this.#listeners.set(name, new Set());
    const set = this.#listeners.get(name);
    set.add(handler);
    return () => set.delete(handler);
  }

  emit(name, payload) {
    const set = this.#listeners.get(name);
    if (!set) return;
    for (const handler of set) handler(payload);
  }

  clear() {
    this.#listeners.clear();
  }
}
