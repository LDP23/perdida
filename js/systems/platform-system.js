/**
 * @module platform-system
 *
 * Movimiento de plataformas, arrastre del rider (robot parado encima) y detección
 * de pisadas en plataformas que caen. Se divide en dos fases por el orden de update:
 * beforePlayer (mover plataformas y arrastrar rider) y afterPlayer (detectar pisadas).
 *
 * Arrastre y diferencia entre "frenar" y "aplastar":
 * 1. beforePlayer: todas las plataformas guardan su posición anterior (savePrevious),
 *    se mueven, y se calcula dx/dy. Si el robot está parado sobre una plataforma
 *    (body.groundSolid === mp.body), se lo arrastra con carryByPlatform, que usa
 *    moveAxis para resolver colisiones normales — así una pared FRENA al robot
 *    sin que atraviese nada. La plataforma sigue de largo y el robot puede caer.
 *    La plataforma que carga al robot se excluye de los sólidos para que el paso
 *    vertical de la plataforma no se confunda con una colisión.
 * 2. afterPlayer: si el robot aterrizó sobre una FallingPlatform, se llama onStepped()
 *    para iniciar el temblor.
 *
 * Aplastamiento real: después de resolver el arrastre, si el robot queda superpuesto
 * con sólidos por dos lados opuestos (izquierda+derecha o arriba+abajo), se lo
 * devuelve al punto seguro con motivo 'crush'.
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: physics.js (carryByPlatform), collision.js (rectsOverlap).
 */
import { rectsOverlap } from '../physics/collision.js';
import { carryByPlatform } from '../physics/physics.js';

/**
 * Sistema de plataformas.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() no necesita limpieza.
 */
export class PlatformSystem {
  #getWorld;
  #events;

  constructor({ context, getWorld }) {
    this.#getWorld = getWorld;
    this.#events = context.events;
  }

  beforePlayer(deltaTime) {
    const w = this.#getWorld();
    w.movingPlatforms.forEach((mp) => mp.update(deltaTime));
    w.fallingPlatforms.forEach((fp) => {
      if (!fp.isBlockedByBody(w.player.body)) fp.update(deltaTime);
    });
    const groundSolid = w.player.body.groundSolid;
    if (!groundSolid) return;
    w.movingPlatforms.forEach((mp) => {
      if (mp.body === groundSolid) {
        const solids = w.getAllSolids().filter((s) => s !== mp.body);
        carryByPlatform(w.player.body, mp.dx, mp.dy, solids);
        if (this.#isCrushed(w.player.body, solids)) {
          w.lastReturn = { reason: 'crush', scene: w.scene.id };
          w.player.placeAt(w.safePoint.point);
        }
      }
    });
  }

  afterPlayer() {
    const w = this.#getWorld();
    if (!w.player.isGrounded) return;
    const groundSolid = w.player.body.groundSolid;
    w.fallingPlatforms.forEach((fp) => {
      if (fp.body === groundSolid) fp.onStepped();
    });
  }

  dispose() {}

  /**
   * Detecta aplastamiento real: el cuerpo queda superpuesto con sólidos por
   * dos lados opuestos (izquierda+derecha o arriba+abajo).
   * @param {Body} body
   * @param {Rect[]} solids
   * @returns {boolean}
   */
  #isCrushed(body, solids) {
    let left = false;
    let right = false;
    let above = false;
    let below = false;
    const cx = body.x + body.width / 2;
    const cy = body.y + body.height / 2;
    for (const solid of solids) {
      if (!rectsOverlap(body, solid)) continue;
      const scx = solid.x + solid.width / 2;
      const scy = solid.y + solid.height / 2;
      if (scx < cx) left = true; else right = true;
      if (scy < cy) above = true; else below = true;
    }
    return (left && right) || (above && below);
  }
}
