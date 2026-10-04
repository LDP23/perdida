import { SESSION } from '../config.js';

// Todo lo que dura una partida completa: sobrevive a cambios de escena y a perder un intento.
export class GameSession {
  #events;
  #score = 0;
  #lives;
  #foundCrewIds = new Set();
  levelIndex = 0;
  sceneIndex = 0;

  // Instantánea al empezar un nivel: se restaura al reiniciar
  #levelStartScore = 0;
  #levelStartCrewIds = new Set();

  constructor(events) {
    this.#events = events;
    this.#lives = SESSION.lives;
  }

  get score() { return this.#score; }
  get lives() { return this.#lives; }
  get isGameOver() { return this.#lives <= 0; }
  get crewFoundCount() { return this.#foundCrewIds.size; }

  hasFoundCrewId(id) { return this.#foundCrewIds.has(id); }

  addScore(points) {
    this.#score += points;
    this.#events.emit('session:score', { score: this.#score });
  }

  collectCrewId(id) {
    if (this.#foundCrewIds.has(id)) return false;
    this.#foundCrewIds.add(id);
    this.#events.emit('session:crew-id', { id, count: this.#foundCrewIds.size });
    return true;
  }

  loseLife() {
    this.#lives = Math.max(0, this.#lives - 1);
    this.#events.emit('session:life-lost', { lives: this.#lives });
    if (this.isGameOver) this.#events.emit('session:game-over');
    return this.#lives;
  }

  // Guarda puntos e IDs al empezar un nivel; si se reinicia se vuelve a este estado
  snapshotLevelStart() {
    this.#levelStartScore = this.#score;
    this.#levelStartCrewIds = new Set(this.#foundCrewIds);
  }

  // Restaura al estado del inicio del nivel (sin tocar vidas)
  restoreLevelStart() {
    this.#score = this.#levelStartScore;
    this.#foundCrewIds = new Set(this.#levelStartCrewIds);
    this.sceneIndex = 0;
  }
}
