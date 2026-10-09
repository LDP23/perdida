/**
 * @module escape-system
 *
 * Gestiona la secuencia final del juego: consola del capitán, alerta de la estación,
 * temporizador de evacuación y cápsula de escape. Solo se activa en escenas que tienen
 * `captainConsole` en sus datos (N3E3).
 *
 * Flujo completo:
 * 1. El robot entra en la zona de la consola → aparece indicador "↑ ACCEDER".
 * 2. El jugador pulsa saltar (↑) → se abre el panel del registro del capitán.
 * 3. Al cerrar el panel → se recoge el ID del capitán (9.º), se activa la alerta.
 * 4. Alerta: overlay rojo pulsante, texto de evacuación, temporizador de 30 s,
 *    temblor continuo, cápsula de escape visible.
 * 5. Si el temporizador llega a 0 → el robot pierde una vida, temporizador se reinicia,
 *    robot reaparece junto a la consola.
 * 6. El robot toca la zona de la cápsula → fundido a negro → VictoryState.
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: config.js (ESCAPE, BATTERY, TRANSITION), CaptainPanel, collision.js, dom-utils.js.
 * Escucha: 'scene:mounted' (para configurar la escena).
 */
import { BATTERY, ESCAPE, TRANSITION } from '../config.js';
import { Timer } from '../core/timer.js';
import { findSurfaceBelow, rectsOverlap } from '../physics/collision.js';
import { CaptainPanel } from '../ui/captain-panel.js';

/**
 * Sistema de la secuencia de escape.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() limpia todo.
 * Colabora con: SafePointTracker (lock), GameSession (collectCrewId), StateMachine (victory).
 */
export class EscapeSystem {
  #context;
  #getWorld;
  #session;
  #hud;
  #captainPanel;
  #unsubs = [];

  // --- Consola ---
  #hasConsole = false;
  #consoleUsed = false;
  #consoleZone = null;
  #consolePos = null;
  #consoleEl = null;
  #indicatorVisible = false;

  // --- Alerta ---
  #alertActive = false;
  #countdownRemaining = 0;
  #alertEl = null;
  #countdownEl = null;

  // --- Cápsula ---
  #podZone = null;
  #podEl = null;

  // --- Transición a victoria ---
  #transitioning = false;
  #fadeEl = null;
  #fadeTimer = new Timer();

  /**
   * @param {Object} deps — dependencias inyectadas por PlayingState.
   * @param {Object} deps.context — contexto compartido del juego.
   * @param {Function} deps.getWorld — devuelve el SceneWorld actual.
   * @param {GameSession} deps.session — sesión de juego (vidas, puntos, IDs).
   * @param {Hud} deps.hud — datos del HUD (para mostrar toasts).
   */
  constructor({ context, getWorld, session, hud }) {
    this.#context = context;
    this.#getWorld = getWorld;
    this.#session = session;
    this.#hud = hud;
    this.#captainPanel = new CaptainPanel(context.layers.panels);

    this.#unsubs.push(
      context.events.on('scene:mounted', () => this.#onSceneMounted()),
    );
  }

  /**
   * Revisa si el panel del capitán está abierto y consume el frame.
   * Se llama ANTES del chequeo de pausa para que Escape cierre el panel
   * en vez de pausar el juego.
   * @returns {boolean} true si el panel consume el frame.
   */
  updatePanel(/** @type {number} */ dt, /** @type {Input} */ input) {
    if (!this.#captainPanel.isOpen) return false;
    this.#captainPanel.update(dt, input);
    if (!this.#captainPanel.isOpen) {
      this.#onPanelClosed();
    }
    return true;
  }

  /**
   * Revisa si el robot está en la zona de la consola y consume la pulsación
   * de salto para abrir el panel. Se llama ANTES de player.update para que
   * el salto no se ejecute.
   */
  checkInteraction(/** @type {Input} */ input) {
    if (!this.#hasConsole || this.#consoleUsed || this.#alertActive || this.#transitioning) {
      this.#setIndicator(false);
      return;
    }
    const w = this.#getWorld();
    const inZone = w.player.isGrounded && rectsOverlap(w.player.body, this.#consoleZone);
    this.#setIndicator(inZone);
    if (inZone && input.consumePress('jump')) {
      this.#openPanel();
    }
  }

  /**
   * Actualiza temporizador, alerta y cápsula de escape.
   * Se llama en el orden normal de sistemas.
   */
  update(dt) {
    if (this.#transitioning) {
      this.#fadeTimer.update(dt);
      if (!this.#fadeTimer.active) this.#completeVictory();
      return;
    }
    if (!this.#alertActive) return;

    const w = this.#getWorld();
    const timedEscape = this.#context.settings.get('timedEscape');

    if (timedEscape) {
      const pauseCountdown = w.player.isInvulnerable || w.player.isRespawning;
      if (!pauseCountdown) {
        this.#countdownRemaining -= dt;
      }
      if (this.#countdownRemaining <= 0) {
        this.#onCountdownExpired(w);
        return;
      }
      this.#updateCountdownDisplay();
    }

    this.#checkEscapePod(w);
  }

  /** Libera suscripciones, panel, elementos DOM y temporizadores. */
  dispose() {
    for (const unsub of this.#unsubs) unsub();
    this.#captainPanel.destroy();
    this.#removeConsole();
    this.#removeAlert();
    this.#removePod();
    this.#fadeEl?.remove();
    this.#fadeEl = null;
    this.#transitioning = false;
    this.#alertActive = false;
    this.#hasConsole = false;
  }

  // =================================================================
  //  Escena
  // =================================================================

  /** Reinicia el estado y configura la consola si la escena tiene captainConsole. */
  #onSceneMounted() {
    this.#removeConsole();
    this.#removeAlert();
    this.#removePod();
    this.#consoleUsed = false;
    this.#alertActive = false;
    this.#transitioning = false;
    this.#hasConsole = false;

    const w = this.#getWorld();
    if (!w.scene.captainConsole) return;
    this.#hasConsole = true;

    const data = w.scene.captainConsole;
    const surfaceY = findSurfaceBelow(data.x, 0, w.scene.solids, 1);
    this.#consolePos = { x: data.x, y: surfaceY };

    this.#consoleZone = {
      x: data.x - ESCAPE.interactionZone / 2,
      y: 0,
      width: ESCAPE.interactionZone,
      height: w.scene.height,
    };

    this.#createConsole(data.x, surfaceY);
  }

  // =================================================================
  //  Consola DOM
  // =================================================================

  /** Crea el elemento DOM de la consola con pantalla verde e indicador de interacción. */
  #createConsole(cx, surfaceY) {
    const cw = ESCAPE.consoleWidth;
    const ch = ESCAPE.consoleHeight;

    const el = document.createElement('div');
    el.className = 'captain-console';
    el.style.setProperty('--x', cx - cw / 2);
    el.style.setProperty('--y', surfaceY - ch);
    el.style.setProperty('--w', cw);
    el.style.setProperty('--h', ch);

    const screen = document.createElement('div');
    screen.className = 'captain-console__screen';
    el.append(screen);

    const indicator = document.createElement('div');
    indicator.className = 'captain-console__indicator';
    indicator.textContent = '↑ ACCEDER';
    el.append(indicator);

    this.#context.layers.entities.append(el);
    this.#consoleEl = el;
  }

  #removeConsole() {
    this.#consoleEl?.remove();
    this.#consoleEl = null;
    this.#indicatorVisible = false;
  }

  #setIndicator(visible) {
    if (this.#indicatorVisible === visible) return;
    this.#indicatorVisible = visible;
    this.#consoleEl?.classList.toggle('is-active', visible);
  }

  // =================================================================
  //  Panel del capitán
  // =================================================================

  #openPanel() {
    this.#context.input.setGameplayEnabled(false);
    this.#captainPanel.open();
  }

  /** Recoge el ID del capitán, muestra toast, activa la alerta y reactiva el input. */
  #onPanelClosed() {
    this.#consoleUsed = true;
    this.#consoleEl?.classList.add('is-used');
    this.#setIndicator(false);

    this.#session.collectCrewId('andres-molina');
    this.#session.addScore(500);
    this.#hud.showToast('ID del capitán recuperado');
    this.#context.events.emit('captain-log-read');

    this.#activateAlert();
    this.#context.input.setGameplayEnabled(true);
  }

  // =================================================================
  //  Alerta
  // =================================================================

  /** Activa la alerta: fija el punto seguro, crea overlay rojo y cápsula de escape. */
  #activateAlert() {
    this.#alertActive = true;
    this.#countdownRemaining = ESCAPE.countdownSeconds;

    const w = this.#getWorld();
    w.safePoint.lock(this.#consolePos);

    this.#createAlertOverlay();
    this.#createEscapePod(w);
  }

  /** Crea el DOM de la alerta: overlay rojo pulsante, texto de evacuación y countdown. */
  #createAlertOverlay() {
    const el = document.createElement('div');
    el.className = 'escape-alert';

    const overlay = document.createElement('div');
    overlay.className = 'escape-alert__overlay';
    el.append(overlay);

    const text = document.createElement('div');
    text.className = 'escape-alert__text';
    text.textContent = '⚠ EVACUACIÓN ⚠';
    el.append(text);

    const timedEscape = this.#context.settings.get('timedEscape');
    if (timedEscape) {
      const countdown = document.createElement('div');
      countdown.className = 'escape-alert__countdown';
      countdown.textContent = this.#formatTime(this.#countdownRemaining);
      el.append(countdown);
      this.#countdownEl = countdown;
    }

    this.#context.refs.game.append(el);
    this.#alertEl = el;

    if (this.#context.settings.get('screenShake')) {
      this.#context.refs.game.classList.add('is-alert-shake');
    }
  }

  #removeAlert() {
    this.#alertEl?.remove();
    this.#alertEl = null;
    this.#countdownEl = null;
    this.#context.refs.game.classList.remove('is-alert-shake');
  }

  #updateCountdownDisplay() {
    if (!this.#countdownEl) return;
    this.#countdownEl.textContent = this.#formatTime(Math.max(0, this.#countdownRemaining));
  }

  /**
   * Formatea segundos como "m:ss" para el display del countdown.
   * @param {number} seconds
   * @returns {string}
   */
  #formatTime(seconds) {
    const s = Math.ceil(seconds);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  }

  /** Penaliza al robot (daño + reposición) y reinicia el countdown. */
  #onCountdownExpired(w) {
    if (w.player.canBeHurt) {
      w.player.takeHit(BATTERY.hitCost);
      this.#context.events.emit('player:hazard');
    }
    w.lastReturn = { reason: 'countdown', scene: w.scene.id };
    w.player.placeAt(w.safePoint.point);
    this.#countdownRemaining = ESCAPE.countdownSeconds;
    this.#updateCountdownDisplay();
  }

  // =================================================================
  //  Cápsula de escape
  // =================================================================

  /** Crea el elemento DOM de la cápsula y define la zona de contacto para la victoria. */
  #createEscapePod(w) {
    const podData = w.scene.escapePod;
    if (!podData) return;

    const surfaceY = findSurfaceBelow(podData.x, 0, w.scene.solids, 1);
    const pw = ESCAPE.podWidth;
    const ph = ESCAPE.podHeight;

    this.#podZone = {
      x: podData.x - pw / 2,
      y: surfaceY - ph,
      width: pw,
      height: ph,
    };

    const el = document.createElement('div');
    el.className = 'escape-pod';
    el.style.setProperty('--x', this.#podZone.x);
    el.style.setProperty('--y', this.#podZone.y);
    el.style.setProperty('--w', pw);
    el.style.setProperty('--h', ph);
    this.#context.layers.entities.append(el);
    this.#podEl = el;
  }

  #removePod() {
    this.#podEl?.remove();
    this.#podEl = null;
    this.#podZone = null;
  }

  /** Verifica si el robot toca la cápsula; si sí, inicia la transición a victoria. */
  #checkEscapePod(w) {
    if (!this.#podZone || this.#transitioning) return;
    if (w.player.isDying || w.player.isDead || w.player.isRespawning) return;
    if (!rectsOverlap(w.player.body, this.#podZone)) return;
    this.#startVictoryTransition();
  }

  // =================================================================
  //  Transición a victoria
  // =================================================================

  /** Inicia el fundido a negro y bloquea el input antes de cambiar a VictoryState. */
  #startVictoryTransition() {
    this.#transitioning = true;
    this.#context.input.setGameplayEnabled(false);
    this.#removeAlert();

    this.#fadeEl = document.createElement('div');
    this.#fadeEl.className = 'scene-fade is-showing';
    this.#context.refs.game.append(this.#fadeEl);
    this.#fadeTimer.start(TRANSITION.fadeOut);
  }

  #completeVictory() {
    this.#fadeEl?.remove();
    this.#fadeEl = null;
    this.#context.states.change('victory', { session: this.#session });
  }
}
