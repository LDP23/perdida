/**
 * @module screens
 *
 * Utilidades compartidas por los estados de pantalla: récord (highScore en localStorage),
 * formato de puntuación y pantalla completa.
 *
 * Usado por: MenuState, GameOverState, LevelCompleteState, SceneFlow.
 * Depende de: storage.js (load, save).
 */
import { load, save } from '../core/storage.js';

/**
 * @returns {number} récord guardado en localStorage, o 0 si no existe.
 */
export function getHighScore() {
  return load('highScore', 0);
}

export function saveHighScore(score) {
  const current = getHighScore();
  if (score > current) {
    save('highScore', score);
    return true;
  }
  return false;
}

export function formatScore(score) {
  return String(score).padStart(6, '0');
}

export function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

export function supportsFullscreen() {
  return typeof document.documentElement.requestFullscreen === 'function';
}
