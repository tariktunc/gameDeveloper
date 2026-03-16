import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { ARENA_WIDTH, ARENA_HEIGHT, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

const MINIMAP_W = 100;
const MINIMAP_H = 56;
const MINIMAP_PADDING = 8;

export class MinimapUI {
  private scene: Phaser.Scene;
  private player: Player;
  private enemies: Enemy[];
  private graphics: Phaser.GameObjects.Graphics;

  private readonly mapX: number;
  private readonly mapY: number;

  constructor(scene: Phaser.Scene, player: Player, enemies: Enemy[]) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;

    this.mapX = GAME_WIDTH - MINIMAP_W - MINIMAP_PADDING;
    this.mapY = GAME_HEIGHT - MINIMAP_H - MINIMAP_PADDING;

    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0);
    this.graphics.setDepth(200);
  }

  update(): void {
    this.graphics.clear();

    // Background
    this.graphics.fillStyle(0x000000, 0.5);
    this.graphics.fillRect(this.mapX, this.mapY, MINIMAP_W, MINIMAP_H);

    // Border
    this.graphics.lineStyle(1, 0xffffff, 1);
    this.graphics.strokeRect(this.mapX, this.mapY, MINIMAP_W, MINIMAP_H);

    // Player dot (green)
    const px = this.mapX + (this.player.x / ARENA_WIDTH) * MINIMAP_W;
    const py = this.mapY + (this.player.y / ARENA_HEIGHT) * MINIMAP_H;
    this.graphics.fillStyle(0x00ff00, 1);
    this.graphics.fillCircle(px, py, 2);

    // Enemy dots (red) - up to 50 nearest
    const activeEnemies: Enemy[] = [];
    for (const e of this.enemies) {
      if (e.active) {
        activeEnemies.push(e);
      }
    }

    let toDraw: Enemy[];
    if (activeEnemies.length <= 50) {
      toDraw = activeEnemies;
    } else {
      // Sort by distance to player, take nearest 50
      const playerX = this.player.x;
      const playerY = this.player.y;
      activeEnemies.sort((a, b) => {
        const da = (a.x - playerX) * (a.x - playerX) + (a.y - playerY) * (a.y - playerY);
        const db = (b.x - playerX) * (b.x - playerX) + (b.y - playerY) * (b.y - playerY);
        return da - db;
      });
      toDraw = activeEnemies.slice(0, 50);
    }

    for (const e of toDraw) {
      const ex = this.mapX + (e.x / ARENA_WIDTH) * MINIMAP_W;
      const ey = this.mapY + (e.y / ARENA_HEIGHT) * MINIMAP_H;
      if (e.enemyData?.id === 'boss_necromancer') {
        // Boss: büyük mor nokta
        this.graphics.fillStyle(0xff00cc, 1);
        this.graphics.fillCircle(ex, ey, 4);
        this.graphics.lineStyle(1, 0xffffff, 0.8);
        this.graphics.strokeCircle(ex, ey, 4);
      } else {
        this.graphics.fillStyle(0xff0000, 0.85);
        this.graphics.fillCircle(ex, ey, 1.5);
      }
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
