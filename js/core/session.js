/**
 * @module session
 *
 * Estado de la partida actual: puntuación, vidas, IDs de tripulante encontrados,
 * nivel y escena actuales. Sobrevive a cambios de escena y a perder un intento.
 *
 * Usado por: PlayingState, SceneFlow, PickupSystem, CombatSystem, HUD, estados de fin.
 * Depende de: config.js (SESSION), EventBus.
 * Participa en: se consulta y modifica durante update; emite eventos de sesión.
 *
 * Snapshot/restore: al empezar un nivel, se toma una instantánea de puntos e IDs.
 * Si el jugador muere o reinicia, se restaura esa instantánea (sin perder vidas
 * en el caso de reinicio desde pausa).
 */
import { SESSION } from '../config.js';

/**
 * Estado persistente de una partida completa.
 *
 * Ciclo de vida: PlayingState la crea al empezar una partida nueva;
 * vive hasta game over o vuelta al menú.
 * Colabora con: EventBus (emite session:score, session:crew-id, session:life-lost, session:game-over).
 */
export class GameSession {
  /** @type {EventBus} */
  #events;
  /** @type {number} — puntuación actual */
  #score = 0;
  /** @type {number} — intentos restantes */
  #lives;
  /** @type {Set<number>} — IDs de tripulante encontrados en esta partida */
  #foundCrewIds = new Set();
  /** @type {number} — índice del nivel actual (0-based) */
  levelIndex = 0;
  /** @type {number} — índice de la escena actual dentro del nivel (0-based) */
  sceneIndex = 0;

  /** @type {number} — puntuación al inicio del nivel (para restaurar al reiniciar) */
  #levelStartScore = 0;
  /** @type {Set<number>} — IDs encontrados al inicio del nivel */
  #levelStartCrewIds = new Set();

  /**
   * @param {EventBus} events — bus de eventos para emitir cambios de sesión.
   */
  constructor(events) {
    this.#events = events;
    this.#lives = SESSION.lives;
  }

  /** @returns {number} puntuación actual */
  get score() { return this.#score; }
  /** @returns {number} intentos restantes */
  get lives() { return this.#lives; }
  /** @returns {boolean} true si no quedan intentos */
  get isGameOver() { return this.#lives <= 0; }
  /** @returns {number} cantidad de IDs de tripulante encontrados */
  get crewFoundCount() { return this.#foundCrewIds.size; }

  /**
   * @param {number} id — ID del tripulante.
   * @returns {boolean} true si ya fue encontrado en esta partida.
   */
  hasFoundCrewId(id) { return this.#foundCrewIds.has(id); }

  /**
   * Suma puntos a la puntuación.
   * Emite: 'session:score' { score }
   * @param {number} points — puntos a sumar.
   */
  addScore(points) {
    this.#score += points;
    this.#events.emit('session:score', { score: this.#score });
  }

  /**
   * Registra un ID de tripulante como encontrado. Si ya se tenía, no hace nada.
   * Emite: 'session:crew-id' { id, count }
   *
   * @param {number} id — ID del tripulante.
   * @returns {boolean} true si es un ID nuevo (no duplicado).
   */
  collectCrewId(id) {
    if (this.#foundCrewIds.has(id)) return false;
    this.#foundCrewIds.add(id);
    this.#events.emit('session:crew-id', { id, count: this.#foundCrewIds.size });
    return true;
  }

  /**
   * Pierde un intento. Emite 'session:life-lost' y, si llega a cero, 'session:game-over'.
   * Emite: 'session:life-lost' { lives }, 'session:game-over' (si cero vidas)
   *
   * @returns {number} intentos restantes tras perder uno.
   */
  loseLife() {
    this.#lives = Math.max(0, this.#lives - 1);
    this.#events.emit('session:life-lost', { lives: this.#lives });
    if (this.isGameOver) this.#events.emit('session:game-over');
    return this.#lives;
  }

  /**
   * Toma una instantánea de puntos e IDs al empezar un nivel.
   * Si el jugador reinicia el nivel, se restaura este estado.
   */
  snapshotLevelStart() {
    this.#levelStartScore = this.#score;
    this.#levelStartCrewIds = new Set(this.#foundCrewIds);
  }

  /**
   * Restaura puntos e IDs al estado del inicio del nivel. No toca las vidas
   * (el caller decide si restar un intento o no).
   */
  restoreLevelStart() {
    this.#score = this.#levelStartScore;
    this.#foundCrewIds = new Set(this.#levelStartCrewIds);
    this.sceneIndex = 0;
  }
}
