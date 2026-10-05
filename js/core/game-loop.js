/**
 * @module game-loop
 *
 * Bucle principal del juego: sincroniza la actualización y el dibujado con la pantalla.
 *
 * Responsabilidad: medir el tiempo real entre frames, dividirlo en subpasos de
 * tamaño fijo y llamar a update/render/endFrame en el orden correcto.
 *
 * Usado por: Game (game.js), que le pasa los callbacks.
 * Depende de: config.js (LOOP.maxFrameDelta, LOOP.maxSubstep).
 * Participa en: es el primer eslabón del frame — todo lo demás ocurre dentro de sus callbacks.
 */
import { LOOP } from '../config.js';

/**
 * Bucle de juego basado en requestAnimationFrame con subpasos de tamaño fijo.
 *
 * Ciclo de vida: Game lo crea, llama start() al arrancar y stop() al destruir.
 * Colabora con: Input (endFrame limpia pulsaciones), StateMachine (update/render).
 *
 * Algoritmo de subpasos:
 * El delta real del frame (tiempo transcurrido desde el frame anterior) se divide
 * en N pasos de como máximo LOOP.maxSubstep (1/120 s ≈ 8.3 ms). Cada paso llama
 * a update() con ese delta fijo. Así la física (gravedad, velocidades, colisiones)
 * produce resultados idénticos sin importar si la pantalla corre a 30, 60 o 144 Hz.
 *
 * Ejemplo: un frame de 16.6 ms (60 Hz) → 2 pasos de 8.3 ms.
 * Un frame de 6.9 ms (144 Hz) → 1 paso de 6.9 ms.
 *
 * LOOP.maxFrameDelta (0.1 s) evita que un frame enorme (pestaña oculta, lag)
 * produzca un salto de tiempo que teletransporte al robot a través de paredes.
 */
export class GameLoop {
  /** @type {function(number): void} — callback de lógica, recibe deltaTime en segundos */
  #update;
  /** @type {function(number): void} — callback de dibujo, recibe el delta total del frame */
  #render;
  /** @type {function(): void} — callback de fin de frame (limpia pulsaciones consumibles) */
  #endFrame;
  /** @type {boolean} — si el bucle está activo */
  #running = false;
  /** @type {number|null} — ID de requestAnimationFrame para poder cancelarlo */
  #frameId = null;
  /** @type {number} — timestamp del último frame, en ms (performance.now) */
  #lastTime = 0;

  /**
   * @param {Object} callbacks
   * @param {function(number): void} callbacks.update  — lógica: recibe deltaTime en segundos.
   * @param {function(number): void} callbacks.render  — dibujado: recibe el delta total del frame.
   * @param {function(): void}       callbacks.endFrame — limpieza de fin de frame.
   */
  constructor({ update, render, endFrame }) {
    this.#update = update;
    this.#render = render;
    this.#endFrame = endFrame;
  }

  /**
   * Arranca el bucle. Si ya está corriendo, no hace nada (evita bucles duplicados).
   */
  start() {
    if (this.#running) return;
    this.#running = true;
    this.#lastTime = performance.now();
    this.#frameId = requestAnimationFrame(this.#tick);
  }

  /**
   * Resetea el reloj interno para que el próximo frame no acumule el tiempo
   * de una pausa externa (p.ej. al volver de la pantalla de pausa).
   */
  resetTime() {
    this.#lastTime = performance.now();
  }

  /**
   * Detiene el bucle y cancela el requestAnimationFrame pendiente.
   */
  stop() {
    this.#running = false;
    if (this.#frameId !== null) cancelAnimationFrame(this.#frameId);
    this.#frameId = null;
  }

  /**
   * Callback interno de requestAnimationFrame. Es función flecha para conservar `this`.
   *
   * Secuencia de un frame completo:
   * 1. Calcular frameDelta (limitado a maxFrameDelta).
   * 2. Dividir en N subpasos de tamaño ≤ maxSubstep.
   * 3. Llamar update(stepDelta) N veces (física y lógica).
   * 4. Llamar render(frameDelta) una vez (dibujado).
   * 5. Llamar endFrame() (limpiar pulsaciones no consumidas).
   * 6. Pedir el siguiente frame si el bucle sigue activo.
   *
   * @param {number} now — timestamp del frame actual, en ms (provisto por rAF).
   */
  #tick = (now) => {
    this.#frameId = null;
    const frameDelta = Math.min((now - this.#lastTime) / 1000, LOOP.maxFrameDelta);
    this.#lastTime = now;

    const steps = Math.max(1, Math.ceil(frameDelta / LOOP.maxSubstep));
    const stepDelta = frameDelta / steps;
    for (let step = 0; step < steps; step += 1) this.#update(stepDelta);

    this.#render(frameDelta);
    this.#endFrame();

    // Si durante el update se llamó stop() (o stop() + start()), no pedimos
    // un segundo frame: así nunca corren dos bucles a la vez tras reiniciar.
    if (this.#running && this.#frameId === null) {
      this.#frameId = requestAnimationFrame(this.#tick);
    }
  };
}
