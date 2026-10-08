/**
 * @module level-check
 *
 * Detector de escalones trampa: recorre todos los niveles y lista los pares de
 * sólidos vecinos con una diferencia de `top` entre 1 y 10 px. Estos desniveles
 * atrapan al robot al caminar porque la resolución de colisiones los interpreta
 * como paredes en vez de rampas.
 *
 * Se usa abriendo /tools/level-check.html con Live Server, o con:
 *   node --experimental-default-type=module tools/level-check.js
 *
 * Importa los datos de nivel reales para verificar el código actual.
 */
import { LEVELS } from '../js/levels/levels.js';
import { PLAYER } from '../js/config.js';

/**
 * Busca pares de sólidos vecinos con escalones de 1–10 px.
 * Dos sólidos son vecinos si su separación horizontal es menor que el ancho
 * del jugador (el robot puede estar parado entre ambos).
 *
 * @returns {Array<{level: string, scene: string, left: Object, right: Object, gap: number, step: number}>}
 */
function findSteps() {
  const results = [];

  for (const level of LEVELS) {
    for (const scene of level.scenes) {
      const solids = scene.solids || [];

      for (let i = 0; i < solids.length; i++) {
        for (let j = i + 1; j < solids.length; j++) {
          const a = solids[i];
          const b = solids[j];

          const leftSolid = a.x2 <= b.x1 ? a : b.x2 <= a.x1 ? b : null;
          const rightSolid = leftSolid === a ? b : a;

          if (!leftSolid) continue;

          const horizontalGap = rightSolid.x1 - leftSolid.x2;
          if (horizontalGap >= PLAYER.width) continue;

          const stepSize = Math.abs((leftSolid.top || 0) - (rightSolid.top || 0));
          if (stepSize >= 1 && stepSize <= 10) {
            results.push({
              level: `N${level.id}`,
              scene: scene.id,
              left: { x1: leftSolid.x1, x2: leftSolid.x2, top: leftSolid.top || 0 },
              right: { x1: rightSolid.x1, x2: rightSolid.x2, top: rightSolid.top || 0 },
              gap: horizontalGap,
              step: stepSize,
            });
          }
        }
      }
    }
  }

  return results;
}

const steps = findSteps();

if (typeof document !== 'undefined') {
  const output = document.getElementById('output');
  if (steps.length === 0) {
    output.innerHTML = '<p class="pass">✅ No se encontraron escalones trampa (1–10 px) en ningún nivel.</p>';
  } else {
    let html = `<p class="fail">❌ Se encontraron ${steps.length} escalones trampa:</p>`;
    html += '<table><tr><th>Nivel</th><th>Escena</th><th>Izq (x2, top)</th><th>Der (x1, top)</th><th>Hueco</th><th>Desnivel</th></tr>';
    for (const s of steps) {
      html += `<tr><td>${s.level}</td><td>${s.scene}</td>`
        + `<td>${s.left.x2}, ${s.left.top}</td>`
        + `<td>${s.right.x1}, ${s.right.top}</td>`
        + `<td>${s.gap} px</td>`
        + `<td class="fail">${s.step} px</td></tr>`;
    }
    html += '</table>';
    output.innerHTML = html;
  }
} else {
  if (steps.length === 0) {
    console.log('✅ No se encontraron escalones trampa (1–10 px) en ningún nivel.');
  } else {
    console.log(`❌ Se encontraron ${steps.length} escalones trampa:`);
    for (const s of steps) {
      console.log(`  ${s.level} ${s.scene}: [${s.left.x1}–${s.left.x2}, top ${s.left.top}] → [${s.right.x1}–${s.right.x2}, top ${s.right.top}] | hueco ${s.gap} px, desnivel ${s.step} px`);
    }
  }
}
