import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const barWidth = 200;
    const barHeight = 10;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333).setOrigin(0, 0.5);
    const fill = this.add.rectangle(x, y, 0, barHeight, 0x33ccff).setOrigin(0, 0.5);
    const loadText = this.add.text(GAME_WIDTH / 2, y - 20, 'Yükleniyor...', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = barWidth * value;
      loadText.setText(`Yükleniyor... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      bg.destroy();
      fill.destroy();
      loadText.destroy();
    });

    // Düşman görselleri
    this.load.image('enemy-cambaz',  'sprites/enemies/cambaz.png');
    this.load.image('enemy-katina',  'sprites/enemies/katina.png');
    this.load.image('enemy-molamba', 'sprites/enemies/molamba.png');
    this.load.image('enemy-bulsar',  'sprites/enemies/bulsar.png');
    this.load.image('enemy-sezer',   'sprites/enemies/sezer.png');

    // Tarık görselleri (6 adet png, arka plan kaldırılmış)
    for (let i = 1; i <= 6; i++) {
      this.load.image(`tarik-frame-${i}`, `sprites/player/tarik/${i}.png`);
    }

    // Mumin görselleri
    this.load.image('mumin-idle', 'sprites/player/mumin/idle.png');
    for (let i = 0; i <= 9; i++) {
      this.load.image(`mumin-run-${i}`, `sprites/player/mumin/run/${i}.png`);
      this.load.image(`mumin-die-${i}`, `sprites/player/mumin/die/${i}.png`);
    }

    this.load.on('loaderror', () => {
      // sessizce yoksay; create() prosedürel fallback kullanır
    });

    this.generatePlaceholderAssets();
  }

  private drawToCanvas(
    width: number, height: number,
    drawFn: (ctx: CanvasRenderingContext2D) => void
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);
    return canvas;
  }

  /** Görsel yüklendiyse canvas'a kopyala, yoksa renk bloku çiz */
  private drawImageOrColor(
    ctx: CanvasRenderingContext2D,
    key: string,
    dx: number, dy: number, dw: number, dh: number,
    fallbackColor: string
  ): void {
    if (this.textures.exists(key)) {
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement;
      ctx.drawImage(src, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(dx, dy, dw, dh);
    }
  }

  /** Tarık spritesheet: 6 animasyon karesi, her biri 64×64 */
  private generateTarikSpritesheet(): void {
    const frameSize = 64;
    const frameCount = 6;
    const canvas = this.drawToCanvas(frameSize * frameCount, frameSize, (ctx) => {
      for (let i = 1; i <= frameCount; i++) {
        const key = `tarik-frame-${i}`;
        this.drawImageOrColor(ctx, key, (i - 1) * frameSize, 0, frameSize, frameSize, '#3355ff');
      }
    });
    if (this.textures.exists('player-tarik')) this.textures.remove('player-tarik');
    this.textures.addSpriteSheet('player-tarik', canvas as any, { frameWidth: frameSize, frameHeight: frameSize });
  }

  /** Mumin spritesheet: 10 run karesi + 10 die karesi = 20 kare, 64×64 */
  private generateMuminSpritesheet(): void {
    const frameSize = 64;
    const totalFrames = 20; // 0-9: run, 10-19: die
    const canvas = this.drawToCanvas(frameSize * totalFrames, frameSize, (ctx) => {
      // Run frames (0-9)
      for (let i = 0; i <= 9; i++) {
        const key = `mumin-run-${i}`;
        this.drawImageOrColor(ctx, key, i * frameSize, 0, frameSize, frameSize, '#cc4411');
      }
      // Die frames (10-19)
      for (let i = 0; i <= 9; i++) {
        const key = `mumin-die-${i}`;
        this.drawImageOrColor(ctx, key, (10 + i) * frameSize, 0, frameSize, frameSize, '#661100');
      }
    });
    if (this.textures.exists('player-mumin')) this.textures.remove('player-mumin');
    this.textures.addSpriteSheet('player-mumin', canvas as any, { frameWidth: frameSize, frameHeight: frameSize });
  }

  /** Düşman spritesheet: 9 slot × 48×48 */
  private generateEnemySpritesheet(): void {
    const frameSize = 48;
    // slot → yüklü texture key
    const imageSlots: Record<number, string> = {
      1: 'enemy-cambaz',   // Yarasa
      2: 'enemy-molamba',  // Vampir
      3: 'enemy-katina',   // Hayalet
      5: 'enemy-bulsar',   // Okçu
      6: 'enemy-sezer',    // Sezer mini boss
      7: 'enemy-sezer',    // Mumin boss (sezer görsel kullan)
      8: 'enemy-sezer',    // Tarık boss (sezer görsel kullan)
    };

    const totalSlots = 9;
    const canvas = this.drawToCanvas(frameSize * totalSlots, frameSize, (ctx) => {
      for (let slot = 0; slot < totalSlots; slot++) {
        const ox = slot * frameSize;
        const imgKey = imageSlots[slot];

        if (imgKey && this.textures.exists(imgKey)) {
          const source = this.textures.get(imgKey).getSourceImage() as HTMLImageElement;
          ctx.drawImage(source, ox, 0, frameSize, frameSize);
        } else {
          this.drawProceduralEnemyFrame(ctx, slot, ox, frameSize);
        }
      }
    });

    if (this.textures.exists('enemies')) this.textures.remove('enemies');
    this.textures.addSpriteSheet('enemies', canvas as any, { frameWidth: frameSize, frameHeight: frameSize });
  }

  private drawProceduralEnemyFrame(
    ctx: CanvasRenderingContext2D, type: number, ox: number, size: number
  ): void {
    const s = size / 32; // 1.5x scale
    switch (type) {
      case 0: // İskelet
        ctx.fillStyle = '#bbbbbb';
        ctx.fillRect(ox + 12*s, 4*s,  8*s, 7*s);
        ctx.fillRect(ox + 13*s, 11*s, 6*s, 9*s);
        ctx.fillRect(ox + 10*s, 20*s, 4*s, 8*s);
        ctx.fillRect(ox + 18*s, 20*s, 4*s, 8*s);
        ctx.fillRect(ox + 7*s,  12*s, 5*s, 2*s);
        ctx.fillRect(ox + 20*s, 12*s, 5*s, 2*s);
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(ox + 14*s, 7*s, 2*s, 2*s);
        ctx.fillRect(ox + 17*s, 7*s, 2*s, 2*s);
        break;
      case 4: // Necromancer Boss
        ctx.fillStyle = '#7700bb';
        ctx.fillRect(ox + 8*s,  6*s,  16*s, 10*s);
        ctx.fillRect(ox + 6*s,  16*s, 20*s, 14*s);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(ox + 8*s,  2*s, 4*s, 6*s);
        ctx.fillRect(ox + 14*s, 0,   4*s, 8*s);
        ctx.fillRect(ox + 20*s, 2*s, 4*s, 6*s);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(ox + 11*s, 10*s, 3*s, 3*s);
        ctx.fillRect(ox + 18*s, 10*s, 3*s, 3*s);
        ctx.fillStyle = '#cc44ff';
        ctx.fillRect(ox + 4*s,  18*s, 3*s, 10*s);
        ctx.fillRect(ox + 25*s, 18*s, 3*s, 10*s);
        break;
      default:
        ctx.fillStyle = '#444444';
        ctx.fillRect(ox + 8*s, 4*s, 16*s, 24*s);
        break;
    }
  }

  private generatePlaceholderAssets(): void {
    // Enemies spritesheet oluşturmak için önce placeholder yükle
    const enemyCanvas = this.drawToCanvas(192, 32, (ctx) => {
      // 0: Skeleton
      { const ox = 0;
        ctx.fillStyle = '#bbbbbb';
        ctx.fillRect(ox+12,4,8,7);
        ctx.fillRect(ox+13,11,6,9);
        ctx.fillRect(ox+10,20,4,8);
        ctx.fillRect(ox+18,20,4,8);
        ctx.fillRect(ox+7,12,5,2);
        ctx.fillRect(ox+20,12,5,2);
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(ox+14,7,2,2); ctx.fillRect(ox+17,7,2,2);
      }
      // 1-5: diğer tipler basit renk blokları
      { ctx.fillStyle = '#774422'; ctx.fillRect(32+11,12,10,8); ctx.fillRect(32+4,8,8,7); ctx.fillRect(32+20,8,8,7); }
      { ctx.fillStyle = '#cc1111'; ctx.fillRect(64+11,4,10,8); ctx.fillRect(64+9,12,14,12); }
      { ctx.fillStyle = '#5566ee'; ctx.fillRect(96+7,6,18,22); }
      { ctx.fillStyle = '#7700bb'; ctx.fillRect(128+8,6,16,24); ctx.fillStyle='#ffcc00'; ctx.fillRect(128+8,2,4,6); ctx.fillRect(128+14,0,4,8); ctx.fillRect(128+20,2,4,6); }
      { ctx.fillStyle = '#336622'; ctx.fillRect(160+12,4,8,8); ctx.fillRect(160+11,12,10,10); }
    });
    this.textures.addSpriteSheet('enemies', enemyCanvas as any, { frameWidth: 32, frameHeight: 32 });

    // Projectiles spritesheet (8x8, 4 types)
    const projColors = ['#ffffff', '#ffcc00', '#00ff00', '#ff6600'];
    const projCanvas = this.drawToCanvas(32, 8, (ctx) => {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = projColors[i];
        ctx.beginPath();
        ctx.arc(i * 8 + 4, 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    this.textures.addSpriteSheet('projectiles', projCanvas as any, { frameWidth: 8, frameHeight: 8 });

    // XP Gem (8x8)
    const gemCanvas = this.drawToCanvas(8, 8, (ctx) => {
      ctx.fillStyle = '#33ff33';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(8, 4);
      ctx.lineTo(4, 8);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
    });
    this.textures.addImage('xp-gem', gemCanvas as any);

    // Arena floor tile (32x32)
    const tileCanvas = this.drawToCanvas(32, 32, (ctx) => {
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#2a1a3e';
      ctx.globalAlpha = 0.5;
      ctx.strokeRect(0.5, 0.5, 31, 31);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#150828';
      for (let j = 0; j < 5; j++) {
        ctx.fillRect(Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 30) + 1, 1, 1);
      }
    });
    this.textures.addImage('arena-tile', tileCanvas as any);
  }

  create(): void {
    // Tarık spritesheet oluştur
    this.generateTarikSpritesheet();

    // Mumin spritesheet oluştur
    this.generateMuminSpritesheet();

    // Düşman spritesheet: gerçek görselleri yerleştir
    this.generateEnemySpritesheet();

    // Tarık animasyonları (6 kare döngü = yürüme, ilk kare = durma)
    this.anims.create({
      key: 'tarik_idle',
      frames: this.anims.generateFrameNumbers('player-tarik', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: 'tarik_walk',
      frames: this.anims.generateFrameNumbers('player-tarik', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    // Mumin animasyonları (frames 0-9: run, 10-19: die)
    this.anims.create({
      key: 'mumin_idle',
      frames: this.anims.generateFrameNumbers('player-mumin', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: 'mumin_walk',
      frames: this.anims.generateFrameNumbers('player-mumin', { start: 0, end: 9 }),
      frameRate: 12,
      repeat: -1
    });
    this.anims.create({
      key: 'mumin_die',
      frames: this.anims.generateFrameNumbers('player-mumin', { start: 10, end: 19 }),
      frameRate: 10,
      repeat: 0
    });

    // Geriye dönük uyumluluk: player_idle / player_walk de tanımla (fallback)
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player-tarik', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player-tarik', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    this.scene.start('MainMenuScene');
  }
}
