import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { WeaponBase } from '../weapons/WeaponBase';
import { Player } from '../entities/Player';
import { UpgradeOption } from '../utils/types';
import { shuffle } from '../utils/math';

export class LevelUpScene extends Phaser.Scene {
  private onSelect?: (choice: string) => void;
  private selected: boolean = false;

  constructor() {
    super({ key: 'LevelUpScene' });
  }

  create(data: { weapons: WeaponBase[]; player: Player; onSelect: (choice: string) => void }): void {
    this.selected = false;
    this.onSelect = data.onSelect;

    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setScrollFactor(0);

    // Başlık
    this.add.text(GAME_WIDTH / 2, 55, 'SEVİYE ATLADI!', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.add.text(GAME_WIDTH / 2, 88, `Seviye ${data.player.level}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#888888'
    }).setOrigin(0.5, 0.5);

    // 3 seçenek üret
    const options = this.generateOptions(data.weapons, data.player);

    const cardWidth = 240;
    const cardHeight = 190;
    const totalWidth = options.length * cardWidth + (options.length - 1) * 20;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    options.forEach((option, i) => {
      const x = startX + i * (cardWidth + 20);
      const y = GAME_HEIGHT / 2 + 30;

      // Kart rengi: silah = mor, pasif = koyu mavi, yeni silah = koyu yeşil
      const cardColor = option.type === 'weapon_upgrade' ? 0x2a1a4e
        : option.type === 'weapon_new' ? 0x0f2a1a
        : 0x0a1a2e;
      const strokeColor = option.type === 'weapon_upgrade' ? 0x9966ff
        : option.type === 'weapon_new' ? 0x33cc66
        : 0x3388cc;

      const card = this.add.rectangle(x, y, cardWidth, cardHeight, cardColor)
        .setStrokeStyle(2, strokeColor)
        .setInteractive({ useHandCursor: true });

      // Tür ikonu
      const icon = option.type === 'weapon_upgrade' ? '⚔' : option.type === 'weapon_new' ? '✦' : '◈';
      this.add.text(x, y - 72, icon, {
        fontSize: '20px', fontFamily: 'monospace', color: `#${strokeColor.toString(16).padStart(6, '0')}`
      }).setOrigin(0.5, 0.5);

      // İsim
      this.add.text(x, y - 48, option.name, {
        fontSize: '15px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
        wordWrap: { width: cardWidth - 16 }, align: 'center'
      }).setOrigin(0.5, 0.5);

      // Açıklama
      this.add.text(x, y + 2, option.description, {
        fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa',
        wordWrap: { width: cardWidth - 20 }, align: 'center'
      }).setOrigin(0.5, 0.5);

      // Seviye göstergesi
      if (option.level) {
        this.add.text(x, y + 58, `Lv.${option.level}`, {
          fontSize: '13px', fontFamily: 'monospace', color: '#ffcc00'
        }).setOrigin(0.5, 0.5);
      }

      // Tuş ipucu
      this.add.text(x, y + cardHeight / 2 - 12, `[${i + 1}]`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#555555'
      }).setOrigin(0.5, 0.5);

      card.on('pointerover', () => { card.setStrokeStyle(3, 0xffcc00); });
      card.on('pointerout',  () => { card.setStrokeStyle(2, strokeColor); });
      card.on('pointerdown', () => this.selectOption(option));
    });

    // Klavye kısayolları
    this.input.keyboard?.on('keydown-ONE',   () => options[0] && this.selectOption(options[0]));
    this.input.keyboard?.on('keydown-TWO',   () => options[1] && this.selectOption(options[1]));
    this.input.keyboard?.on('keydown-THREE', () => options[2] && this.selectOption(options[2]));
  }

  private generateOptions(weapons: WeaponBase[], player: Player): UpgradeOption[] {
    const level = player.level;
    const options: UpgradeOption[] = [];

    // 1. Mevcut silahları yükselt (her zaman öncelikli)
    for (const weapon of weapons) {
      if (!weapon.isMaxLevel) {
        options.push({
          type: 'weapon_upgrade',
          id: weapon.data.id,
          name: weapon.data.name,
          description: `Hasar, hız ve menzil artar`,
          level: weapon.level + 1
        });
      }
    }

    // 2. Yeni silah — oyuncu 6'dan az silaha sahipse + level >= 2
    if (player.canAddWeapon && level >= 2) {
      const allWeaponPool: { id: string; name: string; description: string }[] = [
        { id: 'knife',          name: 'Fırlatma Bıçağı', description: 'En yakın düşmanı otomatik hedefler' },
        { id: 'garlic',         name: 'Sarımsak',        description: 'Yakındaki düşmanlara hasar veren aura' },
        { id: 'whip',           name: 'Kırbaç',          description: 'Önde süpüren yakın dövüş saldırısı' },
        { id: 'holy_water',     name: 'Kutsal Su',        description: 'Yerde alan hasarı gölcüğü oluşturur' },
        { id: 'cross_boomerang',name: 'Haç Bumerangi',   description: 'Size geri dönen bumerang' },
      ];
      const unowned = allWeaponPool.filter(w => !player.weaponIds.includes(w.id));
      if (unowned.length > 0) {
        const pick = unowned[Math.floor(Math.random() * unowned.length)];
        options.push({
          type: 'weapon_new',
          id: pick.id,
          name: `✦ ${pick.name}`,
          description: pick.description
        });
      }
    }

    // 3. Pasif havuzu — seviyeye göre açılır, alınmış olanlar kaldırılır
    const taken = new Set(player.passiveItems);

    // Temel pasifler (her seviyede)
    const basicPassives: UpgradeOption[] = [
      { type: 'passive', id: 'hp_up',      name: '+25 Maks Can',     description: 'Maksimum canı artırır' },
      { type: 'passive', id: 'speed_up',   name: '+15 Hız',          description: 'Daha hızlı hareket et' },
      { type: 'passive', id: 'damage_up',  name: '+10% Hasar',       description: 'Tüm silahlar daha fazla hasar verir' },
      { type: 'passive', id: 'pickup_up',  name: '+20 Toplama',      description: 'Daha geniş XP ve altın toplama alanı' },
    ];

    // Orta seviye pasifler (level 3+)
    const midPassives: UpgradeOption[] = level >= 3 ? [
      { type: 'passive', id: 'armor_up',         name: '+1 Zırh',          description: 'Her vuruşta 1 hasar azaltır' },
      { type: 'passive', id: 'attack_speed_up',  name: '+8% Saldırı Hızı', description: 'Tüm silahlar daha hızlı saldırır' },
      { type: 'passive', id: 'hp_regen',         name: 'Can Yenileme',     description: 'Her 5 saniyede 1 Can kazanırsın' },
    ] : [];

    // İleri seviye pasifler (level 6+)
    const advPassives: UpgradeOption[] = level >= 6 ? [
      { type: 'passive', id: 'luck_up',          name: '+15% Şans',        description: 'Daha fazla altın ve item bulursun' },
      { type: 'passive', id: 'crit_up',          name: '+5% Kritik',       description: 'Kritik vuruş şansı artar' },
      { type: 'passive', id: 'dash_up',          name: 'Hızlı Kaçış',     description: 'Dash bekleme süresi %20 azalır' },
    ] : [];

    // Zaten alınmış olanları filtrele (max 3 kez alınabilir)
    const countTaken = (id: string) => player.passiveItems.filter(p => p === id).length;
    const allPassives = [...basicPassives, ...midPassives, ...advPassives]
      .filter(p => countTaken(p.id) < 3);

    const shuffled = shuffle(allPassives);
    while (options.length < 3 && shuffled.length > 0) {
      options.push(shuffled.shift()!);
    }

    return shuffle(options).slice(0, 3);
  }

  private selectOption(option: UpgradeOption): void {
    if (this.selected) return;
    this.selected = true;

    if (option.type === 'passive') {
      const gameScene = this.scene.get('GameScene') as any;
      const player = gameScene?.player as Player | undefined;
      if (player) {
        player.passiveItems.push(option.id);
        // Stat değişiklikleri Player.applyPassive'de — hp_regen/crit_up/dash_up GameScene'de
        player.applyPassive(option.id);
      }
    }

    this.onSelect?.(option.id);
    this.scene.stop();
  }
}
