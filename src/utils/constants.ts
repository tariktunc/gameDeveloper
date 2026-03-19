// Display
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// Arena
export const ARENA_WIDTH = 3200;
export const ARENA_HEIGHT = 1800;

// Spatial grid
export const GRID_CELL_SIZE = 64;

// Pool sizes
export const MAX_ENEMIES = 500;
export const MAX_PROJECTILES = 300;
export const MAX_XP_GEMS = 200;
export const MAX_GOLD_COINS = 200;

// Player defaults
export const PLAYER_SPEED = 160;
export const PLAYER_MAX_HP = 100;
export const PLAYER_PICKUP_RANGE = 80;
export const PLAYER_INVINCIBILITY_TIME = 500; // ms

// XP thresholds per level (cumulative) – 30 levels, early levels fast, late levels gradual
export const XP_THRESHOLDS = [
  0,    3,    8,   15,   25,   38,   54,   73,   95,  120,   // 1-10: fast early ramp
  150, 185,  225,  270,  320,  378,  442,  514,  594,  684,  // 11-20: mid game
  784, 896, 1020, 1160, 1316, 1490, 1684, 1900, 2140, 2410  // 21-30: gradual late game
];

// Wave
export const WAVE_DURATION = 30_000; // 30s default (overridden by WaveManager per wave)
export const WAVE_SPAWN_INTERVAL = 1500; // ms between spawns (base, overridden by WaveManager)
export const WAVE_COUNT = 10;

// Shop
export const SHOP_REROLL_COST = 10;

// Combat
export const DAMAGE_FLASH_DURATION = 100; // ms
export const KNOCKBACK_FORCE = 50;

// Colors
export const COLOR_HP_BAR = 0xff3333;
export const COLOR_HP_BG = 0x333333;
export const COLOR_XP_BAR = 0x33ccff;
export const COLOR_GOLD = 0xffcc00;
