import Phaser from 'phaser';
import { EnemyData } from '../utils/types';
import { DAMAGE_FLASH_DURATION, ARENA_WIDTH, ARENA_HEIGHT } from '../utils/constants';
import { clamp } from '../utils/math';

export class Enemy extends Phaser.GameObjects.Sprite {
  public enemyData!: EnemyData;
  public currentHp: number = 0;
  public speed: number = 0;
  public damage: number = 0;
  public xpValue: number = 0;
  public goldValue: number = 0;

  private flashUntil: number = 0;

  // Bat behavior timers
  private batZigzagTime: number = 0;
  private batDiveTimer: number = 0;
  private batDiving: boolean = false;
  private batDiveEnd: number = 0;

  // Ghost behavior timers
  private ghostPhaseTimer: number = 0;
  private ghostPhased: boolean = false;
  private ghostPhaseEnd: number = 0;

  // Vampire behavior timers
  private vampireChargeTimer: number = 0;
  private vampireCharging: boolean = true;
  private vampireChargeEnd: number = 0;
  private vampirePauseEnd: number = 0;

  // Boss Necromancer behavior
  private necroSummonTimer: number = 0;
  private necroProjectiles: Phaser.GameObjects.Graphics[] = [];
  private maxHp: number = 0;

  // Archer behavior
  private archerShootTimer: number = 0;
  private archerProjectiles: Phaser.GameObjects.Graphics[] = [];
  private lastTargetX: number = 0;
  private lastTargetY: number = 0;

  // Task 9: HP bar
  private hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, -100, -100, 'enemies', 0);
    scene.add.existing(this);
    this.setActive(false);
    this.setVisible(false);
    this.setOrigin(0.5, 0.5);
    this.setDepth(5);

    // Task 9: HP bar above enemy
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(6);
    this.hpBar.setVisible(false);
  }

  spawn(x: number, y: number, data: EnemyData, waveMultiplier: number = 1, damageMultiplier: number = 1, goldMultiplier: number = 1): void {
    this.enemyData = data;
    this.currentHp = Math.floor(data.hp * waveMultiplier);
    this.maxHp = this.currentHp;
    this.speed = data.speed;
    this.damage = Math.floor(data.damage * damageMultiplier);
    this.xpValue = data.xpValue;
    this.goldValue = Math.round(data.goldValue * goldMultiplier);

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.clearTint();
    this.setAlpha(1);
    this.setScale(1);

    // Reset all behavior timers
    this.batZigzagTime = 0;
    this.batDiveTimer = 0;
    this.batDiving = false;
    this.batDiveEnd = 0;

    this.ghostPhaseTimer = 0;
    this.ghostPhased = false;
    this.ghostPhaseEnd = 0;

    this.vampireChargeTimer = 0;
    this.vampireCharging = true;
    this.vampireChargeEnd = 0;
    this.vampirePauseEnd = 0;

    this.necroSummonTimer = 0;
    this.cleanupNecroProjectiles();

    this.archerShootTimer = 0;
    this.cleanupArcherProjectiles();

    // Reset HP bar
    this.hpBar.clear();
    this.hpBar.setVisible(false);

    // Set frame based on enemy type
    this.setTexture('enemies', this.getFrameForType(data.id));

    // Boss Necromancer: larger sprite
    if (data.id === 'boss_necromancer') {
      this.setScale(2);
    }
  }

  private getFrameForType(id: string): number {
    const frameMap: Record<string, number> = {
      skeleton: 0,
      bat: 1,
      vampire: 2,
      ghost: 3,
      boss_necromancer: 4,
      archer: 5
    };
    return frameMap[id] ?? 0;
  }

  moveToward(targetX: number, targetY: number, delta: number): void {
    if (!this.active) return;

    const id = this.enemyData.id;
    const dt = delta / 1000;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    // Store target position for archer projectile aiming
    this.lastTargetX = targetX;
    this.lastTargetY = targetY;

    if (id === 'bat') {
      this.moveBat(dirX, dirY, dt, dx);
    } else if (id === 'ghost') {
      this.moveGhost(dirX, dirY, dt, dx);
    } else if (id === 'vampire') {
      this.moveVampire(dirX, dirY, dt, dx);
    } else if (id === 'boss_necromancer') {
      this.moveNecromancer(dirX, dirY, dt, dx);
    } else if (id === 'archer') {
      this.moveArcher(dirX, dirY, dt, dx, dist);
    } else {
      // Default (skeleton): straight toward player
      const speed = this.speed * dt;
      this.x = clamp(this.x + dirX * speed, 8, ARENA_WIDTH - 8);
      this.y = clamp(this.y + dirY * speed, 8, ARENA_HEIGHT - 8);
      this.setFlipX(dx < 0);
    }
  }

  private moveBat(dirX: number, dirY: number, dt: number, rawDx: number): void {
    this.batZigzagTime += dt;

    // Perpendicular direction for zigzag
    const perpX = -dirY;
    const perpY = dirX;
    const zigzagOffset = Math.sin(this.batZigzagTime * 6) * 0.7;

    let speedMult = 1;
    if (this.batDiving) {
      speedMult = 2;
    }

    const speed = this.speed * dt * speedMult;
    const moveX = (dirX + perpX * zigzagOffset) * speed;
    const moveY = (dirY + perpY * zigzagOffset) * speed;

    this.x = clamp(this.x + moveX, 8, ARENA_WIDTH - 8);
    this.y = clamp(this.y + moveY, 8, ARENA_HEIGHT - 8);
    this.setFlipX(rawDx < 0);
  }

  private moveGhost(dirX: number, dirY: number, dt: number, rawDx: number): void {
    // Ghost ignores knockback by always moving (no velocity override needed)
    const speed = this.speed * dt;
    this.x = clamp(this.x + dirX * speed, 8, ARENA_WIDTH - 8);
    this.y = clamp(this.y + dirY * speed, 8, ARENA_HEIGHT - 8);
    this.setFlipX(rawDx < 0);
  }

  private moveVampire(dirX: number, dirY: number, dt: number, rawDx: number): void {
    if (!this.vampireCharging) {
      // Paused — don't move
      this.setFlipX(rawDx < 0);
      return;
    }

    // Charging: move at 1.8x speed
    const speed = this.speed * 1.8 * dt;
    this.x = clamp(this.x + dirX * speed, 8, ARENA_WIDTH - 8);
    this.y = clamp(this.y + dirY * speed, 8, ARENA_HEIGHT - 8);
    this.setFlipX(rawDx < 0);
  }

  private moveNecromancer(dirX: number, dirY: number, dt: number, rawDx: number): void {
    const hpRatio = this.currentHp / this.maxHp;
    let speedMult = 1;

    if (hpRatio <= 0.5) {
      // Phase 2: doubled speed
      speedMult = 2;
    }

    const speed = this.speed * speedMult * dt;
    this.x = clamp(this.x + dirX * speed, 8, ARENA_WIDTH - 8);
    this.y = clamp(this.y + dirY * speed, 8, ARENA_HEIGHT - 8);
    this.setFlipX(rawDx < 0);
  }

  takeDamage(amount: number): boolean {
    if (!this.active) return false;

    // Ghost in phased state: invincible
    if (this.enemyData.id === 'ghost' && this.ghostPhased) {
      return false;
    }

    this.currentHp -= amount;
    this.flashUntil = this.scene.time.now + DAMAGE_FLASH_DURATION;
    this.setTint(0xff3300); // kırmızı-turuncu hasar flash

    if (this.currentHp <= 0) {
      // Disable collisions immediately but keep visible for death animation
      this.setActive(false);
      this.cleanupNecroProjectiles();
      this.cleanupArcherProjectiles();
      this.hpBar.setVisible(false);
      this.hpBar.clear();
      return true; // killed — caller must call die() after animation
    }
    return false;
  }

  /**
   * Called by collision system when this enemy hits the player.
   * Returns bonus healing amount (vampire heals on hit).
   */
  onHitPlayer(): void {
    if (this.enemyData.id === 'vampire') {
      this.currentHp = Math.min(this.currentHp + 10, this.maxHp);
    }
  }

  update(time: number, _delta: number): void {
    if (!this.active) return;

    const dt = _delta / 1000;

    // Damage flash
    if (time > this.flashUntil && this.flashUntil > 0) {
      this.clearTint();
      this.flashUntil = 0;
    }

    const id = this.enemyData.id;

    if (id === 'bat') {
      this.updateBat(time, dt);
    } else if (id === 'ghost') {
      this.updateGhost(time, dt);
    } else if (id === 'vampire') {
      this.updateVampire(time, dt);
    } else if (id === 'boss_necromancer') {
      this.updateNecromancer(time, dt);
    } else if (id === 'archer') {
      this.updateArcher(time, dt);
    }

    // Task 9: Draw HP bar above enemy
    this.updateHpBar();
  }

  private updateHpBar(): void {
    if (this.currentHp >= this.maxHp || this.maxHp <= 0) {
      this.hpBar.setVisible(false);
      return;
    }

    this.hpBar.setVisible(true);
    this.hpBar.clear();

    const isBoss = this.enemyData?.id === 'boss_necromancer';
    const barWidth = isBoss ? 40 : 20;
    const barHeight = isBoss ? 5 : 3;
    const barX = this.x - barWidth / 2;
    const barY = this.y - (isBoss ? 26 : 14);

    // Background
    this.hpBar.fillStyle(0x333333, 0.8);
    this.hpBar.fillRect(barX, barY, barWidth, barHeight);

    // HP fill
    const hpPercent = this.currentHp / this.maxHp;
    let color: number;
    if (hpPercent > 0.5) {
      color = 0x00ff00; // green
    } else if (hpPercent > 0.25) {
      color = 0xffff00; // yellow
    } else {
      color = 0xff0000; // red
    }

    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }

  private updateBat(_time: number, dt: number): void {
    this.batDiveTimer += dt;

    if (!this.batDiving && this.batDiveTimer >= 2) {
      // Start dive
      this.batDiving = true;
      this.batDiveEnd = this.batDiveTimer + 0.5;
    }

    if (this.batDiving && this.batDiveTimer >= this.batDiveEnd) {
      // End dive
      this.batDiving = false;
      this.batDiveTimer = 0;
    }
  }

  private updateGhost(time: number, dt: number): void {
    this.ghostPhaseTimer += dt;

    if (!this.ghostPhased && this.ghostPhaseTimer >= 3) {
      // Start phasing
      this.ghostPhased = true;
      this.ghostPhaseEnd = this.ghostPhaseTimer + 1;
      this.setAlpha(0.3);
    }

    if (this.ghostPhased && this.ghostPhaseTimer >= this.ghostPhaseEnd) {
      // End phasing
      this.ghostPhased = false;
      this.ghostPhaseTimer = 0;
      this.setAlpha(1);
    }
  }

  private updateVampire(_time: number, dt: number): void {
    this.vampireChargeTimer += dt;

    if (this.vampireCharging) {
      // Charging for 1s
      if (this.vampireChargeTimer >= 1) {
        this.vampireCharging = false;
        this.vampireChargeTimer = 0;
      }
    } else {
      // Pausing for 0.5s
      if (this.vampireChargeTimer >= 0.5) {
        this.vampireCharging = true;
        this.vampireChargeTimer = 0;
      }
    }
  }

  private updateNecromancer(time: number, dt: number): void {
    const hpRatio = this.currentHp / this.maxHp;

    // Phase 2 red flash
    if (hpRatio <= 0.5) {
      const flashCycle = Math.sin(time * 0.005);
      if (flashCycle > 0.5) {
        this.setTint(0xff0000);
      } else if (this.flashUntil === 0) {
        this.clearTint();
      }
    }

    // Summon timer: fire projectiles every 5 seconds
    this.necroSummonTimer += dt;
    if (this.necroSummonTimer >= 5) {
      this.necroSummonTimer = 0;
      this.fireNecroProjectiles();
    }

    // Update existing necro projectiles
    this.updateNecroProjectiles(dt);
  }

  private fireNecroProjectiles(): void {
    // Fire 4 dark projectiles in cardinal directions
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];

    for (const dir of directions) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0x6600cc, 0.8);
      gfx.fillCircle(0, 0, 8);
      gfx.setPosition(this.x, this.y);
      gfx.setDepth(6);

      // Store direction and lifetime on the graphics object using data manager
      gfx.setData('dirX', dir.x);
      gfx.setData('dirY', dir.y);
      gfx.setData('lifetime', 0);
      gfx.setData('speed', 150);

      this.necroProjectiles.push(gfx);
    }
  }

  private updateNecroProjectiles(dt: number): void {
    for (let i = this.necroProjectiles.length - 1; i >= 0; i--) {
      const gfx = this.necroProjectiles[i];
      const dirX = gfx.getData('dirX') as number;
      const dirY = gfx.getData('dirY') as number;
      const speed = gfx.getData('speed') as number;
      let lifetime = gfx.getData('lifetime') as number;

      lifetime += dt;
      gfx.setData('lifetime', lifetime);

      gfx.x += dirX * speed * dt;
      gfx.y += dirY * speed * dt;

      // Remove after 3 seconds or out of arena bounds
      if (lifetime > 3 || gfx.x < -20 || gfx.x > ARENA_WIDTH + 20 ||
          gfx.y < -20 || gfx.y > ARENA_HEIGHT + 20) {
        gfx.destroy();
        this.necroProjectiles.splice(i, 1);
      }
    }
  }

  /** Check if a necromancer projectile hits a given position (for player collision). */
  checkNecroProjectileHit(targetX: number, targetY: number, radius: number): number {
    let totalDamage = 0;
    for (let i = this.necroProjectiles.length - 1; i >= 0; i--) {
      const gfx = this.necroProjectiles[i];
      const dx = gfx.x - targetX;
      const dy = gfx.y - targetY;
      const distSq = dx * dx + dy * dy;
      const hitRadius = radius + 8; // 8 = projectile radius

      if (distSq < hitRadius * hitRadius) {
        totalDamage += Math.floor(this.damage * 0.5);
        gfx.destroy();
        this.necroProjectiles.splice(i, 1);
      }
    }
    return totalDamage;
  }

  private cleanupNecroProjectiles(): void {
    for (const gfx of this.necroProjectiles) {
      gfx.destroy();
    }
    this.necroProjectiles = [];
  }

  // --- Archer behavior ---

  private moveArcher(dirX: number, dirY: number, dt: number, rawDx: number, dist: number): void {
    const speed = this.speed * dt;

    if (dist < 200) {
      // Too close: back away
      this.x = clamp(this.x - dirX * speed, 8, ARENA_WIDTH - 8);
      this.y = clamp(this.y - dirY * speed, 8, ARENA_HEIGHT - 8);
    } else if (dist > 250) {
      // Too far: approach
      this.x = clamp(this.x + dirX * speed, 8, ARENA_WIDTH - 8);
      this.y = clamp(this.y + dirY * speed, 8, ARENA_HEIGHT - 8);
    }
    // Between 200-250: hold position

    this.setFlipX(rawDx < 0);
  }

  private updateArcher(_time: number, dt: number): void {
    this.archerShootTimer += dt;

    // Fire a projectile every 2 seconds when within 300px
    if (this.archerShootTimer >= 2) {
      const dx = this.lastTargetX - this.x;
      const dy = this.lastTargetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 350) {
        this.archerShootTimer = 0;
        this.fireArcherProjectile();
      }
    }

    // Update existing archer projectiles
    this.updateArcherProjectiles(dt);
  }

  private fireArcherProjectile(): void {
    const dx = this.lastTargetX - this.x;
    const dy = this.lastTargetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const dirX = dx / dist;
    const dirY = dy / dist;

    const gfx = this.scene.add.graphics();
    gfx.fillStyle(0x990000, 0.9);
    gfx.fillCircle(0, 0, 6);
    gfx.setPosition(this.x, this.y);
    gfx.setDepth(6);

    gfx.setData('dirX', dirX);
    gfx.setData('dirY', dirY);
    gfx.setData('lifetime', 0);
    gfx.setData('speed', 180);

    this.archerProjectiles.push(gfx);
  }

  private updateArcherProjectiles(dt: number): void {
    for (let i = this.archerProjectiles.length - 1; i >= 0; i--) {
      const gfx = this.archerProjectiles[i];
      const dirX = gfx.getData('dirX') as number;
      const dirY = gfx.getData('dirY') as number;
      const speed = gfx.getData('speed') as number;
      let lifetime = gfx.getData('lifetime') as number;

      lifetime += dt;
      gfx.setData('lifetime', lifetime);

      gfx.x += dirX * speed * dt;
      gfx.y += dirY * speed * dt;

      if (lifetime > 3 || gfx.x < -20 || gfx.x > ARENA_WIDTH + 20 ||
          gfx.y < -20 || gfx.y > ARENA_HEIGHT + 20) {
        gfx.destroy();
        this.archerProjectiles.splice(i, 1);
      }
    }
  }

  /** Check if an archer projectile hits a given position (for player collision). */
  checkArcherProjectileHit(targetX: number, targetY: number, radius: number): number {
    let totalDamage = 0;
    for (let i = this.archerProjectiles.length - 1; i >= 0; i--) {
      const gfx = this.archerProjectiles[i];
      const dx = gfx.x - targetX;
      const dy = gfx.y - targetY;
      const distSq = dx * dx + dy * dy;
      const hitRadius = radius + 6; // 6 = archer projectile radius

      if (distSq < hitRadius * hitRadius) {
        totalDamage += this.damage;
        gfx.destroy();
        this.archerProjectiles.splice(i, 1);
      }
    }
    return totalDamage;
  }

  private cleanupArcherProjectiles(): void {
    for (const gfx of this.archerProjectiles) {
      gfx.destroy();
    }
    this.archerProjectiles = [];
  }

  /** Final visual reset — call after death animation completes */
  die(): void {
    this.setVisible(false);
    this.setPosition(-100, -100);
    this.setAlpha(1);
    this.setScale(1);
    this.clearTint();
  }

  get maxHpValue(): number {
    return this.maxHp;
  }

  get isAlive(): boolean {
    return this.active && this.currentHp > 0;
  }
}
