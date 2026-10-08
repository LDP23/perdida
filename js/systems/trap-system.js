/**
 * @module trap-system
 *
 * Sistema de trampas: actualiza todas las trampas del mundo, escribe sus
 * rectángulos peligrosos en world.dynamicHazards y asigna la fuerza externa
 * de descompresión al cuerpo del robot (body.externalVx).
 *
 * Los láseres reciben los sólidos actuales para calcular dónde termina el rayo.
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: nada (lee world.traps, escribe world.dynamicHazards y body.externalVx).
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
   * Actualiza todas las trampas, recopila dangerRects y solidRects, y calcula
   * la fuerza externa de descompresión sobre el robot.
   * @param {number} dt — deltaTime en segundos.
   */
  update(dt) {
    const w = this.#getWorld();
    const hazards = [];
    const solids = [];
    let externalVx = 0;
    const allSolids = w.getAllSolids();
    for (const trap of w.traps) {
      if (trap.updateWithSolids) {
        trap.updateWithSolids(dt, allSolids);
      } else {
        trap.update(dt);
      }
      for (const r of trap.dangerRects) hazards.push(r);
      for (const r of trap.solidRects) solids.push(r);
      if (trap.pullFor) externalVx += trap.pullFor(w.player.body);
    }
    w.dynamicHazards = hazards;
    w.dynamicSolids = solids;
    w.player.body.externalVx = externalVx;
  }

  dispose() {}
}
