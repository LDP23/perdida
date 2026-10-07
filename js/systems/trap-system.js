/**
 * @module trap-system
 *
 * Sistema de trampas: actualiza todas las trampas del mundo y escribe sus
 * rectángulos peligrosos en world.dynamicHazards. El HazardSystem lee ese
 * arreglo para aplicar daño al robot, evitando duplicar la lógica.
 *
 * Orden de actualización: después de platformSystem.afterPlayer y antes de
 * combatSystem. Así las trampas ya se movieron cuando el hazard-system evalúa
 * la colisión.
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: nada (lee world.traps, escribe world.dynamicHazards).
 */

/**
 * Sistema de trampas.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() no necesita limpieza.
 */
export class TrapSystem {
  #getWorld;

  constructor({ getWorld }) {
    this.#getWorld = getWorld;
  }

  /**
   * Actualiza todas las trampas y recopila sus dangerRects y solidRects.
   * @param {number} dt — deltaTime en segundos.
   */
  update(dt) {
    const w = this.#getWorld();
    const hazards = [];
    const solids = [];
    for (const trap of w.traps) {
      trap.update(dt);
      for (const r of trap.dangerRects) hazards.push(r);
      for (const r of trap.solidRects) solids.push(r);
    }
    w.dynamicHazards = hazards;
    w.dynamicSolids = solids;
  }

  dispose() {}
}
