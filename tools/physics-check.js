// Simula al Player real sobre un piso infinito y mide saltos a distintos FPS.
// Abre con Live Server en /tools/physics-check.html.

import { PLAYER, LOOP } from '../js/config.js';
import { EventBus } from '../js/core/event-bus.js';
import { Player } from '../js/entities/player.js';

// --- Huecos de los niveles (medida total del hueco en px) ---
const GAPS = Object.freeze({
  pinchosN1E1: 228,
  acidoN2E1: 233,
  fosoN1E3: 290,
  huecoN2E3: 250,       // con subida de 70 px
  huecoN2E3Rise: 70,
});

// Crossable = recorrido >= hueco - PLAYER.width
// Imposible = recorrido < hueco - PLAYER.width
const REQ_SIMPLE_HEIGHT = 100;
const REQ_SIMPLE_HORIZ_MIN = 110;

const STEP_SIZES = [1 / 120, 1 / 144, 1 / 30];
const FLOOR_Y = 500;
const FLOOR = { x: -10000, y: FLOOR_Y, width: 30000, height: 200, kind: 'solid' };

class FakeInput {
  #held = new Set();
  #pressed = new Set();
  isHeld(action) { return this.#held.has(action); }
  consumePress(action) { return this.#pressed.delete(action); }
  hold(action) { this.#held.add(action); }
  press(action) { this.#pressed.add(action); }
  releaseAll() { this.#held.clear(); this.#pressed.clear(); }
  endFrame() { this.#pressed.clear(); }
}

function simulate(rawDt, { jumpAtStep = 1, secondJumpDelay, startY = FLOOR_Y }) {
  const maxSubstep = LOOP.maxSubstep;
  const stepsPerFrame = Math.max(1, Math.ceil(rawDt / maxSubstep));
  const dt = rawDt / stepsPerFrame;

  const events = new EventBus();
  const input = new FakeInput();
  const spawnY = startY;
  const player = new Player({ x: 100, y: spawnY }, events);

  const solids = [FLOOR];
  input.hold('right');

  for (let s = 0; s < stepsPerFrame; s++) player.update(dt, input, solids);
  input.endFrame();

  let jumped = false;
  let doubleJumped = false;
  let frame = 1;
  let maxHeight = player.body.y + player.body.height;
  let landed = false;
  let startX = player.body.x + player.body.width / 2;

  const maxFrames = 600;
  while (frame < maxFrames && !landed) {
    if (!jumped && frame >= jumpAtStep) {
      input.press('jump');
      jumped = true;
    }

    if (jumped && !doubleJumped && secondJumpDelay !== undefined) {
      if (frame - jumpAtStep >= secondJumpDelay) {
        input.press('jump');
        doubleJumped = true;
      }
    }

    for (let s = 0; s < stepsPerFrame; s++) player.update(dt, input, solids);
    input.endFrame();

    const feetY = player.body.y + player.body.height;
    if (feetY < maxHeight) maxHeight = feetY;
    if (jumped && frame > jumpAtStep + 1 && player.isGrounded) {
      landed = true;
    }
    frame++;
  }

  const peakHeight = spawnY - maxHeight;
  const horizDistance = (player.body.x + player.body.width / 2) - startX;
  events.clear();
  return { peakHeight, horizDistance };
}

function findBestDoubleJump(rawDt, startY = FLOOR_Y) {
  let best = { peakHeight: 0, horizDistance: 0 };
  for (let delay = 1; delay <= 120; delay++) {
    const result = simulate(rawDt, { jumpAtStep: 1, secondJumpDelay: delay, startY });
    if (result.peakHeight > best.peakHeight) best = result;
  }
  return best;
}

function runTests() {
  const results = [];

  for (const rawDt of STEP_SIZES) {
    const fpsLabel = Math.round(1 / rawDt);

    const simple = simulate(rawDt, { jumpAtStep: 1 });
    const doubleJump = findBestDoubleJump(rawDt);
    const coyoteBonus = PLAYER.coyoteTime * PLAYER.runSpeed;
    const doubleJump70 = findBestDoubleJump(rawDt, FLOOR_Y - 70);

    results.push({
      fps: fpsLabel,
      simpleHeight: Math.round(simple.peakHeight),
      simpleHoriz: Math.round(simple.horizDistance),
      doubleJumpHeight: Math.round(doubleJump.peakHeight),
      doubleJumpHoriz: Math.round(doubleJump.horizDistance),
      doubleJumpWithCoyoteHoriz: Math.round(doubleJump.horizDistance + coyoteBonus),
      doubleJump70Height: Math.round(doubleJump70.peakHeight),
    });
  }

  return results;
}

function checkReq(label, actual, test) {
  return { label, actual, passed: test(actual) };
}

function renderResults() {
  const output = document.getElementById('output');
  const results = runTests();
  const pw = PLAYER.width;

  let html = '<table><tr><th>FPS</th><th>Simple alto</th><th>Simple horiz.</th>'
    + '<th>Doble alto</th><th>Doble horiz.</th>'
    + '<th>Doble + coyote horiz.</th><th>Doble +70 alto</th></tr>';

  for (const r of results) {
    html += `<tr><td>${r.fps}</td><td>${r.simpleHeight}</td><td>${r.simpleHoriz}</td>`
      + `<td>${r.doubleJumpHeight}</td><td>${r.doubleJumpHoriz}</td>`
      + `<td>${r.doubleJumpWithCoyoteHoriz}</td><td>${r.doubleJump70Height}</td></tr>`;
  }
  html += '</table>';

  html += '<h2>Verificacion de requisitos</h2><table><tr><th>Requisito</th><th>Valor</th><th></th></tr>';

  const ref = results[0];
  const checks = [
    checkReq(`Salto simple = ${REQ_SIMPLE_HEIGHT} px alto`, ref.simpleHeight,
      (v) => v >= REQ_SIMPLE_HEIGHT - 2 && v <= REQ_SIMPLE_HEIGHT + 2),
    checkReq(`Salto simple >= ${REQ_SIMPLE_HORIZ_MIN} px horiz.`, ref.simpleHoriz,
      (v) => v >= REQ_SIMPLE_HORIZ_MIN),
    // Puas N1E1: cruzable si horiz >= gap - width
    checkReq(`Puas N1E1 (${GAPS.pinchosN1E1}): horiz >= ${GAPS.pinchosN1E1 - pw}`,
      ref.doubleJumpWithCoyoteHoriz,
      (v) => v >= GAPS.pinchosN1E1 - pw),
    // Acido N2E1: cruzable
    checkReq(`Acido N2E1 (${GAPS.acidoN2E1}): horiz >= ${GAPS.acidoN2E1 - pw}`,
      ref.doubleJumpWithCoyoteHoriz,
      (v) => v >= GAPS.acidoN2E1 - pw),
    // Foso N1E3: imposible
    checkReq(`Foso N1E3 (${GAPS.fosoN1E3}): horiz < ${GAPS.fosoN1E3 - pw}`,
      ref.doubleJumpWithCoyoteHoriz,
      (v) => v < GAPS.fosoN1E3 - pw),
    // Hueco N2E3 con subida de 70: imposible
    checkReq(`Hueco N2E3 (${GAPS.huecoN2E3} +${GAPS.huecoN2E3Rise}): horiz < ${GAPS.huecoN2E3 - pw}`,
      ref.doubleJump70Height,
      (v) => v < GAPS.huecoN2E3 - pw),
  ];

  for (const c of checks) {
    const cls = c.passed ? 'pass' : 'fail';
    const icon = c.passed ? '✅' : '❌';
    html += `<tr><td>${c.label}</td><td class="${cls}">${c.actual}</td><td>${icon}</td></tr>`;
  }
  html += '</table>';

  const allPassed = checks.every((c) => c.passed);
  html += `<p style="font-size:1.3em;margin-top:1rem;" class="${allPassed ? 'pass' : 'fail'}">`
    + `${allPassed ? '✅ Todas las pruebas pasan' : '❌ Hay requisitos que no se cumplen'}</p>`;

  output.innerHTML = html;
}

renderResults();
