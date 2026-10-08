/**
 * @module physics
 *
 * Motor de física del juego: cuerpos rígidos con gravedad, velocidad y colisiones
 * contra sólidos estáticos (AABB). No hay rotación ni fricción — solo lo necesario
 * para un plataformas en 2D.
 *
 * Usado por: Player, Enemy, Projectile, PlatformSystem.
 * Depende de: config.js (PHYSICS), collision.js (rectsOverlap).
 * Participa en: cada subpaso del bucle, dentro del update de cada entidad.
 *
 * @typedef {import('./collision.js').Rect} Rect
 */
import { PHYSICS } from '../config.js';
import { rectsOverlap } from './collision.js';

/**
 * @typedef {Object} Contacts
 * @property {boolean} left — tocando un sólido por la izquierda.
 * @property {boolean} right — tocando un sólido por la derecha.
 * @property {boolean} ground — apoyado sobre un sólido (piso).
 * @property {boolean} ceiling — chocando contra un sólido por arriba (techo).
 */

/**
 * @typedef {Object} Body
 * @property {number} x — borde izquierdo, en px del mundo.
 * @property {number} y — borde superior, en px del mundo.
 * @property {number} width — ancho de la hitbox, en px del mundo.
 * @property {number} height — alto de la hitbox, en px del mundo.
 * @property {number} vx — velocidad horizontal, en px/s (positivo = derecha).
 * @property {number} vy — velocidad vertical, en px/s (positivo = abajo).
 * @property {number} externalVx — velocidad horizontal externa (px/s), sumada al desplazamiento sin tocar vx.
 * @property {number} gravityScale — multiplicador de gravedad (0 = sin gravedad, como proyectiles).
 * @property {Contacts} contacts — lados en contacto con sólidos tras el último paso.
 * @property {Rect|null} groundSolid — referencia al sólido sobre el que descansa (para plataformas).
 */

/** Describe cada eje para que el mismo código resuelva X e Y sin duplicar lógica */
const AXES = Object.freeze({
  x: { size: 'width', velocity: 'vx', negativeContact: 'left', positiveContact: 'right' },
  y: { size: 'height', velocity: 'vy', negativeContact: 'ceiling', positiveContact: 'ground' },
});

/**
 * Crea un cuerpo físico con posición, tamaño y velocidad inicial cero.
 *
 * @param {Object} opts
 * @param {number} [opts.x=0] — posición X inicial, en px del mundo.
 * @param {number} [opts.y=0] — posición Y inicial, en px del mundo.
 * @param {number} opts.width — ancho de la hitbox, en px del mundo.
 * @param {number} opts.height — alto de la hitbox, en px del mundo.
 * @param {number} [opts.gravityScale=1] — multiplicador de gravedad (0 para proyectiles).
 * @returns {Body}
 */
export function createBody({ x = 0, y = 0, width, height, gravityScale = 1 }) {
  return {
    x, y, width, height,
    vx: 0,
    vy: 0,
    externalVx: 0,
    gravityScale,
    contacts: { left: false, right: false, ground: false, ceiling: false },
    groundSolid: null,
  };
}

/**
 * Calcula la velocidad inicial necesaria para alcanzar una altura dada.
 * Fórmula: v = √(2·g·h), derivada de la cinemática con gravedad constante.
 *
 * @param {number} height — altura deseada del salto, en px del mundo.
 * @returns {number} velocidad inicial hacia arriba, en px/s (positiva; el caller la niega).
 */
export function velocityForHeight(height) {
  return Math.sqrt(2 * PHYSICS.gravity * height);
}

/**
 * Un paso completo de simulación: aplica gravedad, mueve en X, mueve en Y,
 * resolviendo colisiones contra los sólidos en cada eje.
 *
 * @param {Body} body — cuerpo a simular.
 * @param {Rect[]} solids — lista de rectángulos sólidos contra los que colisionar.
 * @param {number} deltaTime — duración del paso, en segundos.
 *
 * Efecto: modifica body.x, body.y, body.vx, body.vy, body.contacts, body.groundSolid.
 */
export function stepBody(body, solids, deltaTime) {
  resetContacts(body.contacts);
  body.groundSolid = null;
  const fallDistance = integrateGravity(body, deltaTime);
  moveAxis(body, 'x', (body.vx + body.externalVx) * deltaTime, solids);
  moveAxis(body, 'y', fallDistance, solids);
}

/** Resetea todos los contactos a false antes de cada paso */
function resetContacts(contacts) {
  for (const side of Object.keys(contacts)) contacts[side] = false;
}

/**
 * Integración de gravedad con velocidad promediada (método de Verlet simplificado).
 *
 * En vez de usar solo la velocidad final (vy + g·dt), se promedia la velocidad
 * antes y después del paso: distancia = (vy_antes + vy_después) / 2 × dt.
 * Con gravedad constante, esta fórmula es EXACTA — no es una aproximación.
 * Por eso el salto mide exactamente lo mismo a 30, 60 o 144 FPS.
 *
 * @param {Body} body — cuerpo al que aplicar gravedad.
 * @param {number} deltaTime — duración del paso, en segundos.
 * @returns {number} distancia vertical a mover, en px del mundo (positivo = abajo).
 */
function integrateGravity(body, deltaTime) {
  const gravity = PHYSICS.gravity * body.gravityScale;
  const nextVy = Math.min(body.vy + gravity * deltaTime, PHYSICS.maxFallSpeed);
  const distance = (body.vy + nextVy) * 0.5 * deltaTime;
  body.vy = nextVy;
  return distance;
}

/**
 * Mueve un cuerpo en un solo eje y resuelve colisiones contra sólidos.
 *
 * Resolución eje por eje:
 * Mover X y Y por separado permite saber de qué lado fue el choque (piso, techo,
 * pared izquierda o derecha) y "deslizarse" por las superficies. Si se movieran
 * ambos ejes a la vez, un choque diagonal no sabría si empujar horizontal o
 * verticalmente, causando que el robot se atasque en las esquinas.
 *
 * Cuando hay colisión, el cuerpo se empuja al borde del sólido, se registra el
 * contacto y se anula la velocidad en ese eje.
 *
 * @param {Body} body — cuerpo a mover.
 * @param {'x'|'y'} axis — eje de movimiento.
 * @param {number} delta — distancia a mover, en px del mundo (con signo).
 * @param {Rect[]} solids — sólidos contra los que colisionar.
 *
 * Efecto: modifica body[axis], body.contacts, body[velocity], body.groundSolid.
 */
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

/**
 * Arrastra un cuerpo junto con su plataforma, resolviendo colisiones normales.
 * Se llama ANTES del paso normal del robot, para que este se mueva con la plataforma.
 *
 * @param {Body} body — cuerpo a arrastrar (normalmente el robot).
 * @param {number} dx — desplazamiento horizontal de la plataforma, en px del mundo.
 * @param {number} dy — desplazamiento vertical de la plataforma, en px del mundo.
 * @param {Rect[]} solids — sólidos contra los que colisionar durante el arrastre.
 */
export function carryByPlatform(body, dx, dy, solids) {
  if (dx !== 0) moveAxis(body, 'x', dx, solids);
  if (dy !== 0) moveAxis(body, 'y', dy, solids);
}
