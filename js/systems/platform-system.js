/**
 * @module platform-system
 *
 * Movimiento de plataformas, arrastre del rider (robot parado encima) y detección
 * de pisadas en plataformas que caen. Se divide en dos fases por el orden de update:
 * beforePlayer (mover plataformas y arrastrar rider) y afterPlayer (detectar pisadas).
 *
 * Arrastre de plataformas y aplastamiento:
 * 1. beforePlayer: todas las plataformas guardan su posición anterior (savePrevious),
 *    se mueven, y se calcula dx/dy. Si el robot está parado sobre una plataforma
 *    (body.groundSolid === mp.body), se lo arrastra con carryByPlatform, que usa
 *    moveAxis para resolver colisiones normales durante el arrastre — así el robot
 *    no atraviesa paredes cuando una plataforma lo empuja contra ellas.
 * 2. afterPlayer: si el robot aterrizó sobre una FallingPlatform, se llama onStepped()
 *    para iniciar el temblor.
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: physics.js (carryByPlatform).
 */
import { carryByPlatform } from '../physics/physics.js';

/**
 * Sistema de plataformas.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() no necesita limpieza.
 */
export class PlatformSystem {
  #getWorld;

  constructor({ getWorld }) {
    this.#getWorld = getWorld;
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
        carryByPlatform(w.player.body, mp.dx, mp.dy, w.getAllSolids());
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
}
