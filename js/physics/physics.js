import { PHYSICS } from '../config.js';
import { rectsOverlap } from './collision.js';

// Describe cada eje para que el mismo código resuelva X e Y (sin duplicar la lógica).
const AXES = Object.freeze({
  x: { size: 'width', velocity: 'vx', negativeContact: 'left', positiveContact: 'right' },
  y: { size: 'height', velocity: 'vy', negativeContact: 'ceiling', positiveContact: 'ground' },
});

export function createBody({ x = 0, y = 0, width, height, gravityScale = 1 }) {
  return {
    x, y, width, height,
    vx: 0,
    vy: 0,
    gravityScale,
    contacts: { left: false, right: false, ground: false, ceiling: false },
    // Referencia al sólido sobre el que descansa (para arrastre de plataformas)
    groundSolid: null,
  };
}

// Velocidad inicial necesaria para alcanzar una altura: v = √(2·g·h).
export function velocityForHeight(height) {
  return Math.sqrt(2 * PHYSICS.gravity * height);
}

// Un paso de simulación: gravedad, movimiento y choque contra los sólidos.
export function stepBody(body, solids, deltaTime) {
  resetContacts(body.contacts);
  body.groundSolid = null;
  const fallDistance = integrateGravity(body, deltaTime);
  moveAxis(body, 'x', body.vx * deltaTime, solids);
  moveAxis(body, 'y', fallDistance, solids);
}

function resetContacts(contacts) {
  for (const side of Object.keys(contacts)) contacts[side] = false;
}

// Promediar la velocidad antes y después del paso es la fórmula exacta con
// gravedad constante: el salto mide lo mismo a 30, 60 o 144 FPS.
function integrateGravity(body, deltaTime) {
  const gravity = PHYSICS.gravity * body.gravityScale;
  const nextVy = Math.min(body.vy + gravity * deltaTime, PHYSICS.maxFallSpeed);
  const distance = (body.vy + nextVy) * 0.5 * deltaTime;
  body.vy = nextVy;
  return distance;
}

// Mover un eje a la vez permite saber de qué lado fue el choque
// (piso, techo o pared) y deslizarse por las superficies.
export function moveAxis(body, axis, delta, solids) {
  if (delta === 0) return;
  const { size, velocity, negativeContact, positiveContact } = AXES[axis];
  body[axis] += delta;

  for (const solid of solids) {
    if (!rectsOverlap(body, solid)) continue;
    if (delta > 0) {
      body[axis] = solid[axis] - body[size];
      body.contacts[positiveContact] = true;
      // Rastrear sobre qué sólido aterrizó (para arrastre de plataformas)
      if (axis === 'y') body.groundSolid = solid;
    } else {
      body[axis] = solid[axis] + solid[size];
      body.contacts[negativeContact] = true;
    }
    body[velocity] = 0;
  }
}

// Arrastra un cuerpo con su plataforma, resolviendo colisiones normales
export function carryByPlatform(body, dx, dy, solids) {
  if (dx !== 0) moveAxis(body, 'x', dx, solids);
  if (dy !== 0) moveAxis(body, 'y', dy, solids);
}
