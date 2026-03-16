/**
 * Generates assets/sprites/ui/icon.png — a 256x256 dark-purple icon
 * with a simple skull silhouette, using only Node.js built-ins.
 * Run: node scripts/generate-icon.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

const SIZE = 256;

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcVal]);
}

// Pixel helper — returns [R, G, B, A]
function getPixel(x, y) {
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: dark purple
  const bg = [14, 6, 30, 255];

  // Outer ring glow
  if (r > 100 && r < 116) {
    const t = 1 - Math.abs(r - 108) / 8;
    return [Math.round(80 * t + 14), Math.round(0 * t + 6), Math.round(120 * t + 30), 255];
  }

  // Skull shape (simplified circle + jaw)
  const skullR = 60;
  // Main skull circle
  if (r < skullR) {
    // Eye sockets
    const eye1 = Math.sqrt((dx + 18) ** 2 + (dy + 5) ** 2);
    const eye2 = Math.sqrt((dx - 18) ** 2 + (dy + 5) ** 2);
    if (eye1 < 12 || eye2 < 12) return [14, 6, 30, 255]; // eye sockets = background
    // Nasal cavity
    const nose = Math.sqrt(dx ** 2 + (dy - 10) ** 2);
    if (nose < 7) return [14, 6, 30, 255];
    return [180, 140, 220, 255]; // skull color — light purple
  }

  // Jaw
  if (dy > 20 && dy < 48 && Math.abs(dx) < 30) {
    // Teeth gaps
    const tx = ((dx + 30) / 12) | 0;
    if (tx % 2 === 0 && dy < 38) return [14, 6, 30, 255];
    return [180, 140, 220, 255];
  }

  return bg;
}

// Build raw RGBA image data (filter byte = 0 per row)
const rows = [];
for (let y = 0; y < SIZE; y++) {
  const row = [0]; // filter byte: None
  for (let x = 0; x < SIZE; x++) {
    const [r, g, b, a] = getPixel(x, y);
    row.push(r, g, b, a);
  }
  rows.push(...row);
}

const rawData = Buffer.from(rows);
const compressed = deflateSync(rawData);

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr.writeUInt8(8, 8);  // bit depth
ihdr.writeUInt8(6, 9);  // color type: RGBA
ihdr.writeUInt8(0, 10);
ihdr.writeUInt8(0, 11);
ihdr.writeUInt8(0, 12);

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', compressed),
  pngChunk('IEND', Buffer.alloc(0))
]);

mkdirSync('assets/sprites/ui', { recursive: true });
writeFileSync('assets/sprites/ui/icon.png', png);
console.log('✓ Icon oluşturuldu: assets/sprites/ui/icon.png (256×256)');
