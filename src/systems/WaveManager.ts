import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { ObjectPool } from './ObjectPool';
import { EnemyData } from '../utils/types';
import { WAVE_COUNT, ARENA_WIDTH, ARENA_HEIGHT, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { getSpawnPositionOutsideCamera, getSpawnPositionNearPlayer } from '../utils/math';

const ENEMY_DATA: Record<string, EnemyData> = {
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton',
    hp: 15,
    speed: 65,
    damage: 5,
    xpValue: 1,
    goldValue: 3,
    spriteKey: 'enemies',
    isBoss: false
  },
  bat: {
    id: 'bat',
    name: 'Bat',
    hp: 8,
    speed: 95,
    damage: 3,
    xpValue: 1,
    goldValue: 3,
    spriteKey: 'enemies',
    isBoss: false
  },
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    hp: 40,
    speed: 70,
    damage: 10,
    xpValue: 3,
    goldValue: 7,
    spriteKey: 'enemies',
    isBoss: false
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    hp: 20,
    speed: 55,
    damage: 7,
    xpValue: 2,
    goldValue: 4,
    spriteKey: 'enemies',
    isBoss: false
  },
  archer: {
    id: 'archer',
    name: 'Dark Archer',
    hp: 12,
    speed: 45,
    damage: 8,
    xpValue: 2,
    goldValue: 5,
    spriteKey: 'enemies',
    isBoss: false
  },
  boss_necromancer: {
    id: 'boss_necromancer',
    name: 'Necromancer',
    hp: 500,
    speed: 20,
    damage: 25,
    xpValue: 50,
    goldValue: 80,
    spriteKey: 'enemies',
    isBoss: true
  }
};

export class WaveManager {
  private scene: Phaser.Scene;
  private enemyPool: ObjectPool<Enemy>;
  private currentWave: number = 1;
  private difficultyHpMult: number;
  private difficultyDamageMult: number;
  private waveTimer: number = 0;
  private spawnTimer: number = 0;
  private waveActive: boolean = false;
  private playerX: number = 0;
  private playerY: number = 0;
  private cameraX: number = 0;
  private cameraY: number = 0;
  public onWaveComplete?: () => void;

  /** A2: Callback for spawn preview warnings – called 1s before enemies actually spawn */
  public onSpawnPreview?: (positions: { x: number; y: number }[]) => void;
  private pendingSpawn: { positions: { x: number; y: number }[]; count: number; timer: number } | null = null;

  constructor(scene: Phaser.Scene, enemyPool: ObjectPool<Enemy>, difficultyHpMult = 1, difficultyDamageMult = 1) {
    this.scene = scene;
    this.enemyPool = enemyPool;
    this.difficultyHpMult = difficultyHpMult;
    this.difficultyDamageMult = difficultyDamageMult;
  }

  startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.waveActive = true;
    this.pendingSpawn = null;
  }

  /** F1: Get wave duration based on wave number */
  getWaveDuration(): number {
    const wave = this.currentWave;
    if (wave <= 3) return 20_000;       // Easy: 20s
    if (wave <= 7) return 25_000;       // Medium: 25s
    if (wave <= 12) return 30_000;      // Hard: 30s
    if (wave <= 20) return 35_000;      // Very Hard: 35s
    return 40_000;                       // Chaos: 40s
  }

  /** F1/A1: Get current spawn interval based on wave tier and elapsed time */
  private getCurrentSpawnInterval(): number {
    const wave = this.currentWave;
    const elapsed = this.waveTimer;
    const duration = this.getWaveDuration();
    const progress = elapsed / duration;

    // Base interval by wave tier
    let baseInterval: number;
    if (wave <= 3) {
      baseInterval = 2500;        // Easy: slow spawn
    } else if (wave <= 7) {
      baseInterval = 1800;        // Medium: moderate
    } else if (wave <= 12) {
      baseInterval = 1200;        // Hard: faster
    } else if (wave <= 20) {
      baseInterval = 800;         // Very Hard: fast
    } else {
      baseInterval = 500;         // Chaos: maximum spawn rate
    }

    // Ramp within wave: spawn faster as wave progresses
    if (progress > 0.66) {
      return Math.max(300, baseInterval * 0.5);   // Finale rush
    } else if (progress > 0.33) {
      return Math.max(400, baseInterval * 0.75);  // Mid wave
    }
    return baseInterval;
  }

  /** F1/A1: Get enemy count per spawn group */
  private getSpawnGroupCount(): number {
    const wave = this.currentWave;
    const elapsed = this.waveTimer;
    const duration = this.getWaveDuration();
    const progress = elapsed / duration;

    // Base count by wave tier
    let baseMin: number;
    let baseRange: number;
    if (wave <= 3) {
      baseMin = 1; baseRange = 2;      // 1-2 enemies
    } else if (wave <= 7) {
      baseMin = 2; baseRange = 3;      // 2-4 enemies
    } else if (wave <= 12) {
      baseMin = 3; baseRange = 4;      // 3-6 enemies
    } else if (wave <= 20) {
      baseMin = 4; baseRange = 5;      // 4-8 enemies
    } else {
      baseMin = 6; baseRange = 6;      // 6-11 enemies
    }

    // Ramp within wave
    if (progress > 0.66) {
      baseMin += 2;
      baseRange += 2;
    } else if (progress > 0.33) {
      baseMin += 1;
      baseRange += 1;
    }

    return baseMin + Math.floor(Math.random() * baseRange);
  }

  update(delta: number, playerX: number, playerY: number, cameraX: number, cameraY: number): void {
    if (!this.waveActive) return;

    this.playerX = playerX;
    this.playerY = playerY;
    this.cameraX = cameraX;
    this.cameraY = cameraY;

    this.waveTimer += delta;
    this.spawnTimer += delta;

    // A2: Handle pending spawn (after preview delay)
    if (this.pendingSpawn) {
      this.pendingSpawn.timer -= delta;
      if (this.pendingSpawn.timer <= 0) {
        this.spawnEnemiesAtPositions(this.pendingSpawn.positions);
        this.pendingSpawn = null;
      }
    }

    // A1: Progressive spawn interval
    const spawnInterval = this.getCurrentSpawnInterval();

    if (this.spawnTimer >= spawnInterval && !this.pendingSpawn) {
      this.spawnTimer = 0;
      this.prepareSpawn();
    }

    if (this.waveTimer >= this.getWaveDuration()) {
      this.waveActive = false;
      this.pendingSpawn = null;
      this.onWaveComplete?.();
    }
  }

  /** A2: Pre-generate spawn positions, emit preview, then spawn after 1s delay */
  private prepareSpawn(): void {
    const count = this.getSpawnGroupCount();
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < count; i++) {
      positions.push(getSpawnPositionNearPlayer(
        this.playerX, this.playerY,
        180, 300,
        ARENA_WIDTH, ARENA_HEIGHT
      ));
    }

    // F1: Boss spawn every 5 waves; chaos mode gets multiple bosses
    const isBossWave = this.currentWave % 5 === 0;
    if (isBossWave && this.waveTimer < 2500) {
      const bossCount = this.currentWave >= 21 ? 2 : 1; // Chaos: 2 bosses
      for (let b = 0; b < bossCount; b++) {
        positions.push(getSpawnPositionOutsideCamera(
          this.cameraX, this.cameraY,
          GAME_WIDTH, GAME_HEIGHT,
          ARENA_WIDTH, ARENA_HEIGHT
        ));
      }
    }

    // Emit preview warning
    this.onSpawnPreview?.(positions);

    // Schedule actual spawn in 1 second
    this.pendingSpawn = { positions, count, timer: 1000 };
  }

  /** C3: Compute HP scaling multiplier based on wave tier + difficulty */
  private getWaveMultiplier(): number {
    const wave = this.currentWave;
    let base: number;
    if (wave <= 5) {
      base = 1 + (wave - 1) * 0.1;
    } else if (wave <= 15) {
      base = 1.5 + (wave - 6) * 0.2;
    } else {
      base = 3.5 + (wave - 16) * 0.3;
    }
    return base * this.difficultyHpMult;
  }

  /** C3: Compute damage scaling multiplier based on wave + difficulty */
  private getDamageMultiplier(): number {
    return (1 + (this.currentWave - 1) * 0.05) * this.difficultyDamageMult;
  }

  /** Gold multiplier: scales up with wave so late-game enemies reward more */
  private getGoldMultiplier(): number {
    return 1 + (this.currentWave - 1) * 0.15; // wave 1=1×, wave 5=1.6×, wave 10=2.35×, wave 20=3.85×
  }

  /** Spawn enemies at pre-determined positions */
  private spawnEnemiesAtPositions(positions: { x: number; y: number }[]): void {
    const waveMultiplier = this.getWaveMultiplier();
    const damageMultiplier = this.getDamageMultiplier();
    const goldMultiplier = this.getGoldMultiplier();
    const isBossWave = this.currentWave % 5 === 0;
    const spawnBoss = isBossWave && this.waveTimer < 3500;
    const bossCount = this.currentWave >= 21 ? 2 : 1;

    for (let i = 0; i < positions.length; i++) {
      // Last N positions are bosses if applicable
      if (spawnBoss && i >= positions.length - bossCount) {
        const boss = this.enemyPool.get();
        if (boss) {
          // Boss HP: wave 5=1×, wave 10=2×, wave 15=3×... max 7×
        const bossHpMult = Math.min(1 + Math.floor(this.currentWave / 5) - 1, 6) * this.difficultyHpMult || this.difficultyHpMult;
        boss.spawn(positions[i].x, positions[i].y, ENEMY_DATA.boss_necromancer, bossHpMult, damageMultiplier, goldMultiplier);
        }
        continue;
      }

      const enemy = this.enemyPool.get();
      if (!enemy) break;

      const enemyType = this.getRandomEnemyType();
      enemy.spawn(positions[i].x, positions[i].y, ENEMY_DATA[enemyType], waveMultiplier, damageMultiplier, goldMultiplier);
    }
  }

  /** F1: Enemy type availability by wave tier */
  private getRandomEnemyType(): string {
    const wave = this.currentWave;

    // Wave 1-3: Easy – only skeletons
    if (wave <= 3) {
      return 'skeleton';
    }

    // Wave 4-7: Medium – add bats and ghosts
    if (wave <= 7) {
      const types = ['skeleton', 'skeleton', 'bat', 'ghost'];
      return types[Math.floor(Math.random() * types.length)];
    }

    // Wave 8-12: Hard – add vampires and archers
    if (wave <= 12) {
      const types = ['skeleton', 'bat', 'ghost', 'vampire', 'archer'];
      return types[Math.floor(Math.random() * types.length)];
    }

    // Wave 13-20: Very Hard – all types, weighted toward harder enemies
    if (wave <= 20) {
      const types = ['skeleton', 'bat', 'ghost', 'ghost', 'vampire', 'vampire', 'archer', 'archer'];
      return types[Math.floor(Math.random() * types.length)];
    }

    // Wave 21-30: Chaos – all types, heavily weighted toward hard enemies
    const types = ['bat', 'ghost', 'vampire', 'vampire', 'archer', 'archer', 'vampire'];
    return types[Math.floor(Math.random() * types.length)];
  }

  get wave(): number {
    return this.currentWave;
  }

  get isWaveActive(): boolean {
    return this.waveActive;
  }

  get waveProgress(): number {
    return Math.min(this.waveTimer / this.getWaveDuration(), 1);
  }

  get waveTimeRemaining(): number {
    return Math.max(0, this.getWaveDuration() - this.waveTimer);
  }

  get totalWaves(): number {
    return WAVE_COUNT;
  }

  get isLastWave(): boolean {
    return this.currentWave >= WAVE_COUNT;
  }
}
