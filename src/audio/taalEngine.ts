/**
 * Indian Classical Taal Definitions & High-Presence Acoustic Tabla Sound Engine
 * Provides authentic rhythmic cycles (Matras, Vibhags, Bols, Sam, Tali, Khali)
 * and physical leather-skin synthesis with punchy mobile/laptop speaker saturation.
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

// Pre-generated leather slap noise buffer for realistic fingertip parchment strike
let cachedNoiseBuffer: AudioBuffer | null = null;
function getLeatherNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const bufferSize = Math.floor(ctx.sampleRate * 0.05); // 50ms transient
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // Pinkish filtered noise with punchy attack
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
  }
  cachedNoiseBuffer = buffer;
  return buffer;
}

/**
 * High-Presence Acoustic Tabla sound generator with physical speaker saturation:
 * Calibrated for maximum clarity and punch on phones, tablets, and laptops.
 */
export function playSyntheticTablaStroke(
  ctx: AudioContext,
  bolType: BolType,
  time: number,
  basePitchHz = 146.83 // Default D3 Dayān tuning (common for acoustic sitar / guitar / tanpura)
) {
  switch (bolType) {
    case 'dha': {
      // Dha = Dayān (Ta/Na rim) + Bayān (deep resonant Ghumki slide with mid-bass punch)
      playBayanGhumki(ctx, time, 92, 54, 0.44, 1.25);
      playDayanKinar(ctx, time, basePitchHz * 2, 0.24, 1.15);
      playLeatherSlap(ctx, time, 0.45);
      break;
    }
    case 'dhin': {
      // Dhin = Open Dayān ring (Sur) + soft Bayān resonance
      playBayanGhumki(ctx, time, 96, 62, 0.48, 1.10);
      playDayanSur(ctx, time, basePitchHz * 2, 0.42, 1.20);
      playLeatherSlap(ctx, time, 0.35);
      break;
    }
    case 'ge': {
      // Ge = Deep open Bayān bass glide alone with resonant punch
      playBayanGhumki(ctx, time, 92, 52, 0.46, 1.30);
      playLeatherSlap(ctx, time, 0.38);
      break;
    }
    case 'tin': {
      // Tin = Open ringing Dayān resonant tone on Syahi (no bass)
      playDayanSur(ctx, time, basePitchHz * 2, 0.38, 1.15);
      playLeatherSlap(ctx, time, 0.28);
      break;
    }
    case 'ta':
    case 'na': {
      // Ta / Na = Crisp, high-pitched metallic rim strike on the Kinar border
      playDayanKinar(ctx, time, basePitchHz * 2.25, 0.20, 1.25);
      playLeatherSlap(ctx, time, 0.48);
      break;
    }
    case 'ke': {
      // Ke = Flat, muted flat-hand slap on Bayān skin
      playMutedSlap(ctx, time);
      break;
    }
  }
}

/**
 * Bayān (Bass Kettle Drum) with Speaker Harmonic Saturation:
 * Uses a fundamental oscillator + a strong 2nd/3rd harmonic punch that translates
 * loudly onto small smartphone speakers (120Hz-220Hz range) while still delivering
 * sub-bass for headphones.
 */
function playBayanGhumki(
  ctx: AudioContext,
  time: number,
  startFreq: number,
  endFreq: number,
  duration: number,
  gainLevel: number
) {
  const osc1 = ctx.createOscillator();
  const oscPunch = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Lowpass filter tailored for punch and presence
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(360, time);
  filter.frequency.exponentialRampToValueAtTime(140, time + duration);

  // Deep fundamental frequency
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(startFreq, time);
  osc1.frequency.exponentialRampToValueAtTime(endFreq, time + duration * 0.85);

  // Speaker punch harmonic (allows phones and laptops to clearly project the bass stroke)
  oscPunch.type = 'triangle';
  oscPunch.frequency.setValueAtTime(startFreq * 2.0, time);
  oscPunch.frequency.exponentialRampToValueAtTime(endFreq * 2.0, time + duration * 0.85);

  // Full-bodied volume envelope
  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(filter);
  oscPunch.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(time);
  oscPunch.start(time);
  osc1.stop(time + duration + 0.02);
  oscPunch.stop(time + duration + 0.02);
}

/**
 * Dayān Open Ring (Sur / Syahi Strike):
 * High-presence singing bell tone with widened Q band to prevent volume loss.
 */
function playDayanSur(
  ctx: AudioContext,
  time: number,
  freq: number,
  duration: number,
  gainLevel: number
) {
  const oscFundamental = ctx.createOscillator();
  const oscSyahiHarmonic = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Syahi metallic resonance band with widened Q to maintain strong output volume
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq * 1.25, time);
  filter.Q.setValueAtTime(1.8, time);

  // Pure fundamental note
  oscFundamental.type = 'sine';
  oscFundamental.frequency.setValueAtTime(freq, time);

  // Over-harmonic from the iron-paste center
  oscSyahiHarmonic.type = 'triangle';
  oscSyahiHarmonic.frequency.setValueAtTime(freq * 1.58, time);

  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  // Direct connection for fundamental + filtered harmonic ensures high volume
  oscFundamental.connect(gain);
  oscSyahiHarmonic.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  oscFundamental.start(time);
  oscSyahiHarmonic.start(time);
  oscFundamental.stop(time + duration + 0.02);
  oscSyahiHarmonic.stop(time + duration + 0.02);
}

/**
 * Dayān Rim Strike (Kinar / Na / Ta):
 * Piercing, snappy acoustic rim slap with boost.
 */
function playDayanKinar(
  ctx: AudioContext,
  time: number,
  freq: number,
  duration: number,
  gainLevel: number
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq * 1.35, time);
  filter.Q.setValueAtTime(2.2, time);

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, time);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2.45, time);

  gain.gain.setValueAtTime(gainLevel, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(gain);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration + 0.02);
  osc2.stop(time + duration + 0.02);
}

/**
 * Finger Slap Transient on Goat Skin (Sharp transient impact)
 */
function playLeatherSlap(ctx: AudioContext, time: number, level: number) {
  try {
    const noise = ctx.createBufferSource();
    noise.buffer = getLeatherNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.Q.setValueAtTime(1.5, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.04);
  } catch {}
}

/**
 * Muted 'Ke' slap simulation: flat hand striking dough skin with distinct acoustic crack
 */
function playMutedSlap(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, time);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(55, time + 0.06);

  gain.gain.setValueAtTime(0.85, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  playLeatherSlap(ctx, time, 0.45);

  osc.start(time);
  osc.stop(time + 0.07);
}
