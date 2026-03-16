import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { SaveManager } from '../systems/SaveManager';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const saveManager = new SaveManager();
    const currentDifficulty = saveManager.difficulty;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0014);

    this.add.text(GAME_WIDTH / 2, 60, 'AYARLAR', {
      fontSize: '42px', fontFamily: 'monospace', color: '#ff3333', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // ─── Zorluk Seviyesi ────────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 115, 'Zorluk Seviyesi', {
      fontSize: '18px', fontFamily: 'monospace', color: '#cccccc'
    }).setOrigin(0.5, 0.5);

    const difficulties: { id: 'easy' | 'normal' | 'hard'; label: string; line1: string; color: string }[] = [
      { id: 'easy',   label: 'KOLAY',  line1: 'Düşman ×0.5 hasar / ×0.7 can  |  Oyuncu ×1.5 hasar', color: '#33ff33' },
      { id: 'normal', label: 'NORMAL', line1: 'Standart oyun dengesi',                                 color: '#ffcc00' },
      { id: 'hard',   label: 'ZOR',    line1: 'Düşman ×1.5 hasar / ×1.5 can  |  Oyuncu ×0.8 hasar',  color: '#ff3333' }
    ];

    difficulties.forEach((diff, i) => {
      const y = 185 + i * 75;
      const isSelected = diff.id === currentDifficulty;

      const btnBg = this.add.rectangle(GAME_WIDTH / 2, y, 420, 60, isSelected ? 0x2a1a4e : 0x110a1e)
        .setStrokeStyle(isSelected ? 3 : 1, isSelected ? 0xffcc00 : 0x553366)
        .setInteractive({ useHandCursor: true });

      const labelText = this.add.text(GAME_WIDTH / 2, y - 10, diff.label, {
        fontSize: '18px', fontFamily: 'monospace',
        color: isSelected ? '#ffcc00' : diff.color,
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);

      this.add.text(GAME_WIDTH / 2, y + 12, diff.line1, {
        fontSize: '10px', fontFamily: 'monospace', color: '#777777'
      }).setOrigin(0.5, 0.5);

      if (isSelected) {
        this.add.text(GAME_WIDTH / 2 - 170, y - 10, '▶', {
          fontSize: '14px', fontFamily: 'monospace', color: '#ffcc00'
        }).setOrigin(0.5, 0.5);
      }

      btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2a1a3e); labelText.setColor('#ffffff'); });
      btnBg.on('pointerout',  () => { btnBg.setFillStyle(isSelected ? 0x2a1a4e : 0x110a1e); labelText.setColor(isSelected ? '#ffcc00' : diff.color); });
      btnBg.on('pointerdown', () => { saveManager.setDifficulty(diff.id); this.scene.restart(); });
    });

    // ─── Müzik Ses Seviyesi ─────────────────────────────────────────────────────
    const volumeY = 440;
    this.add.text(GAME_WIDTH / 2, volumeY - 35, 'Müzik Ses Seviyesi', {
      fontSize: '18px', fontFamily: 'monospace', color: '#cccccc'
    }).setOrigin(0.5, 0.5);

    const steps = [0, 0.25, 0.5, 0.75, 1.0];
    const stepLabels = ['KAPALI', '%25', '%50', '%75', '%100'];
    const currentVolume = saveManager.musicVolume;
    // En yakın adımı bul
    let currentStep = steps.reduce((best, s, i) =>
      Math.abs(s - currentVolume) < Math.abs(steps[best] - currentVolume) ? i : best, 0);

    const btnW = 74;
    const btnH = 44;
    const totalW = steps.length * btnW + (steps.length - 1) * 6;
    const startX = GAME_WIDTH / 2 - totalW / 2 + btnW / 2;

    const volBtns: Phaser.GameObjects.Rectangle[] = [];
    const volTexts: Phaser.GameObjects.Text[] = [];

    const refreshVolBtns = () => {
      volBtns.forEach((b, i) => {
        const selected = i === currentStep;
        b.setFillStyle(selected ? 0x1a3a6e : 0x110a1e);
        b.setStrokeStyle(selected ? 2 : 1, selected ? 0x44aaff : 0x334466);
        volTexts[i].setColor(selected ? '#44aaff' : '#556688');
      });
    };

    steps.forEach((vol, i) => {
      const bx = startX + i * (btnW + 6);
      const selected = i === currentStep;

      const btn = this.add.rectangle(bx, volumeY, btnW, btnH, selected ? 0x1a3a6e : 0x110a1e)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0x44aaff : 0x334466)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(bx, volumeY, stepLabels[i], {
        fontSize: '11px', fontFamily: 'monospace',
        color: selected ? '#44aaff' : '#556688'
      }).setOrigin(0.5, 0.5);

      // Ses ikonu (sadece KAPALI'da X işareti)
      if (i === 0) {
        this.add.text(bx, volumeY - 13, '🔇', { fontSize: '12px' }).setOrigin(0.5, 0.5);
      } else {
        const bars = i;
        let barStr = '';
        for (let b = 0; b < 4; b++) barStr += b < bars ? '█' : '░';
        this.add.text(bx, volumeY - 13, barStr, {
          fontSize: '9px', fontFamily: 'monospace',
          color: selected ? '#44aaff' : '#334466'
        }).setOrigin(0.5, 0.5);
      }

      volBtns.push(btn);
      volTexts.push(txt);

      btn.on('pointerover', () => { if (i !== currentStep) btn.setFillStyle(0x1a2a4e); });
      btn.on('pointerout',  () => refreshVolBtns());
      btn.on('pointerdown', () => {
        currentStep = i;
        saveManager.setMusicVolume(vol);
        refreshVolBtns();
      });
    });

    // ─── Geri Dön ────────────────────────────────────────────────────────────────
    const backText = this.add.text(GAME_WIDTH / 2, 520, '[ GERİ DÖN ]', {
      fontSize: '20px', fontFamily: 'monospace', color: '#8866aa'
    }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    backText.on('pointerover', () => backText.setColor('#ffffff'));
    backText.on('pointerout',  () => backText.setColor('#8866aa'));
    backText.on('pointerdown', () => this.scene.start('MainMenuScene'));

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }
}
