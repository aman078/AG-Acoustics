/**
 * Authentic Acoustic Tanpura Engine
 * Powered by high-fidelity acoustic concert Miraj Tanpura recordings
 * providing the authentic meditative pumpkin gourd resonance and silk thread Javari buzz,
 * matching Tanpura Droid.
 */

export interface TanpuraConfig {
  rootKey: string; // e.g. 'C', 'C#', 'D', 'E', 'G', 'A'
  firstString: 'Pa' | 'Ma' | 'Ni'; // Tuning for the 1st string
  volume: number; // 0.0 to 1.0
  pluckIntervalMs: number; // Duration between string pulses
}

const KEY_TO_FILE: Record<string, string> = {
  'C': 'C.mp3',
  'C#': 'CSharp.mp3',
  'Db': 'CSharp.mp3',
  'D': 'D.mp3',
  'D#': 'DSharp.mp3',
  'Eb': 'DSharp.mp3',
  'E': 'E.mp3',
  'F': 'F.mp3',
  'F#': 'FSharp.mp3',
  'Gb': 'FSharp.mp3',
  'G': 'G.mp3',
  'G#': 'GSharp.mp3',
  'Ab': 'GSharp.mp3',
  'A': 'A.mp3',
  'A#': 'Bb.mp3',
  'Bb': 'Bb.mp3',
  'B': 'B.mp3'
};

class TanpuraEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private loopTimer: any = null;
  private currentStringStep: number = 0;
  private masterGain: GainNode | null = null;

  // Real acoustic audio playback
  private currentAudioElement: HTMLAudioElement | null = null;
  private fadingAudioElement: HTMLAudioElement | null = null;
  private currentBufferSource: AudioBufferSourceNode | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();

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

  private initAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.config.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setConfig(newConfig: Partial<TanpuraConfig>) {
    const oldKey = this.config.rootKey;
    this.config = { ...this.config, ...newConfig };

    // Update volume on running audio
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = Math.max(0, Math.min(1, this.config.volume));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.config.volume, this.ctx.currentTime, 0.05);
    }

    // If key changed while playing, immediately crossfade to the new acoustic recording
    if (newConfig.rootKey && newConfig.rootKey !== oldKey && this.isPlaying) {
      this.switchAcousticAudio(newConfig.rootKey);
    }
  }

  public start(rootKey?: string) {
    if (rootKey) {
      this.config.rootKey = rootKey;
    }
    this.initAudioContext();
    this.isPlaying = true;
    this.currentStringStep = 0;

    // Start playing genuine acoustic recording
    this.playAcousticSample(this.config.rootKey);

    // Start cyclical string pulse timer for visual synchronization
    this.startCyclePulse();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }

    // Fade out and stop acoustic audio
    this.stopAcousticAudio();
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

  private startCyclePulse() {
    if (this.loopTimer) clearTimeout(this.loopTimer);
    const scheduleNext = () => {
      if (!this.isPlaying) return;
      this.loopTimer = setTimeout(() => {
        this.currentStringStep = (this.currentStringStep + 1) % 4;
        this.notify();
        scheduleNext();
      }, this.config.pluckIntervalMs);
    };
    scheduleNext();
  }

  /**
   * Play genuine acoustic Miraj Tanpura recording for the chosen root key
   */
  private playAcousticSample(key: string) {
    const fileName = KEY_TO_FILE[key] || 'C.mp3';
    const audioUrl = `./audio/tanpura/${fileName}`;

    try {
      // 1. First attempt: Web Audio API AudioBuffer for sample-accurate looping
      this.loadAndPlayBuffer(key, audioUrl);
    } catch {
      // 2. Direct HTML5 Audio fallback
      this.playHtmlAudio(audioUrl);
    }
  }

  private async loadAndPlayBuffer(key: string, url: string) {
    this.initAudioContext();
    if (!this.ctx || !this.masterGain) {
      this.playHtmlAudio(url);
      return;
    }

    try {
      let buffer = this.bufferCache.get(key);
      if (!buffer) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuf = await response.arrayBuffer();
        buffer = await this.ctx.decodeAudioData(arrayBuf);
        this.bufferCache.set(key, buffer);
      }

      if (!this.isPlaying) return;

      // Stop previous source if playing
      if (this.currentBufferSource) {
        try {
          this.currentBufferSource.stop();
          this.currentBufferSource.disconnect();
        } catch {}
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Soft fade in over 200ms
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.config.volume, this.ctx.currentTime + 0.2);

      source.connect(gainNode);
      gainNode.connect(this.masterGain);
      source.start(0);

      this.currentBufferSource = source;
    } catch (err) {
      // If Web Audio fetch/decode fails (e.g. edge-case local file scheme), fall back to HTMLAudioElement
      this.playHtmlAudio(url);
    }
  }

  private playHtmlAudio(url: string) {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
      } catch {}
    }

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, this.config.volume));
    audio.play().catch(() => {});
    this.currentAudioElement = audio;
  }

  private switchAcousticAudio(newKey: string) {
    // If using AudioBuffer source
    if (this.currentBufferSource && this.ctx && this.masterGain) {
      const oldSource = this.currentBufferSource;
      try {
        oldSource.stop(this.ctx.currentTime + 0.35);
      } catch {}
      this.currentBufferSource = null;
      const fileName = KEY_TO_FILE[newKey] || 'C.mp3';
      this.loadAndPlayBuffer(newKey, `./audio/tanpura/${fileName}`);
      return;
    }

    // If using HTMLAudioElement crossfade
    if (this.currentAudioElement) {
      this.fadingAudioElement = this.currentAudioElement;
      const oldAudio = this.fadingAudioElement;
      const fadeStep = oldAudio.volume / 6;
      const fadeTimer = setInterval(() => {
        if (oldAudio.volume > fadeStep) {
          oldAudio.volume = Math.max(0, oldAudio.volume - fadeStep);
        } else {
          clearInterval(fadeTimer);
          oldAudio.pause();
          if (this.fadingAudioElement === oldAudio) {
            this.fadingAudioElement = null;
          }
        }
      }, 50);
    }

    const fileName = KEY_TO_FILE[newKey] || 'C.mp3';
    const newAudio = new Audio(`./audio/tanpura/${fileName}`);
    newAudio.loop = true;
    newAudio.volume = Math.max(0, Math.min(1, this.config.volume));
    newAudio.play().catch(() => {});
    this.currentAudioElement = newAudio;
  }

  private stopAcousticAudio() {
    if (this.currentBufferSource && this.ctx) {
      try {
        this.currentBufferSource.stop();
        this.currentBufferSource.disconnect();
      } catch {}
      this.currentBufferSource = null;
    }

    if (this.currentAudioElement) {
      const audio = this.currentAudioElement;
      const fadeInterval = setInterval(() => {
        if (audio.volume > 0.15) {
          audio.volume = Math.max(0, audio.volume - 0.15);
        } else {
          clearInterval(fadeInterval);
          audio.pause();
          audio.currentTime = 0;
        }
      }, 40);
      this.currentAudioElement = null;
    }
  }

  /**
   * Play the 3-Note Magic Riff (Pakad) using warm acoustic guitar string pluck
   */
  public playMagicRiff(frequencies: number[], durations: number[]) {
    this.initAudioContext();
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

        // Acoustic guitar string harmonics
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2800, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + dur * 1.6);

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
