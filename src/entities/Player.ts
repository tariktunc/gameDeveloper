import Phaser from 'phaser';
import { Stats } from '../utils/types';
import { PLAYER_SPEED, PLAYER_MAX_HP, PLAYER_PICKUP_RANGE, PLAYER_INVINCIBILITY_TIME, ARENA_WIDTH, ARENA_HEIGHT } from '../utils/constants';
import { clamp } from '../utils/math';

export class Player extends Phaser.GameObjects.Sprite {
  public stats: Stats;
  public currentHp: number;
  public level: number = 1;
  public xp: number = 0;
  public gold: number = 0;
  public kills: number = 0;
  public readonly MAX_WEAPONS = 6;
  public weaponIds: string[] = [];
  public passiveItems: string[] = [];
  public facingAngle: number = 0;
  private invincibleUntil: number = 0;
  private facingRight: boolean = true;
  private defaultTint: number = 0xffffff;

  private dashCooldown: number = 0;
  private readonly DASH_COOLDOWN = 1500;
  private readonly DASH_DISTANCE = 120;
  private readonly DASH_INVINCIBILITY = 200;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);

    this.stats = {
      maxHp: PLAYER_MAX_HP,
      speed: PLAYER_SPEED,
      damage: 1.0,
      attackSpeed: 1.0,
      armor: 0,
      pickupRange: PLAYER_PICKUP_RANGE,
      luck: 1.0
    };

    this.currentHp = this.stats.maxHp;
    this.setOrigin(0.5, 0.5);
    this.setDepth(10);
  }

  move(dx: number, dy: number, delta: number): void {
    const speed = this.stats.speed * (delta / 1000);
    this.x = clamp(this.x + dx * speed, 16, ARENA_WIDTH - 16);
    this.y = clamp(this.y + dy * speed, 16, ARENA_HEIGHT - 16);

    if (dx > 0) this.facingRight = true;
    else if (dx < 0) this.facingRight = false;
    this.setFlipX(!this.facingRight);

    // Update 8-directional facing angle when moving
    if (dx !== 0 || dy !== 0) {
      const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      const normalized = ((rawAngle % 360) + 360) % 360;
      this.facingAngle = Math.round(normalized / 45) * 45 % 360;
    }

    // Play walk animation if moving
    if (dx !== 0 || dy !== 0) {
      if (this.anims.currentAnim?.key !== 'player_walk') {
        this.play('player_walk', true);
      }
    } else {
      if (this.anims.currentAnim?.key !== 'player_idle') {
        this.play('player_idle', true);
      }
    }
  }

  takeDamage(amount: number): number {
    const now = this.scene.time.now;
    if (now < this.invincibleUntil) return 0;

    const actualDamage = Math.max(1, amount - this.stats.armor);
    this.currentHp -= actualDamage;
    this.invincibleUntil = now + PLAYER_INVINCIBILITY_TIME;

    // Flash red, then restore character tint
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.setTint(this.defaultTint));

    return actualDamage;
  }

  heal(amount: number): void {
    this.currentHp = Math.min(this.currentHp + amount, this.stats.maxHp);
  }

  setDefaultTint(tint: number): void {
    this.defaultTint = tint;
    this.setTint(tint);
  }

  get canAddWeapon(): boolean {
    return this.weaponIds.length < this.MAX_WEAPONS;
  }

  get isAlive(): boolean {
    return this.currentHp > 0;
  }

  get isInvincible(): boolean {
    return this.scene.time.now < this.invincibleUntil;
  }

  get hpPercent(): number {
    return this.currentHp / this.stats.maxHp;
  }

  get canDash(): boolean {
    return this.scene.time.now >= this.dashCooldown;
  }

  /** Returns 0-1: 1 = ready, 0 = just used */
  get dashCooldownProgress(): number {
    const now = this.scene.time.now;
    if (now >= this.dashCooldown) return 1;
    const remaining = this.dashCooldown - now;
    return 1 - remaining / this.DASH_COOLDOWN;
  }

  dash(dirX: number, dirY: number): void {
    // Normalize direction
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len === 0) return;
    const nx = dirX / len;
    const ny = dirY / len;

    // Teleport
    this.x = clamp(this.x + nx * this.DASH_DISTANCE, 16, ARENA_WIDTH - 16);
    this.y = clamp(this.y + ny * this.DASH_DISTANCE, 16, ARENA_HEIGHT - 16);

    // Cooldown
    const now = this.scene.time.now;
    this.dashCooldown = now + this.DASH_COOLDOWN;

    // Invincibility during dash
    this.invincibleUntil = Math.max(this.invincibleUntil, now + this.DASH_INVINCIBILITY);

    // Visual: cyan tint during dash invincibility, then restore character tint
    this.setTint(0x33ccff);
    this.scene.time.delayedCall(this.DASH_INVINCIBILITY, () => {
      if (this.scene.time.now >= this.invincibleUntil) {
        this.setTint(this.defaultTint);
      }
    });
  }
}
