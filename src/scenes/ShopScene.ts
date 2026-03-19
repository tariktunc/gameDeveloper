import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { Player } from '../entities/Player';
import { ShopManager } from '../systems/ShopManager';
import { ShopItemData } from '../utils/types';

export class ShopScene extends Phaser.Scene {
  private shopManager!: ShopManager;
  private player!: Player;
  private onDone?: () => void;
  private goldText!: Phaser.GameObjects.Text;
  private itemCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'ShopScene' });
    this.shopManager = new ShopManager();
  }

  create(data: { player: Player; onDone: () => void; wave?: number }): void {
    this.player = data.player;
    this.onDone = data.onDone;

    // D3: Set wave for dynamic pricing
    if (data.wave !== undefined) {
      this.shopManager.setWave(data.wave);
    }

    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
      .setScrollFactor(0);

    // Title
    this.add.text(GAME_WIDTH / 2, 40, 'MAĞAZA', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffcc00'
    }).setOrigin(0.5, 0.5);

    // Gold display
    this.goldText = this.add.text(GAME_WIDTH / 2, 75, `Altın: ${this.player.gold}`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffcc00'
    }).setOrigin(0.5, 0.5);

    // Player stats summary (top-right)
    const s = this.player.stats;
    this.add.text(GAME_WIDTH - 15, 20, [
      `Can: ${this.player.currentHp}/${s.maxHp}`,
      `Hız: ${s.speed}`,
      `Hasar: ${s.damage.toFixed(1)}`,
      `Zırh: ${s.armor}`,
      `Şans: ${s.luck.toFixed(1)}`
    ].join('\n'), {
      fontSize: '13px', fontFamily: 'monospace', color: '#888888', align: 'right'
    }).setOrigin(1, 0);

    // Generate offerings
    const offerings = this.shopManager.generateOfferings(3);
    this.displayOfferings(offerings);

    // Reroll button
    const rerollCost = this.shopManager.getRerollCost();
    const rerollText = this.add.text(GAME_WIDTH / 2 - 100, GAME_HEIGHT - 60, `Yeniden Çevir (${rerollCost}a)`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    rerollText.on('pointerover', () => rerollText.setColor('#ffcc00'));
    rerollText.on('pointerout', () => rerollText.setColor('#aaaaaa'));
    rerollText.on('pointerdown', () => {
      const result = this.shopManager.reroll(this.player.gold);
      if (result) {
        this.player.gold -= result.cost;
        this.updateGold();
        this.clearCards();
        this.displayOfferings(result.offerings);
        rerollText.setText(`Yeniden Çevir (${this.shopManager.getRerollCost()}a)`);
      }
    });

    // Continue button
    const continueText = this.add.text(GAME_WIDTH / 2 + 100, GAME_HEIGHT - 60, '[ DEVAM ET ]', {
      fontSize: '16px', fontFamily: 'monospace', color: '#33ff33'
    }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });

    continueText.on('pointerover', () => continueText.setColor('#ffffff'));
    continueText.on('pointerout', () => continueText.setColor('#33ff33'));
    continueText.on('pointerdown', () => {
      this.shopManager.resetRerollCost();
      this.onDone?.();
      this.scene.stop();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.shopManager.resetRerollCost();
      this.onDone?.();
      this.scene.stop();
    });
  }

  private numberToColorStr(color: number): string {
    return '#' + color.toString(16).padStart(6, '0');
  }

  private displayOfferings(offerings: ShopItemData[]): void {
    const cardWidth = 220;
    const totalWidth = offerings.length * cardWidth + (offerings.length - 1) * 20;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    offerings.forEach((item, i) => {
      const x = startX + i * (cardWidth + 20);
      const y = GAME_HEIGHT / 2;

      const container = this.add.container(x, y);
      const rarityColor = this.getRarityColor(item.rarity);

      const bg = this.add.rectangle(0, 0, cardWidth, 180, 0x2a1a3e)
        .setStrokeStyle(2, rarityColor)
        .setInteractive({ useHandCursor: true });

      const nameText = this.add.text(0, -60, item.name, {
        fontSize: '18px', fontFamily: 'monospace', color: this.numberToColorStr(rarityColor)
      }).setOrigin(0.5, 0.5);

      const descText = this.add.text(0, -15, item.description, {
        fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa'
      }).setOrigin(0.5, 0.5);

      const costText = this.add.text(0, 30, `${item.cost}a`, {
        fontSize: '18px', fontFamily: 'monospace', color: '#ffcc00'
      }).setOrigin(0.5, 0.5);

      const buyText = this.add.text(0, 65, '[SATIN AL]', {
        fontSize: '14px', fontFamily: 'monospace', color: '#33ff33'
      }).setOrigin(0.5, 0.5);

      container.add([bg, nameText, descText, costText, buyText]);
      this.itemCards.push(container);

      bg.on('pointerover', () => bg.setStrokeStyle(3, 0xffcc00));
      bg.on('pointerout', () => bg.setStrokeStyle(2, rarityColor));
      bg.on('pointerdown', () => {
        if (this.player.gold < item.cost) return;

        // D2: Handle weapon purchases
        if (item.type === 'weapon') {
          if (!this.player.canAddWeapon) {
            buyText.setText('DOLU');
            buyText.setColor('#ff3333');
            return;
          }
          // Extract weapon id from shop item id (e.g., 'weapon_knife' -> 'knife')
          const weaponId = item.id.replace('weapon_', '');
          if (this.player.weaponIds.includes(weaponId)) {
            buyText.setText('SAHİPSİN');
            buyText.setColor('#ff3333');
            return;
          }
          this.player.gold -= item.cost;
          const gameScene = this.scene.get('GameScene') as any;
          gameScene?.addWeaponById?.(weaponId);
          this.updateGold();
          buyText.setText('SATILDI');
          buyText.setColor('#666666');
          bg.disableInteractive();
          return;
        }

        // Passive item purchase
        this.player.gold -= item.cost;
        // HP Potion: anlık iyileşme, max can arttırmaz
        if (item.id === 'hp_potion') {
          this.player.currentHp = Math.min(this.player.currentHp + 40, this.player.stats.maxHp);
          this.updateGold();
          buyText.setText('İÇİLDİ ♥');
          buyText.setColor('#ff6666');
          bg.disableInteractive();
          return;
        }
        const stats = item.statModifiers;
        if (stats.maxHp) { this.player.stats.maxHp += stats.maxHp; this.player.currentHp += stats.maxHp; }
        if (stats.speed) this.player.stats.speed += stats.speed;
        if (stats.damage) this.player.stats.damage *= (1 + stats.damage);
        if (stats.attackSpeed) this.player.stats.attackSpeed += stats.attackSpeed;
        if (stats.armor) this.player.stats.armor += stats.armor;
        if (stats.pickupRange) this.player.stats.pickupRange += stats.pickupRange;
        if (stats.luck) this.player.stats.luck += stats.luck;

        // Track passive item for weapon evolution
        if (!this.player.passiveItems.includes(item.id)) {
          this.player.passiveItems.push(item.id);
        }

        this.updateGold();
        buyText.setText('SATILDI');
        buyText.setColor('#666666');
        bg.disableInteractive();
      });
    });
  }

  private clearCards(): void {
    this.itemCards.forEach(c => c.destroy());
    this.itemCards = [];
  }

  private updateGold(): void {
    this.goldText.setText(`Altın: ${this.player.gold}`);
  }

  private getRarityColor(rarity: string): number {
    switch (rarity) {
      case 'common': return 0xaaaaaa;
      case 'uncommon': return 0x33cc33;
      case 'rare': return 0x3333ff;
      case 'legendary': return 0xffcc00;
      default: return 0xaaaaaa;
    }
  }
}
