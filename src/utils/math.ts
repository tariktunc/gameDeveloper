export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(distanceSq(x1, y1, x2, y2));
}

export function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Oyuncuya yakın rastgele spawn pozisyonu (dalga başlangıcı için) */
export function getSpawnPositionNearPlayer(
  playerX: number, playerY: number,
  minDist: number, maxDist: number,
  arenaW: number, arenaH: number
): { x: number; y: number } {
  const angle = Math.random() * Math.PI * 2;
  const dist = minDist + Math.random() * (maxDist - minDist);
  return {
    x: clamp(playerX + Math.cos(angle) * dist, 16, arenaW - 16),
    y: clamp(playerY + Math.sin(angle) * dist, 16, arenaH - 16)
  };
}

/** Get a random spawn position outside camera view but inside arena */
export function getSpawnPositionOutsideCamera(
  camX: number, camY: number,
  camW: number, camH: number,
  arenaW: number, arenaH: number,
  margin: number = 50
): { x: number; y: number } {
  const side = Math.floor(Math.random() * 4);
  let x: number, y: number;

  switch (side) {
    case 0: // top
      x = randomInRange(0, arenaW);
      y = camY - margin;
      break;
    case 1: // right
      x = camX + camW + margin;
      y = randomInRange(0, arenaH);
      break;
    case 2: // bottom
      x = randomInRange(0, arenaW);
      y = camY + camH + margin;
      break;
    default: // left
      x = camX - margin;
      y = randomInRange(0, arenaH);
      break;
  }

  return {
    x: clamp(x, 16, arenaW - 16),
    y: clamp(y, 16, arenaH - 16)
  };
}
