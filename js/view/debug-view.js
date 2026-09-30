import { DEBUG, WORLD } from '../config.js';
import { damp } from '../core/math-utils.js';
import { createElement, setPosition, setRect } from './dom-utils.js';

const Y_LABEL_COLUMN_STEP = DEBUG.rulerStep * 5;

// Modo de depuración: dibuja los rectángulos de colisión, una regla en píxeles
// de la imagen y un cursor que muestra las coordenadas del mundo. Sirve para
// ajustar las medidas de los niveles comparándolas con el fondo.
export class DebugView {
  #root;
  #viewport;
  #layer;
  #panel;
  #camera;
  #enabled = false;
  #sceneLayer;
  #tracked = new Map();
  #cursor;
  #cursorLabel;
  #pointer = null;
  #lastCopied = '—';
  #report = {};
  #fps = 0;
  #panelTimer = 0;
  #listeners;

  constructor({ game, viewport, 'debug-layer': layer, 'debug-panel': panel }, camera) {
    this.#root = game;
    this.#viewport = viewport;
    this.#layer = layer;
    this.#panel = panel;
    this.#camera = camera;
    this.#layer.style.setProperty('--ruler-step', DEBUG.rulerStep);
    this.#buildRuler();
    this.#sceneLayer = createElement('debug-scene', this.#layer);
    this.#buildCursor();
    this.#listeners = [
      ['pointermove', (event) => this.#onPointerMove(event)],
      ['pointerleave', () => { this.#pointer = null; }],
      ['click', () => this.#copyPointer()],
    ];
    for (const [type, handler] of this.#listeners) this.#viewport.addEventListener(type, handler);
  }

  get isEnabled() {
    return this.#enabled;
  }

  setEnabled(enabled) {
    this.#enabled = enabled;
    this.#root.classList.toggle('is-debug', enabled);
  }

  toggle() {
    this.setEnabled(!this.#enabled);
  }

  // Redibuja los rectángulos fijos de la escena (sólidos, paredes y, más adelante, peligros).
  showScene(scene) {
    this.#sceneLayer.replaceChildren();
    this.#tracked.forEach((entry) => entry.element.remove());
    this.#tracked.clear();
    for (const solid of scene.solids) this.#drawStaticRect(solid);
  }

  // Rectángulos que se mueven (robot, enemigos): se actualizan en cada render.
  track(id, rect, kind) {
    const element = createElement(`debug-rect debug-rect--${kind}`, this.#layer);
    this.#tracked.set(id, { rect, element });
  }

  // Valores que el estado activo quiere mostrar en el panel.
  report(values) {
    Object.assign(this.#report, values);
  }

  render(frameDelta) {
    if (!this.#enabled) return;
    this.#measureFps(frameDelta);
    for (const { rect, element } of this.#tracked.values()) setRect(element, rect);
    this.#renderCursor();
    this.#panelTimer -= frameDelta;
    if (this.#panelTimer <= 0) {
      this.#panelTimer = DEBUG.panelRefreshInterval;
      this.#renderPanel();
    }
  }

  dispose() {
    for (const [type, handler] of this.#listeners) this.#viewport.removeEventListener(type, handler);
    this.setEnabled(false);
  }

  #drawStaticRect(rect) {
    const element = createElement(`debug-rect debug-rect--${rect.kind}`, this.#sceneLayer);
    setRect(element, rect);
    if (rect.kind === 'wall') return;
    // Etiqueta con la misma notación de los datos del nivel, para comparar rápido.
    element.dataset.label = `x ${rect.x}–${rect.x + rect.width} · top ${rect.y}`;
  }

  #buildRuler() {
    const ruler = createElement('debug-ruler', this.#layer);
    for (let x = 0; x <= WORLD.width; x += DEBUG.rulerStep) {
      this.#addRulerLabel(ruler, 'debug-ruler__x', x, 0, x);
    }
    for (let x = 0; x < WORLD.width; x += Y_LABEL_COLUMN_STEP) {
      for (let y = DEBUG.rulerStep; y < WORLD.height; y += DEBUG.rulerStep) {
        this.#addRulerLabel(ruler, 'debug-ruler__y', x, y, y);
      }
    }
  }

  #addRulerLabel(parent, className, x, y, text) {
    const label = createElement(className, parent);
    label.textContent = text;
    setPosition(label, x, y);
  }

  #buildCursor() {
    this.#cursor = createElement('debug-cursor', this.#layer);
    createElement('debug-cursor__line debug-cursor__line--v', this.#cursor);
    createElement('debug-cursor__line debug-cursor__line--h', this.#cursor);
    this.#cursorLabel = createElement('debug-cursor__label', this.#cursor);
  }

  #onPointerMove(event) {
    const bounds = this.#viewport.getBoundingClientRect();
    this.#pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  #pointerInWorld() {
    if (!this.#pointer) return null;
    const point = this.#camera.screenToWorld(this.#pointer.x, this.#pointer.y);
    return { x: Math.round(point.x), y: Math.round(point.y) };
  }

  #renderCursor() {
    const point = this.#pointerInWorld();
    this.#cursor.classList.toggle('is-hidden', !point);
    if (!point) return;
    setPosition(this.#cursor, point.x, point.y);
    this.#cursorLabel.textContent = `${point.x}, ${point.y}`;
  }

  // Clic en modo depuración: copia "x, y" para pegarlo directo en los datos del nivel.
  #copyPointer() {
    const point = this.#pointerInWorld();
    if (!this.#enabled || !point) return;
    this.#lastCopied = `${point.x}, ${point.y}`;
    navigator.clipboard?.writeText(this.#lastCopied).catch(() => {});
    console.info(`[debug] ${this.#lastCopied}`);
  }

  #measureFps(frameDelta) {
    if (frameDelta <= 0) return;
    const instant = 1 / frameDelta;
    this.#fps = this.#fps === 0 ? instant : damp(this.#fps, instant, 1 / DEBUG.fpsSmoothingTime, frameDelta);
  }

  #renderPanel() {
    const lines = [
      'DEPURACIÓN   tecla º/` o F2',
      `fps          ${Math.round(this.#fps)}`,
      ...Object.entries(this.#report).map(([key, value]) => `${key.padEnd(12)} ${value}`),
      `cámara       x ${Math.round(this.#camera.x)}  escala ${this.#camera.scale.toFixed(2)}`,
      `copiado      ${this.#lastCopied}   (clic = copiar x, y)`,
    ];
    this.#panel.textContent = lines.join('\n');
  }
}
