import { ShopItemData } from '../utils/types';
import { SHOP_REROLL_COST } from '../utils/constants';

const PASSIVE_ITEMS: ShopItemData[] = [
  {
    id: 'bracer', name: 'Bilek Koruması', description: '+10% Saldırı Hızı',
    cost: 15, statModifiers: { attackSpeed: 0.1 }, maxStack: 5, rarity: 'common', icon: 'item_bracer', type: 'passive'
  },
  {
    id: 'hollow_heart', name: 'Boş Kalp', description: '+20 Maks Can',
    cost: 10, statModifiers: { maxHp: 20 }, maxStack: 5, rarity: 'common', icon: 'item_heart', type: 'passive'
  },
  {
    id: 'spinach', name: 'Ispanak', description: '+10% Hasar',
    cost: 15, statModifiers: { damage: 0.1 }, maxStack: 5, rarity: 'common', icon: 'item_spinach', type: 'passive'
  },
  {
    id: 'wings', name: 'Kanatlar', description: '+10 Hız',
    cost: 10, statModifiers: { speed: 10 }, maxStack: 5, rarity: 'common', icon: 'item_wings', type: 'passive'
  },
  {
    id: 'armor', name: 'Zırh', description: '+1 Zırh',
    cost: 20, statModifiers: { armor: 1 }, maxStack: 5, rarity: 'uncommon', icon: 'item_armor', type: 'passive'
  },
  {
    id: 'magnet', name: 'Mıknatıs', description: '+20 Toplama Alanı',
    cost: 10, statModifiers: { pickupRange: 20 }, maxStack: 3, rarity: 'common', icon: 'item_magnet', type: 'passive'
  },
  {
    id: 'clover', name: 'Yonca', description: '+10% Şans',
    cost: 15, statModifiers: { luck: 0.1 }, maxStack: 3, rarity: 'uncommon', icon: 'item_clover', type: 'passive'
  },
  {
    id: 'pummarola', name: 'Pummarola', description: '+5 Maks Can, +5 Hız',
    cost: 20, statModifiers: { maxHp: 5, speed: 5 }, maxStack: 3, rarity: 'uncommon', icon: 'item_pummarola', type: 'passive'
  },
  {
    id: 'hp_potion', name: 'Can İksiri', description: 'Anında +40 Can yeniler',
    cost: 25, statModifiers: { maxHp: 0 }, maxStack: 99, rarity: 'common', icon: 'item_hp_potion', type: 'passive'
  },
  {
    id: 'skull_omaniac', name: 'Kafatası', description: '+20% Hasar, +0.3 Şans',
    cost: 40, statModifiers: { damage: 0.2, luck: 0.3 }, maxStack: 3, rarity: 'rare', icon: 'item_skull', type: 'passive'
  },
  {
    id: 'stone_mask', name: 'Taş Maske', description: '+15% Saldırı Hızı, +2 Zırh',
    cost: 35, statModifiers: { attackSpeed: 0.15, armor: 2 }, maxStack: 2, rarity: 'rare', icon: 'item_mask', type: 'passive'
  },
  {
    id: 'spellbinder', name: 'Büyü Bağı', description: '+20% Saldırı Hızı',
    cost: 20, statModifiers: { attackSpeed: 0.2 }, maxStack: 4, rarity: 'uncommon', icon: 'item_spellbinder', type: 'passive'
  },
  {
    id: 'silver_ring', name: 'Gümüş Yüzük', description: '+15 Hız, +10% Şans',
    cost: 25, statModifiers: { speed: 15, luck: 0.1 }, maxStack: 3, rarity: 'uncommon', icon: 'item_ring', type: 'passive'
  }
];

const WEAPON_ITEMS: ShopItemData[] = [
  {
    id: 'weapon_knife', name: 'Bıçak', description: 'Menzilli: otomatik hedefli fırlatma bıçağı',
    cost: 30, statModifiers: {}, maxStack: 1, rarity: 'uncommon', icon: 'weapon_knife', type: 'weapon'
  },
  {
    id: 'weapon_whip', name: 'Kırbaç', description: 'Yakın: süpürme yay saldırısı',
    cost: 30, statModifiers: {}, maxStack: 1, rarity: 'uncommon', icon: 'weapon_whip', type: 'weapon'
  },
  {
    id: 'weapon_garlic', name: 'Sarımsak', description: 'Aura: yakındaki düşmanlara hasar',
    cost: 30, statModifiers: {}, maxStack: 1, rarity: 'uncommon', icon: 'weapon_garlic', type: 'weapon'
  },
  {
    id: 'weapon_holy_water', name: 'Kutsal Su', description: 'Alan: yerde hasar gölcüğü',
    cost: 30, statModifiers: {}, maxStack: 1, rarity: 'uncommon', icon: 'weapon_holy_water', type: 'weapon'
  },
  {
    id: 'weapon_cross_boomerang', name: 'Haç Bumerangi', description: 'Menzilli: size geri dönen bumerang',
    cost: 30, statModifiers: {}, maxStack: 1, rarity: 'uncommon', icon: 'weapon_cross_boomerang', type: 'weapon'
  }
];

export class ShopManager {
  private passiveItems: ShopItemData[];
  private weaponItems: ShopItemData[];
  private currentOfferings: ShopItemData[] = [];
  private rerollCost: number = SHOP_REROLL_COST;
  private currentWave: number = 1;

  constructor() {
    this.passiveItems = [...PASSIVE_ITEMS];
    this.weaponItems = [...WEAPON_ITEMS];
  }

  /** D3: Set wave for dynamic pricing */
  setWave(wave: number): void {
    this.currentWave = wave;
  }

  /** D3: Apply wave-based pricing to an item */
  private applyDynamicPricing(item: ShopItemData): ShopItemData {
    return {
      ...item,
      cost: item.cost + this.currentWave * 2
    };
  }

  generateOfferings(count: number = 3): ShopItemData[] {
    // D2: Mix weapons and passives (1 weapon + 2 passives if possible)
    const offerings: ShopItemData[] = [];

    // Pick 1 weapon
    const shuffledWeapons = [...this.weaponItems].sort(() => Math.random() - 0.5);
    if (shuffledWeapons.length > 0) {
      offerings.push(this.applyDynamicPricing(shuffledWeapons[0]));
    }

    // Fill remaining with passives
    const shuffledPassives = [...this.passiveItems].sort(() => Math.random() - 0.5);
    let passiveIdx = 0;
    while (offerings.length < count && passiveIdx < shuffledPassives.length) {
      offerings.push(this.applyDynamicPricing(shuffledPassives[passiveIdx]));
      passiveIdx++;
    }

    // Shuffle final order
    this.currentOfferings = offerings.sort(() => Math.random() - 0.5);
    return this.currentOfferings;
  }

  getOfferings(): ShopItemData[] {
    return this.currentOfferings;
  }

  reroll(playerGold: number): { offerings: ShopItemData[]; cost: number } | null {
    if (playerGold < this.rerollCost) return null;
    const cost = this.rerollCost;
    this.rerollCost += 2;
    return { offerings: this.generateOfferings(), cost };
  }

  resetRerollCost(): void {
    this.rerollCost = SHOP_REROLL_COST;
  }

  getRerollCost(): number {
    return this.rerollCost;
  }
}
