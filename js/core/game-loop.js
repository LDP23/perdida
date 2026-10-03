import { LOOP } from '../config.js';

// Bucle principal. requestAnimationFrame sincroniza con la pantalla y se pausa
// solo cuando la pestaña no está visible. El tiempo real del frame (delta time)
// se reparte en subpasos cortos: la física es la misma a 30, 60 o 144 FPS.
export class GameLoop {
  #update;
  #render;
  #endFrame;
  #running = false;
  #frameId = null;
  #lastTime = 0;

  constructor({ update, render, endFrame }) {
    this.#update = update;
    this.#render = render;
    this.#endFrame = endFrame;
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#lastTime = performance.now();
    this.#frameId = requestAnimationFrame(this.#tick);
  }

  // Resetea el reloj para que el próximo frame no acumule el tiempo de la pausa.
  resetTime() {
    this.#lastTime = performance.now();
  }

  stop() {
    this.#running = false;
    if (this.#frameId !== null) cancelAnimationFrame(this.#frameId);
    this.#frameId = null;
  }

  // Función flecha: conserva "this" al pasarla a requestAnimationFrame.
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
