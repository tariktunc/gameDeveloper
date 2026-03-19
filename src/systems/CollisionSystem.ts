import { SpatialGrid } from './SpatialGrid';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { XPGem } from '../entities/XPGem';
import { GoldCoin } from '../entities/GoldCoin';
import { ObjectPool } from './ObjectPool';
import { distanceSq } from '../utils/math';

export class CollisionSystem {
  private enemyGrid: SpatialGrid<Enemy>;
  private player: Player;
  private enemies: Enemy[];
  private projectiles: Projectile[];
  private xpGems: XPGem[];
  private goldCoins: GoldCoin[];

  public onEnemyHit?: (enemy: Enemy, damage: number, projectile: Projectile) => void;
  public onEnemyKilled?: (enemy: Enemy) => void;
  public onPlayerHit?: (damage: number) => void;
  public onXPCollected?: (gem: XPGem) => void;
  public onGoldCollected?: (coin: GoldCoin) => void;

  constructor(
    player: Player,
    enemies: Enemy[],
    projectiles: Projectile[],
    xpGems: XPGem[],
    goldCoins: GoldCoin[] = []
  ) {
    this.player = player;
    this.enemies = enemies;
    this.projectiles = projectiles;
    this.xpGems = xpGems;
    this.goldCoins = goldCoins;
    this.enemyGrid = new SpatialGrid<Enemy>();
  }

  update(): void {
    // Rebuild spatial grid
    this.enemyGrid.clear();
    for (const enemy of this.enemies) {
      if (enemy.active) {
        this.enemyGrid.insert(enemy);
      }
    }

    this.checkProjectileEnemyCollisions();
    this.checkEnemyPlayerCollisions();
    this.checkXPPickup();
    this.checkGoldPickup();
  }

  private checkProjectileEnemyCollisions(): void {
    for (const proj of this.projectiles) {
      if (!proj.active) continue;

      const nearby = this.enemyGrid.queryCircle(proj.x, proj.y, 20);
      for (const enemy of nearby) {
        if (!enemy.active || proj.hasHit(enemy)) continue;

        const distSqVal = distanceSq(proj.x, proj.y, enemy.x, enemy.y);
        if (distSqVal < 16 * 16) { // 16px collision radius
          const killed = enemy.takeDamage(proj.damage);
          this.onEnemyHit?.(enemy, proj.damage, proj);

          // die() sets active=false inside takeDamage, so check `killed` only.
          // Crit double-kill is guarded inside onEnemyHit (enemy.active && currentHp > 0).
          if (killed) {
            this.onEnemyKilled?.(enemy);
          }

          if (!proj.registerHit(enemy)) {
            break; // projectile destroyed
          }
        }
      }
    }

    // onEnemyKilled is called here only if enemy is still active
    // (if it was already killed inside onEnemyHit via crit, active will be false)
  }

  private checkEnemyPlayerCollisions(): void {
    if (!this.player.isAlive || this.player.isInvincible) return;

    // Contact damage check (spatial grid, nearby enemies only)
    // Player sprite 2x scale → görsel boyut ~64px → yarıçap 32px
    // Enemy sprite 1x scale → görsel boyut ~32px → yarıçap 16px
    // Temas mesafesi (merkez-merkez): 32 + 16 = 48px → queryCircle en az 64px olmalı
    const nearby = this.enemyGrid.queryCircle(this.player.x, this.player.y, 64);
    for (const enemy of nearby) {
      if (!enemy.active) continue;

      const distSqVal = distanceSq(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distSqVal < 44 * 44) { // player r=32 + enemy r=16 = 48, biraz örtüşme için 44
        const actualDamage = this.player.takeDamage(enemy.damage);
        if (actualDamage > 0) {
          enemy.onHitPlayer();
          this.onPlayerHit?.(actualDamage);
        }
        break; // only take damage from one enemy per frame
      }
    }

    // Ranged projectile checks (all enemies, since projectiles travel far)
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      if (enemy.enemyData.id === 'boss_necromancer') {
        const necroDmg = enemy.checkNecroProjectileHit(this.player.x, this.player.y, 28);
        if (necroDmg > 0 && !this.player.isInvincible) {
          const actualDmg = this.player.takeDamage(necroDmg);
          if (actualDmg > 0) {
            this.onPlayerHit?.(actualDmg);
          }
        }
      }

      if (enemy.enemyData.id === 'archer') {
        const archerDmg = enemy.checkArcherProjectileHit(this.player.x, this.player.y, 28);
        if (archerDmg > 0 && !this.player.isInvincible) {
          const actualDmg = this.player.takeDamage(archerDmg);
          if (actualDmg > 0) {
            this.onPlayerHit?.(actualDmg);
          }
        }
      }
    }
  }

  private checkXPPickup(): void {
    const pickupRange = this.player.stats.pickupRange;
    const pickupRangeSq = pickupRange * pickupRange;
    const collectRangeSq = 10 * 10;

    for (const gem of this.xpGems) {
      if (!gem.active) continue;

      const distSqVal = distanceSq(this.player.x, this.player.y, gem.x, gem.y);

      if (distSqVal < collectRangeSq) {
        this.onXPCollected?.(gem);
        gem.collect();
      } else if (distSqVal < pickupRangeSq) {
        gem.attract(this.player.x, this.player.y);
      }
    }
  }

  private checkGoldPickup(): void {
    const pickupRange = this.player.stats.pickupRange;
    const pickupRangeSq = pickupRange * pickupRange;
    const collectRangeSq = 10 * 10;

    for (const coin of this.goldCoins) {
      if (!coin.active) continue;

      const distSqVal = distanceSq(this.player.x, this.player.y, coin.x, coin.y);

      if (distSqVal < collectRangeSq) {
        this.onGoldCollected?.(coin);
        coin.collect();
      } else if (distSqVal < pickupRangeSq) {
        coin.attract(this.player.x, this.player.y);
      }
    }
  }
}
