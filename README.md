# Şafak Yok

**Blakfy Studio** tarafından geliştirilmiş Vampire Survivors tarzı bir hayatta kalma oyunu.

> 30 dalga boyunca düşmanları yen, güçlen, boss'ları yen — şafak sökmesin!

---

## Teknolojiler

| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| [Phaser 3](https://phaser.io/) | ^3.90.0 | Oyun motoru |
| [Electron](https://www.electronjs.org/) | ^41.0.2 | Masaüstü uygulama |
| [TypeScript](https://www.typescriptlang.org/) | ^5.9.3 | Dil |
| [Vite](https://vitejs.dev/) | ^8.0.0 | Build aracı |
| Web Audio API | — | Prosedürel müzik & ses efektleri |

---

## Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org/) v18 veya üzeri
- npm v9 veya üzeri

### Adımlar

```bash
# 1. Repoyu klonla
git clone https://github.com/blakfy/safak-yok.git
cd safak-yok

# 2. Bağımlılıkları yükle
npm install

# 3. Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda `http://localhost:5173` adresinde oyun açılır.

---

## Scriptler

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme modunda çalıştırır (hot reload) |
| `npm run build` | TypeScript derler + Vite production build |
| `npm run preview` | Production build'i önizler |
| `npm run dist` | Windows için masaüstü `.exe` üretir |

---

## Masaüstü Build ve Dağıtım (Windows)

### Build al

```bash
npm run dist
```

Build tamamlandığında masaüstünde `SafakYok-Build/` klasörü oluşur ve içinde **`SafakYok.zip`** dosyası hazır olur.

> Çıktı dizinini değiştirmek için `package.json` → `build.directories.output` değerini düzenleyin.

---

### Oyuncular nasıl yükler?

Kurulum gerektirmez. Kullanıcı yalnızca şunları yapar:

1. **`SafakYok.zip`** dosyasını indir
2. Bir klasöre **çıkart** (örneğin `C:\Oyunlar\SafakYok\`)
3. `Şafak Yok.exe` dosyasına **çift tıkla** → oyun açılır

> İlk açılışta Windows Defender "bilinmeyen yayıncı" uyarısı verebilir.
> **"Daha fazla bilgi" → "Yine de çalıştır"** seçeneğiyle geçilebilir.
> (İmzasız uygulama olduğu için normaldir — imzalama için bir kod imzalama sertifikası gerekir.)

---

## Proje Yapısı

```
safak-yok/
├── electron/              # Electron ana süreç dosyaları
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── data/              # Karakter ve oyun verileri (JSON)
│   ├── entities/          # Player, Enemy, Projectile, XPGem, GoldCoin...
│   ├── scenes/            # Phaser sahneleri (MainMenu, Game, Pause, Shop...)
│   ├── systems/           # AudioManager, WaveManager, CollisionSystem, SaveManager...
│   ├── ui/                # HUD, Minimap, arayüz bileşenleri
│   ├── utils/             # Sabitler, tipler, matematik yardımcıları
│   └── weapons/           # Silah sistemi (Knife, Whip, Garlic, HolyWater, CrossBoomerang)
├── assets/
│   └── sprites/           # Görseller ve ikonlar
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Oynanış

### Kontroller

| Tuş | Aksiyon |
|-----|---------|
| `W A S D` / Ok tuşları | Hareket |
| `Space` | Dash (kaçış) |
| `ESC` | Duraklat / Ayarlar |

### Oyun Döngüsü

1. Karakter seç (Antonio, Mortis, Fang)
2. 30 dalga boyunca düşmanları yen
3. Dalgalar arasında dükkan açılır — altın ile item satın al
4. Her 5. dalgada **Boss** (Nekromancı) çıkar
5. 30. dalgayı tamamla → Zafer!

### Karakterler

| Karakter | Can | Hız | Özellik | Pasif |
|----------|-----|-----|---------|-------|
| **Antonio** | 100 | 220 | Dengeli, Bıçak ile başlar | Her 20 öldürmede 5 can yeniler |
| **Mortis** | 150 | 190 | Zırhlı tank, Haç Bumerangi | %30 şansla yakına 3 hasar yansıtır |
| **Fang** | 70 | 260 | Hızlı, +%30 hasar, Kırbaç | Her öldürmede %25 şansla 2 can kazanır |

### Zorluklar

| Zorluk | Etki |
|--------|------|
| Kolay | Düşman ×0.5 hasar / ×0.7 can — Oyuncu ×1.5 hasar |
| Normal | Standart denge |
| Zor | Düşman ×1.5 hasar / ×1.5 can — Oyuncu ×0.8 hasar |

---

## Kayıt Sistemi

Oyun verileri tarayıcının `localStorage` alanına kaydedilir:

- Toplam altın (karakterleri açmak için)
- En yüksek skor
- Toplam öldürme / run sayısı
- Açılan karakterler ve silahlar
- Zorluk ve ses ayarları

---

## Lisans

MIT © 2024 Blakfy Studio
