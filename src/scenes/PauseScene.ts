import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { SaveManager } from '../systems/SaveManager';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setScrollFactor(0);

    this.add.text(GAME_WIDTH / 2, 50, 'DURAKLATILDI', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // Player stats from GameScene
    const gameScene = this.scene.get('GameScene') as any;
    const player = gameScene?.player;
    if (player) {
      const s = player.stats;
      const statsLines = [
        `Can: ${Math.ceil(player.currentHp)} / ${s.maxHp}`,
        `Hız: ${s.speed}   Hasar: ×${s.damage.toFixed(1)}`,
        `Zırh: ${s.armor}   Şans: ×${s.luck.toFixed(1)}`,
        `Seviye: ${player.level}   Öldürme: ${player.kills}`,
      ];
      this.add.text(GAME_WIDTH / 2, 145, statsLines.join('\n'), {
        fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa', align: 'center', lineSpacing: 5
      }).setOrigin(0.5, 0.5);

      // Weapons list
      if (gameScene?.weapons?.length > 0) {
        const weaponLines = (gameScene.weapons as any[]).map((w: any) =>
          `${w.data.name}  Lv.${w.level}`
        );
        this.add.text(GAME_WIDTH / 2, 240, 'Silahlar:', {
          fontSize: '12px', fontFamily: 'monospace', color: '#33ccff'
        }).setOrigin(0.5, 0.5);
        this.add.text(GAME_WIDTH / 2, 270, weaponLines.join('\n'), {
          fontSize: '12px', fontFamily: 'monospace', color: '#aaddff', align: 'center', lineSpacing: 3
        }).setOrigin(0.5, 0.5);
      }
    }

    // ─── Ses Seviyesi ────────────────────────────────────────────────────────────
    const saveManager = new SaveManager();
    const audioManager = gameScene?.audioManager;

    this.add.text(GAME_WIDTH / 2, 320, 'Ses Seviyesi', {
      fontSize: '15px', fontFamily: 'monospace', color: '#cccccc'
    }).setOrigin(0.5, 0.5);

    const volSteps = [0, 0.25, 0.5, 0.75, 1.0];
    const volLabels = ['KAPALI', '%25', '%50', '%75', '%100'];
    const currentVol = audioManager ? audioManager.getVolume() : saveManager.musicVolume;
    let currentStep = volSteps.reduce((best, s, i) =>
      Math.abs(s - currentVol) < Math.abs(volSteps[best] - currentVol) ? i : best, 0);

    const btnW = 70;
    const btnH = 38;
    const totalW = volSteps.length * btnW + (volSteps.length - 1) * 5;
    const startX = GAME_WIDTH / 2 - totalW / 2 + btnW / 2;
    const volY = 355;

    const volBtns: Phaser.GameObjects.Rectangle[] = [];
    const volTexts: Phaser.GameObjects.Text[] = [];

    const refreshVolBtns = () => {
      volBtns.forEach((b, i) => {
        const sel = i === currentStep;
        b.setFillStyle(sel ? 0x1a3a6e : 0x110a1e);
        b.setStrokeStyle(sel ? 2 : 1, sel ? 0x44aaff : 0x334466);
        volTexts[i].setColor(sel ? '#44aaff' : '#556688');
      });
    };

    volSteps.forEach((vol, i) => {
      const bx = startX + i * (btnW + 5);
      const sel = i === currentStep;

      const btn = this.add.rectangle(bx, volY, btnW, btnH, sel ? 0x1a3a6e : 0x110a1e)
        .setStrokeStyle(sel ? 2 : 1, sel ? 0x44aaff : 0x334466)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(bx, volY, volLabels[i], {
        fontSize: '10px', fontFamily: 'monospace',
        color: sel ? '#44aaff' : '#556688'
      }).setOrigin(0.5, 0.5);

      volBtns.push(btn);
      volTexts.push(txt);

      btn.on('pointerover', () => { if (i !== currentStep) btn.setFillStyle(0x1a2a4e); });
      btn.on('pointerout', () => refreshVolBtns());
      btn.on('pointerdown', () => {
        currentStep = i;
        saveManager.setMusicVolume(vol);
        // Hemen oyundaki müziğe uygula
        audioManager?.setVolume(vol);
        refreshVolBtns();
      });
    });

    // ─── Butonlar ────────────────────────────────────────────────────────────────
    const resumeText = this.add.text(GAME_WIDTH / 2, 415, '[ DEVAM ET ]', {
      fontSize: '18px', fontFamily: 'monospace', color: '#33ff33'
    }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    resumeText.on('pointerover', () => resumeText.setColor('#ffffff'));
    resumeText.on('pointerout', () => resumeText.setColor('#33ff33'));
    resumeText.on('pointerdown', () => {
      this.scene.resume('GameScene');
      this.scene.stop();
    });

    const quitText = this.add.text(GAME_WIDTH / 2, 460, '[ ANA MENÜ ]', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ff3333'
    }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    quitText.on('pointerover', () => quitText.setColor('#ffffff'));
    quitText.on('pointerout', () => quitText.setColor('#ff3333'));
    quitText.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.start('MainMenuScene');
    });

    // ESC: geri dön / devam et
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.resume('GameScene');
      this.scene.stop();
    });
  }
}
