import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { SaveManager } from '../systems/SaveManager';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0014);

    // Floating particles (atmospheric)
    const particleGfx = this.add.graphics().setDepth(0);
    interface Particle { x: number; y: number; speed: number; alpha: number; size: number; color: number }
    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        speed: 0.2 + Math.random() * 0.6,
        alpha: 0.1 + Math.random() * 0.4,
        size: 0.5 + Math.random() * 2,
        color: Math.random() < 0.5 ? 0xff2200 : 0x6633cc
      });
    }
    this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        particleGfx.clear();
        for (const p of particles) {
          p.y -= p.speed;
          p.x += Math.sin(p.y * 0.02) * 0.4;
          if (p.y < -4) { p.y = GAME_HEIGHT + 4; p.x = Math.random() * GAME_WIDTH; }
          particleGfx.fillStyle(p.color, p.alpha);
          particleGfx.fillCircle(p.x, p.y, p.size);
        }
      }
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 120, 'ŞAFAK\nYOK', {
      fontSize: '56px', fontFamily: 'monospace', color: '#ff3333', align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 220, 'Karanlık Arena Sizi Bekliyor', {
      fontSize: '18px', fontFamily: 'monospace', color: '#8866aa'
    }).setOrigin(0.5, 0.5);

    // Devam kaydı kontrolü
    const saveManager = new SaveManager();
    const hasRun = saveManager.hasRun;
    const runData = hasRun ? saveManager.loadRun() : null;

    // Buton Y pozisyonlarını devam kaydına göre ayarla
    const btnWidth = 300;
    const btnHeight = 50;
    const startBtnY = hasRun ? 290 : 330;

    // Start button
    const btnBg = this.add.rectangle(GAME_WIDTH / 2, startBtnY, btnWidth, btnHeight, 0x2a1a3e)
      .setStrokeStyle(2, 0x6644aa)
      .setInteractive({ useHandCursor: true });

    const startText = this.add.text(GAME_WIDTH / 2, startBtnY, '[ YENİ OYUN ]', {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    const startGame = () => {
      this.scene.start('CharacterSelectScene');
    };

    btnBg.on('pointerover', () => {
      startText.setColor('#ffcc00');
      btnBg.setFillStyle(0x3a2a4e);
      btnBg.setStrokeStyle(3, 0xffcc00);
    });
    btnBg.on('pointerout', () => {
      startText.setColor('#ffffff');
      btnBg.setFillStyle(0x2a1a3e);
      btnBg.setStrokeStyle(2, 0x6644aa);
    });
    btnBg.on('pointerdown', startGame);

    // Devam Et butonu (kayıt varsa)
    if (hasRun && runData) {
      const continueBtnY = startBtnY + 62;
      const continueBg = this.add.rectangle(GAME_WIDTH / 2, continueBtnY, btnWidth, btnHeight, 0x0a2a1a)
        .setStrokeStyle(2, 0x33cc66)
        .setInteractive({ useHandCursor: true });

      const characterName = runData.characterId === 'tarik' ? 'Tarık' : 'Mumin';
      const continueText = this.add.text(GAME_WIDTH / 2, continueBtnY - 4,
        `[ DEVAM ET ]`, {
        fontSize: '20px', fontFamily: 'monospace', color: '#33ff88'
      }).setOrigin(0.5, 0.5);

      this.add.text(GAME_WIDTH / 2, continueBtnY + 12,
        `${characterName} • Dalga ${runData.wave + 1}/${10}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#559966'
      }).setOrigin(0.5, 0.5);

      continueBg.on('pointerover', () => {
        continueText.setColor('#ffffff');
        continueBg.setFillStyle(0x1a3a2a);
        continueBg.setStrokeStyle(3, 0x55ff99);
      });
      continueBg.on('pointerout', () => {
        continueText.setColor('#33ff88');
        continueBg.setFillStyle(0x0a2a1a);
        continueBg.setStrokeStyle(2, 0x33cc66);
      });
      continueBg.on('pointerdown', () => {
        this.scene.start('GameScene', { characterId: runData.characterId, resumeRun: true });
      });
    }

    // Settings button
    const settingsBtnY = hasRun ? 420 : 400;
    const settingsBtnBg = this.add.rectangle(GAME_WIDTH / 2, settingsBtnY, 300, 50, 0x1a0a2e)
      .setStrokeStyle(2, 0x443366)
      .setInteractive({ useHandCursor: true });

    const settingsText = this.add.text(GAME_WIDTH / 2, settingsBtnY, '[ AYARLAR ]', {
      fontSize: '20px', fontFamily: 'monospace', color: '#8866aa'
    }).setOrigin(0.5, 0.5);

    settingsBtnBg.on('pointerover', () => {
      settingsText.setColor('#ffffff');
      settingsBtnBg.setFillStyle(0x2a1a3e);
      settingsBtnBg.setStrokeStyle(2, 0x8866aa);
    });
    settingsBtnBg.on('pointerout', () => {
      settingsText.setColor('#8866aa');
      settingsBtnBg.setFillStyle(0x1a0a2e);
      settingsBtnBg.setStrokeStyle(2, 0x443366);
    });
    settingsBtnBg.on('pointerdown', () => this.scene.start('SettingsScene'));

    // Controls info (sadece devam kaydı yoksa göster — alan kısıtlı)
    if (!hasRun) {
      this.add.text(GAME_WIDTH / 2, 472, 'WASD / Ok Tuşları ile Hareket', {
        fontSize: '14px', fontFamily: 'monospace', color: '#666666'
      }).setOrigin(0.5, 0.5);
      this.add.text(GAME_WIDTH / 2, 496, 'ENTER veya BOŞLUK ile başlat', {
        fontSize: '14px', fontFamily: 'monospace', color: '#666666'
      }).setOrigin(0.5, 0.5);
    }

    // Keyboard start
    this.input.keyboard?.once('keydown-ENTER', startGame);
    this.input.keyboard?.once('keydown-SPACE', startGame);

    // Task 25: Display high score and total kills from save data
    const saveData = saveManager.saveData;

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 75, `En Yüksek Skor: ${saveData.highScore}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888'
    }).setOrigin(0.5, 0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 54, `Toplam Öldürme: ${saveData.totalKills}   Toplam Oyun: ${saveData.totalRuns}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#666666'
    }).setOrigin(0.5, 0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 33, `Banka Altını: ${saveData.gold}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aa8800'
    }).setOrigin(0.5, 0.5);

    // Studio label
    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'Blakfy Studio', {
      fontSize: '11px', fontFamily: 'monospace', color: '#443355'
    }).setOrigin(1, 1);

    // Blinking effect
    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }
}
