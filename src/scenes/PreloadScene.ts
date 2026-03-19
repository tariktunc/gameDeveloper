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
      this.load.image(`mumin-run-${i}`,   `sprites/player/mumin/run/${i}.png`);
      this.load.image(`mumin-die-${i}`,   `sprites/player/mumin/die/${i}.png`);
      this.load.image(`mumin-shoot-${i}`, `sprites/player/mumin/shoot/${i}.png`);
    }

    // Orjinal karakter görselleri (3. karakter)
    for (let i = 0; i <= 9; i++) {
      this.load.image(`orjinal-run-${i}`,   `sprites/player/orjinal/run/${i}.png`);
      this.load.image(`orjinal-die-${i}`,   `sprites/player/orjinal/die/${i}.png`);
      this.load.image(`orjinal-shoot-${i}`, `sprites/player/orjinal/shoot/${i}.png`);
      this.load.image(`orjinal-stand-${i}`, `sprites/player/orjinal/stand/${i}.png`);
    }

    // Ok görseli (archer projectile)
    this.load.image('arrow', 'sprites/projectiles/arrow.png');

    // Sezer karakter müziği
    this.load.audio('sezer-theme', 'music/sezer-theme.m4a');

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
  /** Tarık için gövde çiz: alt kısım savaşçı bedeni, üst kısım kafa görseli */
  private drawTarikBodyWithFace(
    ctx: CanvasRenderingContext2D, ox: number, frameSize: number, faceKey: string, frameIndex: number
  ): void {
    const s = frameSize / 64; // scale factor

    // --- Gövde (alt %55) ---
    // Gövde rengi: mavi zırh tonu
    ctx.fillStyle = '#1a3a6e';
    ctx.fillRect(ox + 20*s, 28*s, 24*s, 20*s); // gövde

    // Omuzlar
    ctx.fillStyle = '#2a5a9e';
    ctx.fillRect(ox + 14*s, 26*s, 10*s, 12*s); // sol omuz
    ctx.fillRect(ox + 40*s, 26*s, 10*s, 12*s); // sağ omuz

    // Kollar
    ctx.fillStyle = '#3a6abe';
    ctx.fillRect(ox + 12*s, 36*s, 8*s, 14*s);  // sol kol
    ctx.fillRect(ox + 44*s, 36*s, 8*s, 14*s);  // sağ kol

    // Bacaklar — her frame için hafif yürüyüş pozu
    const legOffset = [0, 3, 5, 3, 0, -3][frameIndex % 6];
    ctx.fillStyle = '#0e2244';
    ctx.fillRect(ox + 20*s, 48*s,        10*s, 14*s + legOffset*s); // sol bacak
    ctx.fillRect(ox + 34*s, 48*s,        10*s, 14*s - legOffset*s); // sağ bacak

    // Ayakkabılar
    ctx.fillStyle = '#111111';
    ctx.fillRect(ox + 18*s, (62 + legOffset)*s, 14*s, 2*s);
    ctx.fillRect(ox + 32*s, (62 - legOffset)*s, 14*s, 2*s);

    // Boyun
    ctx.fillStyle = '#c8a080';
    ctx.fillRect(ox + 28*s, 22*s, 8*s, 8*s);

    // --- Kafa görseli (üst %40, ortalı) ---
    const headSize = 36 * s; // kafanın boyutu
    const headX = ox + (frameSize / 2) - (headSize / 2);
    const headY = 0;
    if (this.textures.exists(faceKey)) {
      const src = this.textures.get(faceKey).getSourceImage() as HTMLImageElement;
      // Kare kırpma: kafeyi merkeze al, kare kesit al
      const srcW = src.naturalWidth || src.width;
      const srcH = src.naturalHeight || src.height;
      const cropSize = Math.min(srcW, srcH);
      const cropX = (srcW - cropSize) / 2;
      const cropY = (srcH - cropSize) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(headX + headSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(src, cropX, cropY, cropSize, cropSize, headX, headY, headSize, headSize);
      ctx.restore();
    } else {
      // Fallback: basit kafa
      ctx.fillStyle = '#c8a080';
      ctx.beginPath();
      ctx.arc(ox + frameSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private generateTarikSpritesheet(): void {
    const frameSize = 64;
    const frameCount = 6;
    const canvas = this.drawToCanvas(frameSize * frameCount, frameSize, (ctx) => {
      for (let i = 1; i <= frameCount; i++) {
        const ox = (i - 1) * frameSize;
        this.drawTarikBodyWithFace(ctx, ox, frameSize, `tarik-frame-${i}`, i - 1);
      }
    });
    if (this.textures.exists('player-tarik')) this.textures.remove('player-tarik');
    this.textures.addSpriteSheet('player-tarik', canvas as any, { frameWidth: frameSize, frameHeight: frameSize });
  }

  /** Mumin spritesheet: 10 run + 10 die + 10 shoot = 30 kare, 64×64 */
  private generateMuminSpritesheet(): void {
    const frameSize = 64;
    const totalFrames = 30; // 0-9: run, 10-19: die, 20-29: shoot
    const canvas = this.drawToCanvas(frameSize * totalFrames, frameSize, (ctx) => {
      for (let i = 0; i <= 9; i++) {
        this.drawImageOrColor(ctx, `mumin-run-${i}`,   i * frameSize,        0, frameSize, frameSize, '#cc4411');
        this.drawImageOrColor(ctx, `mumin-die-${i}`,   (10 + i) * frameSize, 0, frameSize, frameSize, '#661100');
        this.drawImageOrColor(ctx, `mumin-shoot-${i}`, (20 + i) * frameSize, 0, frameSize, frameSize, '#ff6600');
      }
    });
    if (this.textures.exists('player-mumin')) this.textures.remove('player-mumin');
    this.textures.addSpriteSheet('player-mumin', canvas as any, { frameWidth: frameSize, frameHeight: frameSize });
  }

  /** Sezer spritesheet: 6 kare, 64×64 — enemy-sezer görseli kafa olarak kullanılır */
  private generateSezerSpritesheet(): void {
    const frameSize = 64;
    const frameCount = 6;
    const canvas = this.drawToCanvas(frameSize * frameCount, frameSize, (ctx) => {
      for (let i = 0; i < frameCount; i++) {
        const ox = i * frameSize;
        const s = frameSize / 64;

        // Gövde — koyu kırmızı zırh (Sezer'e özgü renk)
        ctx.fillStyle = '#5a0a0a';
        ctx.fillRect(ox + 20*s, 28*s, 24*s, 20*s);

        // Omuzlar
        ctx.fillStyle = '#8a1a1a';
        ctx.fillRect(ox + 14*s, 26*s, 10*s, 12*s);
        ctx.fillRect(ox + 40*s, 26*s, 10*s, 12*s);

        // Kollar
        ctx.fillStyle = '#aa2a2a';
        ctx.fillRect(ox + 12*s, 36*s, 8*s, 14*s);
        ctx.fillRect(ox + 44*s, 36*s, 8*s, 14*s);

        // Bacaklar (yürüyüş animasyonu)
        const legOffset = [0, 3, 5, 3, 0, -3][i % 6];
        ctx.fillStyle = '#3a0000';
        ctx.fillRect(ox + 20*s, 48*s, 10*s, 14*s + legOffset*s);
        ctx.fillRect(ox + 34*s, 48*s, 10*s, 14*s - legOffset*s);

        // Ayakkabılar
        ctx.fillStyle = '#111111';
        ctx.fillRect(ox + 18*s, (62 + legOffset)*s, 14*s, 2*s);
        ctx.fillRect(ox + 32*s, (62 - legOffset)*s, 14*s, 2*s);

        // Boyun
        ctx.fillStyle = '#c8a080';
        ctx.fillRect(ox + 28*s, 22*s, 8*s, 8*s);

        // Kafa — enemy-sezer görseli daire şeklinde kırpılmış
        const headSize = 36 * s;
        const headX = ox + (frameSize / 2) - (headSize / 2);
        const headY = 0;
        if (this.textures.exists('enemy-sezer')) {
          const src = this.textures.get('enemy-sezer').getSourceImage() as HTMLImageElement;
          const srcW = src.naturalWidth || src.width;
          const srcH = src.naturalHeight || src.height;
          const cropSize = Math.min(srcW, srcH);
          const cropX = (srcW - cropSize) / 2;
          const cropY = (srcH - cropSize) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(headX + headSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(src, cropX, cropY, cropSize, cropSize, headX, headY, headSize, headSize);
          ctx.restore();
        } else {
          ctx.fillStyle = '#c8a080';
          ctx.beginPath();
          ctx.arc(ox + frameSize / 2, headY + headSize / 2, headSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    if (this.textures.exists('player-sezer')) this.textures.remove('player-sezer');
    this.textures.addSpriteSheet('player-sezer', canvas as any, { frameWidth: frameSize, frameHeight: frameSize });
  }

  /** Orjinal karakter spritesheet: run(0-9) + die(10-19) + shoot(20-29) + stand(30-39) = 40 kare, 64×64 */
  private generateOrjinalSpritesheet(): void {
    const frameSize = 64;
    const totalFrames = 40;
    const canvas = this.drawToCanvas(frameSize * totalFrames, frameSize, (ctx) => {
      for (let i = 0; i <= 9; i++) {
        this.drawImageOrColor(ctx, `orjinal-run-${i}`,   i * frameSize,        0, frameSize, frameSize, '#2244cc');
        this.drawImageOrColor(ctx, `orjinal-die-${i}`,   (10 + i) * frameSize, 0, frameSize, frameSize, '#112266');
        this.drawImageOrColor(ctx, `orjinal-shoot-${i}`, (20 + i) * frameSize, 0, frameSize, frameSize, '#4466ff');
        this.drawImageOrColor(ctx, `orjinal-stand-${i}`, (30 + i) * frameSize, 0, frameSize, frameSize, '#3355dd');
      }
    });
    if (this.textures.exists('player-orjinal')) this.textures.remove('player-orjinal');
    this.textures.addSpriteSheet('player-orjinal', canvas as any, { frameWidth: frameSize, frameHeight: frameSize });
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
    };
    // Boss slotları: player spritesheet'inden frame 0 kullan
    const bossSlots: Record<number, { key: string; frameW: number }> = {
      7: { key: 'player-mumin',   frameW: 64 }, // Mumin boss
      8: { key: 'player-tarik',   frameW: 64 }, // Tarık boss
      9: { key: 'player-orjinal', frameW: 64 }, // Kahraman boss
    };

    const totalSlots = 10;
    const canvas = this.drawToCanvas(frameSize * totalSlots, frameSize, (ctx) => {
      for (let slot = 0; slot < totalSlots; slot++) {
        const ox = slot * frameSize;

        // Boss: spritesheet'in ilk frame'ini (64×64) 48×48'e ölçekle
        if (bossSlots[slot] && this.textures.exists(bossSlots[slot].key)) {
          const { key, frameW } = bossSlots[slot];
          const source = this.textures.get(key).getSourceImage() as HTMLImageElement;
          ctx.drawImage(source, 0, 0, frameW, frameW, ox, 0, frameSize, frameSize);
          continue;
        }

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

    // Orjinal karakter spritesheet oluştur
    this.generateOrjinalSpritesheet();

    // Sezer karakter spritesheet oluştur
    this.generateSezerSpritesheet();

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
    this.anims.create({
      key: 'tarik_die',
      frames: this.anims.generateFrameNumbers('player-tarik', { start: 0, end: 5 }),
      frameRate: 4,
      repeat: 0
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
    this.anims.create({
      key: 'mumin_shoot',
      frames: this.anims.generateFrameNumbers('player-mumin', { start: 20, end: 29 }),
      frameRate: 12,
      repeat: 0
    });

    // Orjinal karakter animasyonları (run:0-9, die:10-19, shoot:20-29, stand:30-39)
    this.anims.create({
      key: 'orjinal_idle',
      frames: this.anims.generateFrameNumbers('player-orjinal', { start: 30, end: 39 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'orjinal_walk',
      frames: this.anims.generateFrameNumbers('player-orjinal', { start: 0, end: 9 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'orjinal_die',
      frames: this.anims.generateFrameNumbers('player-orjinal', { start: 10, end: 19 }),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: 'orjinal_shoot',
      frames: this.anims.generateFrameNumbers('player-orjinal', { start: 20, end: 29 }),
      frameRate: 12,
      repeat: 0
    });

    // Sezer animasyonları
    this.anims.create({
      key: 'sezer_idle',
      frames: this.anims.generateFrameNumbers('player-sezer', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: 'sezer_walk',
      frames: this.anims.generateFrameNumbers('player-sezer', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'sezer_die',
      frames: this.anims.generateFrameNumbers('player-sezer', { start: 0, end: 5 }),
      frameRate: 4,
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
