import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

const CHARACTER_NAMES: Record<string, string> = {
  tarik: 'Tarık',
  mumin: 'Mumin',
};

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: {
    kills: number; wave: number; gold: number; score?: number;
    victory: boolean; highScore?: number; previousHighScore?: number; characterId?: string
  }): void {
    const {
      kills = 0, wave = 1, gold = 0,
      victory = false, highScore = 0, previousHighScore = 0,
      characterId = 'tarik'
    } = data;
    const score = data.score ?? (kills * 10 + wave * 100);
    const isNewHighScore = score > previousHighScore;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0014);

    // Başlık
    const title = victory ? 'ZAFERİ KAZANDIN!' : 'OYUN BİTTİ';
    const titleColor = victory ? '#ffcc00' : '#ff3333';
    this.add.text(GAME_WIDTH / 2, 60, title, {
      fontSize: '40px', fontFamily: 'monospace', color: titleColor, fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    // Karakter adı
    const charName = CHARACTER_NAMES[characterId] ?? characterId;
    this.add.text(GAME_WIDTH / 2, 105, `Karakter: ${charName}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#888888'
    }).setOrigin(0.5, 0.5);

    // Victory konfeti
    if (victory) {
      const konfeti = this.add.graphics().setDepth(10);
      interface Kf { x: number; y: number; vy: number; vx: number; color: number; size: number; rot: number }
      const pieces: Kf[] = [];
      const colors = [0xffcc00, 0xff3333, 0x33ff33, 0x33ccff, 0xff66cc, 0xffffff];
      for (let i = 0; i < 80; i++) {
        pieces.push({
          x: Math.random() * GAME_WIDTH,
          y: -10 - Math.random() * 200,
          vy: 1.5 + Math.random() * 2.5,
          vx: (Math.random() - 0.5) * 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2
        });
      }
      this.time.addEvent({
        delay: 25, loop: true,
        callback: () => {
          konfeti.clear();
          for (const p of pieces) {
            p.y += p.vy; p.x += p.vx; p.rot += 0.08;
            if (p.y > GAME_HEIGHT + 10) { p.y = -10; p.x = Math.random() * GAME_WIDTH; }
            konfeti.fillStyle(p.color, 0.85);
            konfeti.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6);
          }
        }
      });
    }

    // İstatistik paneli
    const panelX = GAME_WIDTH / 2 - 160;
    const panelW = 320;
    const panelY = 130;
    const panelH = 185;
    this.add.rectangle(GAME_WIDTH / 2, panelY + panelH / 2, panelW, panelH, 0x1a1a2e, 0.85)
      .setStrokeStyle(1, 0x444466);

    const statsX = GAME_WIDTH / 2;
    const statsStartY = panelY + 20;
    const lineHeight = 32;

    const stats: Array<{ label: string; value: string; color: string }> = [
      { label: 'Ulaşılan Dalga', value: `${wave}`, color: '#aaaaaa' },
      { label: 'Öldürülen Düşman', value: `${kills}`, color: '#aaaaaa' },
      { label: 'Kazanılan Altın', value: `${gold}a`, color: '#ffcc00' },
      { label: 'Koşu Skoru', value: `${score}`, color: '#66aaff' },
      { label: 'En Yüksek Skor', value: `${highScore}`, color: '#aaaaaa' },
    ];

    stats.forEach((s, i) => {
      const y = statsStartY + i * lineHeight;
      this.add.text(statsX - 10, y, `${s.label}:`, {
        fontSize: '15px', fontFamily: 'monospace', color: '#666688'
      }).setOrigin(1, 0.5);
      this.add.text(statsX + 10, y, s.value, {
        fontSize: '15px', fontFamily: 'monospace', color: s.color, fontStyle: 'bold'
      }).setOrigin(0, 0.5);
    });

    // Yeni rekor duyurusu
    if (isNewHighScore) {
      this.add.text(GAME_WIDTH / 2, panelY + panelH + 16, 'YENİ EN YÜKSEK SKOR!', {
        fontSize: '20px', fontFamily: 'monospace', color: '#ffcc00', fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
    }

    // Butonlar
    const btnY = 390;
    const retryText = this.add.text(GAME_WIDTH / 2, btnY, '[ TEKRAR DENE ]', {
      fontSize: '18px', fontFamily: 'monospace', color: '#33ff33'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    retryText.on('pointerover', () => retryText.setColor('#ffffff'));
    retryText.on('pointerout', () => retryText.setColor('#33ff33'));
    retryText.on('pointerdown', () => {
      this.scene.start('CharacterSelectScene');
    });

    const menuText = this.add.text(GAME_WIDTH / 2, btnY + 42, '[ ANA MENÜ ]', {
      fontSize: '18px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    menuText.on('pointerover', () => menuText.setColor('#ffffff'));
    menuText.on('pointerout', () => menuText.setColor('#aaaaaa'));
    menuText.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('CharacterSelectScene');
    });
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
