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
    const loadText = this.add.text(GAME_WIDTH / 2, y - 20, 'Loading...', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = barWidth * value;
      loadText.setText(`Loading... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      bg.destroy();
      fill.destroy();
      loadText.destroy();
    });

    // Try to load player image from file (optional – fallback to procedural if missing)
    this.load.image('player-img', 'assets/sprites/player/tariktunc.png');
    this.load.on('loaderror', () => {
      // silently ignore; create() will use procedural fallback
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

  private generatePlayerSpritesheet(): void {
    // Generate a 4-frame spritesheet from the loaded player image
    const source = this.textures.get('player-img').getSourceImage() as HTMLImageElement;
    const frameSize = 48;
    const playerCanvas = this.drawToCanvas(frameSize * 4, frameSize, (ctx) => {
      for (let i = 0; i < 4; i++) {
        const ox = i * frameSize;
        // Draw the character image scaled to frame size
        ctx.drawImage(source, ox + 4, 2, frameSize - 8, frameSize - 4);
        // Walk animation: slight vertical offset on frames 1 and 3
        if (i === 1) {
          ctx.clearRect(ox, 0, frameSize, frameSize);
          ctx.drawImage(source, ox + 4, 0, frameSize - 8, frameSize - 4);
        } else if (i === 3) {
          ctx.clearRect(ox, 0, frameSize, frameSize);
          ctx.drawImage(source, ox + 4, 4, frameSize - 8, frameSize - 4);
        }
      }
    });
    this.textures.addSpriteSheet('player', playerCanvas as any, { frameWidth: frameSize, frameHeight: frameSize });
  }

  private generatePlaceholderAssets(): void {

    // Enemies spritesheet (32x32, 6 types) — her düşman farklı silüet
    // 0=skeleton 1=bat 2=vampire 3=ghost 4=boss 5=archer
    const enemyCanvas = this.drawToCanvas(192, 32, (ctx) => {

      // 0: Skeleton — ince kemik figür, gri
      { const ox = 0;
        ctx.fillStyle = '#bbbbbb';
        ctx.fillRect(ox+12,4,8,7);    // kafa
        ctx.fillRect(ox+13,11,6,9);   // gövde
        ctx.fillRect(ox+10,20,4,8);   // sol bacak
        ctx.fillRect(ox+18,20,4,8);   // sağ bacak
        ctx.fillRect(ox+7,12,5,2);    // sol kol
        ctx.fillRect(ox+20,12,5,2);   // sağ kol
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(ox+14,7,2,2); ctx.fillRect(ox+17,7,2,2); // gözler
      }

      // 1: Bat — kanat silueti, kahverengi
      { const ox = 32;
        ctx.fillStyle = '#774422';
        ctx.fillRect(ox+11,12,10,8);  // gövde
        ctx.fillRect(ox+4,8,8,7);     // sol kanat
        ctx.fillRect(ox+20,8,8,7);    // sağ kanat
        ctx.fillRect(ox+13,20,3,4);   // ayak
        ctx.fillRect(ox+16,20,3,4);
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(ox+13,13,2,2); ctx.fillRect(ox+17,13,2,2);
      }

      // 2: Vampire — pelerin, kırmızı
      { const ox = 64;
        ctx.fillStyle = '#cc1111';
        ctx.fillRect(ox+11,4,10,8);   // kafa
        ctx.fillRect(ox+9,12,14,12);  // pelerin gövde
        ctx.fillRect(ox+6,14,4,8);    // sol pelerin
        ctx.fillRect(ox+22,14,4,8);   // sağ pelerin
        ctx.fillStyle = '#ff9999';
        ctx.fillRect(ox+13,8,2,2); ctx.fillRect(ox+17,8,2,2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox+13,11,2,2); ctx.fillRect(ox+17,11,2,2); // dişler
      }

      // 3: Ghost — bulanık oval, mavi
      { const ox = 96;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#5566ee';
        ctx.beginPath();
        ctx.ellipse(ox+16,13,9,11,0,0,Math.PI*2); ctx.fill();
        ctx.fillRect(ox+7,18,4,6);
        ctx.fillRect(ox+12,20,4,6);
        ctx.fillRect(ox+17,20,4,6);
        ctx.fillRect(ox+22,18,4,6);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox+12,10,3,3); ctx.fillRect(ox+17,10,3,3);
      }

      // 4: Boss Necromancer — büyük koyu mor, taç
      { const ox = 128;
        ctx.fillStyle = '#7700bb';
        ctx.fillRect(ox+8,6,16,10);   // kafa
        ctx.fillRect(ox+6,16,20,14);  // gövde
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(ox+8,2,4,6); ctx.fillRect(ox+14,0,4,8); ctx.fillRect(ox+20,2,4,6); // taç
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(ox+11,10,3,3); ctx.fillRect(ox+18,10,3,3);
        ctx.fillStyle = '#cc44ff';
        ctx.fillRect(ox+4,18,3,10); ctx.fillRect(ox+25,18,3,10); // kollar
      }

      // 5: Archer — yeşil, ok+yay
      { const ox = 160;
        ctx.fillStyle = '#336622';
        ctx.fillRect(ox+12,4,8,8);    // kafa
        ctx.fillRect(ox+11,12,10,10); // gövde
        ctx.fillRect(ox+12,22,4,8);   // bacaklar
        ctx.fillRect(ox+16,22,4,8);
        ctx.fillStyle = '#885533';
        ctx.fillRect(ox+6,10,2,14);   // yay
        ctx.fillRect(ox+6,10,6,2); ctx.fillRect(ox+6,22,6,2);
        ctx.fillStyle = '#ccaa44';
        ctx.fillRect(ox+8,15,12,2);   // ok
        ctx.fillRect(ox+19,13,2,6);   // ok ucu
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(ox+14,7,2,2); ctx.fillRect(ox+17,7,2,2);
      }
    });
    this.textures.addSpriteSheet('enemies', enemyCanvas as any, { frameWidth: 32, frameHeight: 32 });

    // Projectiles spritesheet (8x8, 4 types) via canvas
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

    // XP Gem (8x8 single image)
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

  private generateProceduralPlayerSprite(): void {
    const frameSize = 48;
    const playerCanvas = this.drawToCanvas(frameSize * 4, frameSize, (ctx) => {
      for (let i = 0; i < 4; i++) {
        const ox = i * frameSize;
        const bobY = (i === 1 || i === 3) ? -4 : 4;
        // Body
        ctx.fillStyle = '#3355ff';
        ctx.fillRect(ox + 14, 20 + bobY, 20, 20);
        // Head
        ctx.fillStyle = '#ffcc99';
        ctx.fillRect(ox + 16, 8 + bobY, 16, 14);
        // Eyes
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(ox + 19, 13 + bobY, 3, 3);
        ctx.fillRect(ox + 26, 13 + bobY, 3, 3);
        // Legs
        ctx.fillStyle = '#222255';
        ctx.fillRect(ox + 15, 38 + bobY, 8, 8);
        ctx.fillRect(ox + 25, 38 + bobY, 8, 8);
      }
    });
    this.textures.addSpriteSheet('player', playerCanvas as any, { frameWidth: frameSize, frameHeight: frameSize });
  }

  create(): void {
    // Build 'player' spritesheet: use loaded image if available, else procedural
    if (this.textures.exists('player-img')) {
      try {
        this.generatePlayerSpritesheet();
      } catch {
        this.generateProceduralPlayerSprite();
      }
    } else {
      this.generateProceduralPlayerSprite();
    }

    // Create player animations using spritesheet frames
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    this.scene.start('MainMenuScene');
  }
}
