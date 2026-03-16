import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create minimal loading bar
    const barWidth = 200;
    const barHeight = 10;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(x, y, barWidth, barHeight, 0x333333).setOrigin(0, 0.5);
    const fill = this.add.rectangle(x, y, 0, barHeight, 0xff3333).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      fill.width = barWidth * value;
    });

    this.load.on('complete', () => {
      bg.destroy();
      fill.destroy();
    });
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
