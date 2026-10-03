import { HAZARD } from '../config.js';
import { rectsOverlap } from '../physics/collision.js';

// Guarda la última posición segura del robot: en el suelo, lejos de peligros,
// con ambos pies sobre sólidos. Se usa para reaparecer después de un daño.
export class SafePointTracker {
  #point;
  #solids;
  #hazards;

  constructor(spawn, solids, hazards) {
    this.#point = { ...spawn };
    this.#solids = solids;
    this.#hazards = hazards;
  }

  get point() { return this.#point; }

  update(body) {
    if (!body.contacts.ground) return;
    if (!this.#feetOnSolid(body)) return;
    if (this.#nearHazard(body)) return;
    this.#point = {
      x: body.x + body.width / 2,
      y: body.y + body.height,
    };
  }

  // Dos sondas finas bajo los pies: borde izquierdo y borde derecho.
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

  // Hitbox agrandada en el margen no debe tocar ningún peligro.
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
    return false;
  }
}
