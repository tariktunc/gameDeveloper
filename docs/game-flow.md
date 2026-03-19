# Şafak Yok — Oyun Akış Diyagramı

## Sahne Geçiş Akışı

```mermaid
flowchart TD
    START([Oyun Başlatıldı]) --> BOOT[BootScene]
    BOOT --> PRELOAD[PreloadScene\nAsset & sprite üretimi]
    PRELOAD --> MENU[MainMenuScene]

    MENU --> |Oyna| CHARSEL[CharacterSelectScene\nAntonio / Mortis / Fang]
    MENU --> |Ayarlar| SETTINGS[SettingsScene\nSes / Zorluk]
    SETTINGS --> MENU

    CHARSEL --> |Karakter seç| GAME[GameScene\nAna oyun döngüsü]

    %% --- Oyun İçi Geçişler ---
    GAME --> |ESC tuşu| PAUSE[PauseScene\nModal Overlay]
    PAUSE --> |Devam Et / ESC| GAME
    PAUSE --> |Ana Menü → stopBGM| MENU

    GAME --> |XP eşiği & isTransitioning=false| LEVELUP[LevelUpScene\nModal Overlay]
    LEVELUP --> |Seçim yapıldı\nisTransitioning=false| GAME

    GAME --> |Dalga biter & isTransitioning=false| WAVECHECK{Son Dalga?}
    WAVECHECK --> |Evet| VICTORY[GameOverScene\nvictory: true 🏆]
    WAVECHECK --> |Hayır| SHOP[ShopScene\nModal Overlay]
    SHOP --> |Devam Et\nisTransitioning=false| GAME

    GAME --> |Oyuncu ölür| DEFEAT[GameOverScene\nvictory: false 💀]

    VICTORY --> |Tekrar Oyna| GAME
    VICTORY --> |Ana Menü| MENU
    DEFEAT --> |Tekrar Oyna| GAME
    DEFEAT --> |Ana Menü| MENU
```

---

## Oyun İçi Sistemler Akışı

```mermaid
flowchart TD
    UPDATE[GameScene.update\nHer frame] --> INPUT[InputManager\nWASD + Dash + ESC]
    UPDATE --> WEAPONS[Silah Sistemi\nAuto-saldırı döngüsü]
    UPDATE --> WAVE[WaveManager\nDüşman spawn & dalga sayacı]
    UPDATE --> COLLISION[CollisionSystem\nMermi + Düşman + Pickup]
    UPDATE --> XP[XPSystem\nXP toplama & seviye atlama]
    UPDATE --> HUD[HUD.update\nCan / XP / Dalga / Kombo]

    COLLISION --> |onEnemyHit| CRIT{Crit?\n%15×Şans max%40}
    CRIT --> |Evet| EXTRADMG[Ek hasar uygula\ntekEnemyKilled yok]
    CRIT --> |Hayır| NODMG[Normal hasar göster]

    COLLISION --> |onEnemyKilled| KILL[Öldürme Sistemi]
    KILL --> COMBO[Kombo Sayacı\n×1.25 / ×1.5 / ×2.0]
    KILL --> DROP[XP Taşı Düşür\nGold Coin Düşür]
    KILL --> PASSIVE[Karakter Pasif\nAntonio/Fang tetikle]

    XP --> |onLevelUp| TRANS{isTransitioning?}
    TRANS --> |false| EVOLUTION[Silah Evrimi Kontrol\nknife+bracer → Bin Kesik\nwhip+hollow_heart → Kanlı Yırtık\ngarlic+pummarola → Ruh Yiyen]
    EVOLUTION --> LVLUP[LevelUpScene Aç\nscene.pause]
    TRANS --> |true| SKIP[Atla]

    WAVE --> |onWaveComplete| TRANS2{isTransitioning?}
    TRANS2 --> |false| WAVEND[Dalga Sonu Mantığı\n+%10 Can İyileşme\nTüm entity temizle]
    TRANS2 --> |true| SKIP2[Atla]
```

---

## Silah Evrim Sistemi

```mermaid
flowchart LR
    KNIFE[🔪 Fırlatma Bıçağı\nMax Lv.8] --> |+ Bracer passive| THOUSAND[⚔️ Bin Kesik\n2× Hasar]
    WHIP[🪤 Kırbaç\nMax Lv.8] --> |+ Hollow Heart passive| BLOODY[🩸 Kanlı Yırtık\n2× Hasar]
    GARLIC[🧄 Sarımsak\nMax Lv.8] --> |+ Pummarola passive| SOUL[👻 Ruh Yiyen\n2× Hasar]
```

---

## Sahne Eş Zamanlılık Tablosu

| Durum | Aktif Sahneler |
|-------|---------------|
| Normal Oyun | GameScene ✅ |
| Level-Up | GameScene ⏸ + LevelUpScene ✅ |
| Dalga Arası | GameScene ⏸ + ShopScene ✅ |
| Pause | GameScene ⏸ + PauseScene ✅ |
| Oyun Bitti | GameOverScene ✅ |

> **Not:** `isTransitioning` bayrağı sayesinde LevelUpScene ve ShopScene aynı anda açılamaz (BUG-3 düzeltmesi).

---

## Düzeltilen Buglar Özeti

| # | Bug | Dosya | Düzeltme |
|---|-----|-------|----------|
| 1 | Damage passive toplamalı | LevelUpScene, ShopScene | `+= 0.1` → `*= 1.1` |
| 2 | Crit çift öldürme callback | GameScene | Fazladan `onEnemyKilled` çağrısı kaldırıldı |
| 3 | Aynı karede çift sahne | GameScene | `isTransitioning` bayrağı eklendi |
| 4 | LevelUp çift tıklama | LevelUpScene | `selected` guard eklendi |
| 5 | BGM Ana Menü'de çalmaya devam | PauseScene | `stopBGM()` Quit öncesi çağrıldı |
| 6 | Boss HP formülü karmaşık | WaveManager | `1+x-1` → `Math.floor(wave/5)` |
| 7 | Geç oyun gold açlığı | WaveManager | Çarpan `0.15` → `0.20` |
| 8 | Silah lv6-8 mermi plateausu | WeaponBase | Level 7'de de +1 mermi |
| 9 | Necromancer tint çakışması | Enemy | Phase-2 kontrolü sonrası tint temizle |
| 10 | Archer mesafe tutarsızlığı | Enemy | Ateş mesafesi 350 → 300px |
| 11 | Biased shuffle | LevelUpScene, math.ts | Fisher-Yates algoritması |
