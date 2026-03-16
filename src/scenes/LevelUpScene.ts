import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { WeaponBase } from '../weapons/WeaponBase';
import { Player } from '../entities/Player';
import { UpgradeOption } from '../utils/types';

export class LevelUpScene extends Phaser.Scene {
  private onSelect?: (choice: string) => void;

  constructor() {
    super({ key: 'LevelUpScene' });
  }

  create(data: { weapons: WeaponBase[]; player: Player; onSelect: (choice: string) => void }): void {
    this.onSelect = data.onSelect;

    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setScrollFactor(0);

    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'SEVİYE ATLADI!', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffcc00'
    }).setOrigin(0.5, 0.5);

    // Generate 3 upgrade options
    const options = this.generateOptions(data.weapons, data.player);

    // Display cards
    const cardWidth = 240;
    const cardHeight = 160;
    const totalWidth = options.length * cardWidth + (options.length - 1) * 20;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    options.forEach((option, i) => {
      const x = startX + i * (cardWidth + 20);
      const y = GAME_HEIGHT / 2 + 20;

      // Card background
      const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0x2a1a3e)
        .setStrokeStyle(2, 0x6644aa)
        .setInteractive({ useHandCursor: true });

      // Name
      this.add.text(x, y - 50, option.name, {
        fontSize: '18px', fontFamily: 'monospace', color: '#ffffff'
      }).setOrigin(0.5, 0.5);

      // Description
      this.add.text(x, y, option.description, {
        fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa'
      }).setOrigin(0.5, 0.5);

      // Level indicator
      if (option.level) {
        this.add.text(x, y + 50, `Lv.${option.level}`, {
          fontSize: '14px', fontFamily: 'monospace', color: '#ffcc00'
        }).setOrigin(0.5, 0.5);
      }

      // Key hint
      this.add.text(x, y + cardHeight / 2 - 10, `[${i + 1}]`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#666666'
      }).setOrigin(0.5, 0.5);

      card.on('pointerover', () => card.setStrokeStyle(3, 0xffcc00));
      card.on('pointerout', () => card.setStrokeStyle(2, 0x6644aa));
      card.on('pointerdown', () => {
        this.selectOption(option);
      });
    });

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-ONE', () => options[0] && this.selectOption(options[0]));
    this.input.keyboard?.on('keydown-TWO', () => options[1] && this.selectOption(options[1]));
    this.input.keyboard?.on('keydown-THREE', () => options[2] && this.selectOption(options[2]));
  }

  private generateOptions(weapons: WeaponBase[], player: Player): UpgradeOption[] {
    const options: UpgradeOption[] = [];

    // Existing weapon upgrades
    for (const weapon of weapons) {
      if (!weapon.isMaxLevel) {
        options.push({
          type: 'weapon_upgrade',
          id: weapon.data.id,
          name: weapon.data.name,
          description: `+Hasar, +Hız`,
          level: weapon.level + 1
        });
      }
    }

    // F3: Offer a new weapon if player has fewer than 6 weapons
    const allWeaponPool: { id: string; name: string; description: string }[] = [
      { id: 'knife', name: 'Fırlatma Bıçağı', description: 'Hızlı mermi, en yakın düşmanı otomatik hedefler' },
      { id: 'garlic', name: 'Sarımsak', description: 'Yakındaki düşmanlara hasar veren aura' },
      { id: 'whip', name: 'Kırbaç', description: 'Önde süpüren yakın dövüş saldırısı' },
      { id: 'holy_water', name: 'Kutsal Su', description: 'Yerde alan hasarı gölcüğü oluşturur' },
      { id: 'cross_boomerang', name: 'Haç Bumerangi', description: 'Size geri dönen bumerang' },
    ];

    if (player.canAddWeapon) {
      const unowned = allWeaponPool.filter(w => !player.weaponIds.includes(w.id));
      if (unowned.length > 0) {
        const pick = unowned[Math.floor(Math.random() * unowned.length)];
        options.push({
          type: 'weapon_new',
          id: pick.id,
          name: `YENİ: ${pick.name}`,
          description: pick.description
        });
      }
    }

    const passives: UpgradeOption[] = [
      { type: 'passive', id: 'hp_up', name: '+20 Maks Can', description: 'Maks canı artırır' },
      { type: 'passive', id: 'speed_up', name: '+10 Hız', description: 'Daha hızlı hareket et' },
      { type: 'passive', id: 'damage_up', name: '+10% Hasar', description: 'Tüm silahlar daha fazla hasar verir' },
      { type: 'passive', id: 'pickup_up', name: '+15 Toplama', description: 'Daha geniş toplama alanı' },
    ];

    const shuffled = passives.sort(() => Math.random() - 0.5);
    while (options.length < 3 && shuffled.length > 0) {
      options.push(shuffled.shift()!);
    }

    // Shuffle all options and return 3
    const finalOptions = options.sort(() => Math.random() - 0.5);
    return finalOptions.slice(0, 3);
  }

  private selectOption(option: UpgradeOption): void {
    if (option.type === 'passive') {
      const gameScene = this.scene.get('GameScene') as any;
      const player = gameScene?.player as Player | undefined;
      if (player) {
        switch (option.id) {
          case 'hp_up':
            player.stats.maxHp += 20;
            player.currentHp += 20;
            break;
          case 'speed_up':
            player.stats.speed += 10;
            break;
          case 'damage_up':
            player.stats.damage += 0.1;
            break;
          case 'pickup_up':
            player.stats.pickupRange += 15;
            break;
        }
      }
    }

    this.onSelect?.(option.id);
    this.scene.stop();
  }
}
