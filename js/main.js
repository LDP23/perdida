/**
 * @module main
 *
 * Punto de entrada del juego. Solo crea la instancia de Game y la arranca.
 * Toda la lógica vive en los módulos importados. Los módulos ES (<script type="module">)
 * se ejecutan después de parsear el HTML, así que el DOM ya existe al llegar aquí.
 *
 * Para probar: abrir index.html con Live Server (módulos ES no funcionan con file://).
 */
import { Game } from './core/game.js';

const game = new Game(document);
game.start();
