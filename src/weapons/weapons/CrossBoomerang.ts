import Phaser from 'phaser';
import { WeaponBase } from '../WeaponBase';
import { Player } from '../../entities/Player';
import { Enemy } from '../../entities/Enemy';
import { angleBetween } from '../../utils/math';

interface Boomerang {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  damage: number;
  lifetime: number;
  maxLifetime: number;
  returning: boolean;
  hitEnemies: Set<Enemy>;
  rotation: number;
}

export class CrossBoomerang extends WeaponBase {
  private enemies: Enemy[];
  private boomerangs: Boomerang[] = [];
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, owner: Player, enemies: Enemy[]) {
    super(scene, owner, {
      id: 'cross_boomerang',
      name: 'Haç Bumerangi',
      damage: 18,
      cooldown: 1200,
      projectileSpeed: 280,
      projectileCount: 1,
      pierce: 99,
      range: 350,
      type: 'projectile'
    });
    this.enemies = enemies;
    this.gfx = scene.add.graphics().setDepth(8);
  }

  update(delta: number): void {
    super.update(delta);
    const dt = delta / 1000;

    for (let i = this.boomerangs.length - 1; i >= 0; i--) {
      const b = this.boomerangs[i];
      b.lifetime += delta;
      b.rotation += dt * 12;

      if (!b.returning && b.lifetime > 400) {
        // Start returning
        b.returning = true;
        b.hitEnemies.clear(); // Can hit again on return
      }

      if (b.returning) {
        const angle = angleBetween(b.x, b.y, this.owner.x, this.owner.y);
        b.vx = Math.cos(angle) * b.speed * 1.3;
        b.vy = Math.sin(angle) * b.speed * 1.3;

        // Remove if returned to player
        const dx = b.x - this.owner.x;
        const dy = b.y - this.owner.y;
        if (dx * dx + dy * dy < 30 * 30) {
          this.boomerangs.splice(i, 1);
          continue;
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Check hits
      for (const enemy of this.enemies) {
        if (!enemy.active || b.hitEnemies.has(enemy)) continue;
        const dx = enemy.x - b.x;
        const dy = enemy.y - b.y;
        if (dx * dx + dy * dy < 24 * 24) {
          const killed = enemy.takeDamage(b.damage);
          b.hitEnemies.add(enemy);
          if (killed) this.onEnemyKilled?.(enemy);
        }
      }

      // Timeout safety
      if (b.lifetime > 5000) {
        this.boomerangs.splice(i, 1);
      }
    }

    this.drawBoomerangs();
  }

  attack(): void {
    // Find nearest enemy — yoksa ateş etme
    let targetX = -1;
    let targetY = -1;
    let nearestDist = this.data.range * this.data.range;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDist) {
        nearestDist = distSq;
        targetX = enemy.x;
        targetY = enemy.y;
      }
    }

    if (targetX === -1) return; // Menzilde düşman yok

    const angle = angleBetween(this.owner.x, this.owner.y, targetX, targetY);

    for (let i = 0; i < this.data.projectileCount; i++) {
      this.boomerangs.push({
        x: this.owner.x,
        y: this.owner.y,
        vx: Math.cos(angle) * this.data.projectileSpeed,
        vy: Math.sin(angle) * this.data.projectileSpeed,
        speed: this.data.projectileSpeed,
        damage: this.effectiveDamage,
        lifetime: 0,
        maxLifetime: 3000,
        returning: false,
        hitEnemies: new Set(),
        rotation: 0
      });
    }
  }

  private drawBoomerangs(): void {
    this.gfx.clear();
    for (const b of this.boomerangs) {
      const size = 16;
      const cos = Math.cos(b.rotation);
      const sin = Math.sin(b.rotation);

      // Glow arkası
      this.gfx.fillStyle(0xffff66, 0.25);
      this.gfx.fillCircle(b.x, b.y, size + 4);

      // Haç yatay kol
      this.gfx.lineStyle(4, 0xffffff, 1);
      this.gfx.beginPath();
      this.gfx.moveTo(b.x + cos * size, b.y + sin * size);
      this.gfx.lineTo(b.x - cos * size, b.y - sin * size);
      this.gfx.strokePath();

      // Haç dikey kol
      this.gfx.beginPath();
      this.gfx.moveTo(b.x - sin * size, b.y + cos * size);
      this.gfx.lineTo(b.x + sin * size, b.y - cos * size);
      this.gfx.strokePath();

      // Merkez nokta
      this.gfx.fillStyle(0xffee00, 1);
      this.gfx.fillCircle(b.x, b.y, 4);
    }
  }

  protected applyLevelUpBonus(): void {
    super.applyLevelUpBonus();
    if (this.level === 3 || this.level === 5 || this.level === 7) {
      this.data.projectileCount++;
    }
  }
}
