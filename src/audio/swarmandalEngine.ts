/**
 * Authentic Swarmandal (Indian Harp / Zither) Acoustic Cascade Engine
 * Simulates the cascading modal harp strums that classical vocalists and
 * sitarists use for melodic ambiance, vocal warmup, and establishing the Raga aura.
 */

// Semitone map relative to root note Sa (0)
const SWARA_SEMITONES: Record<string, number> = {
  'S': 0, 'Sa': 0,
  'r': 1, 're': 1, 'Re(k)': 1,
  'R': 2, 'Re': 2,
  'g': 3, 'ga': 3, 'Ga(k)': 3,
  'G': 4, 'Ga': 4,
  'm': 5, 'ma': 5, 'Ma': 5,
  'M': 6, 'Ma(t)': 6, "Ma'": 6,
  'P': 7, 'Pa': 7,
  'd': 8, 'dha': 8, 'Dha(k)': 8,
  'D': 9, 'Dha': 9,
  'n': 10, 'ni': 10, 'Ni(k)': 10,
  'N': 11, 'Ni': 11,
};

const NOTE_FREQS_BASE: Record<string, number> = {
  'C': 130.81,  // C3
  'C#': 138.59,
  'Db': 138.59,
  'D': 146.83,
  'D#': 155.56,
  'Eb': 155.56,
  'E': 164.81,
  'F': 174.61,
  'F#': 185.00,
  'Gb': 185.00,
  'G': 196.00,
  'G#': 207.65,
  'Ab': 207.65,
  'A': 220.00,
  'A#': 233.08,
  'Bb': 233.08,
  'B': 246.94
};

class SwarmandalEngine {
  private ctx: AudioContext | null = null;
  private isStrumming: boolean = false;
  private activeOscillators: OscillatorNode[] = [];

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Cascades a modal arpeggio across 2 to 3 octaves using the valid Swaras of the active Raga.
   * @param rootKey e.g. 'C', 'D', 'G', etc.
   * @param swaras Array of swara strings e.g. ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni']
   * @param direction 'up' | 'down' | 'both'
   */
  public cascade(
    rootKey: string = 'C',
    swaras: string[] = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'],
    direction: 'up' | 'down' | 'both' = 'up'
  ) {
    const ctx = this.getAudioContext();
    const baseFreq = NOTE_FREQS_BASE[rootKey] || 130.81;

    // Calculate semitone offsets from swaras
    const semitones: number[] = [];
    swaras.forEach((sw) => {
      const clean = sw.trim();
      const semi = SWARA_SEMITONES[clean] ?? SWARA_SEMITONES[clean.slice(0, 2)] ?? 0;
      if (!semitones.includes(semi)) {
        semitones.push(semi);
      }
    });
    semitones.sort((a, b) => a - b);
    if (semitones.length === 0) semitones.push(0, 2, 4, 5, 7, 9, 11);

    // Build multi-octave string frequencies (Mandra, Madhya, Taar)
    const stringFreqs: number[] = [];
    // Lower octave
    semitones.forEach((s) => stringFreqs.push(baseFreq * Math.pow(2, (s - 12) / 12)));
    // Middle octave
    semitones.forEach((s) => stringFreqs.push(baseFreq * Math.pow(2, s / 12)));
    // Upper octave
    semitones.forEach((s) => stringFreqs.push(baseFreq * Math.pow(2, (s + 12) / 12)));

    // Order based on direction
    let sequence = [...stringFreqs];
    if (direction === 'down') {
      sequence.reverse();
    } else if (direction === 'both') {
      sequence = [...stringFreqs, ...stringFreqs.slice(0, -1).reverse()];
    }

    const now = ctx.currentTime;
    const pluckInterval = 0.055; // 55ms between harp strings creates a gentle flowing cascade

    sequence.forEach((freq, idx) => {
      const pluckTime = now + idx * pluckInterval;
      this.pluckString(ctx, freq, pluckTime);
    });
  }

  /**
   * Synthesizes an individual acoustic harp string pluck with bright metallic attack
   * and long shimmering sympathetic ringing tail (2.5 seconds).
   */
  private pluckString(ctx: AudioContext, freq: number, time: number) {
    const oscMain = ctx.createOscillator();
    const oscHarmonic = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Harp string body resonance filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(10000, freq * 4.5), time);
    filter.frequency.exponentialRampToValueAtTime(Math.min(6000, freq * 1.8), time + 1.8);

    // String timbre
    oscMain.type = 'triangle';
    oscMain.frequency.setValueAtTime(freq, time);

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2.01, time); // Subtle physical detune

    // Harp pluck attack & long ringing envelope
    const duration = 2.6;
    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.linearRampToValueAtTime(0.28, time + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscMain.connect(filter);
    oscHarmonic.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscMain.start(time);
    oscHarmonic.start(time);
    oscMain.stop(time + duration + 0.05);
    oscHarmonic.stop(time + duration + 0.05);
  }
}

export const swarmandal = new SwarmandalEngine();
