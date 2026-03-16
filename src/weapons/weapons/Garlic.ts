import Phaser from 'phaser';
import { WeaponBase } from '../WeaponBase';
import { Player } from '../../entities/Player';
import { Enemy } from '../../entities/Enemy';
import { ARENA_WIDTH, ARENA_HEIGHT } from '../../utils/constants';
import { clamp } from '../../utils/math';

export class Garlic extends WeaponBase {
  private enemies: Enemy[];
  private auraGraphics: Phaser.GameObjects.Graphics;
  private pulseTime: number = 0;
  private readonly KNOCKBACK_FORCE: number = 40;

  constructor(scene: Phaser.Scene, owner: Player, enemies: Enemy[]) {
    super(scene, owner, {
      id: 'garlic',
      name: 'Sarımsak',
      damage: 5,
      cooldown: 250,
      projectileSpeed: 0,
      projectileCount: 0,
      pierce: 0,
      range: 120,
      type: 'aura'
    });
    this.enemies = enemies;

    // Create a graphics object for the aura circle
    this.auraGraphics = scene.add.graphics();
    this.auraGraphics.setDepth(3);
  }

  update(delta: number): void {
    super.update(delta);

    // Update pulse animation
    this.pulseTime += delta * 0.004;

    // Draw aura circle centered on the player
    this.drawAura();
  }

  attack(): void {
    const range = this.data.range;
    const rangeSq = range * range;
    const damage = this.effectiveDamage;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rangeSq) {
        const killed = enemy.takeDamage(damage);
        this.onMeleeHit?.(enemy, damage);

        // Apply small knockback away from player
        if (distSq > 0) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          enemy.x = clamp(
            enemy.x + nx * this.KNOCKBACK_FORCE,
            8,
            ARENA_WIDTH - 8
          );
          enemy.y = clamp(
            enemy.y + ny * this.KNOCKBACK_FORCE,
            8,
            ARENA_HEIGHT - 8
          );
        }

        if (killed) {
          this.onEnemyKilled?.(enemy);
        }
      }
    }
  }

  private drawAura(): void {
    this.auraGraphics.clear();

    const pulse = Math.sin(this.pulseTime) * 0.12 + 0.88;
    const radius = this.data.range * pulse;
    const alpha = 0.22 + Math.sin(this.pulseTime) * 0.08;

    // Dış parlaklık halkası
    this.auraGraphics.fillStyle(0x44ff22, alpha * 0.3);
    this.auraGraphics.fillCircle(this.owner.x, this.owner.y, radius * 1.1);

    // Ana dolu daire
    this.auraGraphics.fillStyle(0x66ff33, alpha);
    this.auraGraphics.fillCircle(this.owner.x, this.owner.y, radius);

    // Dış çizgi (parlak)
    this.auraGraphics.lineStyle(3, 0xaaff44, alpha + 0.4);
    this.auraGraphics.strokeCircle(this.owner.x, this.owner.y, radius);

    // İç çizgi
    this.auraGraphics.lineStyle(1.5, 0xffffff, alpha * 0.5);
    this.auraGraphics.strokeCircle(this.owner.x, this.owner.y, radius * 0.55);

    // Alev parçacıkları (rotate eden noktalar)
    const flameCount = 6;
    for (let i = 0; i < flameCount; i++) {
      const angle = this.pulseTime * 1.5 + (i / flameCount) * Math.PI * 2;
      const fr = radius * (0.7 + Math.sin(this.pulseTime * 3 + i) * 0.2);
      const fx = this.owner.x + Math.cos(angle) * fr;
      const fy = this.owner.y + Math.sin(angle) * fr;
      const fa = 0.5 + Math.sin(this.pulseTime * 4 + i) * 0.3;
      this.auraGraphics.fillStyle(0xccff44, fa);
      this.auraGraphics.fillCircle(fx, fy, 3 + Math.sin(this.pulseTime * 5 + i) * 1.5);
    }
  }

  protected applyLevelUpBonus(): void {
    super.applyLevelUpBonus();
    // Garlic also grows in range on level up
    this.data.range += 10;
  }
}
