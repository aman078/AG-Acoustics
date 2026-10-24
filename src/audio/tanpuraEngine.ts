/**
 * Authentic Acoustic Tanpura Engine
 * Powered by high-fidelity acoustic concert Miraj Tanpura recordings with
 * Dual-Voice Ping-Pong Overlap Crossfade architecture.
 *
 * Eliminates all loop seams, pops, and MP3 padding gaps, keeping the deep
 * Kharaj gourd resonance continuously vibrating beneath incoming plucks
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

interface ActiveVoice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  stopTimer: any;
}

class TanpuraEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private pulseTimer: any = null;
  private pingPongTimer: any = null;
  private currentStringStep: number = 0;
  private masterGain: GainNode | null = null;

  // Dual-voice ping-pong overlap
  private activeVoices: Set<ActiveVoice> = new Set();
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private isVoiceAPlaying: boolean = true;
  private readonly overlapSeconds: number = 2.4; // 2.4s seamless acoustic crossfade window

  // HTMLAudioElement ping-pong fallback for environments without AudioBuffer
  private htmlVoiceA: HTMLAudioElement | null = null;
  private htmlVoiceB: HTMLAudioElement | null = null;
  private htmlPingPongTimer: any = null;

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
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.config.volume, this.ctx.currentTime, 0.05);
    }
    if (this.htmlVoiceA) this.htmlVoiceA.volume = Math.max(0, Math.min(1, this.config.volume));
    if (this.htmlVoiceB) this.htmlVoiceB.volume = Math.max(0, Math.min(1, this.config.volume));

    // If root key changed while playing, smoothly crossfade to the new pitch
    if (newConfig.rootKey && newConfig.rootKey !== oldKey && this.isPlaying) {
      this.switchAcousticKey(newConfig.rootKey);
    }
  }

  public start(rootKey?: string) {
    if (rootKey) {
      this.config.rootKey = rootKey;
    }
    this.initAudioContext();
    this.isPlaying = true;
    this.currentStringStep = 0;

    // Start dual-voice ping-pong acoustic loop
    this.startDualVoicePingPong(this.config.rootKey);

    // Start visual string indicator sync
    this.startCyclePulse();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.pulseTimer) {
      clearTimeout(this.pulseTimer);
      this.pulseTimer = null;
    }
    if (this.pingPongTimer) {
      clearTimeout(this.pingPongTimer);
      this.pingPongTimer = null;
    }
    if (this.htmlPingPongTimer) {
      clearTimeout(this.htmlPingPongTimer);
      this.htmlPingPongTimer = null;
    }

    this.stopAllVoices();
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
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
    const scheduleNext = () => {
      if (!this.isPlaying) return;
      this.pulseTimer = setTimeout(() => {
        this.currentStringStep = (this.currentStringStep + 1) % 4;
        this.notify();
        scheduleNext();
      }, this.config.pluckIntervalMs);
    };
    scheduleNext();
  }

  /**
   * Dual-Voice Ping-Pong Audio Loop Execution
   * Alternates Voice A and Voice B with a 2.4s overlap window.
   */
  private async startDualVoicePingPong(key: string) {
    this.stopAllVoices();

    const fileName = KEY_TO_FILE[key] || 'C.mp3';
    const audioUrl = `./audio/tanpura/${fileName}`;

    try {
      const buffer = await this.fetchAndDecodeBuffer(key, audioUrl);
      if (!buffer || !this.isPlaying) return;

      this.schedulePingPongBufferVoice(buffer);
    } catch {
      // Graceful fallback to HTML5 Audio ping-pong crossfade
      this.startHtmlPingPong(audioUrl);
    }
  }

  private async fetchAndDecodeBuffer(key: string, url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(key)) {
      return this.bufferCache.get(key)!;
    }

    this.initAudioContext();
    if (!this.ctx) return null;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const decodedBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(key, decodedBuffer);
      return decodedBuffer;
    } catch {
      return null;
    }
  }

  /**
   * Schedules an overlapping buffer voice.
   * Starts a voice, and before it finishes, schedules the next voice so that
   * the Kharaj tail naturally sustains under the new cycle.
   */
  private schedulePingPongBufferVoice(buffer: AudioBuffer) {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = buffer.duration;
    // Overlap duration ensures previous bass tail rings out under new pluck
    const overlap = Math.min(this.overlapSeconds, duration * 0.15);
    const cycleIntervalMs = Math.max(1000, (duration - overlap) * 1000);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = false; // Never use abrupt hard loop

    const voiceGain = this.ctx.createGain();
    // Smooth fade in over 80ms to prevent click
    voiceGain.gain.setValueAtTime(0.001, now);
    voiceGain.gain.linearRampToValueAtTime(1.0, now + 0.08);

    // Fade out tail over overlap period at the end
    const fadeOutStart = now + duration - overlap;
    voiceGain.gain.setValueAtTime(1.0, fadeOutStart);
    voiceGain.gain.linearRampToValueAtTime(0.0001, now + duration);

    source.connect(voiceGain);
    voiceGain.connect(this.masterGain);
    source.start(now);

    const activeVoice: ActiveVoice = {
      source,
      gain: voiceGain,
      stopTimer: setTimeout(() => {
        try {
          source.stop();
          source.disconnect();
          voiceGain.disconnect();
        } catch {}
        this.activeVoices.delete(activeVoice);
      }, duration * 1000 + 200)
    };

    this.activeVoices.add(activeVoice);

    // Schedule the next overlapping voice exactly (duration - overlap) later
    this.pingPongTimer = setTimeout(() => {
      if (this.isPlaying) {
        this.schedulePingPongBufferVoice(buffer);
      }
    }, cycleIntervalMs);
  }

  /**
   * HTML5 Audio Dual-Voice ping-pong fallback
   */
  private startHtmlPingPong(url: string) {
    this.htmlVoiceA = new Audio(url);
    this.htmlVoiceB = new Audio(url);
    this.htmlVoiceA.volume = Math.max(0, Math.min(1, this.config.volume));
    this.htmlVoiceB.volume = 0;

    this.htmlVoiceA.play().catch(() => {});
    this.isVoiceAPlaying = true;

    const cycleMs = 18600; // ~18.6s cycle before crossfading
    const triggerHtmlPingPong = () => {
      if (!this.isPlaying) return;

      this.htmlPingPongTimer = setTimeout(() => {
        if (!this.isPlaying) return;

        const incoming = this.isVoiceAPlaying ? this.htmlVoiceB : this.htmlVoiceA;
        const outgoing = this.isVoiceAPlaying ? this.htmlVoiceA : this.htmlVoiceB;

        if (incoming && outgoing) {
          incoming.currentTime = 0;
          incoming.volume = 0;
          incoming.play().catch(() => {});

          // Crossfade over 2000ms
          const steps = 10;
          let currentStep = 0;
          const targetVol = this.config.volume;
          const fadeTimer = setInterval(() => {
            currentStep++;
            const ratio = currentStep / steps;
            incoming.volume = Math.min(1, targetVol * ratio);
            outgoing.volume = Math.max(0, targetVol * (1 - ratio));

            if (currentStep >= steps) {
              clearInterval(fadeTimer);
              outgoing.pause();
            }
          }, 200);
        }

        this.isVoiceAPlaying = !this.isVoiceAPlaying;
        triggerHtmlPingPong();
      }, cycleMs);
    };

    triggerHtmlPingPong();
  }

  private switchAcousticKey(newKey: string) {
    // Smooth crossfade out old voices over 350ms
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.activeVoices.forEach((v) => {
        try {
          v.gain.gain.setValueAtTime(v.gain.gain.value, now);
          v.gain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
          setTimeout(() => {
            try {
              v.source.stop();
              v.source.disconnect();
              v.gain.disconnect();
            } catch {}
          }, 360);
        } catch {}
      });
      this.activeVoices.clear();
    }

    if (this.pingPongTimer) {
      clearTimeout(this.pingPongTimer);
      this.pingPongTimer = null;
    }
    if (this.htmlPingPongTimer) {
      clearTimeout(this.htmlPingPongTimer);
      this.htmlPingPongTimer = null;
    }

    // Immediately start dual-voice ping-pong in the new root key
    this.startDualVoicePingPong(newKey);
  }

  private stopAllVoices() {
    this.activeVoices.forEach((v) => {
      try {
        clearTimeout(v.stopTimer);
        v.source.stop();
        v.source.disconnect();
        v.gain.disconnect();
      } catch {}
    });
    this.activeVoices.clear();

    if (this.htmlVoiceA) {
      try {
        this.htmlVoiceA.pause();
        this.htmlVoiceA.currentTime = 0;
      } catch {}
      this.htmlVoiceA = null;
    }
    if (this.htmlVoiceB) {
      try {
        this.htmlVoiceB.pause();
        this.htmlVoiceB.currentTime = 0;
      } catch {}
      this.htmlVoiceB = null;
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
