// Web Audio API による自然で心地よいシンセシス効果音（外部ファイル不要で即再生）

class SoundEffectManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private birdTimer: ReturnType<typeof setTimeout> | null = null;
  private isAmbientRunning: boolean = false;

  constructor() {
    // ユーザー操作時に初期化
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.ambientGain) {
        this.ambientGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
      }
    } else {
      if (this.ambientGain) {
        this.ambientGain.gain.setValueAtTime(0.045, this.ctx?.currentTime || 0);
      }
      if (this.isAmbientRunning && !this.ambientSource) {
        this.startAmbient();
      }
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 着地・ドロップ音（コトンッ）
  public playDrop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // スワイプ音
  public playSwipe() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // 木材マッチ音（カコーン！）
  public playWoodMatch(combo: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const baseFreqs = [440, 493.88, 554.37, 587.33, 659.25, 739.99, 880];
    const freq = baseFreqs[Math.min(baseFreqs.length - 1, (combo - 1) % baseFreqs.length)];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // 水滴マッチ音（ポチョン！）
  public playWaterMatch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // 氷ヒビ音（ピキッ！）
  public playIceCrack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  // 氷粉砕音（パリーン！❄️）
  public playIceBreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [1200, 1600, 2100, 2800];
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.02);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.02 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + i * 0.02);
      osc.stop(this.ctx.currentTime + i * 0.02 + 0.12);
    });
  }

  // 岩粉砕音（ガシャン！🪨）
  public playRockBreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // ツタ切断音（ブチッ！🌿）
  public playVineCut() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // 木づち音（ゴツンッ！）
  public playHammer() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // ノコギリ音（ズバッ！）
  public playSaw() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  // しっぽビンタ音（バチンッ！）
  public playTailSlap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // ぜんまい時計音（時を戻すキラキラ音！）
  public playClock() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx!.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + idx * 0.05);
      osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.15);
    });
  }

  // 爆弾爆発音（ドカーン！）
  public playBomb(mega: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(mega ? 160 : 200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + (mega ? 0.35 : 0.25));

    gain.gain.setValueAtTime(mega ? 0.28 : 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (mega ? 0.35 : 0.25));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + (mega ? 0.35 : 0.25));

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * (mega ? 0.3 : 0.2));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(mega ? 0.15 : 0.1, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (mega ? 0.3 : 0.2));
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start();
    } catch {}
  }

  // ロケット丸太音
  public playRocket() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  // レインボー音
  public playRainbow() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.04);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + i * 0.04);
      osc.stop(this.ctx.currentTime + i * 0.04 + 0.15);
    });
  }

  // クリアファンファーレ
  public playStageClear() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.50, d: 0.35 },
    ];

    let t = this.ctx.currentTime;
    melody.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d * 0.9;
    });
  }
  // 11. 建築・開拓タスク完了音（トンカン！木工の心地よいハンマー音）
  public playBuild() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // 2連打の軽快な木槌音
    [0, 0.09].forEach((delay, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(idx === 0 ? 580 : 880, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + delay + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.08);
    });
  }

  // 12. 霧晴らし音（シュワ〜〜✨ 神秘的な光の広がり）
  public playFogClear() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // きらめくアルペジオ (C-E-G-B-C)
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.35);
    });
  }

  // 13. 環境音（川のせせらぎ ＆ 森の小鳥）
  public startAmbient() {
    this.isAmbientRunning = true;
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    if (this.ambientSource) return; // 既に再生中

    try {
      // 2秒間のピンク/水流ノイズバッファ生成
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // 簡易ピンクノイズフィルター
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // 川の水の帯域（バンドパス 450Hz〜1200Hz）
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.045, this.ctx.currentTime); // 控えめで心地よい音量

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.ambientSource = noise;
      this.ambientGain = gain;

      this.scheduleBirdChirp();
    } catch {
      // AudioContext未初期化などの安全対策
    }
  }

  public stopAmbient() {
    this.isAmbientRunning = false;
    if (this.birdTimer) {
      clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch {}
      this.ambientSource = null;
      this.ambientGain = null;
    }
  }

  // 小鳥のランダムなさえずり（5〜10秒おき）
  private scheduleBirdChirp() {
    if (!this.isAmbientRunning) return;
    const delay = Math.random() * 5000 + 4000;
    this.birdTimer = setTimeout(() => {
      if (this.isAmbientRunning && !this.isMuted) {
        this.playBirdChirp();
      }
      this.scheduleBirdChirp();
    }, delay);
  }

  // 小鳥のさえずり音（ピピッ♪）
  public playBirdChirp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const baseFreq = 2400 + Math.random() * 600;
    [0, 0.07].forEach((t, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const f = i === 0 ? baseFreq : baseFreq * 1.25;
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.8, this.ctx.currentTime + t + 0.05);

      gain.gain.setValueAtTime(0.025, this.ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + t);
      osc.stop(this.ctx.currentTime + t + 0.05);
    });
  }
}

export const sounds = new SoundEffectManager();
