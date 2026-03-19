import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { SaveManager } from '../systems/SaveManager';
import characters from '../data/characters.json';
import { CharacterData } from '../utils/types';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    const saveManager = new SaveManager();

    // Unlock prices per character (0 = free)
    const unlockPrices: Record<string, number> = { tarik: 0, mumin: 50, orjinal: 100 };

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0014);

    // Title
    this.add.text(GAME_WIDTH / 2, 50, 'KARAKTERİNİZİ SEÇİN', {
      fontSize: '28px', fontFamily: 'monospace', color: '#ffcc00'
    }).setOrigin(0.5, 0.5);

    // Bank gold display
    this.add.text(GAME_WIDTH / 2, 82, `Banka Altını: ${saveManager.saveData.gold}`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#ffcc00'
    }).setOrigin(0.5, 0.5);

    const cardWidth = 250;
    const cardHeight = 320;
    const gap = 30;
    const totalWidth = characters.length * cardWidth + (characters.length - 1) * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    const charData = characters as CharacterData[];

    const weaponNames: Record<string, string> = {
      knife: 'Bıçak', garlic: 'Sarımsak', whip: 'Kırbaç',
      cross_boomerang: 'Haç Bumerangi', holy_water: 'Kutsal Su'
    };

    charData.forEach((char, i) => {
      const x = startX + i * (cardWidth + gap);
      const y = GAME_HEIGHT / 2 + 20;

      const price = unlockPrices[char.id] ?? 0;
      const unlocked = price === 0 || saveManager.saveData.unlockedCharacters.includes(char.id);
      const canAfford = saveManager.saveData.gold >= price;

      // Card background
      const cardFill = unlocked ? 0x1a0a2e : 0x0d0618;
      const cardStroke = unlocked ? 0x6644aa : 0x332244;
      const card = this.add.rectangle(x, y, cardWidth, cardHeight, cardFill)
        .setStrokeStyle(2, cardStroke)
        .setInteractive({ useHandCursor: true });

      // Locked overlay
      if (!unlocked) {
        this.add.rectangle(x, y, cardWidth, cardHeight, 0x000000, 0.45);
      }

      // Character name
      this.add.text(x, y - 130, char.name, {
        fontSize: '22px', fontFamily: 'monospace',
        color: unlocked ? '#ffffff' : '#664477', fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);

      // Description
      this.add.text(x, y - 92, char.description, {
        fontSize: '12px', fontFamily: 'monospace', color: unlocked ? '#aaaaaa' : '#443355',
        wordWrap: { width: cardWidth - 20 }, align: 'center'
      }).setOrigin(0.5, 0.5);

      // Starting weapon
      this.add.text(x, y - 50, `Silah: ${weaponNames[char.startingWeapon] ?? char.startingWeapon}`, {
        fontSize: '14px', fontFamily: 'monospace', color: unlocked ? '#33ccff' : '#224455'
      }).setOrigin(0.5, 0.5);

      // Stat modifiers
      const statLines: string[] = [];
      const hpDiff = char.baseStats.maxHp - 100;
      const speedDiff = char.baseStats.speed - 160;
      const dmgDiff = char.baseStats.damage - 1.0;
      if (hpDiff !== 0) statLines.push(`Can: ${hpDiff > 0 ? '+' : ''}${hpDiff}`);
      if (speedDiff !== 0) statLines.push(`Hız: ${speedDiff > 0 ? '+' : ''}${speedDiff}`);
      if (dmgDiff !== 0) statLines.push(`Hasar: ${dmgDiff > 0 ? '+' : ''}${Math.round(dmgDiff * 100)}%`);
      if (statLines.length === 0) statLines.push('Temel istatistikler');
      this.add.text(x, y, statLines.join('\n'), {
        fontSize: '13px', fontFamily: 'monospace', color: unlocked ? '#66ff66' : '#224422', align: 'center'
      }).setOrigin(0.5, 0.5);

      // Passive ability
      this.add.text(x, y + 40, '— PASİF —', {
        fontSize: '10px', fontFamily: 'monospace', color: unlocked ? '#aa7744' : '#443322'
      }).setOrigin(0.5, 0.5);
      this.add.text(x, y + 56, char.passive, {
        fontSize: '10px', fontFamily: 'monospace', color: unlocked ? '#ffaa44' : '#443322',
        wordWrap: { width: cardWidth - 20 }, align: 'center'
      }).setOrigin(0.5, 0.5);

      // Select / unlock button
      if (unlocked) {
        const selText = this.add.text(x, y + 104, '[ SEÇ ]', {
          fontSize: '14px', fontFamily: 'monospace', color: '#ffcc00'
        }).setOrigin(0.5, 0.5);
        this.add.text(x, y + 122, `[${i + 1}]`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(0.5, 0.5);

        card.on('pointerover', () => { card.setStrokeStyle(3, 0xffcc00); selText.setColor('#ffffff'); });
        card.on('pointerout', () => { card.setStrokeStyle(2, 0x6644aa); selText.setColor('#ffcc00'); });
        card.on('pointerdown', () => this.scene.start('GameScene', { characterId: char.id }));
      } else {
        // Lock icon + price
        this.add.text(x, y + 92, '🔒', { fontSize: '22px' }).setOrigin(0.5, 0.5);
        const priceColor = canAfford ? '#ffcc00' : '#ff4444';
        const unlockText = this.add.text(x, y + 116, `${price} ALTIN ile Aç`, {
          fontSize: '13px', fontFamily: 'monospace', color: priceColor
        }).setOrigin(0.5, 0.5);

        if (canAfford) {
          card.on('pointerover', () => { card.setStrokeStyle(2, 0xffcc00); unlockText.setColor('#ffffff'); });
          card.on('pointerout', () => { card.setStrokeStyle(2, cardStroke); unlockText.setColor(priceColor); });
          card.on('pointerdown', () => {
            saveManager.addGold(-price);
            saveManager.unlockCharacter(char.id);
            this.scene.restart();
          });
        } else {
          card.removeInteractive();
        }
      }
    });

    // Back button
    const backText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '[ GERİ ]', {
      fontSize: '16px', fontFamily: 'monospace', color: '#666666'
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
    backText.on('pointerover', () => backText.setColor('#ffffff'));
    backText.on('pointerout', () => backText.setColor('#666666'));
    backText.on('pointerdown', () => this.scene.start('MainMenuScene'));

    // Klavye kısayolları
    this.input.keyboard?.on('keydown-ONE', () => {
      if (charData[0]) this.scene.start('GameScene', { characterId: charData[0].id });
    });
    this.input.keyboard?.on('keydown-TWO', () => {
      if (charData[1]) this.scene.start('GameScene', { characterId: charData[1].id });
    });
    this.input.keyboard?.on('keydown-THREE', () => {
      if (charData[2]) this.scene.start('GameScene', { characterId: charData[2].id });
    });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }
}
