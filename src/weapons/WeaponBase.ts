import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { WeaponData } from '../utils/types';

export abstract class WeaponBase {
  public onEnemyKilled?: (enemy: Enemy) => void;
  /** Melee/aura silahlarında hasar göstergesi için kullanılır */
  public onMeleeHit?: (enemy: Enemy, damage: number) => void;
  public data: WeaponData;
  public level: number = 1;
  public scene: Phaser.Scene;
  public owner: Player;

  protected cooldownTimer: number = 0;

  constructor(scene: Phaser.Scene, owner: Player, data: WeaponData) {
    this.scene = scene;
    this.owner = owner;
    this.data = { ...data };
  }

  get effectiveCooldown(): number {
    return this.data.cooldown / this.owner.stats.attackSpeed;
  }

  get effectiveDamage(): number {
    return this.data.damage * this.owner.stats.damage;
  }

  /** E4: Cooldown progress (0 = ready, 1 = full cooldown) */
  get cooldownProgress(): number {
    if (this.cooldownTimer <= 0) return 0;
    const effective = this.effectiveCooldown;
    if (effective <= 0) return 0;
    return Math.min(this.cooldownTimer / effective, 1);
  }

  update(delta: number): void {
    this.cooldownTimer -= delta;
    if (this.cooldownTimer <= 0) {
      this.attack();
      this.cooldownTimer = this.effectiveCooldown;
    }
  }

  abstract attack(): void;

  levelUp(): void {
    this.level++;
    this.applyLevelUpBonus();
  }

  protected applyLevelUpBonus(): void {
    // F2: +15% damage per level, -5% cooldown per level
    this.data.damage *= 1.15;
    this.data.cooldown = Math.max(100, this.data.cooldown * 0.95);
    if (this.data.projectileCount) {
      // Seviye 3, 5 ve 7'de ek mermi ekle (geç oyun platosunu önler)
      if (this.level === 3 || this.level === 5 || this.level === 7) {
        this.data.projectileCount++;
      }
    }
  }

  get maxLevel(): number {
    return 8;
  }

  get isMaxLevel(): boolean {
    return this.level >= this.maxLevel;
  }
}
