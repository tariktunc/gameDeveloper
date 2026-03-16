import Phaser from 'phaser';
import { gameConfig } from './config';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(gameConfig);
  console.log('Phaser game created', game.config.width, 'x', game.config.height);
});
