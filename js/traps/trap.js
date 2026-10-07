/**
 * @module trap
 *
 * Clase base para todas las trampas del juego. Define el ciclo de fases que se
 * repite (idle → warning → activa → …), un Timer de cuenta regresiva y los
 * getters que el motor necesita: phase, phaseProgress, dangerRects y zone.
 *
 * Las trampas NO aplican daño: exponen sus rectángulos peligrosos mediante
 * dangerRects y el HazardSystem se encarga del daño, igual que con las púas.
 * Tampoco tocan el DOM: la vista (TrapView) lee phase y viewData.
 *
 * Diseño de fases: la subclase pasa un arreglo [{ name, duration }] que se
 * recorre en orden cíclico. phaseOffset permite desfasar trampas iguales
 * cercanas para que no se activen todas a la vez.
 *
 * Usado por: HydraulicPress, IntermittentLaser (heredan).
 * Depende de: timer.js.
 */
import { Timer } from '../core/timer.js';

/**
 * Trampa abstracta con ciclo de fases.
 *
 * Ciclo de vida: SceneWorld la crea (vía trap-factory) al montar la escena;
 * TrapSystem llama update() cada frame; SceneWorld la destruye en dispose().
 */
export class Trap {
  /** @type {{name: string, duration: number}[]} — fases del ciclo */
  #phases;
  /** @type {number} — índice de la fase actual */
  #phaseIndex;
  /** @type {Timer} — cuenta regresiva de la fase actual */
  #timer;
  /** @type {Rect} — área total que la trampa puede alcanzar (fija) */
  #zone;

  /**
   * @param {{name: string, duration: number}[]} phases — fases del ciclo, en orden.
   * @param {Rect} zone — rectángulo fijo para excluir del punto seguro.
   * @param {number} [phaseOffset=0] — segundos de desfase inicial.
   */
  constructor(phases, zone, phaseOffset = 0) {
    this.#phases = phases;
    this.#zone = zone;
    this.#phaseIndex = 0;
    this.#timer = new Timer();
    this.#timer.start(phases[0].duration);
    if (phaseOffset > 0) this.#applyOffset(phaseOffset);
  }

  /** @returns {string} nombre de la fase actual */
  get phase() { return this.#phases[this.#phaseIndex].name; }

  /** @returns {number} progreso de la fase actual, 0 (inicio) a 1 (fin) */
  get phaseProgress() {
    const duration = this.#phases[this.#phaseIndex].duration;
    if (duration <= 0) return 1;
    return 1 - this.#timer.value / duration;
  }

  /** @returns {number} segundos restantes de la fase actual */
  get phaseRemaining() { return this.#timer.value; }

  /** @returns {Rect[]} rectángulos peligrosos en este instante (vacío si no daña) */
  get dangerRects() { return []; }

  /** @returns {Rect[]} rectángulos sólidos en este instante (vacío si no bloquea) */
  get solidRects() { return []; }

  /** @returns {Rect} área total que la trampa puede ocupar (fija, para safe-point) */
  get zone() { return this.#zone; }

  /** @returns {string} tipo de la trampa ('press', 'laser', etc.) */
  get type() { return ''; }

  /** @returns {Object|null} variables CSS extra que la vista debe escribir */
  get viewData() { return null; }

  /**
   * Avanza el ciclo de fases. Las subclases extienden con super.update(dt).
   * @param {number} dt — deltaTime en segundos.
   */
  update(dt) {
    this.#timer.update(dt);
    if (!this.#timer.active) {
      this.#phaseIndex = (this.#phaseIndex + 1) % this.#phases.length;
      this.#timer.start(this.#phases[this.#phaseIndex].duration);
    }
  }

  /** Avanza el ciclo según el desfase inicial, consumiendo fases completas */
  #applyOffset(offset) {
    const totalCycle = this.#phases.reduce((sum, p) => sum + p.duration, 0);
    let remaining = offset % totalCycle;
    while (remaining > 0) {
      const left = this.#timer.value;
      if (remaining < left) {
        this.#timer.start(left - remaining);
        remaining = 0;
      } else {
        remaining -= left;
        this.#phaseIndex = (this.#phaseIndex + 1) % this.#phases.length;
        this.#timer.start(this.#phases[this.#phaseIndex].duration);
      }
    }
  }
}
