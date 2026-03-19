import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { SaveManager } from '../systems/SaveManager';

export class SettingsScene extends Phaser.Scene {
  private saveManager!: SaveManager;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.saveManager = new SaveManager();
    this.buildUI();
  }

  private buildUI(): void {
    // Arka plan
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0014);

    // Başlık
    this.add.text(GAME_WIDTH / 2, 32, 'AYARLAR', {
      fontSize: '36px', fontFamily: 'monospace', color: '#ff3333', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const colL = 260;
    const colR = 700;

    // ── SOL KOLON ──────────────────────────────────────────
    this.buildSectionLabel(colL, 70, '🖥  EKRAN AYARLARI');
    this.buildFullscreenToggle(colL, 108);
    this.buildToggleRow(colL, 148, 'FPS Göster', this.saveManager.showFps, (v) => this.saveManager.setShowFps(v));
    this.buildToggleRow(colL, 184, 'Kamera Sarsıntısı', this.saveManager.cameraShake, (v) => this.saveManager.setCameraShake(v));
    this.buildToggleRow(colL, 220, 'Hasar Sayıları', this.saveManager.showDamageNumbers, (v) => this.saveManager.setShowDamageNumbers(v));

    this.buildSectionLabel(colL, 268, '🔊  SES AYARLARI');
    this.buildVolumeRow(colL, 306, 'Müzik', this.saveManager.musicVolume, (v) => this.saveManager.setMusicVolume(v));
    this.buildVolumeRow(colL, 354, 'Efektler', this.saveManager.sfxVolume, (v) => this.saveManager.setSfxVolume(v));

    // ── SAĞ KOLON ──────────────────────────────────────────
    this.buildSectionLabel(colR, 70, '⚔  ZORLUK SEVİYESİ');
    this.buildDifficulty(colR, 115);

    this.buildSectionLabel(colR, 290, '📊  İSTATİSTİKLER');
    this.buildStats(colR, 325);

    // ── ALT BUTONLAR ───────────────────────────────────────
    this.buildBottomButtons();

    // ESC
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }

  // ── Bölüm başlığı ──────────────────────────────────────────────────────────
  private buildSectionLabel(x: number, y: number, label: string): void {
    this.add.text(x, y, label, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aa8833', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.add.rectangle(x, y + 12, 380, 1, 0x332211).setOrigin(0.5, 0.5);
  }

  // ── Tam ekran toggle ────────────────────────────────────────────────────────
  private buildFullscreenToggle(x: number, y: number): void {
    const isFs = this.scale.isFullscreen;

    const bg = this.add.rectangle(x, y, 380, 32, isFs ? 0x1a3a1a : 0x110a1e)
      .setStrokeStyle(1, isFs ? 0x44ff88 : 0x334466)
      .setInteractive({ useHandCursor: true });

    const icon = this.add.text(x - 155, y, isFs ? '⛶' : '⛶', {
      fontSize: '14px', fontFamily: 'monospace', color: isFs ? '#44ff88' : '#556688'
    }).setOrigin(0, 0.5);

    const label = this.add.text(x - 130, y, 'Tam Ekran Modu', {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    const state = this.add.text(x + 155, y, isFs ? 'AÇIK' : 'KAPALI', {
      fontSize: '12px', fontFamily: 'monospace',
      color: isFs ? '#44ff88' : '#ff4444', fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x1a2a3a));
    bg.on('pointerout',  () => bg.setFillStyle(isFs ? 0x1a3a1a : 0x110a1e));
    bg.on('pointerdown', () => {
      this.scale.toggleFullscreen();
      this.time.delayedCall(50, () => this.scene.restart());
    });

    void label; void icon; void state;
  }

  // ── Açık/kapalı toggle satırı ───────────────────────────────────────────────
  private buildToggleRow(x: number, y: number, labelStr: string, current: boolean, onChange: (v: boolean) => void): void {
    let isOn = current;

    const bg = this.add.rectangle(x, y, 380, 30, isOn ? 0x1a2a3a : 0x110a1e)
      .setStrokeStyle(1, isOn ? 0x4488cc : 0x334466)
      .setInteractive({ useHandCursor: true });

    this.add.text(x - 145, y, labelStr, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    const stateText = this.add.text(x + 155, y, isOn ? '✓ AÇIK' : '✗ KAPALI', {
      fontSize: '12px', fontFamily: 'monospace',
      color: isOn ? '#44aaff' : '#666666', fontStyle: 'bold'
    }).setOrigin(1, 0.5);

    const refresh = () => {
      bg.setFillStyle(isOn ? 0x1a2a3a : 0x110a1e);
      bg.setStrokeStyle(1, isOn ? 0x4488cc : 0x334466);
      stateText.setText(isOn ? '✓ AÇIK' : '✗ KAPALI');
      stateText.setColor(isOn ? '#44aaff' : '#666666');
    };

    bg.on('pointerover', () => bg.setFillStyle(0x1a1a2e));
    bg.on('pointerout',  () => refresh());
    bg.on('pointerdown', () => {
      isOn = !isOn;
      onChange(isOn);
      refresh();
    });
  }

  // ── Ses seviyesi satırı ─────────────────────────────────────────────────────
  private buildVolumeRow(x: number, y: number, labelStr: string, current: number, onChange: (v: number) => void): void {
    this.add.text(x - 165, y, labelStr, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    const steps = [0, 0.25, 0.5, 0.75, 1.0];
    const labels = ['🔇', '▌', '▌▌', '▌▌▌', '▌▌▌▌'];

    let currentStep = steps.reduce((best, s, i) =>
      Math.abs(s - current) < Math.abs(steps[best] - current) ? i : best, 0);

    const btnW = 44;
    const gap = 5;
    const startX = x + 10;

    const btns: Phaser.GameObjects.Rectangle[] = [];
    const txts: Phaser.GameObjects.Text[] = [];

    const refresh = () => {
      btns.forEach((b, i) => {
        const sel = i === currentStep;
        b.setFillStyle(sel ? 0x1a3a6e : 0x110a1e);
        b.setStrokeStyle(sel ? 2 : 1, sel ? 0x44aaff : 0x334466);
        txts[i].setColor(sel ? '#44aaff' : '#446688');
      });
    };

    steps.forEach((vol, i) => {
      const bx = startX + i * (btnW + gap);
      const sel = i === currentStep;

      const btn = this.add.rectangle(bx, y, btnW, 28, sel ? 0x1a3a6e : 0x110a1e)
        .setStrokeStyle(sel ? 2 : 1, sel ? 0x44aaff : 0x334466)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(bx, y, labels[i], {
        fontSize: '11px', fontFamily: 'monospace',
        color: sel ? '#44aaff' : '#446688'
      }).setOrigin(0.5, 0.5);

      btns.push(btn); txts.push(txt);

      btn.on('pointerover', () => { if (i !== currentStep) btn.setFillStyle(0x1a2a4e); });
      btn.on('pointerout',  () => refresh());
      btn.on('pointerdown', () => {
        currentStep = i;
        onChange(vol);
        refresh();
      });
    });
  }

  // ── Zorluk seçimi ───────────────────────────────────────────────────────────
  private buildDifficulty(x: number, startY: number): void {
    const current = this.saveManager.difficulty;

    const diffs: { id: 'easy' | 'normal' | 'hard'; label: string; desc: string; color: string }[] = [
      { id: 'easy',   label: 'KOLAY',  desc: 'Düşman ×0.5 hasar / ×0.7 can  •  Oyuncu ×1.5', color: '#33ff88' },
      { id: 'normal', label: 'NORMAL', desc: 'Standart oyun dengesi',                           color: '#ffcc00' },
      { id: 'hard',   label: 'ZOR',    desc: 'Düşman ×1.5 hasar / ×1.5 can  •  Oyuncu ×0.8',  color: '#ff4444' }
    ];

    diffs.forEach((d, i) => {
      const y = startY + i * 56;
      const sel = d.id === current;

      const bg = this.add.rectangle(x, y, 380, 48, sel ? 0x2a1a4e : 0x110a1e)
        .setStrokeStyle(sel ? 2 : 1, sel ? 0xffcc00 : 0x443366)
        .setInteractive({ useHandCursor: true });

      if (sel) {
        this.add.text(x - 170, y - 7, '▶', {
          fontSize: '12px', fontFamily: 'monospace', color: '#ffcc00'
        }).setOrigin(0, 0.5);
      }

      const labelTxt = this.add.text(x - 155, y - 8, d.label, {
        fontSize: '15px', fontFamily: 'monospace',
        color: sel ? '#ffcc00' : d.color, fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      this.add.text(x - 155, y + 10, d.desc, {
        fontSize: '9px', fontFamily: 'monospace', color: '#666666'
      }).setOrigin(0, 0.5);

      bg.on('pointerover', () => { bg.setFillStyle(0x2a1a3e); labelTxt.setColor('#ffffff'); });
      bg.on('pointerout',  () => { bg.setFillStyle(sel ? 0x2a1a4e : 0x110a1e); labelTxt.setColor(sel ? '#ffcc00' : d.color); });
      bg.on('pointerdown', () => { this.saveManager.setDifficulty(d.id); this.scene.restart(); });
    });
  }

  // ── İstatistikler ───────────────────────────────────────────────────────────
  private buildStats(x: number, y: number): void {
    const sd = this.saveManager.saveData;

    const stats = [
      { label: 'Toplam Öldürme', value: sd.totalKills.toLocaleString() },
      { label: 'Toplam Oyun',    value: sd.totalRuns.toLocaleString() },
      { label: 'En Yüksek Skor', value: sd.highScore.toLocaleString() },
      { label: 'Banka Altını',   value: `${sd.gold} 💰` }
    ];

    const bg = this.add.rectangle(x, y + 55, 380, 120, 0x0d0a1e)
      .setStrokeStyle(1, 0x221a33);

    void bg;

    stats.forEach((s, i) => {
      const row = y + i * 28;
      this.add.text(x - 165, row, s.label, {
        fontSize: '12px', fontFamily: 'monospace', color: '#778899'
      }).setOrigin(0, 0.5);

      this.add.text(x + 165, row, s.value, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ccddee', fontStyle: 'bold'
      }).setOrigin(1, 0.5);

      if (i < stats.length - 1) {
        this.add.rectangle(x, row + 13, 360, 1, 0x221a33).setOrigin(0.5, 0.5);
      }
    });
  }

  // ── Alt butonlar ────────────────────────────────────────────────────────────
  private buildBottomButtons(): void {
    // Geri Dön
    const backBg = this.add.rectangle(GAME_WIDTH / 2 - 110, 507, 180, 36, 0x1a0a2e)
      .setStrokeStyle(1, 0x6644aa)
      .setInteractive({ useHandCursor: true });

    const backTxt = this.add.text(GAME_WIDTH / 2 - 110, 507, '◀  GERİ DÖN', {
      fontSize: '14px', fontFamily: 'monospace', color: '#8866cc'
    }).setOrigin(0.5, 0.5);

    backBg.on('pointerover', () => { backBg.setFillStyle(0x2a1a4e); backTxt.setColor('#ffffff'); });
    backBg.on('pointerout',  () => { backBg.setFillStyle(0x1a0a2e); backTxt.setColor('#8866cc'); });
    backBg.on('pointerdown', () => this.scene.start('MainMenuScene'));

    // İlerlemeyi Sıfırla
    const resetBg = this.add.rectangle(GAME_WIDTH / 2 + 110, 507, 180, 36, 0x1a0808)
      .setStrokeStyle(1, 0x661122)
      .setInteractive({ useHandCursor: true });

    const resetTxt = this.add.text(GAME_WIDTH / 2 + 110, 507, '⚠  KAYDI SİL', {
      fontSize: '14px', fontFamily: 'monospace', color: '#883344'
    }).setOrigin(0.5, 0.5);

    resetBg.on('pointerover', () => { resetBg.setFillStyle(0x2a0808); resetTxt.setColor('#ff4466'); });
    resetBg.on('pointerout',  () => { resetBg.setFillStyle(0x1a0808); resetTxt.setColor('#883344'); });
    resetBg.on('pointerdown', () => this.showResetConfirm());
  }

  // ── Sıfırlama onay penceresi ────────────────────────────────────────────────
  private showResetConfirm(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    const box     = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 400, 180, 0x1a0a1e).setStrokeStyle(2, 0xff3333);

    const title   = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 55, '⚠  DİKKAT', {
      fontSize: '22px', fontFamily: 'monospace', color: '#ff3333', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const msg     = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, 'Tüm ilerleme ve altın silinecek.\nBu işlem geri alınamaz!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ccaaaa', align: 'center'
    }).setOrigin(0.5, 0.5);

    // Evet
    const yesBg = this.add.rectangle(GAME_WIDTH / 2 - 70, GAME_HEIGHT / 2 + 50, 120, 34, 0x3a0a0a)
      .setStrokeStyle(1, 0xff3333).setInteractive({ useHandCursor: true });
    const yesTxt = this.add.text(GAME_WIDTH / 2 - 70, GAME_HEIGHT / 2 + 50, 'EVET, SİL', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ff4444'
    }).setOrigin(0.5, 0.5);

    yesBg.on('pointerover', () => { yesBg.setFillStyle(0x5a1a1a); yesTxt.setColor('#ff0000'); });
    yesBg.on('pointerout',  () => { yesBg.setFillStyle(0x3a0a0a); yesTxt.setColor('#ff4444'); });
    yesBg.on('pointerdown', () => {
      this.saveManager.resetProgress();
      this.scene.restart();
    });

    // Hayır
    const noBg = this.add.rectangle(GAME_WIDTH / 2 + 70, GAME_HEIGHT / 2 + 50, 120, 34, 0x0a1a0a)
      .setStrokeStyle(1, 0x33aa55).setInteractive({ useHandCursor: true });
    const noTxt = this.add.text(GAME_WIDTH / 2 + 70, GAME_HEIGHT / 2 + 50, 'İPTAL', {
      fontSize: '13px', fontFamily: 'monospace', color: '#33aa55'
    }).setOrigin(0.5, 0.5);

    noBg.on('pointerover', () => { noBg.setFillStyle(0x0a2a0a); noTxt.setColor('#44ff66'); });
    noBg.on('pointerout',  () => { noBg.setFillStyle(0x0a1a0a); noTxt.setColor('#33aa55'); });
    noBg.on('pointerdown', () => {
      [overlay, box, title, msg, yesBg, yesTxt, noBg, noTxt].forEach(o => o.destroy());
    });
  }
}
