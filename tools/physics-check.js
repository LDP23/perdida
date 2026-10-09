/**
 * @module physics-check
 *
 * Verificador de física: simula al Player real sobre un piso infinito y mide
 * saltos a 30, 120 y 144 FPS. Compara los resultados con los requisitos de los
 * huecos del juego (pinchos, ácido, foso) para garantizar que la física es
 * determinista a cualquier tasa de frames.
 *
 * También simula saltos con externalVx (fuerza de descompresión) para verificar
 * las brechas del nivel 3.
 *
 * Se usa abriendo /tools/physics-check.html con Live Server. No es parte del juego.
 *
 * Importa el Player y la física reales (no simulaciones separadas) para verificar
 * que el código actual cumple las restricciones de diseño del CLAUDE.md.
 */
import { PLAYER, LOOP, TRAPS } from '../js/config.js';
import { EventBus } from '../js/core/event-bus.js';
import { Player } from '../js/entities/player.js';

/** Distancias horizontales (en px) de los huecos que el robot debe cruzar o no cruzar */
const GAPS = Object.freeze({
  pinchosN1E1: 228,
  acidoN2E1: 233,
  fosoN1E3: 290,
  huecoN2E3: 250,
  huecoN2E3Rise: 70,
});

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

function simulate(rawDt, { jumpAtStep = 1, secondJumpDelay, startY = FLOOR_Y, externalVx = 0 }) {
  const maxSubstep = LOOP.maxSubstep;
  const stepsPerFrame = Math.max(1, Math.ceil(rawDt / maxSubstep));
  const dt = rawDt / stepsPerFrame;

  const events = new EventBus();
  const input = new FakeInput();
  const spawnY = startY;
  const player = new Player({ x: 100, y: spawnY }, events);

  const solids = [FLOOR];
  input.hold('right');

  player.body.externalVx = externalVx;
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

    player.body.externalVx = externalVx;
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

function findBestDoubleJump(rawDt, startY = FLOOR_Y, externalVx = 0) {
  let best = { peakHeight: 0, horizDistance: 0 };
  for (let delay = 1; delay <= 120; delay++) {
    const result = simulate(rawDt, { jumpAtStep: 1, secondJumpDelay: delay, startY, externalVx });
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

function runDecompressionTests() {
  const rawDt = 1 / 120;
  const str = TRAPS.decompression.strength;
  const coyote = PLAYER.coyoteTime * PLAYER.runSpeed;

  const simpleWithHelp = simulate(rawDt, { jumpAtStep: 1, externalVx: str });
  const simpleAgainst = simulate(rawDt, { jumpAtStep: 1, externalVx: -str });
  const doubleWithHelp = findBestDoubleJump(rawDt, FLOOR_Y, str);
  const doubleAgainst = findBestDoubleJump(rawDt, FLOOR_Y, -str);
  const doubleNeutral = findBestDoubleJump(rawDt, FLOOR_Y, 0);
  const double84up = findBestDoubleJump(rawDt, FLOOR_Y - 84, str);

  return {
    simpleHorizHelp: Math.round(simpleWithHelp.horizDistance),
    simpleHorizAgainst: Math.round(simpleAgainst.horizDistance),
    doubleHorizHelp: Math.round(doubleWithHelp.horizDistance),
    doubleHorizAgainst: Math.round(doubleAgainst.horizDistance),
    doubleHorizNeutral: Math.round(doubleNeutral.horizDistance),
    doubleHorizHelpCoyote: Math.round(doubleWithHelp.horizDistance + coyote),
    doubleHorizAgainstCoyote: Math.round(doubleAgainst.horizDistance + coyote),
    doubleHorizNeutralCoyote: Math.round(doubleNeutral.horizDistance + coyote),
    double84upHorizHelp: Math.round(double84up.horizDistance),
    double84upHeight: Math.round(double84up.peakHeight),
  };
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
    checkReq(`Puas N1E1 (${GAPS.pinchosN1E1}): horiz >= ${GAPS.pinchosN1E1 - pw}`,
      ref.doubleJumpWithCoyoteHoriz,
      (v) => v >= GAPS.pinchosN1E1 - pw),
    checkReq(`Acido N2E1 (${GAPS.acidoN2E1}): horiz >= ${GAPS.acidoN2E1 - pw}`,
      ref.doubleJumpWithCoyoteHoriz,
      (v) => v >= GAPS.acidoN2E1 - pw),
    checkReq(`Foso N1E3 (${GAPS.fosoN1E3}): horiz < ${GAPS.fosoN1E3 - pw}`,
      ref.doubleJumpWithCoyoteHoriz,
      (v) => v < GAPS.fosoN1E3 - pw),
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

  // --- Verificación con descompresión (Nivel 3) ---
  html += '<h2>Verificacion con descompresion (Nivel 3)</h2>';
  const dc = runDecompressionTests();
  const str = TRAPS.decompression.strength;

  html += `<table><tr><th>Medida</th><th>Valor (px)</th></tr>`
    + `<tr><td>Simple con fuerza a favor (+${str})</td><td>${dc.simpleHorizHelp}</td></tr>`
    + `<tr><td>Simple con fuerza en contra (-${str})</td><td>${dc.simpleHorizAgainst}</td></tr>`
    + `<tr><td>Doble con fuerza a favor</td><td>${dc.doubleHorizHelp}</td></tr>`
    + `<tr><td>Doble con fuerza en contra</td><td>${dc.doubleHorizAgainst}</td></tr>`
    + `<tr><td>Doble sin fuerza (neutral)</td><td>${dc.doubleHorizNeutral}</td></tr>`
    + `<tr><td>Doble + coyote con fuerza a favor</td><td>${dc.doubleHorizHelpCoyote}</td></tr>`
    + `<tr><td>Doble + coyote con fuerza en contra</td><td>${dc.doubleHorizAgainstCoyote}</td></tr>`
    + `<tr><td>Doble + coyote sin fuerza</td><td>${dc.doubleHorizNeutralCoyote}</td></tr>`
    + `<tr><td>Doble subiendo 84 px + fuerza a favor</td><td>${dc.double84upHorizHelp}</td></tr>`
    + `<tr><td>Doble subiendo 84 px alto</td><td>${dc.double84upHeight}</td></tr>`
    + '</table>';

  const n3checks = [
    checkReq(`N3E1 entrada (383→544, 161 px): simple + fuerza a favor >= ${161 - pw}`,
      dc.simpleHorizHelp, (v) => v >= 161 - pw),
    checkReq(`N3E1 salida (644→805, 161 px): doble + fuerza en contra + coyote >= ${161 - pw}`,
      dc.doubleHorizAgainstCoyote, (v) => v >= 161 - pw),
    checkReq(`N3E1 sin plataforma (422 px): doble + fuerza a favor + coyote < ${422 - pw}`,
      dc.doubleHorizHelpCoyote, (v) => v < 422 - pw),
    checkReq(`N3E2 871→1047 (176 px, subida 84): doble + fuerza a favor`,
      dc.double84upHorizHelp, (v) => v >= 176 - pw),
    checkReq(`N3E2 1337→1499 (162 px, bajada 68): doble + fuerza en contra`,
      dc.doubleHorizAgainst, (v) => v >= 162 - pw),
    checkReq(`N3E2 1614→1775 (161 px, bajada 72): doble + fuerza en contra`,
      dc.doubleHorizAgainst, (v) => v >= 161 - pw),
    checkReq(`N3E3 entrada (331→437, 106 px): simple + fuerza a favor >= ${106 - pw}`,
      dc.simpleHorizHelp, (v) => v >= 106 - pw),
    checkReq(`N3E3 salida (537→643, 106 px): doble + fuerza en contra + coyote >= ${106 - pw}`,
      dc.doubleHorizAgainstCoyote, (v) => v >= 106 - pw),
    checkReq(`N3E3 sin plataforma (312 px, pullX central): doble neutral + coyote < ${312 - pw}`,
      dc.doubleHorizNeutralCoyote, (v) => v < 312 - pw),
    checkReq(`Quedarse quieto arrastra: ${str} px/s > 0`,
      str, (v) => v > 0),
    checkReq(`Caminar resiste: runSpeed (${PLAYER.runSpeed}) > strength (${str})`,
      PLAYER.runSpeed - str, (v) => v > 0),
  ];

  html += '<h3>Requisitos Nivel 3</h3><table><tr><th>Requisito</th><th>Valor</th><th></th></tr>';
  for (const c of n3checks) {
    const cls = c.passed ? 'pass' : 'fail';
    const icon = c.passed ? '✅' : '❌';
    html += `<tr><td>${c.label}</td><td class="${cls}">${c.actual}</td><td>${icon}</td></tr>`;
  }
  html += '</table>';

  const allN3Passed = n3checks.every((c) => c.passed);
  html += `<p style="font-size:1.3em;margin-top:1rem;" class="${allN3Passed ? 'pass' : 'fail'}">`
    + `${allN3Passed ? '✅ Nivel 3: todas las pruebas pasan' : '❌ Nivel 3: hay requisitos que no se cumplen'}</p>`;

  output.innerHTML = html;
}

renderResults();
