import { createWriteStream, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';

// Output dir from package.json build config
const OUTPUT_DIR = 'C:/Users/tarkt/Desktop/SafakYok-Build';
const UNPACKED_DIR = join(OUTPUT_DIR, 'win-unpacked');
const ZIP_PATH = join(OUTPUT_DIR, 'SafakYok.zip');

if (!existsSync(UNPACKED_DIR)) {
  console.error('win-unpacked klasörü bulunamadı:', UNPACKED_DIR);
  process.exit(1);
}

const output = createWriteStream(ZIP_PATH);
const archive = archiver('zip', { zlib: { level: 6 } });

output.on('close', () => {
  const mb = (archive.pointer() / 1024 / 1024).toFixed(1);
  console.log(`\n✅ ZIP hazır: ${ZIP_PATH} (${mb} MB)`);
  console.log('📦 Kullanıcılar bu dosyayı indirip çıkartarak Şafak Yok.exe\'yi çalıştırabilir.\n');
});

archive.on('error', (err) => { throw err; });
archive.pipe(output);

// Tüm win-unpacked içeriğini "SafakYok/" klasörü altına ekle
archive.directory(UNPACKED_DIR, 'SafakYok');

await archive.finalize();
