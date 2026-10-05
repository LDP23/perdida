/**
 * @module combat-system
 *
 * Sistema de combate: crea proyectiles al escuchar 'player:shoot', verifica impactos
 * de proyectiles contra shootables, y verifica daño de enemigos al robot (zarpazo y contacto).
 *
 * Usado por: PlayingState (en el arreglo de sistemas).
 * Depende de: config.js (ENEMY, SCORE), Projectile, collision.js.
 * Escucha: 'player:shoot' { x, y, direction }, 'enemy:destroyed'
 */
import { ENEMY, SCORE } from '../config.js';
import { Projectile } from '../entities/projectile.js';
import { rectsOverlap } from '../physics/collision.js';

/**
 * Sistema de combate.
 *
 * Ciclo de vida: PlayingState lo crea en enter(); dispose() limpia los listeners.
 * Colabora con: EventBus (escucha player:shoot, enemy:destroyed), GameSession (puntos).
 */
export class CombatSystem {
  #getWorld;
  #session;
  #hud;
  #unsubs = [];

  constructor({ context, getWorld, session, hud }) {
    this.#getWorld = getWorld;
    this.#session = session;
    this.#hud = hud;

    this.#unsubs.push(
      context.events.on('player:shoot', (data) => {
        this.#getWorld().projectiles.add(new Projectile(data));
      }),
      context.events.on('enemy:destroyed', () => {
        this.#session.addScore(SCORE.enemy);
        this.#hud.showToast(`+${SCORE.enemy} enemigo`);
      }),
    );
  }

  update(deltaTime) {
    const w = this.#getWorld();
    const solids = w.getAllSolids();

    w.enemies.update((enemy) => enemy.update(deltaTime, solids, w.player.body));
    w.projectiles.update((p) => p.update(deltaTime, solids));
    w.dummies.forEach((d) => d.update(deltaTime));
    w.shootables.update(() => {});
    this.#checkProjectileHits(w);
    this.#checkEnemyDamage(w);
  }

  dispose() {
    for (const unsub of this.#unsubs) unsub();
  }

  #checkProjectileHits(w) {
    w.projectiles.forEach((proj) => {
      if (proj.isDead) return;
      w.shootables.forEach((target) => {
        if (proj.isDead) return;
        if (target.canBeShot === false) return;
        if (rectsOverlap(proj.body, target.body)) {
          target.onShot(proj);
          proj.isDead = true;
        }
      });
    });
  }

  #checkEnemyDamage(w) {
    if (!w.player.canBeHurt) return;
    w.enemies.forEach((enemy) => {
      if (!w.player.canBeHurt) return;
      const originX = enemy.body.x + enemy.body.width / 2;
      const sr = enemy.strikeRect;
      if (sr && rectsOverlap(w.player.body, sr)) {
        w.player.takeHitWithOrigin(ENEMY.strikeDamage, originX);
        enemy.onStrikeHit();
        return;
      }
      if (enemy.canDamageOnContact && rectsOverlap(w.player.body, enemy.body)) {
        w.player.takeHitWithOrigin(ENEMY.contactDamage, originX);
      }
    });
  }
}
