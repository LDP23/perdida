import { Game } from './core/game.js';

// Punto de entrada: solo arranca el juego. Toda la lógica vive en los módulos.
// Los módulos ES se ejecutan después de leer el HTML, así que el DOM ya existe.
const game = new Game(document);
game.start();
