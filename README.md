# Şafak Yok

**Blakfy Studio** tarafından geliştirilmiş Vampire Survivors tarzı bir hayatta kalma oyunu.

> 10 level (~20 dakika) boyunca düşmanları yen, güçlen, boss'ları yen — şafak sökmesin!

---

## Oynamak İçin — Kurulum Gerekmez

1. Bu sayfada yeşil **`< > Code`** butonuna tıkla → **Download ZIP**
2. ZIP'i bir klasöre çıkart
3. **`EXE DOSYASI`** klasörüne gir
4. **`SafakYok.exe`** dosyasına çift tıkla → oyun açılır

> **Windows Defender uyarısı** çıkarsa:
> "Daha fazla bilgi" → "Yine de çalıştır" seçeneğine tıkla.
> (İmzasız uygulama olduğu için normaldir.)

---

## Oynanış

### Kontroller

| Tuş | Aksiyon |
|-----|---------|
| `W A S D` / Ok tuşları | Hareket |
| `Space` | Dash (kaçış) |
| `ESC` | Duraklat / Ses Ayarı |

### Oyun Döngüsü

1. Karakter seç (Tarık veya Mumin)
2. 10 level (~20 dakika) boyunca düşmanları yen
3. Dalgalar arasında dükkan açılır — altın ile item satın al
4. Her level'in **%75'inde Sezer** (mini boss) çıkar
5. Her level sonunda **rakip boss** çıkar — Tarık seçersen Mumin boss olarak gelir, Mumin seçersen Tarık gelir
6. 10. leveli tamamla → Zafer!

### Karakterler

| Karakter | Can | Hız | Pasif Yetenek |
|----------|-----|-----|---------------|
| **Tarık** | 100 | 230 | Savaşçı Ruhu |
| **Mumin** | 80 | 260 | Kan Emici |

### Zorluklar

| Zorluk | Etki |
|--------|------|
| Kolay | Düşman ×0.5 hasar / ×0.7 can — Oyuncu ×1.5 hasar |
| Normal | Standart denge |
| Zor | Düşman ×1.5 hasar / ×1.5 can — Oyuncu ×0.8 hasar |

---

## Geliştirici Kurulumu

Kaynak koddan çalıştırmak veya değişiklik yapmak isteyenler için:

### Gereksinimler

- [Node.js](https://nodejs.org/) v18+
- npm v9+

### Adımlar

```bash
git clone https://github.com/blakfy/safak-yok.git
cd safak-yok
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresinde açılır.

### Scriptler

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme modu (hot reload) |
| `npm run build` | Production build |
| `npm run dist` | Windows `.exe` üretir |

---

## Teknolojiler

| Teknoloji | Kullanım |
|-----------|----------|
| [Phaser 3](https://phaser.io/) | Oyun motoru |
| [Electron](https://www.electronjs.org/) | Masaüstü uygulama |
| [TypeScript](https://www.typescriptlang.org/) | Dil |
| [Vite](https://vitejs.dev/) | Build aracı |
| Web Audio API | Prosedürel müzik & ses efektleri |

---

## Lisans

MIT © 2024 Blakfy Studio
