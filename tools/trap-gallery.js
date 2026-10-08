/**
 * @module trap-gallery
 *
 * Galería visual de trampas: muestra cada tipo en cada una de sus fases,
 * congelada, para verificar que ninguna pieza permanente desaparezca.
 * Usa las clases reales de js/traps/ y la vista real TrapView.
 *
 * Se abre con Live Server en /tools/trap-gallery.html.
 */
import { TRAPS } from '../js/config.js';
import { TrapView } from '../js/view/trap-view.js';
import { createTrap } from '../js/traps/trap-factory.js';

const gallery = document.getElementById('gallery');

const TRAP_SAMPLES = [
  {
    name: 'Prensa hidráulica',
    data: { type: 'press', x1: 50, x2: 200, restBottom: 180, bottom: 300 },
    phases: ['idle', 'warning', 'slam', 'hold', 'rise'],
  },
  {
    name: 'Láser intermitente',
    data: { type: 'laser', x: 100 },
    phases: ['off', 'warning', 'on'],
  },
  {
    name: 'Goteo de ácido',
    data: { type: 'acid-drip', x: 100 },
    sceneContext: { solids: [{ x: 0, y: 250, width: 300, height: 100 }] },
    phases: ['idle', 'warning', 'fall', 'splash'],
  },
  {
    name: 'Láser de barrido',
    data: { type: 'sweep-laser', x1: 30, x2: 250 },
    phases: ['warning-left', 'sweep-right', 'pause-right', 'warning-right', 'sweep-left', 'pause-left'],
  },
  {
    name: 'Torreta',
    data: { type: 'turret', x: 100, y: 120, direction: -1 },
    phases: ['idle', 'aiming', 'fire', 'cooldown', 'destroyed'],
  },
  {
    name: 'Descompresión',
    data: { type: 'decompression', x1: 20, x2: 250, top: 20, bottom: 250, pullX: 135 },
    phases: ['active'],
  },
];

let zoomLevel = 1;

const zoomBtn = document.createElement('button');
zoomBtn.textContent = 'Zoom ×1';
zoomBtn.className = 'zoom-btn';
zoomBtn.addEventListener('click', () => {
  zoomLevel = zoomLevel === 3 ? 1 : 3;
  zoomBtn.textContent = `Zoom ×${zoomLevel}`;
  gallery.style.setProperty('--gallery-zoom', zoomLevel);
});
document.body.insertBefore(zoomBtn, gallery);

for (const sample of TRAP_SAMPLES) {
  const section = document.createElement('div');
  section.className = 'trap-type';
  section.innerHTML = `<h2>${sample.name} (${sample.data.type})</h2>`;

  const phasesRow = document.createElement('div');
  phasesRow.className = 'phases';

  for (const phaseName of sample.phases) {
    const card = document.createElement('div');
    card.className = 'phase-card';
    card.innerHTML = `<h3>${phaseName}</h3>`;

    const container = document.createElement('div');
    container.className = 'trap-container';

    const trap = createTrap(sample.data, sample.sceneContext);

    if (phaseName === 'destroyed' && trap.type === 'turret') {
      advanceTrapToPhase(trap, 'idle');
      trap.onShot();
      trap.onShot();
    } else {
      advanceTrapToPhase(trap, phaseName);
    }

    const zone = trap.zone;
    container.style.width = `${zone.width}px`;
    container.style.height = `${zone.height}px`;

    if (zone.height > 400) {
      container.style.height = '300px';
      container.style.overflow = 'hidden';
    }

    const view = new TrapView(container, trap);
    view.sync(trap);

    card.appendChild(container);
    phasesRow.appendChild(card);
  }

  section.appendChild(phasesRow);
  gallery.appendChild(section);
}

/**
 * Avanza la trampa hasta la fase indicada consumiendo tiempo.
 * @param {Trap} trap
 * @param {string} targetPhase
 */
function advanceTrapToPhase(trap, targetPhase) {
  let safetyLimit = 1000;
  while (trap.phase !== targetPhase && safetyLimit-- > 0) {
    trap.update(0.05);
  }
  if (trap.phase === targetPhase) {
    trap.update(0.001);
  }
}
