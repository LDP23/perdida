/**
 * @module tutorial
 *
 * Lógica de los carteles del tutorial: cuándo mostrarlos, cuándo descartarlos.
 * Reglas: se muestran de a uno (el siguiente solo aparece cuando todos los anteriores
 * fueron descartados). Cada cartel tiene permanencia mínima, linger al alejarse,
 * y se descarta por evento (p.ej. player:jump) o por posición (passX).
 *
 * Usado por: PlayingState (llama update en cada frame), SceneWorld (lo crea).
 * Depende de: config.js (MESSAGES, TUTORIAL), timer.js.
 */
import { MESSAGES, TUTORIAL } from '../config.js';
import { Timer } from '../core/timer.js';

/**
 * Lógica de carteles del tutorial.
 *
 * Ciclo de vida: SceneWorld lo crea si hay carteles y el tutorial está habilitado;
 * PlayingState llama update(); dispose() limpia suscripciones.
 * Colabora con: TutorialView (lee signs para mostrar/ocultar carteles en el DOM).
 */
export class Tutorial {
  #signs;
  #events;
  #unsubscribes = [];

  constructor(signsData, events) {
    this.#events = events;
    this.#signs = signsData.map((data) => ({
      ...data,
      state: 'hidden',          // hidden → visible → dismissed
      minVisibleTimer: new Timer(),
      lingerTimer: new Timer(),
      lingering: false,          // true mientras cuenta el linger
      pendingDismiss: false,     // la acción ocurrió pero el minVisible no terminó
    }));

    for (const sign of this.#signs) {
      if (!sign.dismiss.event) continue;
      const unsub = events.on(sign.dismiss.event, () => {
        if (sign.state !== 'visible') return;
        if (sign.minVisibleTimer.active) {
          sign.pendingDismiss = true;
        } else {
          sign.state = 'dismissed';
        }
      });
      this.#unsubscribes.push(unsub);
    }
  }

  get signs() { return this.#signs; }

  update(playerBody, dt) {
    const playerCenterX = playerBody.x + playerBody.width / 2;

    for (let i = 0; i < this.#signs.length; i++) {
      const sign = this.#signs[i];

      sign.minVisibleTimer.update(dt);
      sign.lingerTimer.update(dt);

      if (sign.state === 'dismissed') continue;

      // De a uno: no mostrar si algún anterior no fue descartado ni quedó atrás.
      if (sign.state === 'hidden') {
        const blocked = this.#signs.slice(0, i).some(
          (prev) => prev.state !== 'dismissed',
        );
        if (blocked) continue;
      }

      const distance = Math.abs(playerCenterX - sign.x);
      const inRange = distance < TUTORIAL.showDistance;

      if (sign.state === 'hidden' && inRange) {
        sign.state = 'visible';
        sign.minVisibleTimer.start(MESSAGES.tutorialMinVisible);
        sign.lingerTimer.reset();
      }

      if (sign.state === 'visible') {
        // Si la acción pendiente se completó y el minVisible expiró
        if (sign.pendingDismiss && !sign.minVisibleTimer.active) {
          sign.state = 'dismissed';
          continue;
        }

        // passX: se evalúa solo después de minVisible
        if (sign.dismiss.passX !== undefined && !sign.minVisibleTimer.active) {
          if (playerCenterX > sign.dismiss.passX) {
            sign.state = 'dismissed';
            continue;
          }
        }

        // Linger: si se alejó, empieza a contar; si vuelve, se reinicia
        if (!inRange) {
          if (!sign.lingering) {
            sign.lingering = true;
            sign.lingerTimer.start(MESSAGES.lingerAfterLeaving);
          }
          if (!sign.lingerTimer.active) {
            sign.state = 'dismissed';
          }
        } else {
          sign.lingering = false;
          sign.lingerTimer.reset();
        }
      }
    }
  }

  dispose() {
    for (const unsub of this.#unsubscribes) unsub();
    this.#unsubscribes.length = 0;
  }
}
