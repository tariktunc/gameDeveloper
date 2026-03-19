export interface Stats {
  maxHp: number;
  speed: number;
  damage: number;
  attackSpeed: number; // multiplier, 1.0 = normal
  armor: number;
  pickupRange: number;
  luck: number; // multiplier for crit/drop rates
}

export interface WeaponData {
  id: string;
  name: string;
  damage: number;
  cooldown: number; // ms
  projectileSpeed: number;
  projectileCount: number;
  pierce: number;
  range: number;
  type: 'projectile' | 'melee' | 'aura' | 'area';
  evolutionId?: string;
  evolutionRequires?: string; // passive item id
}

export interface EnemyData {
  id: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  xpValue: number;
  goldValue: number;
  spriteKey: string;
  frame?: number;
  isBoss: boolean;
}

export interface WaveData {
  waveNumber: number;
  duration: number;
  enemies: WaveEnemySpawn[];
  bossId?: string;
}

export interface WaveEnemySpawn {
  enemyId: string;
  count: number;
  spawnInterval: number;
  startDelay?: number;
}

export interface ShopItemData {
  id: string;
  name: string;
  description: string;
  cost: number;
  statModifiers: Partial<Stats>;
  maxStack: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  icon: string;
  type?: 'passive' | 'weapon';
}

export interface CharacterData {
  id: string;
  name: string;
  description: string;
  passive: string;
  startingWeapon: string;
  baseStats: Stats;
  spriteKey: string;
  bossRivalId: string;
}

export interface SaveData {
  gold: number;
  unlockedCharacters: string[];
  unlockedWeapons: string[];
  highScore: number;
  totalKills: number;
  totalRuns: number;
  difficulty: 'easy' | 'normal' | 'hard';
  musicVolume: number;   // 0.0 - 1.0
  sfxVolume: number;     // 0.0 - 1.0
  showFps: boolean;
  showDamageNumbers: boolean;
  cameraShake: boolean;
}

export interface UpgradeOption {
  type: 'weapon_new' | 'weapon_upgrade' | 'passive';
  id: string;
  name: string;
  description: string;
  level?: number;
}

/** Devam kayıt verisi — mevcut run'u kaydeder/yükler */
export interface RunSaveData {
  characterId: string;
  wave: number;          // kayıt anındaki tamamlanan dalga (devamda wave+1'den başlanır)
  playerLevel: number;
  playerHp: number;
  playerStats: Stats;
  passiveItems: string[];
  weaponIds: string[];
  weaponLevels: Record<string, number>; // id → level
  gold: number;
  kills: number;
}
