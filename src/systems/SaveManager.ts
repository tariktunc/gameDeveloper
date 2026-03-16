import { SaveData } from '../utils/types';

const SAVE_KEY = 'safak_yok_save';

const DEFAULT_SAVE: SaveData = {
  gold: 0,
  unlockedCharacters: ['default'],
  unlockedWeapons: ['knife'],
  highScore: 0,
  totalKills: 0,
  totalRuns: 0,
  difficulty: 'normal',
  musicVolume: 0.8
};

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_SAVE };
  }

  save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // ignore
    }
  }

  get saveData(): SaveData {
    return this.data;
  }

  updateAfterRun(kills: number, score: number): void {
    this.data.totalKills += kills;
    this.data.totalRuns++;
    if (score > this.data.highScore) {
      this.data.highScore = score;
    }
    this.save();
  }

  addGold(amount: number): void {
    this.data.gold = Math.max(0, this.data.gold + amount);
    this.save();
  }

  unlockCharacter(id: string): void {
    if (!this.data.unlockedCharacters.includes(id)) {
      this.data.unlockedCharacters.push(id);
      this.save();
    }
  }

  unlockWeapon(id: string): void {
    if (!this.data.unlockedWeapons.includes(id)) {
      this.data.unlockedWeapons.push(id);
      this.save();
    }
  }

  get difficulty(): 'easy' | 'normal' | 'hard' {
    return this.data.difficulty ?? 'normal';
  }

  setDifficulty(difficulty: 'easy' | 'normal' | 'hard'): void {
    this.data.difficulty = difficulty;
    this.save();
  }

  get musicVolume(): number {
    return this.data.musicVolume ?? 0.8;
  }

  setMusicVolume(volume: number): void {
    this.data.musicVolume = Math.max(0, Math.min(1, volume));
    this.save();
  }
}
