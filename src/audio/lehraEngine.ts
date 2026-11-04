import { BolType, playSyntheticTablaStroke } from './taalEngine';

/**
 * Authentic Lehra (Nagma) Melodic Loop Definition:
 * Semitone offsets from root Sa (0) for each beat of the Taal cycle,
 * creating the hypnotic harmonium melody essential for tracking Sam (Beat 1).
 */
export interface LehraNote {
  beatIndex: number;
  semitoneOffset: number; // e.g. 0 for Sa, 4 for Ga, 7 for Pa, 12 for high Sa
  durationBeats: number;
}

export interface TaalLehra {
  taalId: string;
  notes: LehraNote[]; // Maps exactly to the matras of the Taal
}

// Classical Lehra melodies in Raga Yaman / Bilawal framework for standard Taals:
export const LEHRA_PATTERNS: Record<string, LehraNote[]> = {
  // Teentaal (16 Beats): Classic Yaman Lehra that resolves with a joyful surge on Beat 1 (Sam)
  'teentaal': [
    { beatIndex: 0, semitoneOffset: 12, durationBeats: 1 },  // Beat 1 (Sam): High Sa (Climax)
    { beatIndex: 1, semitoneOffset: 11, durationBeats: 1 },  // Beat 2: Ni
    { beatIndex: 2, semitoneOffset: 9, durationBeats: 1 },   // Beat 3: Dha
    { beatIndex: 3, semitoneOffset: 7, durationBeats: 1 },   // Beat 4: Pa
    { beatIndex: 4, semitoneOffset: 6, durationBeats: 1 },   // Beat 5 (Tali 2): Teevra Ma
    { beatIndex: 5, semitoneOffset: 4, durationBeats: 1 },   // Beat 6: Ga
    { beatIndex: 6, semitoneOffset: 2, durationBeats: 1 },   // Beat 7: Re
    { beatIndex: 7, semitoneOffset: 0, durationBeats: 1 },   // Beat 8: Sa
    { beatIndex: 8, semitoneOffset: -1, durationBeats: 1 },  // Beat 9 (Khali): Mandra Ni
    { beatIndex: 9, semitoneOffset: 2, durationBeats: 1 },   // Beat 10: Re
    { beatIndex: 10, semitoneOffset: 4, durationBeats: 1 },  // Beat 11: Ga
    { beatIndex: 11, semitoneOffset: 6, durationBeats: 1 },  // Beat 12: Teevra Ma
    { beatIndex: 12, semitoneOffset: 7, durationBeats: 1 },  // Beat 13 (Tali 3): Pa
    { beatIndex: 13, semitoneOffset: 9, durationBeats: 1 },  // Beat 14: Dha
    { beatIndex: 14, semitoneOffset: 11, durationBeats: 1 }, // Beat 15: Ni
    { beatIndex: 15, semitoneOffset: 11, durationBeats: 1 }, // Beat 16: Ni (pre-surge to Sam)
  ],
  // Keherwa (8 Beats): Catchy Ghazal/Folk Nagma
  'keherwa': [
    { beatIndex: 0, semitoneOffset: 7, durationBeats: 1 },  // Beat 1 (Sam): Pa
    { beatIndex: 1, semitoneOffset: 9, durationBeats: 1 },  // Beat 2: Dha
    { beatIndex: 2, semitoneOffset: 11, durationBeats: 1 }, // Beat 3: Ni
    { beatIndex: 3, semitoneOffset: 12, durationBeats: 1 }, // Beat 4: Sa'
    { beatIndex: 4, semitoneOffset: 11, durationBeats: 1 }, // Beat 5 (Khali): Ni
    { beatIndex: 5, semitoneOffset: 9, durationBeats: 1 },  // Beat 6: Dha
    { beatIndex: 6, semitoneOffset: 7, durationBeats: 1 },  // Beat 7: Pa
    { beatIndex: 7, semitoneOffset: 6, durationBeats: 1 },  // Beat 8: Ma'
  ],
  // Dadra (6 Beats): Romantic 6/8 Nagma
  'dadra': [
    { beatIndex: 0, semitoneOffset: 12, durationBeats: 1 }, // Beat 1 (Sam): Sa'
    { beatIndex: 1, semitoneOffset: 11, durationBeats: 1 }, // Beat 2: Ni
    { beatIndex: 2, semitoneOffset: 9, durationBeats: 1 },  // Beat 3: Dha
    { beatIndex: 3, semitoneOffset: 7, durationBeats: 1 },  // Beat 4 (Khali): Pa
    { beatIndex: 4, semitoneOffset: 9, durationBeats: 1 },  // Beat 5: Dha
    { beatIndex: 5, semitoneOffset: 11, durationBeats: 1 }, // Beat 6: Ni
  ],
  // Rupak (7 Beats): Elegantly beginning on Khali
  'rupak': [
    { beatIndex: 0, semitoneOffset: 0, durationBeats: 1 },  // Beat 1 (Khali): Sa
    { beatIndex: 1, semitoneOffset: 2, durationBeats: 1 },  // Beat 2: Re
    { beatIndex: 2, semitoneOffset: 4, durationBeats: 1 },  // Beat 3: Ga
    { beatIndex: 3, semitoneOffset: 7, durationBeats: 1 },  // Beat 4 (Tali 1): Pa
    { beatIndex: 4, semitoneOffset: 9, durationBeats: 1 },  // Beat 5: Dha
    { beatIndex: 5, semitoneOffset: 11, durationBeats: 1 }, // Beat 6 (Tali 2): Ni
    { beatIndex: 6, semitoneOffset: 12, durationBeats: 1 }, // Beat 7: Sa'
  ],
  // Ektaal (12 Beats)
  'ektaal': [
    { beatIndex: 0, semitoneOffset: 12, durationBeats: 1 },
    { beatIndex: 1, semitoneOffset: 11, durationBeats: 1 },
    { beatIndex: 2, semitoneOffset: 9, durationBeats: 1 },
    { beatIndex: 3, semitoneOffset: 7, durationBeats: 1 },
    { beatIndex: 4, semitoneOffset: 6, durationBeats: 1 },
    { beatIndex: 5, semitoneOffset: 4, durationBeats: 1 },
    { beatIndex: 6, semitoneOffset: 2, durationBeats: 1 },
    { beatIndex: 7, semitoneOffset: 0, durationBeats: 1 },
    { beatIndex: 8, semitoneOffset: 4, durationBeats: 1 },
    { beatIndex: 9, semitoneOffset: 7, durationBeats: 1 },
    { beatIndex: 10, semitoneOffset: 9, durationBeats: 1 },
    { beatIndex: 11, semitoneOffset: 11, durationBeats: 1 },
  ],
  // Jhaptal (10 Beats)
  'jhaptal': [
    { beatIndex: 0, semitoneOffset: 7, durationBeats: 1 },
    { beatIndex: 1, semitoneOffset: 9, durationBeats: 1 },
    { beatIndex: 2, semitoneOffset: 11, durationBeats: 1 },
    { beatIndex: 3, semitoneOffset: 12, durationBeats: 1 },
    { beatIndex: 4, semitoneOffset: 11, durationBeats: 1 },
    { beatIndex: 5, semitoneOffset: 9, durationBeats: 1 },
    { beatIndex: 6, semitoneOffset: 7, durationBeats: 1 },
    { beatIndex: 7, semitoneOffset: 6, durationBeats: 1 },
    { beatIndex: 8, semitoneOffset: 4, durationBeats: 1 },
    { beatIndex: 9, semitoneOffset: 6, durationBeats: 1 },
  ],
};

const NOTE_ROOTS: Record<string, number> = {
  'C': 130.81, 'C#': 138.59, 'Db': 138.59, 'D': 146.83, 'D#': 155.56,
  'Eb': 155.56, 'E': 164.81, 'F': 174.61, 'F#': 185.00, 'Gb': 185.00,
  'G': 196.00, 'G#': 207.65, 'Ab': 207.65, 'A': 220.00, 'A#': 233.08,
  'Bb': 233.08, 'B': 246.94
};

/**
 * Synthesizes a warm acoustic Harmonium reed tone for the Lehra note
 */
export function playLehraNote(
  ctx: AudioContext,
  rootKey: string,
  taalId: string,
  beatIndex: number,
  time: number,
  beatDurationSeconds: number
) {
  const pattern = LEHRA_PATTERNS[taalId] || LEHRA_PATTERNS['teentaal'];
  const noteDef = pattern.find((n) => n.beatIndex === beatIndex);
  if (!noteDef) return;

  const baseFreq = (NOTE_ROOTS[rootKey] || 146.83) * 2; // Middle octave for harmonium
  const freq = baseFreq * Math.pow(2, noteDef.semitoneOffset / 12);

  // Dual detuned acoustic free-reeds
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, time);
  filter.Q.setValueAtTime(2.2, time);

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(freq, time);
  osc1.detune.setValueAtTime(4.0, time); // +4 cents detune for singing harmonium chorusing

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(freq, time);
  osc2.detune.setValueAtTime(-4.0, time); // -4 cents detune

  // Bellows envelope with smooth legato transition
  const duration = beatDurationSeconds * 0.95;
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.22, time + 0.04);
  gain.gain.setValueAtTime(0.20, time + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration + 0.02);
  osc2.stop(time + duration + 0.02);
}
