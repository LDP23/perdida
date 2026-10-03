import { load, save } from '../core/storage.js';

// Utilidades compartidas por los estados de pantalla.

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
