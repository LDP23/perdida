/**
 * @module level-check
 *
 * Verificaciones estáticas de los datos de nivel:
 * 1. Escalones trampa: pares de sólidos vecinos con desnivel de 1–10 px.
 * 2. Separación de plataformas: plataformas móviles y que caen no deben
 *    superponerse con sólidos estáticos en ningún punto de su recorrido.
 *
 * Se usa abriendo /tools/level-check.html con Live Server, o con:
 *   node --experimental-default-type=module tools/level-check.js
 *
 * Importa los datos de nivel reales para verificar el código actual.
 */
import { LEVELS } from '../js/levels/levels.js';
import { PLAYER, PLATFORMS } from '../js/config.js';

/**
 * Busca pares de sólidos vecinos con escalones de 1–10 px.
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

/**
 * Verifica que las plataformas no se superpongan con sólidos estáticos.
 * Para plataformas móviles, muestrea posiciones intermedias del recorrido.
 * @returns {Array<{level: string, scene: string, platform: string, solid: Object, clearance: number}>}
 */
function findPlatformOverlaps() {
  const results = [];
  const minClearance = PLATFORMS.wallClearance;

  for (const level of LEVELS) {
    for (const scene of level.scenes) {
      const solids = scene.solids || [];

      const movingPlatforms = scene.movingPlatforms || [];
      for (const mp of movingPlatforms) {
        const w = mp.width;
        const h = PLATFORMS.moving.height;
        const dx = mp.to.x - mp.from.x;
        const dy = mp.to.y - mp.from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sampleCount = Math.max(2, Math.ceil(dist / 4));

        for (let s = 0; s <= sampleCount; s++) {
          const t = s / sampleCount;
          const px = mp.from.x + dx * t;
          const py = mp.from.y + dy * t;
          const platRect = { x1: px, x2: px + w, top: py, bottom: py + h };

          for (const solid of solids) {
            const solidBottom = solid.bottom ?? 724;
            const horizontalOverlap = platRect.x2 + minClearance > solid.x1 && platRect.x1 - minClearance < solid.x2;
            const verticalOverlap = platRect.bottom > solid.top && platRect.top < solidBottom;
            if (horizontalOverlap && verticalOverlap) {
              const clearanceLeft = solid.x1 - platRect.x2;
              const clearanceRight = platRect.x1 - solid.x2;
              const clearance = Math.max(clearanceLeft, clearanceRight);
              results.push({
                level: `N${level.id}`,
                scene: scene.id,
                platform: `móvil [${mp.from.x},${mp.from.y}]→[${mp.to.x},${mp.to.y}] w${w}`,
                solid: { x1: solid.x1, x2: solid.x2, top: solid.top },
                clearance: Math.round(clearance),
                at: `t=${t.toFixed(2)} (${Math.round(px)},${Math.round(py)})`,
              });
              break;
            }
          }
        }
      }

      const fallingPlatforms = scene.fallingPlatforms || [];
      for (const fp of fallingPlatforms) {
        const w = fp.width;
        const h = PLATFORMS.falling.height;
        const platRect = { x1: fp.x, x2: fp.x + w, top: fp.y, bottom: fp.y + h };

        for (const solid of solids) {
          const solidBottom = solid.bottom ?? 724;
          const horizontalOverlap = platRect.x2 + minClearance > solid.x1 && platRect.x1 - minClearance < solid.x2;
          const verticalOverlap = platRect.bottom > solid.top && platRect.top < solidBottom;
          if (horizontalOverlap && verticalOverlap) {
            const clearanceLeft = solid.x1 - platRect.x2;
            const clearanceRight = platRect.x1 - solid.x2;
            const clearance = Math.max(clearanceLeft, clearanceRight);
            results.push({
              level: `N${level.id}`,
              scene: scene.id,
              platform: `cae [${fp.x},${fp.y}] w${w}`,
              solid: { x1: solid.x1, x2: solid.x2, top: solid.top },
              clearance: Math.round(clearance),
              at: `reposo`,
            });
          }
        }
      }
    }
  }

  return results;
}

const steps = findSteps();
const overlaps = findPlatformOverlaps();

if (typeof document !== 'undefined') {
  const output = document.getElementById('output');
  let html = '';

  html += '<h2>Escalones trampa (1–10 px)</h2>';
  if (steps.length === 0) {
    html += '<p class="pass">✅ No se encontraron escalones trampa en ningún nivel.</p>';
  } else {
    html += `<p class="fail">❌ Se encontraron ${steps.length} escalones trampa:</p>`;
    html += '<table><tr><th>Nivel</th><th>Escena</th><th>Izq (x2, top)</th><th>Der (x1, top)</th><th>Hueco</th><th>Desnivel</th></tr>';
    for (const s of steps) {
      html += `<tr><td>${s.level}</td><td>${s.scene}</td>`
        + `<td>${s.left.x2}, ${s.left.top}</td>`
        + `<td>${s.right.x1}, ${s.right.top}</td>`
        + `<td>${s.gap} px</td>`
        + `<td class="fail">${s.step} px</td></tr>`;
    }
    html += '</table>';
  }

  html += '<h2>Separación de plataformas</h2>';
  if (overlaps.length === 0) {
    html += `<p class="pass">✅ Todas las plataformas mantienen ${PLATFORMS.wallClearance} px de separación.</p>`;
  } else {
    html += `<p class="fail">❌ Se encontraron ${overlaps.length} violaciones de separación (mín ${PLATFORMS.wallClearance} px):</p>`;
    html += '<table><tr><th>Nivel</th><th>Escena</th><th>Plataforma</th><th>Sólido</th><th>Separación</th><th>En</th></tr>';
    for (const o of overlaps) {
      html += `<tr><td>${o.level}</td><td>${o.scene}</td>`
        + `<td>${o.platform}</td>`
        + `<td>[${o.solid.x1}–${o.solid.x2}, top ${o.solid.top}]</td>`
        + `<td class="fail">${o.clearance} px</td>`
        + `<td>${o.at}</td></tr>`;
    }
    html += '</table>';
  }

  output.innerHTML = html;
} else {
  if (steps.length === 0) {
    console.log('✅ No se encontraron escalones trampa (1–10 px) en ningún nivel.');
  } else {
    console.log(`❌ Se encontraron ${steps.length} escalones trampa:`);
    for (const s of steps) {
      console.log(`  ${s.level} ${s.scene}: [${s.left.x1}–${s.left.x2}, top ${s.left.top}] → [${s.right.x1}–${s.right.x2}, top ${s.right.top}] | hueco ${s.gap} px, desnivel ${s.step} px`);
    }
  }

  if (overlaps.length === 0) {
    console.log(`✅ Todas las plataformas mantienen ${PLATFORMS.wallClearance} px de separación.`);
  } else {
    console.log(`❌ Se encontraron ${overlaps.length} violaciones de separación:`);
    for (const o of overlaps) {
      console.log(`  ${o.level} ${o.scene}: ${o.platform} ↔ [${o.solid.x1}–${o.solid.x2}, top ${o.solid.top}] | ${o.clearance} px | ${o.at}`);
    }
  }
}
