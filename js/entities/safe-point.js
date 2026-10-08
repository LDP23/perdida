/**
 * @module safe-point
 *
 * Rastrea la última posición segura del robot para reaparecer tras una muerte.
 * Una posición es segura si cumple tres condiciones simultáneamente:
 * 1. El robot está apoyado en el suelo (contacts.ground).
 * 2. Ambos pies (borde izquierdo y derecho) están sobre sólidos (no sobre el vacío).
 * 3. La hitbox inflada en HAZARD.safePointHazardMargin no toca ningún peligro
 *    ni ninguna zona de trampa.
 *
 * Usado por: HazardSystem (actualiza y consulta el punto seguro).
 * Depende de: config.js (HAZARD), collision.js (rectsOverlap).
 */
import { HAZARD } from '../config.js';
import { rectsOverlap } from '../physics/collision.js';

/**
 * Rastreador de punto seguro.
 *
 * Ciclo de vida: SceneWorld lo crea con el spawn inicial; HazardSystem llama
 * update() en cada frame; se destruye al cambiar de escena.
 */
export class SafePointTracker {
  /** @type {{x: number, y: number}} — último punto seguro (centro-abajo del robot) */
  #point;
  /** @type {Rect[]} — sólidos de la escena (para verificar pies sobre sólidos) */
  #solids;
  /** @type {Rect[]} — peligros de la escena (para verificar distancia segura) */
  #hazards;
  /** @type {Trap[]} — trampas (se consultan sus safePointExclusions) */
  #traps;

  /**
   * @param {{x: number, y: number}} spawn — punto inicial (centro-abajo del robot).
   * @param {Rect[]} solids — sólidos de la escena.
   * @param {Rect[]} hazards — peligros de la escena.
   * @param {Trap[]} [traps=[]] — trampas (se consultan sus safePointExclusions cada frame).
   */
  constructor(spawn, solids, hazards, traps = []) {
    this.#point = { ...spawn };
    this.#solids = solids;
    this.#hazards = hazards;
    this.#traps = traps;
  }

  /** @returns {{x: number, y: number}} último punto seguro (centro-abajo) */
  get point() { return this.#point; }

  /**
   * Evalúa si la posición actual del robot es segura y la guarda si lo es.
   * @param {Body} body — cuerpo del robot.
   */
  update(body) {
    if (!body.contacts.ground) return;
    if (!this.#feetOnSolid(body)) return;
    if (this.#nearHazard(body)) return;
    this.#point = {
      x: body.x + body.width / 2,
      y: body.y + body.height,
    };
  }

  /**
   * Verifica que ambos pies estén sobre sólidos (dos sondas rectangulares finas
   * de 2×2 px bajo el borde izquierdo y derecho del robot).
   */
  #feetOnSolid(body) {
    const probeH = 2;
    const probeW = 2;
    const feetY = body.y + body.height;
    const leftProbe = { x: body.x, y: feetY, width: probeW, height: probeH };
    const rightProbe = { x: body.x + body.width - probeW, y: feetY, width: probeW, height: probeH };
    let leftOk = false;
    let rightOk = false;
    for (const solid of this.#solids) {
      if (!leftOk && rectsOverlap(leftProbe, solid)) leftOk = true;
      if (!rightOk && rectsOverlap(rightProbe, solid)) rightOk = true;
      if (leftOk && rightOk) return true;
    }
    return false;
  }

  /** Verifica si la hitbox inflada en el margen de seguridad toca algún peligro o zona de trampa */
  #nearHazard(body) {
    const m = HAZARD.safePointHazardMargin;
    const inflated = {
      x: body.x - m,
      y: body.y - m,
      width: body.width + m * 2,
      height: body.height + m * 2,
    };
    for (const hazard of this.#hazards) {
      if (rectsOverlap(inflated, hazard)) return true;
    }
    for (const trap of this.#traps) {
      for (const zone of trap.safePointExclusions) {
        if (rectsOverlap(inflated, zone)) return true;
      }
    }
    return false;
  }
}
