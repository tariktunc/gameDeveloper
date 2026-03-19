import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { XPSystem } from '../systems/XPSystem';
import { WaveManager } from '../systems/WaveManager';
import { WeaponBase } from '../weapons/WeaponBase';
import { GameScene } from '../scenes/GameScene';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_HP_BAR, COLOR_HP_BG, COLOR_XP_BAR } from '../utils/constants';

/** E4: Color mapping for weapon types */
const WEAPON_TYPE_COLORS: Record<string, number> = {
  projectile: 0x3399ff,  // blue for ranged
  melee: 0xff8833,       // orange for melee
  aura: 0x33cc33,        // green for aura
  area: 0x33cccc         // cyan for area
};

/** E4: Name abbreviations for weapon slots */
const WEAPON_ABBREVIATIONS: Record<string, string> = {
  knife: 'BÇK',
  garlic: 'SRM',
  whip: 'KRB',
  holy_water: 'KSU',
  cross_boomerang: 'HÇB'
};

export class HUD {
  private scene: Phaser.Scene;
  private player: Player;
  private enemies: Enemy[];
  private xpSystem: XPSystem;
  private waveManager: WaveManager;
  private weapons: WeaponBase[];

  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private waveText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;

  // E2: Enemy count
  private enemyCountText!: Phaser.GameObjects.Text;

  // Task 14: Dash cooldown
  private dashBarBg!: Phaser.GameObjects.Rectangle;
  private dashBarFill!: Phaser.GameObjects.Rectangle;
  private dashLabel!: Phaser.GameObjects.Text;

  // E4: Weapon slot UI elements
  private weaponSlotGraphics!: Phaser.GameObjects.Graphics;
  private weaponSlotTexts: Phaser.GameObjects.Text[] = [];
  private weaponSlotLevelTexts: Phaser.GameObjects.Text[] = [];
  private lastWeaponCount: number = 0;

  // Task 20: Combo counter
  private comboText!: Phaser.GameObjects.Text;

  // Running score
  private scoreText!: Phaser.GameObjects.Text;

  // Boss HP bar
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossBarLabel!: Phaser.GameObjects.Text;
  private bossBarName!: Phaser.GameObjects.Text;

  // Off-screen boss arrow
  private bossArrowGraphics!: Phaser.GameObjects.Graphics;

  // Wave progress bar
  private waveProgressBg!: Phaser.GameObjects.Rectangle;
  private waveProgressFill!: Phaser.GameObjects.Rectangle;

  // Low HP overlay
  private lowHpOverlay!: Phaser.GameObjects.Rectangle;
  private lowHpPulseTime: number = 0;

  private barWidth = 120;
  private barHeight = 10;

  constructor(scene: Phaser.Scene, player: Player, xpSystem: XPSystem, waveManager: WaveManager, weapons: WeaponBase[], enemies: Enemy[]) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.xpSystem = xpSystem;
    this.waveManager = waveManager;
    this.weapons = weapons;

    this.create();
  }

  private create(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff'
    };

    // HP bar (top-left)
    this.hpBarBg = this.scene.add.rectangle(10, 10, this.barWidth, this.barHeight, COLOR_HP_BG)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(200);
    this.hpBarFill = this.scene.add.rectangle(10, 10, this.barWidth, this.barHeight, COLOR_HP_BAR)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(201);

    // XP bar (below HP)
    this.xpBarBg = this.scene.add.rectangle(10, 24, this.barWidth, 6, 0x222222)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(200);
    this.xpBarFill = this.scene.add.rectangle(10, 24, this.barWidth, 6, COLOR_XP_BAR)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(201);

    // Level text
    this.levelText = this.scene.add.text(10, 34, 'Lv.1', textStyle)
      .setScrollFactor(0).setDepth(201);

    // Task 14: Dash cooldown bar (below level text)
    const dashY = 54;
    this.dashLabel = this.scene.add.text(10, dashY - 2, 'KOŞU', {
      fontSize: '10px', fontFamily: 'monospace', color: '#33ccff'
    }).setScrollFactor(0).setDepth(201);

    this.dashBarBg = this.scene.add.rectangle(50, dashY, 40, 4, 0x222222)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(200);
    this.dashBarFill = this.scene.add.rectangle(50, dashY, 40, 4, 0x33ccff)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(201);

    // Wave text (top-center)
    this.waveText = this.scene.add.text(GAME_WIDTH / 2, 10, 'Dalga 1', textStyle)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);

    // Timer (below wave)
    this.timerText = this.scene.add.text(GAME_WIDTH / 2, 30, '0:30', textStyle)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);

    // Kills (top-right)
    this.killsText = this.scene.add.text(GAME_WIDTH - 10, 10, 'Öldürme: 0', textStyle)
      .setOrigin(1, 0).setScrollFactor(0).setDepth(201);

    // Gold (below kills)
    this.goldText = this.scene.add.text(GAME_WIDTH - 10, 30, 'Altın: 0', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffcc00'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(201);

    // E2: Enemy count (below gold)
    this.enemyCountText = this.scene.add.text(GAME_WIDTH - 10, 50, 'Düşman: 0', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff9999'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(201);

    // Task 20: Combo counter (below enemy count)
    this.comboText = this.scene.add.text(GAME_WIDTH - 10, 68, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ff6600', fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(201);

    // Running score (below combo)
    this.scoreText = this.scene.add.text(GAME_WIDTH - 10, 88, 'Skor: 0', {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(201);

    // Wave progress bar (top-center, below timer)
    this.waveProgressBg = this.scene.add.rectangle(GAME_WIDTH / 2, 48, 160, 4, 0x222222)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(200);
    this.waveProgressFill = this.scene.add.rectangle(GAME_WIDTH / 2 - 80, 48, 0, 4, 0x33aaff)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(201);

    // Low HP overlay (kırmızı kenar yanıp sönmesi)
    this.lowHpOverlay = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0)
      .setScrollFactor(0).setDepth(199).setOrigin(0.5, 0.5);

    // Boss HP bar (bottom-center, above weapon slots)
    const bossBarW = 300;
    const bossBarH = 14;
    const bossBarX = GAME_WIDTH / 2 - bossBarW / 2;
    const bossBarY = GAME_HEIGHT - 60;

    this.bossBarLabel = this.scene.add.text(GAME_WIDTH / 2, bossBarY - 14, 'PATRON', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff66cc', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(205).setVisible(false);

    this.bossBarName = this.scene.add.text(GAME_WIDTH / 2, bossBarY - 14, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff66cc'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(205).setVisible(false);

    this.bossBarBg = this.scene.add.rectangle(bossBarX, bossBarY, bossBarW, bossBarH, 0x330022)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(204).setVisible(false);

    this.bossBarFill = this.scene.add.rectangle(bossBarX, bossBarY, bossBarW, bossBarH, 0xff00aa)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(205).setVisible(false);

    // Boss off-screen arrow
    this.bossArrowGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(206);

    // E4: Weapon slot graphics
    this.weaponSlotGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(200);
    this.rebuildWeaponSlots();
  }

  /** E4: Rebuild weapon slot UI */
  private rebuildWeaponSlots(): void {
    // Destroy old texts
    for (const t of this.weaponSlotTexts) t.destroy();
    for (const t of this.weaponSlotLevelTexts) t.destroy();
    this.weaponSlotTexts = [];
    this.weaponSlotLevelTexts = [];

    const slotSize = 32;
    const gap = 4;
    const startX = 10;
    const startY = GAME_HEIGHT - slotSize - 10;

    for (let i = 0; i < this.weapons.length; i++) {
      const w = this.weapons[i];
      const x = startX + i * (slotSize + gap);

      // Abbreviation text
      const abbr = WEAPON_ABBREVIATIONS[w.data.id] ?? w.data.name.substring(0, 3).toUpperCase();
      const abbrText = this.scene.add.text(x + slotSize / 2, startY + slotSize / 2 - 4, abbr, {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(203);
      this.weaponSlotTexts.push(abbrText);

      // Level text
      const lvlText = this.scene.add.text(x + slotSize / 2, startY + slotSize / 2 + 8, `${w.level}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#cccccc'
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(203);
      this.weaponSlotLevelTexts.push(lvlText);
    }

    this.lastWeaponCount = this.weapons.length;
  }

  /** E4: Draw weapon slot rectangles and cooldown overlays */
  private drawWeaponSlots(): void {
    this.weaponSlotGraphics.clear();

    const slotSize = 32;
    const gap = 4;
    const startX = 10;
    const startY = GAME_HEIGHT - slotSize - 10;

    for (let i = 0; i < this.weapons.length; i++) {
      const w = this.weapons[i];
      const x = startX + i * (slotSize + gap);
      const typeColor = WEAPON_TYPE_COLORS[w.data.type] ?? 0x888888;

      // Slot background
      this.weaponSlotGraphics.fillStyle(0x111111, 0.8);
      this.weaponSlotGraphics.fillRect(x, startY, slotSize, slotSize);

      // Colored border
      this.weaponSlotGraphics.lineStyle(2, typeColor, 1);
      this.weaponSlotGraphics.strokeRect(x, startY, slotSize, slotSize);

      // Cooldown overlay (darkening from bottom up)
      const cdProgress = w.cooldownProgress;
      if (cdProgress > 0) {
        const cdHeight = slotSize * cdProgress;
        this.weaponSlotGraphics.fillStyle(0x000000, 0.6);
        this.weaponSlotGraphics.fillRect(x, startY + (slotSize - cdHeight), slotSize, cdHeight);
      }
    }
  }

  update(): void {
    // HP
    const hpPercent = this.player.hpPercent;
    this.hpBarFill.width = this.barWidth * hpPercent;
    // HP bar rengi: yeşil > sarı > kırmızı
    const hpColor = hpPercent > 0.5 ? COLOR_HP_BAR : hpPercent > 0.25 ? 0xff8800 : 0xff2200;
    this.hpBarFill.setFillStyle(hpColor);

    // XP
    const isMaxLevel = this.player.level >= 30;
    this.xpBarFill.width = isMaxLevel ? this.barWidth : this.barWidth * this.xpSystem.xpProgress;
    this.xpBarFill.setFillStyle(isMaxLevel ? 0xffcc00 : COLOR_XP_BAR);

    // Level
    const levelLabel = isMaxLevel ? 'MAX' : `Lv.${this.player.level}`;
    this.levelText.setText(`${levelLabel}  ${Math.ceil(this.player.currentHp)}/${this.player.stats.maxHp}`);

    // Wave
    this.waveText.setText(`Dalga ${this.waveManager.wave}`);

    // Timer
    const remaining = Math.ceil(this.waveManager.waveTimeRemaining / 1000);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

    // Kills
    this.killsText.setText(`Öldürme: ${this.player.kills}`);

    // Gold
    this.goldText.setText(`Altın: ${this.player.gold}`);

    // E2: Enemy count
    let activeEnemies = 0;
    for (const e of this.enemies) {
      if (e.active) activeEnemies++;
    }
    this.enemyCountText.setText(`Düşman: ${activeEnemies}`);

    // Task 14: Dash cooldown
    this.dashBarFill.width = 40 * this.player.dashCooldownProgress;

    // Task 20: Combo counter
    const gameScene = this.scene as GameScene;
    const combo = gameScene.getComboCount();
    if (combo >= 5) {
      this.comboText.setText(`Kombo x${combo}`);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }

    // Running score
    const score = this.player.kills * 10 + this.waveManager.wave * 100;
    this.scoreText.setText(`Skor: ${score}`);

    // Wave progress bar
    const wp = this.waveManager.waveProgress;
    this.waveProgressFill.width = 160 * wp;
    const waveColor = wp > 0.75 ? 0xff4400 : wp > 0.5 ? 0xffaa00 : 0x33aaff;
    this.waveProgressFill.setFillStyle(waveColor);

    // Low HP overlay pulse
    const hpPct = this.player.hpPercent;
    if (hpPct <= 0.25) {
      this.lowHpPulseTime += 16;
      const pulseAlpha = (Math.sin(this.lowHpPulseTime * 0.006) * 0.5 + 0.5) * 0.18;
      this.lowHpOverlay.setAlpha(pulseAlpha);
    } else {
      this.lowHpOverlay.setAlpha(0);
    }

    // Boss HP bar
    const boss = this.enemies.find(e => e.active && e.enemyData?.id === 'boss_necromancer');
    if (boss) {
      const bossHpPct = Math.max(0, boss.maxHpValue > 0 ? boss.currentHp / boss.maxHpValue : 1);
      const bossBarW = 300;
      this.bossBarBg.setVisible(true);
      this.bossBarFill.setVisible(true);
      this.bossBarLabel.setText(`⚠ BÜYÜCÜ  ${Math.ceil(boss.currentHp)} / ${boss.maxHpValue} ⚠`);
      this.bossBarLabel.setVisible(true);
      this.bossBarName.setVisible(false);
      this.bossBarFill.width = bossBarW * bossHpPct;
    } else {
      this.bossBarBg.setVisible(false);
      this.bossBarFill.setVisible(false);
      this.bossBarLabel.setVisible(false);
      this.bossBarName.setVisible(false);
    }

    // Off-screen boss arrow
    this.bossArrowGraphics.clear();
    if (boss) {
      const cam = this.scene.cameras.main;
      const screenX = boss.x - cam.scrollX;
      const screenY = boss.y - cam.scrollY;
      const margin = 20;
      const onScreen = screenX >= 0 && screenX <= GAME_WIDTH && screenY >= 0 && screenY <= GAME_HEIGHT;
      if (!onScreen) {
        // Clamp to screen edge and draw arrow
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const dx = screenX - cx;
        const dy = screenY - cy;
        const angle = Math.atan2(dy, dx);
        const edgeX = cx + Math.cos(angle) * (GAME_WIDTH / 2 - margin);
        const edgeY = cy + Math.sin(angle) * (GAME_HEIGHT / 2 - margin);
        const clampedX = Math.max(margin, Math.min(GAME_WIDTH - margin, edgeX));
        const clampedY = Math.max(margin, Math.min(GAME_HEIGHT - margin, edgeY));
        // Draw blinking triangle arrow
        const pulse = (Math.sin(Date.now() * 0.006) + 1) * 0.5;
        const arrowAlpha = 0.5 + pulse * 0.5;
        const arrowSize = 10;
        this.bossArrowGraphics.fillStyle(0xff00cc, arrowAlpha);
        this.bossArrowGraphics.fillTriangle(
          clampedX + Math.cos(angle) * arrowSize,
          clampedY + Math.sin(angle) * arrowSize,
          clampedX + Math.cos(angle + 2.4) * arrowSize * 0.7,
          clampedY + Math.sin(angle + 2.4) * arrowSize * 0.7,
          clampedX + Math.cos(angle - 2.4) * arrowSize * 0.7,
          clampedY + Math.sin(angle - 2.4) * arrowSize * 0.7
        );
        this.bossArrowGraphics.lineStyle(1.5, 0xffffff, arrowAlpha * 0.8);
        this.bossArrowGraphics.strokeTriangle(
          clampedX + Math.cos(angle) * arrowSize,
          clampedY + Math.sin(angle) * arrowSize,
          clampedX + Math.cos(angle + 2.4) * arrowSize * 0.7,
          clampedY + Math.sin(angle + 2.4) * arrowSize * 0.7,
          clampedX + Math.cos(angle - 2.4) * arrowSize * 0.7,
          clampedY + Math.sin(angle - 2.4) * arrowSize * 0.7
        );
      }
    }

    // E4: Weapon slots
    if (this.lastWeaponCount !== this.weapons.length) {
      this.rebuildWeaponSlots();
    } else {
      // Update level texts
      for (let i = 0; i < this.weapons.length; i++) {
        const w = this.weapons[i];
        this.weaponSlotLevelTexts[i].setText(`${w.level}`);
      }
    }
    this.drawWeaponSlots();
  }

  destroy(): void {
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.xpBarBg.destroy();
    this.xpBarFill.destroy();
    this.waveText.destroy();
    this.timerText.destroy();
    this.killsText.destroy();
    this.levelText.destroy();
    this.goldText.destroy();
    this.enemyCountText.destroy();
    this.dashBarBg.destroy();
    this.dashBarFill.destroy();
    this.dashLabel.destroy();
    this.comboText.destroy();
    this.scoreText.destroy();
    this.waveProgressBg.destroy();
    this.waveProgressFill.destroy();
    this.lowHpOverlay.destroy();
    this.bossBarBg.destroy();
    this.bossBarFill.destroy();
    this.bossBarLabel.destroy();
    this.bossBarName.destroy();
    this.bossArrowGraphics.destroy();
    this.weaponSlotGraphics.destroy();
    for (const t of this.weaponSlotTexts) t.destroy();
    for (const t of this.weaponSlotLevelTexts) t.destroy();
  }
}
