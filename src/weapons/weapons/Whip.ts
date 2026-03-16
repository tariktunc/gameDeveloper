import Phaser from 'phaser';
import { WeaponBase } from '../WeaponBase';
import { Player } from '../../entities/Player';
import { Enemy } from '../../entities/Enemy';
import { ARENA_WIDTH, ARENA_HEIGHT } from '../../utils/constants';
import { clamp } from '../../utils/math';

export class Whip extends WeaponBase {
  private enemies: Enemy[];
  private whipGraphics: Phaser.GameObjects.Graphics;
  private showTimer: number = 0;

  constructor(scene: Phaser.Scene, owner: Player, enemies: Enemy[]) {
    super(scene, owner, {
      id: 'whip',
      name: 'Kırbaç',
      damage: 25,
      cooldown: 700,
      projectileSpeed: 0,
      projectileCount: 1,
      pierce: 99,
      range: 130,
      type: 'melee'
    });
    this.enemies = enemies;
    this.whipGraphics = scene.add.graphics().setDepth(9);
  }

  update(delta: number): void {
    super.update(delta);

    // Fade out whip visual
    if (this.showTimer > 0) {
      this.showTimer -= delta;
      if (this.showTimer <= 0) {
        this.whipGraphics.clear();
      }
    }
  }

  attack(): void {
    const range = this.data.range;
    const damage = this.effectiveDamage;

    // Auto-aim: find nearest enemy — yoksa ateş etme
    let facingRad = this.owner.facingAngle * (Math.PI / 180);
    let nearestDistSq = Infinity;
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        facingRad = Math.atan2(dy, dx);
      }
    }
    if (nearestDistSq === Infinity) return; // Ekranda düşman yok

    const arcSpread = 0.85; // ±0.85 radians (~49°) from facing direction

    // Hit all enemies within the arc centered on nearest-enemy direction
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= range) {
        const angleToEnemy = Math.atan2(dy, dx);
        let angleDiff = angleToEnemy - facingRad;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) <= arcSpread) {
          const killed = enemy.takeDamage(damage);
          this.onMeleeHit?.(enemy, damage);

          // Knockback away from player
          if (dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            enemy.x = clamp(enemy.x + nx * 30, 8, ARENA_WIDTH - 8);
            enemy.y = clamp(enemy.y + ny * 30, 8, ARENA_HEIGHT - 8);
          }

          if (killed) {
            this.onEnemyKilled?.(enemy);
          }
        }
      }
    }

    // Visual whip slash
    this.drawWhipSlash(range, facingRad, arcSpread);
  }

  private drawWhipSlash(range: number, facingRad: number, arcSpread: number): void {
    this.whipGraphics.clear();
    this.whipGraphics.lineStyle(3, 0xff6600, 0.8);

    const startAngle = facingRad - arcSpread;
    const endAngle = facingRad + arcSpread;

    this.whipGraphics.beginPath();
    this.whipGraphics.arc(this.owner.x, this.owner.y, range, startAngle, endAngle, false);
    this.whipGraphics.strokePath();

    // Inner arc
    this.whipGraphics.lineStyle(2, 0xffaa33, 0.5);
    this.whipGraphics.beginPath();
    this.whipGraphics.arc(this.owner.x, this.owner.y, range * 0.6, startAngle, endAngle, false);
    this.whipGraphics.strokePath();

    this.showTimer = 150;
  }

  protected applyLevelUpBonus(): void {
    super.applyLevelUpBonus();
    this.data.range += 15;
  }
}
