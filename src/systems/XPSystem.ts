import { Player } from '../entities/Player';
import { XP_THRESHOLDS } from '../utils/constants';

export class XPSystem {
  private player: Player;
  public onLevelUp?: (level: number) => void;

  constructor(player: Player) {
    this.player = player;
  }

  addXP(amount: number): void {
    this.player.xp += amount;
    this.checkLevelUp();
  }

  private checkLevelUp(): void {
    while (this.player.level < XP_THRESHOLDS.length) {
      const threshold = XP_THRESHOLDS[this.player.level];
      if (threshold === undefined) break;
      if (this.player.xp >= threshold) {
        this.player.level++;
        this.onLevelUp?.(this.player.level);
      } else {
        break;
      }
    }
  }

  get xpToNextLevel(): number {
    if (this.player.level >= XP_THRESHOLDS.length) return Infinity;
    return XP_THRESHOLDS[this.player.level] - this.player.xp;
  }

  get xpProgress(): number {
    if (this.player.level >= XP_THRESHOLDS.length) return 1;
    const current = this.player.level > 0 ? XP_THRESHOLDS[this.player.level - 1] : 0;
    const next = XP_THRESHOLDS[this.player.level];
    if (next === undefined) return 1;
    return (this.player.xp - current) / (next - current);
  }
}
