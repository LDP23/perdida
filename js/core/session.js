import { SESSION } from '../config.js';

// Todo lo que dura una partida completa: sobrevive a cambios de escena y a perder un intento.
export class GameSession {
  #events;
  #score = 0;
  #lives;
  #foundCrewIds = new Set();
  levelIndex = 0;
  sceneIndex = 0;

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
}
