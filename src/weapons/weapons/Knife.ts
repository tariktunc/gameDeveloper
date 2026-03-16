import { WeaponBase } from '../WeaponBase';
import { Player } from '../../entities/Player';
import { Projectile } from '../../entities/Projectile';
import { ObjectPool } from '../../systems/ObjectPool';
import { Enemy } from '../../entities/Enemy';
import { InputManager } from '../../systems/InputManager';
import { AudioManager } from '../../systems/AudioManager';
import { angleBetween } from '../../utils/math';

export class Knife extends WeaponBase {
  private projectilePool: ObjectPool<Projectile>;
  private enemies: Enemy[];
  private inputManager: InputManager;
  private audioManager: AudioManager | null;

  constructor(
    scene: Phaser.Scene,
    owner: Player,
    projectilePool: ObjectPool<Projectile>,
    inputManager: InputManager,
    enemies: Enemy[],
    audioManager?: AudioManager
  ) {
    super(scene, owner, {
      id: 'knife',
      name: 'Fırlatma Bıçağı',
      damage: 15,
      cooldown: 400,
      projectileSpeed: 500,
      projectileCount: 1,
      pierce: 1,
      range: 800,
      type: 'projectile'
    });
    this.projectilePool = projectilePool;
    this.enemies = enemies;
    this.inputManager = inputManager;
    this.audioManager = audioManager ?? null;
  }

  attack(): void {
    // Auto-aim: fire at nearest enemy — yoksa ateş etme
    const nearest = this.findNearestEnemy();
    if (!nearest) return;
    const angle = angleBetween(this.owner.x, this.owner.y, nearest.x, nearest.y);

    const spread = this.data.projectileCount > 1 ? 0.2 : 0;

    for (let i = 0; i < this.data.projectileCount; i++) {
      const proj = this.projectilePool.get();

      let fireAngle = angle;
      if (this.data.projectileCount > 1) {
        const offset = (i - (this.data.projectileCount - 1) / 2) * spread;
        fireAngle += offset;
      }

      proj.fire(
        this.owner.x,
        this.owner.y,
        fireAngle,
        this.data.projectileSpeed,
        this.effectiveDamage,
        this.data.pierce,
        this.data.id,
        0
      );
      // Bıçak görünümü: uzun ince dikdörtgen, gümüş rengi
      proj.setScale(3.5, 0.4);
      proj.setTint(0xddeeff);
    }

    this.audioManager?.playShoot();

    // Task 12: Muzzle flash
    const flash = this.scene.add.circle(this.owner.x, this.owner.y, 6, 0xffff00, 0.9);
    flash.setDepth(9);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      ease: 'Power1',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  private findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = this.data.range * this.data.range;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDist) {
        nearestDist = distSq;
        nearest = enemy;
      }
    }
    return nearest;
  }
}
