/**
 * Acoustic Tanpura Synthesizer Engine
 * Synthesizes a multi-string classical Indian Tanpura with authentic Javari bridge buzz,
 * harmonic overtones, chorused dual Jod Sa, and deep Kharaj bass string.
 */

export interface TanpuraConfig {
  rootKey: string; // e.g. 'C', 'C#', 'D', 'E', 'G', 'A'
  firstString: 'Pa' | 'Ma' | 'Ni'; // Tuning for the 1st string
  volume: number; // 0.0 to 1.0
  pluckIntervalMs: number; // Duration between string plucks (e.g. 1100ms)
}

const NOTE_FREQS: Record<string, number> = {
  'C': 130.81,   // C3 base (Kharaj C2 = 65.4)
  'C#': 138.59,
  'D': 146.83,
  'D#': 155.56,
  'E': 164.81,
  'F': 174.61,
  'F#': 185.00,
  'G': 196.00,
  'G#': 207.65,
  'A': 220.00,
  'Bb': 233.08,
  'B': 246.94
};

class TanpuraEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private loopTimer: any = null;
  private currentStringStep: number = 0;
  private masterGain: GainNode | null = null;
  private config: TanpuraConfig = {
    rootKey: 'C',
    firstString: 'Pa',
    volume: 0.75,
    pluckIntervalMs: 1200
  };

  private listeners: Set<(step: number, isPlaying: boolean) => void> = new Set();

  public subscribe(fn: (step: number, isPlaying: boolean) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.currentStringStep, this.isPlaying));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentConfig(): TanpuraConfig {
    return { ...this.config };
  }

  private initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.config.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setConfig(newConfig: Partial<TanpuraConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.config.volume, this.ctx.currentTime, 0.05);
    }
  }

  public start() {
    if (this.isPlaying) return;
    this.initAudio();
    this.isPlaying = true;
    this.currentStringStep = 0;
    this.scheduleNextPluck();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.currentStringStep = 0;
    this.notify();
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  private scheduleNextPluck() {
    if (!this.isPlaying || !this.ctx) return;

    this.pluckCurrentString();

    // Advance to next string (0 -> 1 -> 2 -> 3 -> 0)
    // String 0: First String (Pa/Ma/Ni)
    // String 1: Jod Sa (Tonic)
    // String 2: Jod Sa (Tonic detuned +1.5¢)
    // String 3: Kharaj Sa (Deep Bass Tonic)
    this.loopTimer = setTimeout(() => {
      this.currentStringStep = (this.currentStringStep + 1) % 4;
      this.notify();
      this.scheduleNextPluck();
    }, this.config.pluckIntervalMs);
  }

  private pluckCurrentString() {
    if (!this.ctx || !this.masterGain) return;

    const baseSa = NOTE_FREQS[this.config.rootKey] || NOTE_FREQS['C'];
    let targetFreq = baseSa;
    let panPos = 0;
    let stringDuration = 4.5; // Long acoustic sustain

    switch (this.currentStringStep) {
      case 0:
        // First String: Pa (1.5x) or Ma (1.333x) or Ni (1.875x)
        if (this.config.firstString === 'Pa') {
          targetFreq = baseSa * 1.5; // Perfect 5th
        } else if (this.config.firstString === 'Ma') {
          targetFreq = baseSa * (4 / 3); // Perfect 4th
        } else {
          targetFreq = baseSa * (15 / 8); // Major 7th
        }
        panPos = -0.4;
        break;
      case 1:
        // 1st Jod Sa (Tonic unison)
        targetFreq = baseSa;
        panPos = -0.15;
        break;
      case 2:
        // 2nd Jod Sa (Tonic unison with slight chorused shimmer +1.2Hz)
        targetFreq = baseSa + 1.2;
        panPos = 0.15;
        break;
      case 3:
        // Kharaj Sa (Low bass Tonic, 1 octave lower)
        targetFreq = baseSa / 2;
        panPos = 0.0;
        stringDuration = 6.0;
        break;
    }

    this.synthesizeTanpuraString(targetFreq, panPos, stringDuration);
  }

  /**
   * Synthesize an acoustic Tanpura string with authentic Javari harmonic distortion
   */
  private synthesizeTanpuraString(freq: number, pan: number, duration: number) {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // String gain envelope
    const stringGain = this.ctx.createGain();
    stringGain.gain.setValueAtTime(0.0001, now);
    stringGain.gain.exponentialRampToValueAtTime(0.7, now + 0.03); // Quick finger pluck attack
    stringGain.gain.exponentialRampToValueAtTime(0.35, now + 0.4); // Initial javari blossom
    stringGain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Long singing decay

    // Stereo Panner
    let pannerNode: StereoPannerNode | GainNode;
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.setValueAtTime(pan, now);
      stringGain.connect(p);
      p.connect(this.masterGain);
      pannerNode = p;
    } else {
      stringGain.connect(this.masterGain);
      pannerNode = stringGain;
    }

    // 1. Fundamental Oscillator (Warm body tone)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);

    // 2. Javari Harmonic Shimmer (Thread buzzing against bridge)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now); // 2nd harmonic dominance

    // 3. High Shimmer Sitar-like Overtones
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(freq * 3.01, now); // Slight detuned 3rd harmonic

    // Resonant Javari Bandpass Filter (Peaks around 1200Hz - 2400Hz like a hollow dried gourd resonator)
    const javariFilter = this.ctx.createBiquadFilter();
    javariFilter.type = 'bandpass';
    javariFilter.frequency.setValueAtTime(Math.min(1800, freq * 8), now);
    javariFilter.Q.setValueAtTime(2.2, now);

    // Warm Lowpass Filter (Rolls off harsh treble over time)
    const warmFilter = this.ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.setValueAtTime(3200, now);
    warmFilter.frequency.exponentialRampToValueAtTime(600, now + duration);

    // Subtle string vibrato LFO (0.8 Hz micro-swirl)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.8, now);
    lfoGain.gain.setValueAtTime(freq * 0.003, now); // Subtle 0.3% frequency pitch waver
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    // Connect nodes
    osc1.connect(warmFilter);
    osc2.connect(warmFilter);
    osc3.connect(javariFilter);
    javariFilter.connect(warmFilter);
    warmFilter.connect(stringGain);

    // Start oscillators
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    lfo.start(now);

    // Clean up nodes after sustain
    const stopTime = now + duration + 0.1;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
    lfo.stop(stopTime);

    setTimeout(() => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        osc3.disconnect();
        lfo.disconnect();
        warmFilter.disconnect();
        stringGain.disconnect();
        if (pannerNode !== stringGain) pannerNode.disconnect();
      } catch {}
    }, (duration + 0.5) * 1000);
  }

  /**
   * Play the 3-Note Magic Riff (Pakad) on an acoustic guitar synthesized sound
   */
  public playMagicRiff(frequencies: number[], durations: number[]) {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    let timeOffset = 0;
    frequencies.forEach((freq, idx) => {
      const dur = durations[idx] || 0.5;
      setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.8, now + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.5);

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + dur * 1.5);
      }, timeOffset * 1000);
      timeOffset += dur;
    });
  }
}

export const tanpura = new TanpuraEngine();
