/**
 * Swara Keyboard Acoustic Engine
 * Expressive Web Audio synthesizer for Indian Classical Ragas:
 * - Plucked Sitar / Resonant Acoustic String physical modeling
 * - Seamless Meend (continuous microtonal pitch glides / bends)
 * - Andolan (automatic slow singing vibrato on held notes)
 * - Ambient Drone Pad latching
 */

export interface ActiveSwaraVoice {
  oscFundamental: OscillatorNode;
  oscHarmonic: OscillatorNode;
  filter: BiquadFilterNode;
  gainNode: GainNode;
  vibratoOsc: OscillatorNode;
  vibratoGain: GainNode;
  frequency: number;
  startTime: number;
  isHeld: boolean;
}

class SwaraKeyboardEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeVoices: Map<string, ActiveSwaraVoice> = new Map();
  private lastTriggeredFrequency: number | null = null;
  private droneVoice: { osc: OscillatorNode; gain: GainNode } | null = null;
  private droneFrequency: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  /**
   * Triggers a swara note pluck with optional glide (Meend)
   */
  public noteOn(
    noteId: string,
    targetFreq: number,
    glideFromFreq?: number,
    isDronePad: boolean = false
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    // Release existing voice with same id if any
    if (this.activeVoices.has(noteId)) {
      this.noteOff(noteId);
    }

    const now = this.ctx.currentTime;
    const fromFreq = glideFromFreq || (this.lastTriggeredFrequency && Math.abs(this.lastTriggeredFrequency - targetFreq) < 300 ? this.lastTriggeredFrequency : null);

    // 1. Fundamental Oscillator (Triangle for woody string warmth)
    const oscFund = this.ctx.createOscillator();
    oscFund.type = 'triangle';

    // 2. Harmonic Oscillator (Sine for resonant string chime)
    const oscHarm = this.ctx.createOscillator();
    oscHarm.type = 'sine';

    // 3. Vibrato LFO (Andolan - slow singing vibrato)
    const vibratoOsc = this.ctx.createOscillator();
    vibratoOsc.frequency.setValueAtTime(4.8, now); // 4.8 Hz authentic vocal / sitar oscillation
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.setValueAtTime(0, now); // Starts at 0, ramps up when held > 350ms
    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(oscFund.frequency);
    vibratoGain.connect(oscHarm.frequency);

    // Frequency Setup with Glide (Meend)
    if (fromFreq) {
      // Smooth sitar meend glide from previous pitch to new pitch
      oscFund.frequency.setValueAtTime(fromFreq, now);
      oscFund.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.12);
      oscHarm.frequency.setValueAtTime(fromFreq * 2, now);
      oscHarm.frequency.exponentialRampToValueAtTime(targetFreq * 2, now + 0.12);
    } else {
      oscFund.frequency.setValueAtTime(targetFreq, now);
      oscHarm.frequency.setValueAtTime(targetFreq * 2, now);
    }

    // 4. Acoustic Body Resonant Filter (Biquad Lowpass with dynamic pluck sweep)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.2, now); // Sitar gourd resonance
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.45);

    // 5. Envelope Gain Node
    const gainNode = this.ctx.createGain();
    const peakVolume = isDronePad ? 0.35 : 0.65;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(peakVolume, now + 0.015); // Snappy pluck

    if (!isDronePad) {
      // Natural string decay to warm sustain level
      gainNode.gain.exponentialRampToValueAtTime(peakVolume * 0.4, now + 0.35);
    }

    // Connect audio graph
    oscFund.connect(filter);
    oscHarm.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscFund.start(now);
    oscHarm.start(now);
    vibratoOsc.start(now);

    // Fade in singing vibrato (Andolan) after 350ms of holding
    vibratoGain.gain.setValueAtTime(0, now + 0.35);
    vibratoGain.gain.linearRampToValueAtTime(targetFreq * 0.025, now + 0.85);

    this.activeVoices.set(noteId, {
      oscFundamental: oscFund,
      oscHarmonic: oscHarm,
      filter,
      gainNode,
      vibratoOsc,
      vibratoGain,
      frequency: targetFreq,
      startTime: now,
      isHeld: true
    });

    this.lastTriggeredFrequency = targetFreq;
  }

  /**
   * Releases an active swara voice with natural string damping
   */
  public noteOff(noteId: string) {
    const voice = this.activeVoices.get(noteId);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    voice.isHeld = false;

    // Smooth release envelope (acoustic damping)
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    setTimeout(() => {
      try {
        voice.oscFundamental.stop();
        voice.oscHarmonic.stop();
        voice.vibratoOsc.stop();
        voice.oscFundamental.disconnect();
        voice.oscHarmonic.disconnect();
        voice.filter.disconnect();
        voice.gainNode.disconnect();
      } catch {}
      this.activeVoices.delete(noteId);
    }, 350);
  }

  /**
   * Smooth continuous glide during active touch drag across keyboard
   */
  public glideCurrentVoice(noteId: string, targetFreq: number) {
    const voice = this.activeVoices.get(noteId);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    voice.oscFundamental.frequency.cancelScheduledValues(now);
    voice.oscFundamental.frequency.setValueAtTime(voice.oscFundamental.frequency.value, now);
    voice.oscFundamental.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.06);

    voice.oscHarmonic.frequency.cancelScheduledValues(now);
    voice.oscHarmonic.frequency.setValueAtTime(voice.oscHarmonic.frequency.value, now);
    voice.oscHarmonic.frequency.exponentialRampToValueAtTime(targetFreq * 2, now + 0.06);

    voice.frequency = targetFreq;
    this.lastTriggeredFrequency = targetFreq;
  }

  /**
   * Toggles an ambient drone pad on a chosen frequency (e.g. Vadi or Root)
   */
  public toggleDronePad(freq: number): boolean {
    this.initContext();
    if (!this.ctx || !this.masterGain) return false;

    if (this.droneVoice) {
      // If tapping same frequency, turn off
      const isSame = this.droneFrequency === freq;
      this.stopDronePad();
      if (isSame) return false;
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.8); // Gentle background ambient shimmer

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    this.droneVoice = { osc, gain };
    this.droneFrequency = freq;
    return true;
  }

  public stopDronePad() {
    if (!this.droneVoice || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.droneVoice.gain.gain.cancelScheduledValues(now);
    this.droneVoice.gain.gain.setValueAtTime(this.droneVoice.gain.gain.value, now);
    this.droneVoice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    const dv = this.droneVoice;
    setTimeout(() => {
      try {
        dv.osc.stop();
        dv.osc.disconnect();
        dv.gain.disconnect();
      } catch {}
    }, 550);
    this.droneVoice = null;
    this.droneFrequency = null;
  }

  public getDroneFrequency(): number | null {
    return this.droneFrequency;
  }

  public releaseAll() {
    this.activeVoices.forEach((_, noteId) => {
      this.noteOff(noteId);
    });
    this.stopDronePad();
  }
}

export const swaraAudio = new SwaraKeyboardEngine();
