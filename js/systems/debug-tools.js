/**
 * @module debug-tools
 *
 * Herramientas de depuración: reporte en panel (fps, posición, estado, batería, etc.),
 * rectángulos de debug (hitboxes, zonas de detección, peligros), tecla H (daño de prueba),
 * y teclas 1–9 (salto a escena por número).
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: config.js (BATTERY, ENEMY, PLAYER), levels.js.
 * Escucha: 'scene:mounted' (para configurar rectángulos de debug).
 * Emite: 'debug:jump-scene' { index } (al presionar 1–9).
 */
import { BATTERY, ENEMY, PLAYER } from '../config.js';
import { LEVELS } from '../levels/levels.js';

/**
 * Sistema de herramientas de depuración.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() limpia el listener.
 * Colabora con: DebugView (reporte y rectángulos), EventBus.
 */
export class DebugTools {
  #context;
  #getWorld;
  #session;
  #enemyDebugRects = [];
  #trapDebugRects = [];
  #unsub;

  constructor({ context, getWorld, session }) {
    this.#context = context;
    this.#getWorld = getWorld;
    this.#session = session;
    this.#unsub = context.events.on('scene:mounted', () => this.#setupScene());
  }

  handleInput(deltaTime, input) {
    const { debugView } = this.#context;
    if (!debugView.isEnabled) return;
    if (input.consumePress('debugHurt')) {
      const w = this.#getWorld();
      const playerCx = w.player.body.x + w.player.body.width / 2;
      const fakeOriginX = playerCx + w.player.facing * 10;
      w.player.takeHitWithOrigin(BATTERY.hitCost, fakeOriginX);
    }
    this.#handleSceneJump(input);
  }

  reportDebug() {
    const w = this.#getWorld();
    if (!w) return;
    const { body, facing, jumpsUsed, battery } = w.player;
    const sp = w.safePoint.point;
    const tutorialStates = w.tutorial
      ? w.tutorial.signs.map((s) => {
          let info = `${s.id}:${s.state}`;
          if (s.minVisibleTimer.active) info += `(min:${s.minVisibleTimer.value.toFixed(1)})`;
          if (s.lingering) info += `(lnr:${s.lingerTimer.value.toFixed(1)})`;
          return info;
        }).join(' ')
      : '—';

    const enemyParts = [];
    let ei = 0;
    w.enemies.forEach((e) => { enemyParts.push(`${ei++}:${e.state}(hp${e.health})`); });
    const enemyStates = enemyParts.join(' ') || '—';

    this.#context.debugView.report({
      escena: `${w.scene.id} · ${w.scene.name}`,
      'robot (pies)': `x ${Math.round(body.x + body.width / 2)}  y ${Math.round(body.y + body.height)}`,
      velocidad: `vx ${Math.round(body.vx)}  vy ${Math.round(body.vy)}`,
      estado: `${w.player.isGrounded ? 'suelo' : 'aire'}  saltos ${jumpsUsed}/${PLAYER.maxJumps}  mira ${facing > 0 ? '→' : '←'}`,
      visual: w.player.visualState,
      'batería': `${battery.value.toFixed(1)} ${battery.isLow ? '⚠ BAJA' : ''}`,
      intentos: `${this.#session.lives}/3`,
      puntos: this.#session.score,
      IDs: `${this.#session.crewFoundCount}/9`,
      disparos: w.projectiles?.count ?? 0,
      invulnerable: w.player.isInvulnerable ? 'sí' : 'no',
      'punto seguro': `x ${Math.round(sp.x)}  y ${Math.round(sp.y)}`,
      enemigos: enemyStates,
      listeners: this.#context.events.listenerCount,
      tutorial: tutorialStates,
      plataformas: `${w.movingPlatforms.count}M ${w.fallingPlatforms.count}F`,
      trampas: w.traps.map((t, i) => `${i}:${t.type}·${t.phase}(${t.phaseRemaining.toFixed(1)})`).join(' ') || '—',
      'último regreso': w.lastReturn
        ? `${w.lastReturn.reason} @ ${w.lastReturn.scene}`
        : '—',
    });

    this.#context.debugView.track('safe-point', {
      x: sp.x - 6, y: sp.y - 12, width: 12, height: 12,
    }, 'safe-point');

    let debugIdx = 0;
    w.enemies.forEach((enemy) => {
      const rects = this.#enemyDebugRects[debugIdx++];
      if (!rects) return;
      const cx = enemy.body.x + enemy.body.width / 2;
      const cy = enemy.body.y + enemy.body.height / 2;
      Object.assign(rects.detect, {
        x: cx - ENEMY.detectRange, y: cy - ENEMY.detectHeight,
        width: ENEMY.detectRange * 2, height: ENEMY.detectHeight * 2,
      });
      const sr = enemy.strikeRect;
      if (sr) Object.assign(rects.strike, sr);
      else { rects.strike.width = 0; rects.strike.height = 0; }
    });

    for (let i = 0; i < w.traps.length; i++) {
      const trap = w.traps[i];
      const dangerRect = this.#trapDebugRects[i];
      if (!dangerRect) continue;
      const rects = trap.dangerRects;
      if (rects.length > 0) Object.assign(dangerRect, rects[0]);
      else { dangerRect.width = 0; dangerRect.height = 0; }
    }
  }

  dispose() {
    this.#unsub();
  }

  #setupScene() {
    const w = this.#getWorld();
    const { debugView } = this.#context;
    this.#enemyDebugRects = [];
    this.#trapDebugRects = [];

    debugView.showScene(w.scene);
    for (const h of w.scene.hazards) {
      debugView.track(`hazard-${h.x}-${h.y}`, h, 'hazard');
    }
    if (w.scene.door) {
      debugView.track('door', w.scene.door, 'trigger');
    }
    let mpIdx = 0;
    w.movingPlatforms.forEach((mp) => {
      const i = mpIdx++;
      const minX = Math.min(mp.from.x, mp.to.x);
      const maxX = Math.max(mp.from.x + mp.body.width, mp.to.x + mp.body.width);
      const pathRect = { x: minX, y: mp.from.y, width: maxX - minX, height: 2 };
      debugView.track(`mp-path-${i}`, pathRect, 'trigger');
    });
    let enemyIdx = 0;
    w.enemies.forEach((enemy) => {
      const i = enemyIdx++;
      const data = w.scene.enemies[i];
      debugView.track(`enemy-${i}`, enemy.body, 'player');
      debugView.track(`enemy-patrol-${i}`, {
        x: data.patrol.x1, y: data.y - 2,
        width: data.patrol.x2 - data.patrol.x1, height: 4,
      }, 'trigger');
      const detectRect = { x: 0, y: 0, width: 0, height: 0 };
      const strikeRect = { x: 0, y: 0, width: 0, height: 0 };
      debugView.track(`enemy-detect-${i}`, detectRect, 'trigger');
      debugView.track(`enemy-strike-${i}`, strikeRect, 'hazard');
      this.#enemyDebugRects.push({ detect: detectRect, strike: strikeRect });
    });
    for (let i = 0; i < w.traps.length; i++) {
      const trap = w.traps[i];
      debugView.track(`trap-zone-${i}`, trap.zone, 'trap');
      const dangerRect = { x: 0, y: 0, width: 0, height: 0 };
      debugView.track(`trap-danger-${i}`, dangerRect, 'hazard');
      this.#trapDebugRects.push(dangerRect);
    }
    debugView.track('player', w.player.body, 'player');
    if (w.tutorial) {
      for (const sign of w.scene.tutorial) {
        debugView.track(`tut-${sign.id}`, {
          x: sign.x - 110, y: sign.y - 20, width: 220, height: 40,
        }, 'trigger');
      }
    }
  }

  #handleSceneJump(input) {
    const level = LEVELS[this.#session.levelIndex];
    for (let i = 1; i <= 9; i++) {
      if (!input.consumePress(`scene${i}`)) continue;
      const sceneIdx = i - 1;
      if (sceneIdx >= level.scenes.length) return;
      this.#context.events.emit('debug:jump-scene', { index: sceneIdx });
      return;
    }
  }
}
