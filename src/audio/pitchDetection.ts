// McLeod Pitch Method (MPM) / Normalized Square Difference Function (NSDF)
// High-accuracy time-domain pitch detector with parabolic interpolation for sub-cent precision.

export interface PitchResult {
  frequency: number;
  clarity: number; // 0.0 to 1.0
  volume: number;  // RMS volume 0.0 to 1.0
  noteName: string;
  octave: number;
  cents: number;
  targetFreq: number;
}

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Computes root mean square (RMS) volume of the audio buffer
 */
export function getRMSVolume(buffer: Float32Array<ArrayBufferLike>): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Normalized Square Difference Function (NSDF) autocorrelation
 * Used in McLeod Pitch Method to avoid false octave jumps.
 */
function computeNSDF(buffer: Float32Array<ArrayBufferLike>, nsdf: Float32Array, maxLag: number) {
  const n = buffer.length;
  for (let tau = 0; tau < maxLag; tau++) {
    let acf = 0;
    let divisorM = 0;
    for (let i = 0; i < n - tau; i++) {
      const a = buffer[i];
      const b = buffer[i + tau];
      acf += a * b;
      divisorM += a * a + b * b;
    }
    nsdf[tau] = divisorM === 0 ? 0 : (2 * acf) / divisorM;
  }
}

/**
 * Parabolic interpolation for fine sub-sample peak refinement
 */
function parabolicInterpolation(array: Float32Array, x: number): { x: number; y: number } {
  const x0 = x - 1;
  const x2 = x + 1;
  const y0 = array[x0];
  const y1 = array[x];
  const y2 = array[x2];
  const bottom = 2 * (2 * y1 - y2 - y0);
  if (bottom === 0) return { x, y: y1 };
  const delta = (y2 - y0) / bottom;
  return {
    x: x + delta,
    y: y1 - (y2 - y0) * (delta / 4),
  };
}

// Reusable scratch buffer to minimize Garbage Collection in the 60fps audio loop
let cachedNSDF: Float32Array | null = null;

/**
 * Detects fundamental frequency using McLeod Pitch Method (MPM)
 * @param buffer Float32Array audio samples
 * @param sampleRate audio sample rate (e.g. 44100 or 48000)
 * @param minFreq minimum detectable freq (e.g. 50Hz for low E and bass)
 * @param maxFreq maximum detectable freq (e.g. 1200Hz for high notes)
 */
export function detectPitchMPM(
  buffer: Float32Array<ArrayBufferLike>,
  sampleRate: number,
  clarityThreshold = 0.60,
  minFreq = 55,   // Covers Guitar Low E (82Hz), Drop Tunings, and Bass
  maxFreq = 1200  // Covers high guitar fret notes
): { frequency: number; clarity: number } | null {
  const desiredMaxLag = Math.floor(sampleRate / minFreq);
  const maxLag = Math.min(desiredMaxLag, Math.floor(buffer.length / 2) - 1);
  const minLag = Math.max(1, Math.floor(sampleRate / maxFreq));

  if (maxLag <= minLag) {
    return null;
  }

  if (!cachedNSDF || cachedNSDF.length < maxLag) {
    cachedNSDF = new Float32Array(maxLag);
  }

  computeNSDF(buffer, cachedNSDF, maxLag);

  // Find local maxima above threshold
  let maxVal = 0;
  let maxIndex = -1;
  let isRising = false;

  for (let tau = minLag; tau < maxLag - 1; tau++) {
    const prev = cachedNSDF[tau - 1];
    const curr = cachedNSDF[tau];
    const next = cachedNSDF[tau + 1];

    if (!isRising && curr > prev) {
      isRising = true;
    }

    if (isRising && curr >= prev && curr >= next) {
      isRising = false;
      if (curr > clarityThreshold) {
        maxVal = curr;
        maxIndex = tau;
        // Take the first strong peak to avoid octave errors
        break;
      }
    }
  }

  if (maxIndex === -1 || maxVal < clarityThreshold) {
    return null;
  }

  const { x: refinedLag, y: refinedClarity } = parabolicInterpolation(cachedNSDF, maxIndex);
  const frequency = sampleRate / refinedLag;

  return {
    frequency,
    clarity: Math.min(1, Math.max(0, refinedClarity)),
  };
}

/**
 * Converts a frequency in Hz to nearest musical note, octave, and cents offset
 * @param freq frequency in Hz
 * @param referenceA4 reference frequency for A4 (default 440 Hz)
 */
export function frequencyToNote(freq: number, referenceA4 = 440) {
  // MIDI note 69 = A4
  const noteNum = 12 * (Math.log(freq / referenceA4) / Math.log(2)) + 69;
  const roundedNote = Math.round(noteNum);
  const noteIndex = (roundedNote % 12 + 12) % 12;
  const octave = Math.floor(roundedNote / 12) - 1;
  const targetFreq = referenceA4 * Math.pow(2, (roundedNote - 69) / 12);
  const cents = 1200 * (Math.log(freq / targetFreq) / Math.log(2));

  return {
    noteName: NOTE_STRINGS[noteIndex],
    octave,
    cents: Number(cents.toFixed(1)), // 0.1 cent resolution!
    targetFreq: Number(targetFreq.toFixed(2)),
  };
}

/**
 * Calculates cents offset relative to a specific target frequency
 */
export function calculateCents(currentFreq: number, targetFreq: number): number {
  if (targetFreq <= 0 || currentFreq <= 0) return 0;
  return 1200 * Math.log2(currentFreq / targetFreq);
}
