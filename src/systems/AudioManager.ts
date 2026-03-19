import Phaser from 'phaser';

/**
 * AudioManager — Web Audio API tabanlı prosedürel ses sistemi.
 * BGM: 128 BPM dark synth ritim (kick + snare + hihat + bass arpeggio)
 * SFX: Daha zengin ve tatmin edici efektler
 */
export class AudioManager {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private currentVolume: number = 0.8;

  // BGM
  private bgmActive = false;
  private bgmTimeout: ReturnType<typeof setTimeout> | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private intensityLevel: number = 0; // 0=normal, 1=intense, 2=frantic, 3=chaos

  constructor(scene: Phaser.Scene, volume = 0.8) {
    const soundManager = scene.sound as Phaser.Sound.WebAudioSoundManager;
    this.ctx = soundManager.context;

    this.currentVolume = volume;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = volume;
    this.masterGain.connect(this.ctx.destination);

    // Pre-generate noise buffer (used for snare & hihat)
    const bufLen = Math.floor(this.ctx.sampleRate * 0.5);
    this.noiseBuffer = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private now(): number { return this.ctx.currentTime; }

  private osc(type: OscillatorType, freq: number, gain: number, dur: number, freqEnd?: number): void {
    const t = this.now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + dur);
  }

  private noise(start: number, dur: number, gain: number, highpass = 0): void {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    if (highpass > 0) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = highpass;
      src.connect(f); f.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(this.masterGain);
    src.start(start); src.stop(start + dur);
  }

  // ─── BGM ────────────────────────────────────────────────────────────────────

  playBGM(): void {
    if (this.bgmActive) return;
    this.bgmActive = true;
    // Restore volume in case stopBGM silenced it
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    this.scheduleBGMBar();
  }

  setIntensity(level: number): void {
    this.intensityLevel = Math.max(0, Math.min(3, level));
  }

  private scheduleBGMBar(): void {
    if (!this.bgmActive) return;

    const lvl = this.intensityLevel;
    // BPM scales slightly with intensity: 128 → 132 → 136 → 140
    const bpm = 128 + lvl * 4;
    const beat = 60 / bpm;
    const step = beat / 2;           // 8th note
    const t = this.ctx.currentTime + 0.05;
    const steps = 16;                // 2-bar pattern

    // Bass note pattern (minor pentatonic A)
    const bassFreqs = [55, 0, 55, 0, 65, 0, 55, 0, 55, 0, 82, 65, 55, 0, 65, 82];
    // Extra bass hits at higher intensity
    const bassFreqs2 = [0, 55, 0, 65, 0, 55, 0, 82, 0, 65, 0, 0, 0, 55, 0, 0];

    for (let i = 0; i < steps; i++) {
      const bt = t + i * step;

      // Kick: base pattern + extras at higher intensity
      const baseKick = i === 0 || i === 4 || i === 8 || i === 10;
      const extraKick = lvl >= 2 && (i === 2 || i === 6 || i === 14);
      const franticKick = lvl >= 3 && (i === 1 || i === 9 || i === 13);
      if (baseKick || extraKick || franticKick) this.scheduleKick(bt);

      // Snare
      if (i === 4 || i === 12) this.scheduleSnare(bt);
      if (lvl >= 2 && i === 14) this.scheduleSnare(bt); // anticipation snare

      // Hihat: denser at higher intensity
      const hihatBase = (i % 4 === 0) ? 0.055 : 0.028;
      const hihatBoost = lvl >= 1 ? 1.3 : 1;
      this.noise(bt, 0.025, hihatBase * hihatBoost, 7000);
      // 16th hihat at intensity 3
      if (lvl >= 3) {
        this.noise(bt + step * 0.5, 0.012, 0.018, 8000);
      }

      // Bass line (louder at higher intensity)
      const bassVol = 1 + lvl * 0.08;
      if (bassFreqs[i] > 0) this.scheduleBass(bt, bassFreqs[i], step * 0.85, bassVol);
      if (lvl >= 2 && bassFreqs2[i] > 0) this.scheduleBass(bt, bassFreqs2[i], step * 0.7, bassVol * 0.6);

      // Melody: starts earlier and more notes at higher intensity
      const melodyStart = lvl >= 1 ? 4 : 8;
      if (i >= melodyStart && i % 2 === 0) {
        const melodyNotes = lvl >= 2
          ? [220, 261, 329, 392, 329, 261, 220, 261]
          : [220, 261, 329, 261];
        const mIdx = (i - melodyStart) / 2 % melodyNotes.length;
        const melVol = lvl >= 2 ? 0.07 : 0.04;
        this.scheduleMelodyVol(bt, melodyNotes[mIdx], step * 0.7, melVol);
      }

      // Intensity 3: add a high synth pad
      if (lvl >= 3 && i % 4 === 0) {
        const padNotes = [440, 523, 659, 523];
        this.scheduleMelodyVol(bt, padNotes[i / 4 % padNotes.length], step * 1.9, 0.03);
      }
    }

    const loopMs = steps * step * 1000;
    this.bgmTimeout = setTimeout(() => this.scheduleBGMBar(), loopMs - 50);
  }

  private scheduleKick(t: number): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.18);
    g.gain.setValueAtTime(0.65, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + 0.22);

    // Click transient
    this.noise(t, 0.012, 0.15, 2000);
  }

  private scheduleSnare(t: number): void {
    // Noise body
    this.noise(t, 0.12, 0.22, 1500);
    // Tone snap
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.06);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + 0.08);
  }

  private scheduleBass(t: number, freq: number, dur: number, volMult: number = 1): void {
    const o = this.ctx.createOscillator();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.value = 500;
    f.Q.value = 1.5;
    g.gain.setValueAtTime(0.12 * volMult, t);
    g.gain.setValueAtTime(0.10 * volMult, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + dur);
  }

  private scheduleMelody(t: number, freq: number, dur: number): void {
    this.scheduleMelodyVol(t, freq, dur, 0.04);
  }

  private scheduleMelodyVol(t: number, freq: number, dur: number, vol: number): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.linearRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + dur);
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
  }

  getVolume(): number {
    return this.currentVolume;
  }

  stopBGM(): void {
    this.bgmActive = false;
    if (this.bgmTimeout !== null) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
    // Immediately silence any already-scheduled audio nodes to prevent overlap
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
  }

  /** Sezer müzik ses seviyesini ayarla (0-1 arası, masterGain'den bağımsız bir katman) */
  setSezerMusicVolume(volume: number, sezerMusic: Phaser.Sound.BaseSound): void {
    if (sezerMusic && (sezerMusic as Phaser.Sound.WebAudioSound).setVolume) {
      (sezerMusic as Phaser.Sound.WebAudioSound).setVolume(Math.max(0, Math.min(1, volume)));
    }
  }

  // ─── SFX ────────────────────────────────────────────────────────────────────

  /** Bıçak fırlatma: kısa keskin "swish" */
  playShoot(): void {
    const t = this.now();
    // High freq sweep down
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.06);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + 0.07);
    // Noise accent
    this.noise(t, 0.025, 0.06, 3000);
  }

  /** Düşmana isabet: çarpan darbe */
  playHit(): void {
    const t = this.now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(380, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.055);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    o.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + 0.065);
  }

  /** Düşman öldü: tatmin edici patlama */
  playKill(): void {
    const t = this.now();
    // Low thump
    this.osc('sine', 600, 0.22, 0.05, 120);
    // High crack
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1800, t + 0.01);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.setValueAtTime(0.14, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + 0.12);
    // Noise burst
    this.noise(t, 0.04, 0.08, 1000);
  }

  /** XP toplama: hafif parlak "ding" */
  playXPPickup(): void {
    const t = this.now();
    this.osc('sine', 800, 0.13, 0.08, 1600);
  }

  /** Altın toplama: iki çarpan bip */
  playGoldPickup(): void {
    const t = this.now();
    this.osc('sine', 1200, 0.12, 0.04);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 1600;
    g.gain.setValueAtTime(0, t);
    g.gain.setValueAtTime(0.12, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g); g.connect(this.masterGain);
    o.start(t); o.stop(t + 0.09);
  }

  /** Seviye atladı: yükselen fanfare */
  playLevelUp(): void {
    const t = this.now();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const s = t + i * 0.09;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.2, s + 0.02);
      g.gain.linearRampToValueAtTime(0, s + 0.28);
      o.connect(g); g.connect(this.masterGain);
      o.start(s); o.stop(s + 0.28);
    });
    // Shimmer layer
    const o2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    o2.type = 'triangle';
    o2.frequency.value = 2093; // C7
    g2.gain.setValueAtTime(0, t + 0.25);
    g2.gain.linearRampToValueAtTime(0.1, t + 0.3);
    g2.gain.linearRampToValueAtTime(0, t + 0.55);
    o2.connect(g2); g2.connect(this.masterGain);
    o2.start(t); o2.stop(t + 0.55);
  }

  /** Boss öldü: epik patlama + inen fanfare */
  playBossKill(): void {
    const t = this.now();
    // Derin boom
    const o1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(120, t);
    o1.frequency.exponentialRampToValueAtTime(25, t + 0.5);
    g1.gain.setValueAtTime(0.6, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o1.connect(g1); g1.connect(this.masterGain);
    o1.start(t); o1.stop(t + 0.5);
    // Noise burst
    this.noise(t, 0.3, 0.25, 200);
    // Fanfare: inen notalar
    const notes = [880, 660, 523, 392];
    notes.forEach((freq, i) => {
      const delay = i * 0.1;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.15, t + delay + 0.02);
      g.gain.linearRampToValueAtTime(0, t + delay + 0.18);
      o.connect(g); g.connect(this.masterGain);
      o.start(t + delay); o.stop(t + delay + 0.2);
    });
  }

  /** Zafer fanfaresi */
  playVictory(): void {
    const t = this.now();
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((freq, i) => {
      const delay = i * 0.13;
      const dur = i === melody.length - 1 ? 0.8 : 0.18;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = i % 2 === 0 ? 'sine' : 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.22, t + delay + 0.03);
      g.gain.linearRampToValueAtTime(0, t + delay + dur);
      o.connect(g); g.connect(this.masterGain);
      o.start(t + delay); o.stop(t + delay + dur + 0.05);
    });
    // Bass hit
    this.osc('sine', 130, 0.4, 0.3, 50);
  }

  /** Dash: hızlı whoosh */
  playDash(): void {
    const t = this.now();
    this.osc('sawtooth', 900, 0.12, 0.1, 80);
    this.noise(t, 0.06, 0.07, 500);
  }

  /** Dalga bitiş uyarısı: üç inen bip */
  playTimerWarning(): void {
    const t = this.now();
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.15;
      const freq = 880 - i * 110;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, t + delay);
      g.gain.linearRampToValueAtTime(0.10, t + delay + 0.02);
      g.gain.linearRampToValueAtTime(0, t + delay + 0.08);
      o.connect(g); g.connect(this.masterGain);
      o.start(t + delay); o.stop(t + delay + 0.12);
    }
  }

  /** Oyuncuya vuruldu: düşük darbe */
  playPlayerHit(): void {
    const t = this.now();
    this.osc('sine', 90, 0.28, 0.15, 30);
    this.noise(t, 0.06, 0.1, 0);
  }
}
