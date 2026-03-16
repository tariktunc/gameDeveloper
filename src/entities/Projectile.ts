import Phaser from 'phaser';
import { ARENA_WIDTH, ARENA_HEIGHT } from '../utils/constants';

export class Projectile extends Phaser.GameObjects.Sprite {
  public damage: number = 0;
  public speed: number = 0;
  public pierce: number = 0;
  public pierceCount: number = 0;
  public weaponId: string = '';

  public trailCooldown: number = 0;
  private vx: number = 0;
  private vy: number = 0;
  private hitEnemies: Set<any> = new Set();

  constructor(scene: Phaser.Scene) {
    super(scene, -100, -100, 'projectiles', 0);
    scene.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setOrigin(0.5, 0.5);
    this.setDepth(8);
  }

  fire(
    x: number, y: number,
    angle: number,
    speed: number,
    damage: number,
    pierce: number,
    weaponId: string,
    frame: number = 0
  ): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setFrame(frame);
    this.setScale(1, 1);
    this.clearTint();

    this.speed = speed;
    this.damage = damage;
    this.pierce = pierce;
    this.pierceCount = 0;
    this.weaponId = weaponId;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotation = angle;
    this.trailCooldown = 0;
    this.hitEnemies.clear();
  }

  update(_time: number, delta: number): void {
    if (!this.active) return;

    if (this.trailCooldown > 0) this.trailCooldown -= delta;

    const dt = delta / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Deactivate if out of arena bounds
    if (this.x < -50 || this.x > ARENA_WIDTH + 50 ||
        this.y < -50 || this.y > ARENA_HEIGHT + 50) {
      this.deactivate();
    }
  }

  hasHit(enemy: any): boolean {
    return this.hitEnemies.has(enemy);
  }

  registerHit(enemy: any): boolean {
    this.hitEnemies.add(enemy);
    this.pierceCount++;
    if (this.pierceCount > this.pierce) {
      this.deactivate();
      return false; // projectile destroyed
    }
    return true; // projectile continues
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setPosition(-100, -100);
    this.hitEnemies.clear();
  }
}
