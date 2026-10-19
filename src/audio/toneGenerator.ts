// Web Audio Tone Generator for tuning by ear & feedback chimes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a realistic guitar string pluck tone for reference tuning
 */
export function playGuitarStringTone(frequency: number, durationSeconds = 2.0) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Fundamental oscillator (triangle wave gives acoustic-like warmth)
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, now);

    // 2nd Harmonic (sine)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);

    // 3rd Harmonic (subtle)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency * 3, now);

    // Gain nodes for envelope shaping (pluck attack + exponential acoustic decay)
    const masterGain = ctx.createGain();
    const osc2Gain = ctx.createGain();
    const osc3Gain = ctx.createGain();

    osc2Gain.gain.setValueAtTime(0.35, now);
    osc3Gain.gain.setValueAtTime(0.15, now);

    // Attack: Fast 15ms burst
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.6, now + 0.015);
    // Natural guitar acoustic decay
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    // Connect nodes
    osc1.connect(masterGain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(masterGain);
    osc3.connect(osc3Gain);
    osc3Gain.connect(masterGain);

    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + durationSeconds);
    osc2.stop(now + durationSeconds);
    osc3.stop(now + durationSeconds);
  } catch (err) {
    console.warn('Could not play tone:', err);
  }
}

/**
 * Plays a pleasant in-tune celebration chime
 */
export function playInTuneChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [587.33, 880.0]; // D5 -> A5 high chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.55);
    });
  } catch (err) {
    console.warn('Could not play chime:', err);
  }
}
