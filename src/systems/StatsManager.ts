import { Stats, ShopItemData } from '../utils/types';
import { Player } from '../entities/Player';

export class StatsManager {
  private player: Player;
  private items: Map<string, number> = new Map(); // itemId -> stack count

  constructor(player: Player) {
    this.player = player;
  }

  addItem(item: ShopItemData): boolean {
    const current = this.items.get(item.id) ?? 0;
    if (current >= item.maxStack) return false;

    this.items.set(item.id, current + 1);
    this.applyStatModifiers(item.statModifiers);
    return true;
  }

  private applyStatModifiers(mods: Partial<Stats>): void {
    if (mods.maxHp) {
      this.player.stats.maxHp += mods.maxHp;
      this.player.currentHp += mods.maxHp;
    }
    if (mods.speed) this.player.stats.speed += mods.speed;
    if (mods.damage) this.player.stats.damage += mods.damage;
    if (mods.attackSpeed) this.player.stats.attackSpeed += mods.attackSpeed;
    if (mods.armor) this.player.stats.armor += mods.armor;
    if (mods.pickupRange) this.player.stats.pickupRange += mods.pickupRange;
    if (mods.luck) this.player.stats.luck += mods.luck;
  }

  getItemCount(itemId: string): number {
    return this.items.get(itemId) ?? 0;
  }

  getOwnedPassiveIds(): string[] {
    return Array.from(this.items.keys());
  }
}
