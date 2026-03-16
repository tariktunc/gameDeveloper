import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { XPGem } from '../entities/XPGem';
import { GoldCoin } from '../entities/GoldCoin';
import { DamageNumber } from '../entities/DamageNumber';
import { ObjectPool } from '../systems/ObjectPool';
import { InputManager } from '../systems/InputManager';
import { WaveManager } from '../systems/WaveManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { XPSystem } from '../systems/XPSystem';
import { Knife } from '../weapons/weapons/Knife';
import { Garlic } from '../weapons/weapons/Garlic';
import { Whip } from '../weapons/weapons/Whip';
import { HolyWater } from '../weapons/weapons/HolyWater';
import { CrossBoomerang } from '../weapons/weapons/CrossBoomerang';
import { WeaponBase } from '../weapons/WeaponBase';
import { HUD } from '../ui/HUD';
import { MinimapUI } from '../ui/MinimapUI';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { getEvolution } from '../weapons/WeaponEvolution';
import { CharacterData } from '../utils/types';
import characters from '../data/characters.json';
import { ARENA_WIDTH, ARENA_HEIGHT, GAME_WIDTH, GAME_HEIGHT, MAX_ENEMIES, MAX_PROJECTILES, MAX_XP_GEMS, MAX_GOLD_COINS } from '../utils/constants';

export class GameScene extends Phaser.Scene {
  public player!: Player;
  private inputManager!: InputManager;
  private waveManager!: WaveManager;
  private collisionSystem!: CollisionSystem;
  private xpSystem!: XPSystem;
  private hud!: HUD;
  private minimap!: MinimapUI;
  private audioManager!: AudioManager;
  private saveManager!: SaveManager;
  private characterId: string = 'antonio';

  private enemyPool!: ObjectPool<Enemy>;
  private projectilePool!: ObjectPool<Projectile>;
  private xpGemPool!: ObjectPool<XPGem>;
  private goldCoinPool!: ObjectPool<GoldCoin>;
  private damageNumbers: DamageNumber[] = [];

  private weapons: WeaponBase[] = [];

  private allEnemies: Enemy[] = [];
  private allProjectiles: Projectile[] = [];
  private allXPGems: XPGem[] = [];
  private allGoldCoins: GoldCoin[] = [];

  // Task 20: Kill Combo System
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private readonly COMBO_WINDOW = 2000; // 2 seconds

  // E3: Wave statistics tracking
  private waveKills: number = 0;
  private waveDamageTaken: number = 0;
  private waveGoldEarned: number = 0;

  // Wave timer warning (fire once per wave at 10s left)
  private waveWarningFiredForWave: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  /** Task 20: Get XP multiplier based on current combo */
  getComboXPMultiplier(): number {
    if (this.comboCount >= 20) return 2.0;
    if (this.comboCount >= 10) return 1.5;
    if (this.comboCount >= 5) return 1.25;
    return 1.0;
  }

  /** Task 20: Current combo count (for HUD) */
  getComboCount(): number {
    return this.comboCount;
  }

  create(data?: { characterId?: string }): void {
    // Reset combo state
    this.comboCount = 0;
    this.comboTimer = 0;

    // E3: Reset wave stats
    this.waveKills = 0;
    this.waveDamageTaken = 0;
    this.waveGoldEarned = 0;

    // Draw arena background
    this.createArenaBackground();

    // Set world and camera bounds
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Create player at center
    this.player = new Player(this, ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Zorluk çarpanları
    const diffSave = new SaveManager();
    const { enemyHpMult, enemyDamageMult, playerDamageMult } = this.getDifficultyMultipliers(diffSave.difficulty);

    // Task 17: Apply character data
    this.characterId = data?.characterId ?? 'antonio';
    const characterId = this.characterId;
    const charList = characters as CharacterData[];
    const charData = charList.find(c => c.id === characterId) ?? charList[0];
    if (charData) {
      this.player.stats.maxHp = charData.baseStats.maxHp;
      this.player.stats.speed = charData.baseStats.speed;
      this.player.stats.damage = charData.baseStats.damage * playerDamageMult;
      this.player.stats.attackSpeed = charData.baseStats.attackSpeed;
      this.player.stats.armor = charData.baseStats.armor;
      this.player.stats.pickupRange = charData.baseStats.pickupRange;
      this.player.stats.luck = charData.baseStats.luck;
      this.player.currentHp = charData.baseStats.maxHp;

      // Karakter renk ayrımı
      const tints: Record<string, number> = {
        antonio: 0x88aaff, // mavi
        mortis:  0xff6644, // kırmızı-turuncu
        fang:    0xcc66ff  // mor
      };
      if (tints[characterId]) this.player.setDefaultTint(tints[characterId]);
    }

    // Input
    this.inputManager = new InputManager(this);

    // Object pools
    this.allEnemies = [];
    this.enemyPool = new ObjectPool<Enemy>(
      () => {
        const e = new Enemy(this);
        this.allEnemies.push(e);
        return e;
      },
      MAX_ENEMIES
    );

    this.allProjectiles = [];
    this.projectilePool = new ObjectPool<Projectile>(
      () => {
        const p = new Projectile(this);
        this.allProjectiles.push(p);
        return p;
      },
      MAX_PROJECTILES
    );

    this.allXPGems = [];
    this.xpGemPool = new ObjectPool<XPGem>(
      () => {
        const g = new XPGem(this);
        this.allXPGems.push(g);
        return g;
      },
      MAX_XP_GEMS
    );

    this.allGoldCoins = [];
    this.goldCoinPool = new ObjectPool<GoldCoin>(
      () => {
        const c = new GoldCoin(this);
        this.allGoldCoins.push(c);
        return c;
      },
      MAX_GOLD_COINS
    );

    // Damage numbers pool (sıfırla + yeniden oluştur)
    this.damageNumbers = [];
    for (let i = 0; i < 50; i++) {
      this.damageNumbers.push(new DamageNumber(this));
    }

    // Task 17: Starting weapons based on character choice
    this.weapons = [];
    const startingWeapon = charData?.startingWeapon ?? 'knife';
    this.addWeaponById(startingWeapon);

    // XP System
    this.xpSystem = new XPSystem(this.player);
    this.xpSystem.onLevelUp = (level: number) => {
      this.onLevelUp(level);
    };

    // Wave Manager
    this.waveManager = new WaveManager(this, this.enemyPool, enemyHpMult, enemyDamageMult);
    this.waveManager.onWaveComplete = () => this.onWaveComplete();
    // Spawn preview warnings devre dışı (görsel hata oluşturuyordu)
    this.waveManager.startWave(1);

    // Collision System
    this.collisionSystem = new CollisionSystem(
      this.player,
      this.allEnemies,
      this.allProjectiles,
      this.allXPGems,
      this.allGoldCoins
    );
    this.setupCollisionCallbacks();
    // Melee/aura silahlarına kill + hit callback'i bağla
    for (const weapon of this.weapons) {
      weapon.onEnemyKilled = this.collisionSystem.onEnemyKilled;
      weapon.onMeleeHit = (enemy, damage) => {
        this.showDamageNumber(enemy.x, enemy.y, damage, false);
        this.audioManager?.playHit();
        this.spawnHitSpark(enemy.x, enemy.y, false);
      };
    }

    // HUD (E2: pass enemies array for enemy count display)
    this.hud = new HUD(this, this.player, this.xpSystem, this.waveManager, this.weapons, this.allEnemies);

    // Minimap
    this.minimap = new MinimapUI(this, this.player, this.allEnemies);

    // Task 21 & 22: Audio (kaydedilmiş volume ile başlat)
    const volSave = new SaveManager();
    this.audioManager = new AudioManager(this, volSave.musicVolume);
    this.audioManager.playBGM();

    // BGM'i scene kapanınca durdur (üst üste binmeyi önle)
    this.events.once('shutdown', () => {
      this.audioManager?.stopBGM();
    }, this);

    // Task 25: SaveManager
    this.saveManager = new SaveManager();

    // Task 16: Wave announcement at game start
    this.showWaveAnnouncement(1);
  }

  /** Task 17: Add a weapon by ID */
  addWeaponById(weaponId: string): void {
    if (this.player.weaponIds.includes(weaponId)) return;
    if (!this.player.canAddWeapon) return;
    const prevCount = this.weapons.length;

    switch (weaponId) {
      case 'knife': {
        const knife = new Knife(this, this.player, this.projectilePool, this.inputManager, this.allEnemies, this.audioManager);
        this.weapons.push(knife);
        this.player.weaponIds.push('knife');
        break;
      }
      case 'garlic': {
        const garlic = new Garlic(this, this.player, this.allEnemies);
        this.weapons.push(garlic);
        this.player.weaponIds.push('garlic');
        break;
      }
      case 'whip': {
        const whip = new Whip(this, this.player, this.allEnemies);
        this.weapons.push(whip);
        this.player.weaponIds.push('whip');
        break;
      }
      case 'holy_water': {
        const hw = new HolyWater(this, this.player, this.allEnemies);
        this.weapons.push(hw);
        this.player.weaponIds.push('holy_water');
        break;
      }
      case 'cross_boomerang': {
        const cb = new CrossBoomerang(this, this.player, this.allEnemies);
        this.weapons.push(cb);
        this.player.weaponIds.push('cross_boomerang');
        break;
      }
    }

    // Yeni eklenen silaha kill + hit callback'i bağla (level-up sırasında eklenirse)
    if (this.weapons.length > prevCount && this.collisionSystem?.onEnemyKilled) {
      const newWeapon = this.weapons[this.weapons.length - 1];
      newWeapon.onEnemyKilled = this.collisionSystem.onEnemyKilled;
      newWeapon.onMeleeHit = (enemy, damage) => {
        this.showDamageNumber(enemy.x, enemy.y, damage, false);
        this.audioManager?.playHit();
        this.spawnHitSpark(enemy.x, enemy.y, false);
      };
    }
  }

  private createArenaBackground(): void {
    // Tile the arena with floor tiles
    const tileSize = 32;
    for (let x = 0; x < ARENA_WIDTH; x += tileSize) {
      for (let y = 0; y < ARENA_HEIGHT; y += tileSize) {
        this.add.image(x + tileSize / 2, y + tileSize / 2, 'arena-tile').setDepth(0);
      }
    }

    // Arena border — dış duvar (parlak mor + içe gölge)
    const border = this.add.graphics().setDepth(1);
    border.lineStyle(6, 0xaa44ff, 0.9);
    border.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    border.lineStyle(14, 0x220033, 0.5);
    border.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    // Köşe işaretleri
    const corners = [[0,0],[ARENA_WIDTH,0],[0,ARENA_HEIGHT],[ARENA_WIDTH,ARENA_HEIGHT]];
    for (const [cx, cy] of corners) {
      border.fillStyle(0xcc66ff, 0.8);
      border.fillRect(cx - 6, cy - 6, 12, 12);
    }
  }

  private setupCollisionCallbacks(): void {
    this.collisionSystem.onEnemyHit = (enemy, damage, _proj) => {
      // Task 11: Critical hit system — luck ile ölçeklenir (temel %15, max %40)
      const critChance = Math.min(0.15 * this.player.stats.luck, 0.40);
      const isCrit = Math.random() < critChance;
      let finalDamage = damage;
      if (isCrit) {
        finalDamage = damage * 2;
        // Apply extra crit damage only if enemy is still alive
        if (enemy.active && enemy.currentHp > 0) {
          const killed = enemy.takeDamage(damage);
          if (killed) {
            this.collisionSystem.onEnemyKilled?.(enemy);
          }
        }
        this.showCritFlash(enemy.x, enemy.y);
      }

      this.showDamageNumber(enemy.x, enemy.y, finalDamage, isCrit);
      this.audioManager.playHit();
      this.spawnHitSpark(enemy.x, enemy.y, isCrit);
    };

    this.collisionSystem.onEnemyKilled = (enemy) => {
      this.player.kills++;
      this.waveKills++;
      const isBossKill = enemy.enemyData?.id === 'boss_necromancer';
      this.cameras.main.shake(isBossKill ? 300 : 30, isBossKill ? 0.012 : 0.002);
      if (isBossKill) {
        this.audioManager.playBossKill();
      } else {
        this.audioManager.playKill();
      }

      // --- Task 20: Kill Combo System ---
      this.comboCount++;
      this.comboTimer = this.COMBO_WINDOW;
      if (this.comboCount === 10 || this.comboCount === 20) {
        this.showComboText(enemy.x, enemy.y, this.comboCount);
      }

      // --- Task 8: Death particle burst ---
      this.spawnDeathParticles(enemy.x, enemy.y, enemy.enemyData.id);

      // Drop XP (Task 20: apply combo XP bonus)
      const xpMultiplier = this.getComboXPMultiplier();
      const gem = this.xpGemPool.get();
      if (gem) {
        gem.spawn(enemy.x, enemy.y, Math.round(enemy.xpValue * xpMultiplier));
      }

      // D1: Drop gold coin entity (every kill)
      const coin = this.goldCoinPool.get();
      if (coin) {
        coin.spawn(enemy.x, enemy.y, enemy.goldValue);
      }

      // --- Task 23: HP Potion Drop (5% chance) ---
      if (Math.random() < 0.05) {
        this.spawnHealthPotion(enemy.x, enemy.y);
      }

      // --- Character passives on kill ---
      // Antonio: Savaşçı Ruhu — every 20 kills, heal 5 HP
      if (this.characterId === 'antonio' && this.player.kills % 20 === 0) {
        this.player.currentHp = Math.min(this.player.currentHp + 5, this.player.stats.maxHp);
        this.showHealText(this.player.x, this.player.y, 5);
        this.showPassiveTrigger('SAVAŞÇI RUHU!', '#44ff88');
      }
      // Fang: Kan Emici — 25% chance to heal 2 HP on kill
      if (this.characterId === 'fang' && Math.random() < 0.25) {
        this.player.currentHp = Math.min(this.player.currentHp + 2, this.player.stats.maxHp);
        this.showHealText(this.player.x, this.player.y, 2);
        this.showPassiveTrigger('KAN EMİCİ!', '#ff4466');
      }

      // Death shrink+fade animation, then release to pool
      this.tweens.add({
        targets: enemy,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: isBossKill ? 400 : 160,
        ease: 'Power2',
        onComplete: () => {
          enemy.die();
          this.enemyPool.release(enemy);
        }
      });
    };

    this.collisionSystem.onPlayerHit = (damage) => {
      this.waveDamageTaken += damage;
      this.showDamageNumber(this.player.x, this.player.y, damage, true);
      this.cameras.main.shake(100, 0.008);
      this.audioManager.playPlayerHit();

      // Mortis: Taş Deri — 30% chance to reflect 3 damage to nearby enemies (range 80)
      if (this.characterId === 'mortis' && Math.random() < 0.30) {
        const thornRange = 80;
        const thornRangeSq = thornRange * thornRange;
        let thornHit = false;
        for (const e of this.allEnemies) {
          if (!e.active) continue;
          const dx = e.x - this.player.x;
          const dy = e.y - this.player.y;
          if (dx * dx + dy * dy <= thornRangeSq) {
            const killed = e.takeDamage(3);
            this.spawnHitSpark(e.x, e.y, false);
            if (killed) this.collisionSystem.onEnemyKilled?.(e);
            thornHit = true;
          }
        }
        if (thornHit) this.showPassiveTrigger('TAŞ DERİ!', '#ff8833');
      }

      if (!this.player.isAlive) {
        this.showPlayerDeath();
      }
    };

    this.collisionSystem.onXPCollected = (gem) => {
      // Task 24: XP Collection Glow Effect
      const glow = this.add.circle(gem.x, gem.y, 5, 0x33ff33, 0.6);
      glow.setDepth(9);
      this.tweens.add({
        targets: glow,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 200,
        ease: 'Power1',
        onComplete: () => {
          glow.destroy();
        }
      });

      this.xpSystem.addXP(gem.xpValue);
      this.xpGemPool.release(gem);
      this.audioManager.playXPPickup();
    };

    this.collisionSystem.onGoldCollected = (coin) => {
      this.player.gold += coin.goldValue;
      this.waveGoldEarned += coin.goldValue;
      this.audioManager.playGoldPickup();
      this.showGoldPickupText(coin.x, coin.y, coin.goldValue);
      this.goldCoinPool.release(coin);
    };
  }

  private showDamageNumber(x: number, y: number, amount: number, isCrit: boolean = false): void {
    const dmgNum = this.damageNumbers.find(d => !d.active);
    if (dmgNum) {
      dmgNum.show(x, y, amount, isCrit);
    }
  }

  update(time: number, delta: number): void {
    if (!this.player.isAlive) return;

    // 1. Input
    this.inputManager.update();

    // Pause
    if (this.inputManager.pausePressed) {
      this.scene.launch('PauseScene');
      this.scene.pause();
      return;
    }

    // 2. Player movement
    this.player.move(this.inputManager.moveX, this.inputManager.moveY, delta);

    // 2b. Dash
    if (this.inputManager.dashPressed && this.player.canDash) {
      let dashDirX = this.inputManager.moveX;
      let dashDirY = this.inputManager.moveY;

      // If no move direction, dash toward mouse cursor
      if (dashDirX === 0 && dashDirY === 0) {
        dashDirX = this.inputManager.mouseWorldX - this.player.x;
        dashDirY = this.inputManager.mouseWorldY - this.player.y;
      }

      this.player.dash(dashDirX, dashDirY);
      this.cameras.main.shake(80, 0.003);
      this.audioManager.playDash();

      // Dash afterimage trail
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * 30, () => {
          const ghost = this.add.sprite(this.player.x, this.player.y, 'player', 0);
          ghost.setAlpha(0.55 - i * 0.08);
          ghost.setTint(0x4488ff);
          ghost.setDepth(4);
          ghost.setFlipX(this.player.flipX);
          this.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: 0.6,
            scaleY: 0.6,
            duration: 220,
            ease: 'Power2',
            onComplete: () => ghost.destroy()
          });
        });
      }
    }

    // 3. Wave manager
    const cam = this.cameras.main;
    this.waveManager.update(
      delta,
      this.player.x, this.player.y,
      cam.scrollX, cam.scrollY
    );

    // 3b. Wave timer warning at 10s left
    const waveRemaining = this.waveManager.waveTimeRemaining;
    if (waveRemaining > 0 && waveRemaining < 10000 && this.waveWarningFiredForWave !== this.waveManager.wave) {
      this.waveWarningFiredForWave = this.waveManager.wave;
      this.audioManager.playTimerWarning();

      // Screen pulse + warning text
      const warnOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff4400, 0)
        .setScrollFactor(0).setDepth(198);
      this.tweens.add({
        targets: warnOverlay, alpha: 0.12, duration: 150, yoyo: true, repeat: 2,
        onComplete: () => warnOverlay.destroy()
      });

      const warnText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '⚠ 10 SANİYE ⚠', {
        fontSize: '24px', fontFamily: 'monospace', color: '#ff6600', fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(302).setAlpha(0);
      this.tweens.add({
        targets: warnText, alpha: 1, duration: 200,
        onComplete: () => {
          this.tweens.add({ targets: warnText, alpha: 0, duration: 300, delay: 1200, onComplete: () => warnText.destroy() });
        }
      });
    }

    // 4. Enemies move toward player
    for (const enemy of this.allEnemies) {
      if (enemy.active) {
        enemy.moveToward(this.player.x, this.player.y, delta);
        enemy.update(time, delta);
      }
    }

    // 5. Weapons auto-attack
    for (const weapon of this.weapons) {
      weapon.update(delta);
    }

    // 6. Update projectiles
    for (const proj of this.allProjectiles) {
      if (proj.active) {
        proj.update(time, delta);
        // Projectile trail effect
        if (proj.trailCooldown <= 0) {
          proj.trailCooldown = 35;
          this.spawnProjectileTrail(proj.x, proj.y, proj.rotation);
        }
      }
    }

    // 7. Update XP gems
    for (const gem of this.allXPGems) {
      if (gem.active) {
        gem.update(time, delta);
      }
    }

    // 7b. Update gold coins
    for (const coin of this.allGoldCoins) {
      if (coin.active) {
        coin.update(time, delta);
      }
    }

    // 8. Collisions
    this.collisionSystem.update();

    // 8b. Task 20: Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboTimer = 0;
      }
    }

    // 9. Damage numbers
    for (const dmg of this.damageNumbers) {
      if (dmg.active) {
        dmg.update(time, delta);
      }
    }

    // 10. HUD
    this.hud.update();

    // 11. Minimap
    this.minimap.update();
  }

  private onLevelUp(level: number): void {
    this.audioManager.playLevelUp();

    // Level-up burst ring around player
    this.spawnLevelUpBurst(this.player.x, this.player.y, level);

    // Task 18: Check weapon evolution before showing level-up choices
    this.checkWeaponEvolutions();

    // Pause game and show level-up choices
    this.scene.launch('LevelUpScene', {
      weapons: this.weapons,
      player: this.player,
      onSelect: (choice: string) => {
        this.applyLevelUpChoice(choice);
        this.scene.resume('GameScene');
      }
    });
    this.scene.pause();
  }

  /** Task 18: Check all weapons for evolution conditions */
  private checkWeaponEvolutions(): void {
    for (const weapon of this.weapons) {
      if (weapon.isMaxLevel) {
        const evolution = getEvolution(weapon.data.id, this.player.passiveItems);
        if (evolution) {
          // Evolve: double damage and apply stat boost
          weapon.data.damage *= 2;
          weapon.data.id = evolution.resultId;
          weapon.data.name = evolution.resultName;

          // Update weaponIds
          const idx = this.player.weaponIds.indexOf(evolution.weaponId);
          if (idx !== -1) {
            this.player.weaponIds[idx] = evolution.resultId;
          }

          // Show evolution announcement
          this.showEvolutionAnnouncement(evolution.resultName);
        }
      }
    }
  }

  /** Task 18: Show "EVOLUTION!" announcement */
  private showEvolutionAnnouncement(weaponName: string): void {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'EVRİM!', {
      fontSize: '56px',
      fontFamily: 'monospace',
      color: '#ffcc00',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(350);
    text.setAlpha(0);

    const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, weaponName, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffdd44'
    });
    subText.setOrigin(0.5, 0.5);
    subText.setScrollFactor(0);
    subText.setDepth(350);
    subText.setAlpha(0);

    this.tweens.add({
      targets: [text, subText],
      alpha: 1,
      duration: 300,
      ease: 'Power1',
      onComplete: () => {
        this.tweens.add({
          targets: [text, subText],
          alpha: 0,
          duration: 400,
          delay: 2000,
          ease: 'Power1',
          onComplete: () => {
            text.destroy();
            subText.destroy();
          }
        });
      }
    });
  }

  private applyLevelUpChoice(choice: string): void {
    // Check if it's an existing weapon upgrade
    const existingWeapon = this.weapons.find(w => w.data.id === choice);
    if (existingWeapon && !existingWeapon.isMaxLevel) {
      existingWeapon.levelUp();
      return;
    }

    // New weapon via unified helper
    this.addWeaponById(choice);
  }

  private onWaveComplete(): void {
    // Wave-end heal: recover 10% max HP
    const healAmt = Math.floor(this.player.stats.maxHp * 0.10);
    const healed = Math.min(healAmt, this.player.stats.maxHp - this.player.currentHp);
    if (healed > 0) {
      this.player.currentHp += healed;
      this.showHealText(this.player.x, this.player.y, healed);
    }

    // A3: Clear all enemies, projectiles, and XP gems for a clean slate
    this.clearAllEntities();

    if (this.waveManager.isLastWave) {
      // Victory! Task 25: Save highscore
      this.audioManager?.stopBGM();
      this.audioManager?.playVictory();
      const score = this.player.kills * 10 + this.waveManager.wave * 100;
      const previousHighScore = this.saveManager.saveData.highScore;
      this.saveManager.updateAfterRun(this.player.kills, score);
      this.saveManager.addGold(this.player.gold);
      this.scene.start('GameOverScene', {
        kills: this.player.kills,
        wave: this.waveManager.wave,
        gold: this.player.gold,
        victory: true,
        highScore: this.saveManager.saveData.highScore,
        previousHighScore,
        characterId: this.characterId
      });
      return;
    }

    // A4: Show "WAVE X COMPLETE!" then E3 stats, then open shop
    const completedWave = this.waveManager.wave;
    const nextWave = completedWave + 1;
    // Capture wave stats before reset
    const statsKills = this.waveKills;
    const statsDamage = this.waveDamageTaken;
    const statsGold = this.waveGoldEarned;

    this.showWaveCompleteAnnouncement(completedWave, () => {
      // E3: Show wave statistics overlay for 2 seconds, then open shop
      this.showWaveStatistics(statsKills, statsDamage, statsGold, () => {
        // Reset wave stats for next wave
        this.waveKills = 0;
        this.waveDamageTaken = 0;
        this.waveGoldEarned = 0;

        // Open shop between waves
        this.scene.launch('ShopScene', {
          player: this.player,
          wave: completedWave,
          onDone: () => {
            this.scene.resume('GameScene');
            // A4: Show "WAVE X+1 STARTING!" then start wave after 1.5s
            this.showWaveStartingAnnouncement(nextWave, () => {
              this.waveManager.startWave(nextWave);
              // BGM intensity scaling
              const intensity = nextWave >= 15 ? 3 : nextWave >= 10 ? 2 : nextWave >= 5 ? 1 : 0;
              this.audioManager.setIntensity(intensity);
            });
          }
        });
        this.scene.pause();
      });
    });
  }

  /** A3: Kill all active enemies, clear projectiles and XP gems */
  private clearAllEntities(): void {
    for (const enemy of this.allEnemies) {
      if (enemy.active) {
        enemy.die(); // ensure visual cleanup before pool release
        this.enemyPool.release(enemy);
      } else if (enemy.visible) {
        // Dying (in death animation) — force-complete immediately
        this.tweens.killTweensOf(enemy);
        enemy.die();
      }
    }
    for (const proj of this.allProjectiles) {
      if (proj.active) {
        this.projectilePool.release(proj);
      }
    }
    for (const gem of this.allXPGems) {
      if (gem.active) {
        this.xpGemPool.release(gem);
      }
    }
    for (const coin of this.allGoldCoins) {
      if (coin.active) {
        this.goldCoinPool.release(coin);
      }
    }
  }

  /** A2: Show pulsing red/orange warning circles at spawn positions */
  private showSpawnWarnings(positions: { x: number; y: number }[]): void {
    for (const pos of positions) {
      const warning = this.add.graphics();
      warning.setDepth(5);

      let pulseCount = 0;
      const maxPulses = 3;
      const pulseDuration = 1000 / maxPulses; // ~333ms per pulse

      const doPulse = (): void => {
        if (pulseCount >= maxPulses) {
          warning.destroy();
          return;
        }
        pulseCount++;

        warning.clear();
        warning.lineStyle(2, 0xff4400, 0.8);
        warning.strokeCircle(pos.x, pos.y, 5);

        this.tweens.add({
          targets: warning,
          scaleX: 3,
          scaleY: 3,
          alpha: 0.2,
          duration: pulseDuration * 0.8,
          ease: 'Sine.easeOut',
          onComplete: () => {
            warning.setScale(1);
            warning.setAlpha(1);
            doPulse();
          }
        });
      };

      doPulse();
    }
  }

  /** A4: Show "WAVE X COMPLETE!" announcement, then call callback after 2 seconds */
  private showWaveCompleteAnnouncement(waveNumber: number, onDone: () => void): void {
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `DALGA ${waveNumber} TAMAM!`, {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#33ff33',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(300);
    text.setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 300,
      ease: 'Power1',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          alpha: 0,
          duration: 300,
          delay: 1700,
          ease: 'Power1',
          onComplete: () => {
            text.destroy();
            onDone();
          }
        });
      }
    });
  }

  /** E3: Show wave end statistics overlay, auto-dismiss after 2 seconds */
  private showWaveStatistics(kills: number, damageTaken: number, goldEarned: number, onDone: () => void): void {
    // Performance rating
    const ratingScore = kills * 10 - damageTaken;
    let rating: string; let ratingColor: string;
    if (ratingScore >= 400)      { rating = 'S'; ratingColor = '#ffcc00'; }
    else if (ratingScore >= 200) { rating = 'A'; ratingColor = '#33ff33'; }
    else if (ratingScore >= 50)  { rating = 'B'; ratingColor = '#33ccff'; }
    else if (ratingScore >= -50) { rating = 'C'; ratingColor = '#ffaa33'; }
    else                          { rating = 'D'; ratingColor = '#ff4444'; }

    // Dark background panel
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 300, 185, 0x000000, 0.82);
    bg.setScrollFactor(0).setDepth(301).setOrigin(0.5, 0.5);

    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 68, 'DALGA İSTATİSTİKLERİ', {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(302);

    // Rating
    const ratingText = this.add.text(GAME_WIDTH / 2 + 100, GAME_HEIGHT / 2 - 20, rating, {
      fontSize: '52px', fontFamily: 'monospace', color: ratingColor, fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(302);

    const killsText = this.add.text(GAME_WIDTH / 2 - 20, GAME_HEIGHT / 2 - 30, `Öldürülen Düşman: ${kills}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#ffffff'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(302);

    const damageText = this.add.text(GAME_WIDTH / 2 - 20, GAME_HEIGHT / 2 - 8, `Alınan Hasar: ${damageTaken}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#ff6666'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(302);

    const goldText = this.add.text(GAME_WIDTH / 2 - 20, GAME_HEIGHT / 2 + 14, `Kazanılan Altın: ${goldEarned}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#ffcc00'
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(302);

    const elements = [bg, titleText, killsText, damageText, goldText, ratingText];

    // Fade in
    for (const el of elements) el.setAlpha(0);
    this.tweens.add({
      targets: elements,
      alpha: 1,
      duration: 200,
      ease: 'Power1',
      onComplete: () => {
        // Hold for 2 seconds then fade out
        this.tweens.add({
          targets: elements,
          alpha: 0,
          duration: 300,
          delay: 1700,
          ease: 'Power1',
          onComplete: () => {
            for (const el of elements) el.destroy();
            onDone();
          }
        });
      }
    });
  }

  /** A4: Show "WAVE X STARTING!" announcement, then call callback after 1.5 seconds */
  private showWaveStartingAnnouncement(waveNumber: number, onDone: () => void): void {
    const isBossWave = waveNumber % 5 === 0;
    const color = isBossWave ? '#ff3333' : '#ffcc00';

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - (isBossWave ? 20 : 0), `DALGA ${waveNumber} BAŞLIYOR!`, {
      fontSize: '42px',
      fontFamily: 'monospace',
      color,
      fontStyle: 'bold'
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(300);
    text.setAlpha(0);

    const elements: Phaser.GameObjects.GameObject[] = [text];

    if (isBossWave) {
      const subText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 28, '⚠ BOSS YAKLAŞIYOR ⚠', {
        fontSize: '22px', fontFamily: 'monospace', color: '#ff9900', fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
      elements.push(subText);
    }

    this.tweens.add({
      targets: elements,
      alpha: 1,
      duration: 300,
      ease: 'Power1',
      onComplete: () => {
        this.tweens.add({
          targets: elements,
          alpha: 0,
          duration: 300,
          delay: 1200,
          ease: 'Power1',
          onComplete: () => {
            for (const el of elements) (el as Phaser.GameObjects.Text).destroy();
            onDone();
          }
        });
      }
    });
  }

  /** Task 8: Spawn death particles at enemy position */
  private spawnDeathParticles(x: number, y: number, enemyId: string): void {
    const colorMap: Record<string, number> = {
      skeleton: 0x999999,
      bat: 0x8B4513,
      vampire: 0xff0000,
      ghost: 0x4444ff,
      boss_necromancer: 0x9900cc,
      archer: 0x226622
    };
    const color = colorMap[enemyId] ?? 0xffffff;
    const isBoss = enemyId === 'boss_necromancer';
    const count = isBoss ? 24 : (6 + Math.floor(Math.random() * 3));
    const speedMax = isBoss ? 220 : 200;
    const duration = isBoss ? 700 : 400;

    for (let i = 0; i < count; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      const size = isBoss ? (3 + Math.random() * 5) : (2 + Math.random() * 3);
      particle.fillRect(-size / 2, -size / 2, size, size);
      particle.setPosition(x, y);
      particle.setDepth(10);

      const angle = Math.random() * Math.PI * 2;
      const speed = (isBoss ? 100 : 80) + Math.random() * speedMax;
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed;

      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }

    // Boss: ekstra parlama halkası
    if (isBoss) {
      const ring = this.add.graphics().setDepth(12);
      let elapsed = 0;
      const tick = (_t: number, delta: number) => {
        elapsed += delta;
        const t = Math.min(elapsed / 600, 1);
        ring.clear();
        ring.lineStyle(4, 0xff00cc, (1 - t) * 0.9);
        ring.strokeCircle(x, y, 20 + 80 * t);
        if (t >= 1) { this.events.off('update', tick); ring.destroy(); }
      };
      this.events.on('update', tick);
      this.cameras.main.shake(400, 0.015);
    }
  }

  /** Seviye atlama patlama efekti */
  private spawnLevelUpBurst(x: number, y: number, level: number): void {
    // 3 genişleyen halka
    for (let ring = 0; ring < 3; ring++) {
      const delay = ring * 80;
      const gfx = this.add.graphics().setDepth(12);
      const startRadius = 10 + ring * 8;
      const endRadius = 70 + ring * 20;
      let elapsed = 0;
      const duration = 500;

      const tick = (_t: number, delta: number) => {
        elapsed += delta;
        const t = Math.min(elapsed / duration, 1);
        const r = startRadius + (endRadius - startRadius) * t;
        const alpha = (1 - t) * 0.85;
        gfx.clear();
        gfx.lineStyle(3 - ring, 0xffee44, alpha);
        gfx.strokeCircle(x, y, r);
        if (t >= 1) {
          this.events.off('update', tick);
          gfx.destroy();
        }
      };

      this.time.delayedCall(delay, () => {
        this.events.on('update', tick);
      });
    }

    // Altın parçacıklar
    const count = 8 + level * 2;
    for (let i = 0; i < count; i++) {
      const p = this.add.graphics().setDepth(13);
      p.fillStyle(0xffdd00, 1);
      p.fillRect(-2, -2, 4, 4);
      p.setPosition(x, y);
      const angle = (i / count) * Math.PI * 2;
      const dist = 50 + Math.random() * 60;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }
  }

  /** Mermi arkası trail efekti */
  private spawnProjectileTrail(x: number, y: number, rot: number): void {
    const trail = this.add.rectangle(x, y, 10, 3, 0xffdd88, 0.45);
    trail.setRotation(rot);
    trail.setDepth(7);
    this.tweens.add({
      targets: trail,
      alpha: 0,
      scaleX: 0.2,
      duration: 130,
      ease: 'Power1',
      onComplete: () => trail.destroy()
    });
  }

  /** Mermi çarpma kıvılcımı */
  private spawnHitSpark(x: number, y: number, isCrit: boolean): void {
    const count = isCrit ? 5 : 3;
    const color = isCrit ? 0xffcc00 : 0xff6622;
    for (let i = 0; i < count; i++) {
      const spark = this.add.graphics().setDepth(11);
      spark.fillStyle(color, 1);
      spark.fillRect(-1.5, -1.5, 3, 3);
      spark.setPosition(x, y);
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: isCrit ? 280 : 180,
        ease: 'Power2',
        onComplete: () => spark.destroy()
      });
    }
  }

  /** Task 10: Show floating gold text */
  private showGoldPickupText(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y - 10, `+${amount}g`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffcc00',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(100);

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Power1',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /** Task 11: Show crit flash at hit position */
  private showCritFlash(x: number, y: number): void {
    const flash = this.add.circle(x, y, 12, 0xffffff, 0.8);
    flash.setDepth(9);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /** Task 16: Show wave announcement text with fade in/out */
  private showWaveAnnouncement(waveNumber: number): void {
    const isBossWave = waveNumber % 5 === 0;
    const color = isBossWave ? '#ff3333' : '#ffffff';

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `DALGA ${waveNumber}`, {
      fontSize: '48px',
      fontFamily: 'monospace',
      color,
      fontStyle: 'bold'
    });
    text.setOrigin(0.5, 0.5);
    text.setScrollFactor(0);
    text.setDepth(300);
    text.setAlpha(0);

    // Fade in
    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 300,
      ease: 'Power1',
      onComplete: () => {
        // Hold for 1.5s then fade out
        this.tweens.add({
          targets: text,
          alpha: 0,
          duration: 300,
          delay: 1500,
          ease: 'Power1',
          onComplete: () => {
            text.destroy();
          }
        });
      }
    });
  }

  /** Task 20: Show floating combo text */
  private showComboText(x: number, y: number, combo: number): void {
    const text = this.add.text(x, y - 20, `KOMBO x${combo}!`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ff6600',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(100);

    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power1',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /** Task 23: Spawn a health potion at position */
  private spawnHealthPotion(x: number, y: number): void {
    const potionText = this.add.text(x, y - 5, '+', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#33ff33',
      fontStyle: 'bold'
    });
    potionText.setOrigin(0.5, 0.5);
    potionText.setDepth(15);

    // Float up gently to indicate pickup area
    this.tweens.add({
      targets: potionText,
      y: y - 15,
      duration: 500,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut'
    });

    // Check proximity to player each frame for 4 seconds
    const checkEvent = this.time.addEvent({
      delay: 50,
      repeat: 80,
      callback: () => {
        if (!potionText.active) return;
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          potionText.x, potionText.y
        );
        if (dist < this.player.stats.pickupRange) {
          // Heal player
          this.player.heal(15);
          // Show heal text
          this.showHealText(this.player.x, this.player.y, 15);
          potionText.destroy();
          checkEvent.destroy();
        }
      }
    });

    // Auto-destroy after 4 seconds if not picked up
    this.time.delayedCall(4000, () => {
      if (potionText.active) {
        this.tweens.add({
          targets: potionText,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            potionText.destroy();
          }
        });
      }
    });
  }

  /** Pasif yetenek tetiklendiğinde yukarı kayan bildirim */
  private showPassiveTrigger(label: string, color: string): void {
    const text = this.add.text(this.player.x, this.player.y - 40, label, {
      fontSize: '13px', fontFamily: 'monospace', color, fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(301).setScrollFactor(1);
    this.tweens.add({
      targets: text,
      y: this.player.y - 80,
      alpha: 0,
      duration: 900,
      ease: 'Power1',
      onComplete: () => text.destroy()
    });
  }

  /** Task 23: Show green heal floating text */
  private showHealText(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y - 10, `+${amount} HP`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#33ff33',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(100);

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Power1',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  private getDifficultyMultipliers(difficulty: string): { enemyHpMult: number; enemyDamageMult: number; playerDamageMult: number } {
    switch (difficulty) {
      case 'easy': return { enemyHpMult: 0.7, enemyDamageMult: 0.5, playerDamageMult: 1.5 };
      case 'hard': return { enemyHpMult: 1.5, enemyDamageMult: 1.5, playerDamageMult: 0.8 };
      default:     return { enemyHpMult: 1.0, enemyDamageMult: 1.0, playerDamageMult: 1.0 };
    }
  }

  private showPlayerDeath(): void {
    const px = this.player.x;
    const py = this.player.y;

    // Oyuncuyu gizle
    this.player.setVisible(false);

    // Kırmızı patlama parçacıkları
    for (let i = 0; i < 16; i++) {
      const p = this.add.graphics().setDepth(20);
      p.fillStyle(i % 2 === 0 ? 0xff2200 : 0xff8800, 1);
      const size = 3 + Math.random() * 5;
      p.fillRect(-size / 2, -size / 2, size, size);
      p.setPosition(px, py);
      const angle = (i / 16) * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      this.tweens.add({
        targets: p,
        x: px + Math.cos(angle) * dist,
        y: py + Math.sin(angle) * dist,
        alpha: 0,
        duration: 700,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }

    // Genişleyen kırmızı halka
    const ring = this.add.graphics().setDepth(19);
    let elapsed = 0;
    const ringTick = (_t: number, delta: number) => {
      elapsed += delta;
      const t = Math.min(elapsed / 600, 1);
      ring.clear();
      ring.lineStyle(4, 0xff0000, (1 - t) * 0.9);
      ring.strokeCircle(px, py, 15 + 70 * t);
      if (t >= 1) { this.events.off('update', ringTick); ring.destroy(); }
    };
    this.events.on('update', ringTick);

    // Kamera sarsıntısı
    this.cameras.main.shake(500, 0.02);

    // Ekran kırmızıya soluklan
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0)
      .setScrollFactor(0).setDepth(500);
    this.tweens.add({
      targets: overlay,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => overlay.destroy()
    });

    // 1.2 saniye sonra gameOver
    this.time.delayedCall(1200, () => {
      this.gameOver();
    });
  }

  private gameOver(): void {
    this.audioManager?.stopBGM();
    // Task 25: Save highscore
    const score = this.player.kills * 10 + this.waveManager.wave * 100;
    const previousHighScore = this.saveManager.saveData.highScore;
    this.saveManager.updateAfterRun(this.player.kills, score);
    this.saveManager.addGold(this.player.gold);
    this.scene.start('GameOverScene', {
      kills: this.player.kills,
      wave: this.waveManager.wave,
      gold: this.player.gold,
      victory: false,
      highScore: this.saveManager.saveData.highScore,
      previousHighScore,
      characterId: this.characterId
    });
  }
}
