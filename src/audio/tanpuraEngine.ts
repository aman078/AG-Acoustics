/**
 * Authentic Acoustic Tanpura Synthesizer Engine
 * Recreates the organic warmth, Javari thread buzzing, and hollow pumpkin gourd resonance
 * inspired by concert Miraj Tanpuras and Tanpura Droid.
 */

export interface TanpuraConfig {
  rootKey: string; // e.g. 'C', 'C#', 'D', 'E', 'G', 'A'
  firstString: 'Pa' | 'Ma' | 'Ni'; // Tuning for the 1st string
  volume: number; // 0.0 to 1.0
  pluckIntervalMs: number; // Duration between string plucks
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
  private periodicWave: PeriodicWave | null = null;

  private config: TanpuraConfig = {
    rootKey: 'C',
    firstString: 'Pa',
    volume: 0.8,
    pluckIntervalMs: 1300
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
    if (!this.periodicWave && this.ctx) {
      this.buildJavariWavetable();
    }
  }

  /**
   * Builds an authentic Miraj Tanpura Fourier series wavetable
   * Models the hollow dried pumpkin gourd (Tumba) and silk thread buzzing (Javari)
   */
  private buildJavariWavetable() {
    if (!this.ctx) return;
    const n = 48; // 48 harmonics for rich acoustic overtone spectrum
    const real = new Float32Array(n);
    const imag = new Float32Array(n);

    real[0] = 0;
    imag[0] = 0;

    // Harmonic overtone distribution modeled after acoustic Tanpura measurements
    for (let i = 1; i < n; i++) {
      // Body fundamental & low resonance (harmonics 1 to 4)
      if (i <= 4) {
        imag[i] = 1.0 / Math.pow(i, 0.7);
      } 
      // The singing mid-overtones (harmonics 5 to 14)
      else if (i <= 14) {
        imag[i] = 0.55 / Math.pow(i, 0.9);
      } 
      // The Javari thread buzz formant cluster around 1.5kHz - 3.5kHz (harmonics 15 to 30)
      else if (i <= 30) {
        imag[i] = 0.42 * Math.sin(((i - 15) / 15) * Math.PI);
      } 
      // Subtle high shimmer roll-off
      else {
        imag[i] = 0.15 / Math.pow(i - 28, 1.2);
      }
      real[i] = 0;
    }

    this.periodicWave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
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

    // Advance to next string in the authentic 4-step cyclical loop
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
    let sustainTime = 6.5; // Natural acoustic string sustain

    switch (this.currentStringStep) {
      case 0:
        // First String: Pa (1.5x), Ma (4/3x), or Ni (15/8x)
        if (this.config.firstString === 'Pa') {
          targetFreq = baseSa * 1.5;
        } else if (this.config.firstString === 'Ma') {
          targetFreq = baseSa * (4 / 3);
        } else {
          targetFreq = baseSa * (15 / 8);
        }
        panPos = -0.35;
        break;
      case 1:
        // 1st Jod Sa (Middle Tonic unison)
        targetFreq = baseSa;
        panPos = -0.12;
        break;
      case 2:
        // 2nd Jod Sa (Middle Tonic unison with authentic acoustic chorused beating +0.9Hz)
        targetFreq = baseSa + 0.9;
        panPos = 0.15;
        break;
      case 3:
        // Kharaj Sa (Deep pumpkin gourd bass resonance, 1 octave below baseSa)
        targetFreq = baseSa / 2;
        panPos = 0.0;
        sustainTime = 7.5;
        break;
    }

    this.synthesizeAcousticString(targetFreq, panPos, sustainTime);
  }

  /**
   * Synthesize string with real physical acoustic body modeling
   */
  private synthesizeAcousticString(freq: number, pan: number, duration: number) {
    if (!this.ctx || !this.masterGain || !this.periodicWave) return;

    const now = this.ctx.currentTime;

    // String Volume Envelope (Rounded finger pad pluck attack, no plastic synth clicks)
    const stringGain = this.ctx.createGain();
    stringGain.gain.setValueAtTime(0.0001, now);
    stringGain.gain.linearRampToValueAtTime(0.75, now + 0.045); // Soft finger flesh release
    stringGain.gain.exponentialRampToValueAtTime(0.45, now + 0.6); // Javari swell
    stringGain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // Long, singing wooden decay

    // Stereo Panning for ambient spatial immersion
    let panner: StereoPannerNode | GainNode;
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.setValueAtTime(pan, now);
      stringGain.connect(p);
      p.connect(this.masterGain);
      panner = p;
    } else {
      stringGain.connect(this.masterGain);
      panner = stringGain;
    }

    // 1. Primary Javari String Oscillator (Using Miraj Tanpura Fourier Wavetable)
    const osc = this.ctx.createOscillator();
    osc.setPeriodicWave(this.periodicWave);
    osc.frequency.setValueAtTime(freq, now);

    // 2. Sub-bass Body Resonance (Adds that hollow acoustic thud of the dried pumpkin gourd)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq, now);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    subOsc.connect(subGain);
    subGain.connect(stringGain);

    // 3. Acoustic Formant Filters (Simulating the hollow wooden Dandi neck and Tumba gourd)
    // Tumba Gourd Resonance Filter (Peaking around 180Hz)
    const gourdFilter = this.ctx.createBiquadFilter();
    gourdFilter.type = 'peaking';
    gourdFilter.frequency.setValueAtTime(180, now);
    gourdFilter.gain.setValueAtTime(5.5, now);
    gourdFilter.Q.setValueAtTime(2.0, now);

    // Tabli Soundboard Filter (Warm mid-presence around 680Hz)
    const tabliFilter = this.ctx.createBiquadFilter();
    tabliFilter.type = 'peaking';
    tabliFilter.frequency.setValueAtTime(680, now);
    tabliFilter.gain.setValueAtTime(4.0, now);
    tabliFilter.Q.setValueAtTime(1.8, now);

    // Javari Thread Buzz Dynamic Filter (Silk thread shimmering against the bone bridge)
    const javariFilter = this.ctx.createBiquadFilter();
    javariFilter.type = 'bandpass';
    javariFilter.frequency.setValueAtTime(Math.min(2600, freq * 9), now);
    javariFilter.Q.setValueAtTime(2.5, now);

    const javariGain = this.ctx.createGain();
    javariGain.gain.setValueAtTime(0.001, now);
    javariGain.gain.exponentialRampToValueAtTime(0.4, now + 0.35); // Javari blooms after initial string pluck
    javariGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Gentle Acoustic Lowpass (Rolls off extreme digital highs above 4500Hz)
    const warmthFilter = this.ctx.createBiquadFilter();
    warmthFilter.type = 'lowpass';
    warmthFilter.frequency.setValueAtTime(4200, now);
    warmthFilter.frequency.exponentialRampToValueAtTime(800, now + duration);

    // Subtle micro-swirl vibrato (0.6 Hz organic thermal drift)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.65, now);
    lfoGain.gain.setValueAtTime(freq * 0.002, now); // 0.2% micro-pitch drift
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Connect audio signal graph
    osc.connect(gourdFilter);
    gourdFilter.connect(tabliFilter);
    tabliFilter.connect(warmthFilter);
    warmthFilter.connect(stringGain);

    // Parallel Javari buzz routing
    osc.connect(javariFilter);
    javariFilter.connect(javariGain);
    javariGain.connect(stringGain);

    // Start audio sources
    osc.start(now);
    subOsc.start(now);
    lfo.start(now);

    const stopTime = now + duration + 0.15;
    osc.stop(stopTime);
    subOsc.stop(now + 2.1);
    lfo.stop(stopTime);

    // Safe memory cleanup
    setTimeout(() => {
      try {
        osc.disconnect();
        subOsc.disconnect();
        subGain.disconnect();
        lfo.disconnect();
        gourdFilter.disconnect();
        tabliFilter.disconnect();
        javariFilter.disconnect();
        javariGain.disconnect();
        warmthFilter.disconnect();
        stringGain.disconnect();
        if (panner !== stringGain) panner.disconnect();
      } catch {}
    }, (duration + 0.5) * 1000);
  }

  /**
   * Play the 3-Note Magic Riff (Pakad) using warm acoustic guitar string pluck
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
        noteGain.gain.linearRampToValueAtTime(0.7, now + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.6);

        // Acoustic nylon/steel string synthesis
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + dur * 1.6);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + dur * 1.6);
      }, timeOffset * 1000);
      timeOffset += dur;
    });
  }
}

export const tanpura = new TanpuraEngine();
