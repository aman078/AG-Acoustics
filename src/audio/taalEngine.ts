/**
 * Indian Classical Taal Definitions & Synthetic Tabla Sound Engine
 * Provides authentic rhythmic cycles (Matras, Vibhags, Bols, Sam, Tali, Khali)
 * and multi-tonal acoustic Tabla synthesis using Web Audio API.
 */

export type BolType = 'dha' | 'dhin' | 'tin' | 'ta' | 'ge' | 'ke' | 'na';

export interface TaalMatra {
  index: number;       // 1-based matra number (1..N)
  bol: string;         // 'Dha', 'Dhin', 'Tin', 'Ta', etc.
  type: BolType;
  mark: 'sam' | 'tali' | 'khali' | 'none'; // 'sam' (X), 'tali' (2, 3), 'khali' (0)
  vibhagIndex: number; // which division it belongs to
}

export interface TaalPreset {
  id: string;
  name: string;
  hindiName: string;
  totalMatras: number;
  description: string;
  structure: string; // e.g. "4+4+4+4"
  defaultBpm: number;
  matras: TaalMatra[];
}

export const TAAL_PRESETS: TaalPreset[] = [
  {
    id: 'teentaal',
    name: 'Teentaal (Tintal)',
    hindiName: 'तीनताल',
    totalMatras: 16,
    structure: '4 + 4 + 4 + 4',
    defaultBpm: 90,
    description: 'The king of Hindustani Taals. 16 beats with 3 Talis and 1 Khali.',
    matras: [
      // Vibhag 1 (Sam / Tali 1)
      { index: 1, bol: 'Dha', type: 'dha', mark: 'sam', vibhagIndex: 0 },
      { index: 2, bol: 'Dhin', type: 'dhin', mark: 'none', vibhagIndex: 0 },
      { index: 3, bol: 'Dhin', type: 'dhin', mark: 'none', vibhagIndex: 0 },
      { index: 4, bol: 'Dha', type: 'dha', mark: 'none', vibhagIndex: 0 },
      // Vibhag 2 (Tali 2)
      { index: 5, bol: 'Dha', type: 'dha', mark: 'tali', vibhagIndex: 1 },
      { index: 6, bol: 'Dhin', type: 'dhin', mark: 'none', vibhagIndex: 1 },
      { index: 7, bol: 'Dhin', type: 'dhin', mark: 'none', vibhagIndex: 1 },
      { index: 8, bol: 'Dha', type: 'dha', mark: 'none', vibhagIndex: 1 },
      // Vibhag 3 (Khali 0)
      { index: 9, bol: 'Dha', type: 'dha', mark: 'khali', vibhagIndex: 2 },
      { index: 10, bol: 'Tin', type: 'tin', mark: 'none', vibhagIndex: 2 },
      { index: 11, bol: 'Tin', type: 'tin', mark: 'none', vibhagIndex: 2 },
      { index: 12, bol: 'Ta', type: 'ta', mark: 'none', vibhagIndex: 2 },
      // Vibhag 4 (Tali 3)
      { index: 13, bol: 'Ta', type: 'ta', mark: 'tali', vibhagIndex: 3 },
      { index: 14, bol: 'Dhin', type: 'dhin', mark: 'none', vibhagIndex: 3 },
      { index: 15, bol: 'Dhin', type: 'dhin', mark: 'none', vibhagIndex: 3 },
      { index: 16, bol: 'Dha', type: 'dha', mark: 'none', vibhagIndex: 3 },
    ],
  },
  {
    id: 'keherwa',
    name: 'Keherwa (Kaharwa)',
    hindiName: 'कहरवा',
    totalMatras: 8,
    structure: '4 + 4',
    defaultBpm: 108,
    description: 'Energetic 8-beat cycle common in Ghazals, Bhajans, Folk, and Bollywood.',
    matras: [
      // Vibhag 1 (Sam)
      { index: 1, bol: 'Dha', type: 'dha', mark: 'sam', vibhagIndex: 0 },
      { index: 2, bol: 'Ge', type: 'ge', mark: 'none', vibhagIndex: 0 },
      { index: 3, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 0 },
      { index: 4, bol: 'Ti', type: 'tin', mark: 'none', vibhagIndex: 0 },
      // Vibhag 2 (Khali)
      { index: 5, bol: 'Na', type: 'na', mark: 'khali', vibhagIndex: 1 },
      { index: 6, bol: 'Ke', type: 'ke', mark: 'none', vibhagIndex: 1 },
      { index: 7, bol: 'Dhi', type: 'dhin', mark: 'none', vibhagIndex: 1 },
      { index: 8, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 1 },
    ],
  },
  {
    id: 'dadra',
    name: 'Dadra',
    hindiName: 'दादरा',
    totalMatras: 6,
    structure: '3 + 3',
    defaultBpm: 120,
    description: 'Lilting 6-beat waltz-like rhythm (3/4 & 6/8 acoustic guitar feel).',
    matras: [
      // Vibhag 1 (Sam)
      { index: 1, bol: 'Dha', type: 'dha', mark: 'sam', vibhagIndex: 0 },
      { index: 2, bol: 'Dhi', type: 'dhin', mark: 'none', vibhagIndex: 0 },
      { index: 3, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 0 },
      // Vibhag 2 (Khali)
      { index: 4, bol: 'Dha', type: 'dha', mark: 'khali', vibhagIndex: 1 },
      { index: 5, bol: 'Tu', type: 'tin', mark: 'none', vibhagIndex: 1 },
      { index: 6, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 1 },
    ],
  },
  {
    id: 'rupak',
    name: 'Rupak',
    hindiName: 'रूपक',
    totalMatras: 7,
    structure: '3 + 2 + 2',
    defaultBpm: 84,
    description: 'Unique asymmetrical 7-beat cycle that begins on a Khali wave.',
    matras: [
      // Vibhag 1 (Khali / Sam)
      { index: 1, bol: 'Tin', type: 'tin', mark: 'sam', vibhagIndex: 0 },
      { index: 2, bol: 'Tin', type: 'tin', mark: 'none', vibhagIndex: 0 },
      { index: 3, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 0 },
      // Vibhag 2 (Tali 1)
      { index: 4, bol: 'Dhin', type: 'dhin', mark: 'tali', vibhagIndex: 1 },
      { index: 5, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 1 },
      // Vibhag 3 (Tali 2)
      { index: 6, bol: 'Dhin', type: 'dhin', mark: 'tali', vibhagIndex: 2 },
      { index: 7, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 2 },
    ],
  },
  {
    id: 'ektaal',
    name: 'Ektaal (Ektal)',
    hindiName: 'एकताल',
    totalMatras: 12,
    structure: '2 + 2 + 2 + 2 + 2 + 2',
    defaultBpm: 72,
    description: 'Majestic 12-beat cycle for contemplative classical khayal and slow raag practice.',
    matras: [
      { index: 1, bol: 'Dhin', type: 'dhin', mark: 'sam', vibhagIndex: 0 },
      { index: 2, bol: 'Dhin', type: 'dhin', mark: 'none', vibhagIndex: 0 },
      { index: 3, bol: 'Dha', type: 'dha', mark: 'khali', vibhagIndex: 1 },
      { index: 4, bol: 'Ge', type: 'ge', mark: 'none', vibhagIndex: 1 },
      { index: 5, bol: 'Tu', type: 'tin', mark: 'tali', vibhagIndex: 2 },
      { index: 6, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 2 },
      { index: 7, bol: 'Kat', type: 'ke', mark: 'khali', vibhagIndex: 3 },
      { index: 8, bol: 'Ta', type: 'ta', mark: 'none', vibhagIndex: 3 },
      { index: 9, bol: 'Dha', type: 'dha', mark: 'tali', vibhagIndex: 4 },
      { index: 10, bol: 'Ge', type: 'ge', mark: 'none', vibhagIndex: 4 },
      { index: 11, bol: 'Dhi', type: 'dhin', mark: 'tali', vibhagIndex: 5 },
      { index: 12, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 5 },
    ],
  },
  {
    id: 'jhaptal',
    name: 'Jhaptal',
    hindiName: 'झपताल',
    totalMatras: 10,
    structure: '2 + 3 + 2 + 3',
    defaultBpm: 80,
    description: 'Pensive 10-beat rhythm with rich contrast between 2-beat and 3-beat vibhags.',
    matras: [
      { index: 1, bol: 'Dhi', type: 'dhin', mark: 'sam', vibhagIndex: 0 },
      { index: 2, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 0 },
      { index: 3, bol: 'Dhi', type: 'dhin', mark: 'tali', vibhagIndex: 1 },
      { index: 4, bol: 'Dhi', type: 'dhin', mark: 'none', vibhagIndex: 1 },
      { index: 5, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 1 },
      { index: 6, bol: 'Ti', type: 'tin', mark: 'khali', vibhagIndex: 2 },
      { index: 7, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 2 },
      { index: 8, bol: 'Dhi', type: 'dhin', mark: 'tali', vibhagIndex: 3 },
      { index: 9, bol: 'Dhi', type: 'dhin', mark: 'none', vibhagIndex: 3 },
      { index: 10, bol: 'Na', type: 'na', mark: 'none', vibhagIndex: 3 },
    ],
  },
];

/**
 * High-fidelity synthetic Tabla sound generator using Web Audio API nodes.
 * Accurately models the dual-drum acoustic properties:
 * - Dayān (treble wooden drum): tuned metallic ring, crisp rim slap
 * - Bayān (bass copper drum): deep resonant boom with modulatory pitch glide (Ghumki)
 */
export function playSyntheticTablaStroke(
  ctx: AudioContext,
  bolType: BolType,
  time: number,
  basePitchHz = 146.83 // Default D3 Dayān tuning (common for acoustic sitar / guitar / tanpura)
) {
  switch (bolType) {
    case 'dha': {
      // Dha = Dayān (Ta/Na) + Bayān (Ge resonant bass)
      playBayanBass(ctx, time, 75, 52, 0.32, 0.85);
      playDayanTreble(ctx, time, basePitchHz * 2, 0.18, 0.65, true);
      break;
    }
    case 'dhin': {
      // Dhin = Open Dayān ring + soft deep Bayān resonance
      playBayanBass(ctx, time, 82, 60, 0.38, 0.75);
      playDayanTreble(ctx, time, basePitchHz * 2, 0.30, 0.70, false);
      break;
    }
    case 'ge': {
      // Ge = Deep open Bayān bass glide alone
      playBayanBass(ctx, time, 72, 48, 0.35, 0.90);
      break;
    }
    case 'tin': {
      // Tin = Open ringing Dayān resonant tone (no bass)
      playDayanTreble(ctx, time, basePitchHz * 2, 0.28, 0.65, false);
      break;
    }
    case 'ta':
    case 'na': {
      // Ta / Na = Crisp high-pitched metallic rim strike (Kinar)
      playDayanTreble(ctx, time, basePitchHz * 2.2, 0.14, 0.75, true);
      break;
    }
    case 'ke': {
      // Ke = Flat, muted flat hand slap on Bayān
      playMutedSlap(ctx, time);
      break;
    }
  }
}

/**
 * Bayān (Bass kettle drum) acoustic simulation:
 * Low-frequency sine with pitch modulation envelope + sub-bass resonance filter
 */
function playBayanBass(
  ctx: AudioContext,
  time: number,
  startFreq: number,
  endFreq: number,
  duration: number,
  gainLevel: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(220, time);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, time);
  // Gentle pitch dip mimicking finger slide on dough skin
  osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration * 0.7);

  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + duration + 0.02);
}

/**
 * Dayān (Right treble drum) acoustic simulation:
 * Dual harmonic oscillator mimicking the black iron-powder paste (Syahi) resonance
 */
function playDayanTreble(
  ctx: AudioContext,
  time: number,
  freq: number,
  duration: number,
  gainLevel: number,
  isRim: boolean
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, time);

  // High metallic harmonic
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * (isRim ? 2.76 : 1.58), time);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq * 1.2, time);
  filter.Q.setValueAtTime(isRim ? 6 : 4, time);

  gain.gain.setValueAtTime(gainLevel, time);
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

/**
 * Muted 'Ke' slap simulation: short noise burst + low thud
 */
function playMutedSlap(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.06);

  gain.gain.setValueAtTime(0.4, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.07);
}
