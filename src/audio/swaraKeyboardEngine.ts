/**
 * High-Fidelity Swara Acoustic Sound Engine
 * Multi-Instrument Physical & Formant Synthesis for Indian Classical Music:
 * 1. Bansuri (Indian Bamboo Flute with breath chiff & warm woody resonance)
 * 2. Concert Sitar (Rich Javari bridge harmonic buzz & sympathetic shimmer)
 * 3. Acoustic Guitar (Snappy fingernail pluck & resonant wooden soundboard)
 * 4. Harmonium Reed (Dual detuned free-reeds with authentic acoustic bellows chorusing)
 * 5. Kashmiri Santoor (Delicate wooden hammer strike & crystalline ringing overtones)
 */

export type InstrumentSoundType = 'flute' | 'sitar' | 'guitar' | 'harmonium' | 'santoor';

export interface InstrumentPreset {
  id: InstrumentSoundType;
  name: string;
  emoji: string;
  description: string;
}

export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  {
    id: 'flute',
    name: 'Bansuri Flute',
    emoji: '🪈',
    description: 'Warm Indian bamboo flute with gentle breath chiff & singing vibrato'
  },
  {
    id: 'sitar',
    name: 'Concert Sitar',
    emoji: '🪕',
    description: 'Resonant bronze & steel strings with authentic Javari bridge buzz'
  },
  {
    id: 'guitar',
    name: 'Acoustic Guitar',
    emoji: '🎸',
    description: 'Fingerpicked wooden acoustic guitar with natural harmonic decay'
  },
  {
    id: 'harmonium',
    name: 'Harmonium',
    emoji: '🎹',
    description: 'Warm Kolkata free-reeds with dual detuned bellows flutter'
  },
  {
    id: 'santoor',
    name: 'Kashmiri Santoor',
    emoji: '✨',
    description: 'Delicate struck hammer dulcimer with shimmering long decay'
  }
];

interface ActiveVoice {
  oscillators: OscillatorNode[];
  filters: BiquadFilterNode[];
  gainNode: GainNode;
  vibratoOsc?: OscillatorNode;
  vibratoGain?: GainNode;
  targetFrequency: number;
  startTime: number;
  instrument: InstrumentSoundType;
}

class SwaraKeyboardEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeVoices: Map<string, ActiveVoice> = new Map();
  private lastTriggeredFrequency: number | null = null;
  private currentInstrument: InstrumentSoundType = 'flute';

  // Drone Pad Voice
  private droneVoice: { oscs: OscillatorNode[]; gain: GainNode } | null = null;
  private droneFrequency: number | null = null;

  // Custom PeriodicWave tables for authentic acoustic timbres
  private fluteWave: PeriodicWave | null = null;
  private sitarWave: PeriodicWave | null = null;
  private harmoniumWave: PeriodicWave | null = null;
  private santoorWave: PeriodicWave | null = null;

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
      this.buildNoiseBuffer();
      this.buildPeriodicWaves();
    }
  }

  /**
   * Pre-generates pink/white noise buffer for acoustic breath chiffs and string pluck transients
   */
  private buildNoiseBuffer() {
    if (!this.ctx || this.noiseBuffer) return;
    const bufferSize = this.ctx.sampleRate * 1.5; // 1.5s noise loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter approximation for natural acoustic breathiness
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Builds custom harmonic spectra (PeriodicWaves) for authentic acoustic instruments
   */
  private buildPeriodicWaves() {
    if (!this.ctx) return;

    // 1. Bansuri Bamboo Flute (Warm, breathy hollow cylinder with strong fundamental & odd overtones)
    const fluteReal = new Float32Array(16);
    const fluteImag = new Float32Array(16);
    fluteImag[1] = 1.0;   // Strong fundamental
    fluteImag[2] = 0.18;  // Soft 2nd harmonic
    fluteImag[3] = 0.32;  // Hollow 3rd harmonic (cylindrical pipe signature)
    fluteImag[4] = 0.04;
    fluteImag[5] = 0.12;  // 5th harmonic
    fluteImag[6] = 0.02;
    fluteImag[7] = 0.05;
    this.fluteWave = this.ctx.createPeriodicWave(fluteReal, fluteImag);

    // 2. Concert Sitar (Rich Javari bridge harmonic buzz — wide decaying spectrum)
    const sitarReal = new Float32Array(24);
    const sitarImag = new Float32Array(24);
    sitarImag[1] = 1.0;
    sitarImag[2] = 0.85;
    sitarImag[3] = 0.70;
    sitarImag[4] = 0.60;
    sitarImag[5] = 0.50;
    sitarImag[6] = 0.42;
    sitarImag[7] = 0.35;
    sitarImag[8] = 0.30;
    sitarImag[9] = 0.25;
    sitarImag[10] = 0.20;
    sitarImag[11] = 0.15;
    sitarImag[12] = 0.12;
    this.sitarWave = this.ctx.createPeriodicWave(sitarReal, sitarImag);

    // 3. Harmonium Reed (Rich brass free-reed overtones)
    const harmReal = new Float32Array(16);
    const harmImag = new Float32Array(16);
    harmImag[1] = 1.0;
    harmImag[2] = 0.65;
    harmImag[3] = 0.45;
    harmImag[4] = 0.35;
    harmImag[5] = 0.25;
    harmImag[6] = 0.18;
    harmImag[7] = 0.12;
    this.harmoniumWave = this.ctx.createPeriodicWave(harmReal, harmImag);

    // 4. Kashmiri Santoor (Struck hammer on metal strings with crystalline chime)
    const santoorReal = new Float32Array(16);
    const santoorImag = new Float32Array(16);
    santoorImag[1] = 1.0;
    santoorImag[2] = 0.45;
    santoorImag[3] = 0.55;
    santoorImag[4] = 0.20;
    santoorImag[5] = 0.35;
    santoorImag[6] = 0.10;
    santoorImag[7] = 0.18;
    this.santoorWave = this.ctx.createPeriodicWave(santoorReal, santoorImag);
  }

  public setInstrument(preset: InstrumentSoundType) {
    this.currentInstrument = preset;
  }

  public getCurrentInstrument(): InstrumentSoundType {
    return this.currentInstrument;
  }

  /**
   * Main Note Pluck / Trigger with Meend Glide
   */
  public noteOn(
    noteId: string,
    targetFreq: number,
    glideFromFreq?: number,
    isDronePad: boolean = false
  ) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.activeVoices.has(noteId)) {
      this.noteOff(noteId);
    }

    const now = this.ctx.currentTime;
    const fromFreq = glideFromFreq || (this.lastTriggeredFrequency && Math.abs(this.lastTriggeredFrequency - targetFreq) < 280 ? this.lastTriggeredFrequency : null);

    const voiceGain = this.ctx.createGain();
    const oscs: OscillatorNode[] = [];
    const filters: BiquadFilterNode[] = [];

    // LFO Vibrato (Andolan)
    const vibratoOsc = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.setValueAtTime(0, now);
    vibratoOsc.frequency.setValueAtTime(4.9, now); // 4.9 Hz natural singing oscillation
    vibratoOsc.connect(vibratoGain);

    // -------------------------------------------------------------
    // INSTRUMENT SPECIFIC SYNTHESIS
    // -------------------------------------------------------------
    switch (this.currentInstrument) {
      case 'flute': {
        // BANSURI FLUTE: Warm breath chiff attack + hollow resonant pipe
        const osc = this.ctx.createOscillator();
        if (this.fluteWave) {
          osc.setPeriodicWave(this.fluteWave);
        } else {
          osc.type = 'triangle';
        }

        // Apply frequency & meend glide
        if (fromFreq) {
          osc.frequency.setValueAtTime(fromFreq, now);
          osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.11);
        } else {
          osc.frequency.setValueAtTime(targetFreq, now);
        }
        vibratoGain.connect(osc.frequency);

        // Flute body resonance lowpass filter
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.Q.setValueAtTime(1.8, now);

        // Breath Chiff (Airy embouchure transient)
        if (this.noiseBuffer && !fromFreq) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = this.noiseBuffer;
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(1900, now);
          noiseFilter.Q.setValueAtTime(3.0, now);

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.09, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          noiseSrc.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(voiceGain);
          noiseSrc.start(now);
          noiseSrc.stop(now + 0.06);
        }

        // Soft breath swell attack envelope
        voiceGain.gain.setValueAtTime(0.001, now);
        voiceGain.gain.linearRampToValueAtTime(0.68, now + 0.038);
        voiceGain.gain.exponentialRampToValueAtTime(0.48, now + 0.4);

        osc.connect(filter);
        filter.connect(voiceGain);
        oscs.push(osc);
        filters.push(filter);
        break;
      }

      case 'sitar': {
        // CONCERT SITAR: Javari buzzing bridge & metallic plectrum bite
        const oscMain = this.ctx.createOscillator();
        if (this.sitarWave) {
          oscMain.setPeriodicWave(this.sitarWave);
        } else {
          oscMain.type = 'sawtooth';
        }

        // Sub-harmonic sympathetic body resonance
        const oscSub = this.ctx.createOscillator();
        oscSub.type = 'triangle';

        if (fromFreq) {
          oscMain.frequency.setValueAtTime(fromFreq, now);
          oscMain.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.13);
          oscSub.frequency.setValueAtTime(fromFreq, now);
          oscSub.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.13);
        } else {
          oscMain.frequency.setValueAtTime(targetFreq, now);
          oscSub.frequency.setValueAtTime(targetFreq, now);
        }

        vibratoGain.connect(oscMain.frequency);

        // Javari Bridge Peaking Formant Filter
        const javariFilter = this.ctx.createBiquadFilter();
        javariFilter.type = 'peaking';
        javariFilter.frequency.setValueAtTime(2600, now);
        javariFilter.Q.setValueAtTime(3.5, now);
        javariFilter.gain.setValueAtTime(9.0, now); // Distinctive metallic buzzing peak

        const bodyFilter = this.ctx.createBiquadFilter();
        bodyFilter.type = 'lowpass';
        bodyFilter.frequency.setValueAtTime(4200, now);
        bodyFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.65);

        // Pluck transient (Mizrab wire strike)
        voiceGain.gain.setValueAtTime(0.001, now);
        voiceGain.gain.linearRampToValueAtTime(0.72, now + 0.012);
        voiceGain.gain.exponentialRampToValueAtTime(0.28, now + 0.35);

        oscMain.connect(javariFilter);
        javariFilter.connect(bodyFilter);
        oscSub.connect(bodyFilter);
        bodyFilter.connect(voiceGain);

        oscs.push(oscMain, oscSub);
        filters.push(javariFilter, bodyFilter);
        break;
      }

      case 'guitar': {
        // ACOUSTIC GUITAR: Crisp fingernail attack + warm wooden body resonance
        const oscFund = this.ctx.createOscillator();
        oscFund.type = 'triangle';

        const oscHarm = this.ctx.createOscillator();
        oscHarm.type = 'sine';

        if (fromFreq) {
          oscFund.frequency.setValueAtTime(fromFreq, now);
          oscFund.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.09);
          oscHarm.frequency.setValueAtTime(fromFreq * 2, now);
          oscHarm.frequency.exponentialRampToValueAtTime(targetFreq * 2, now + 0.09);
        } else {
          oscFund.frequency.setValueAtTime(targetFreq, now);
          oscHarm.frequency.setValueAtTime(targetFreq * 2, now);
        }

        vibratoGain.connect(oscFund.frequency);

        // Dynamic Wooden Enclosure Filter (damps high frequencies over time)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3400, now);
        filter.frequency.exponentialRampToValueAtTime(550, now + 1.2);

        // Snappy pluck envelope
        voiceGain.gain.setValueAtTime(0.001, now);
        voiceGain.gain.linearRampToValueAtTime(0.75, now + 0.01);
        voiceGain.gain.exponentialRampToValueAtTime(0.25, now + 0.4);

        oscFund.connect(filter);
        oscHarm.connect(filter);
        filter.connect(voiceGain);

        oscs.push(oscFund, oscHarm);
        filters.push(filter);
        break;
      }

      case 'harmonium': {
        // HARMONIUM: Dual detuned free-reeds with acoustic bellows beating
        const oscA = this.ctx.createOscillator();
        const oscB = this.ctx.createOscillator();
        if (this.harmoniumWave) {
          oscA.setPeriodicWave(this.harmoniumWave);
          oscB.setPeriodicWave(this.harmoniumWave);
        } else {
          oscA.type = 'sawtooth';
          oscB.type = 'sawtooth';
        }

        // Slight detune of ±3.5 cents creates authentic reed beating
        const detuneAmount = 3.5;
        if (fromFreq) {
          oscA.frequency.setValueAtTime(fromFreq, now);
          oscA.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.12);
          oscB.frequency.setValueAtTime(fromFreq, now);
          oscB.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.12);
        } else {
          oscA.frequency.setValueAtTime(targetFreq, now);
          oscB.frequency.setValueAtTime(targetFreq, now);
        }
        oscA.detune.setValueAtTime(detuneAmount, now);
        oscB.detune.setValueAtTime(-detuneAmount, now);

        vibratoGain.connect(oscA.frequency);
        vibratoGain.connect(oscB.frequency);

        // Wooden Reed Box Formant
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(2.0, now);

        // Bellows swell envelope
        voiceGain.gain.setValueAtTime(0.001, now);
        voiceGain.gain.linearRampToValueAtTime(0.55, now + 0.045);

        oscA.connect(filter);
        oscB.connect(filter);
        filter.connect(voiceGain);

        oscs.push(oscA, oscB);
        filters.push(filter);
        break;
      }

      case 'santoor':
      default: {
        // KASHMIRI SANTOOR: Struck metal strings with shimmering harmonic decay
        const oscMain = this.ctx.createOscillator();
        if (this.santoorWave) {
          oscMain.setPeriodicWave(this.santoorWave);
        } else {
          oscMain.type = 'triangle';
        }

        const oscChime = this.ctx.createOscillator();
        oscChime.type = 'sine';

        if (fromFreq) {
          oscMain.frequency.setValueAtTime(fromFreq, now);
          oscMain.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.1);
          oscChime.frequency.setValueAtTime(fromFreq * 2.76, now);
          oscChime.frequency.exponentialRampToValueAtTime(targetFreq * 2.76, now + 0.1);
        } else {
          oscMain.frequency.setValueAtTime(targetFreq, now);
          oscChime.frequency.setValueAtTime(targetFreq * 2.76, now); // Inharmonic chime
        }

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(targetFreq * 2, now);
        filter.Q.setValueAtTime(1.5, now);

        // Hammer strike attack
        voiceGain.gain.setValueAtTime(0.001, now);
        voiceGain.gain.linearRampToValueAtTime(0.70, now + 0.008);
        voiceGain.gain.exponentialRampToValueAtTime(0.20, now + 0.35);

        oscMain.connect(voiceGain);
        oscChime.connect(filter);
        filter.connect(voiceGain);

        oscs.push(oscMain, oscChime);
        filters.push(filter);
        break;
      }
    }

    voiceGain.connect(this.masterGain);

    // Start all oscillators
    oscs.forEach((osc) => osc.start(now));
    vibratoOsc.start(now);

    // Fade in singing vibrato (Andolan) after 380ms of holding
    vibratoGain.gain.setValueAtTime(0, now + 0.38);
    vibratoGain.gain.linearRampToValueAtTime(targetFreq * 0.02, now + 0.85);

    this.activeVoices.set(noteId, {
      oscillators: oscs,
      filters,
      gainNode: voiceGain,
      vibratoOsc,
      vibratoGain,
      targetFrequency: targetFreq,
      startTime: now,
      instrument: this.currentInstrument
    });

    this.lastTriggeredFrequency = targetFreq;
  }

  /**
   * Note Off with Instrument-Specific Acoustic Damping
   */
  public noteOff(noteId: string) {
    const voice = this.activeVoices.get(noteId);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);

    // Flute & Harmonium stop smoothly when key released; strings linger with natural decay
    const releaseTime = voice.instrument === 'flute' || voice.instrument === 'harmonium' ? 0.22 : 0.45;
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    setTimeout(() => {
      try {
        voice.oscillators.forEach((o) => {
          o.stop();
          o.disconnect();
        });
        voice.vibratoOsc?.stop();
        voice.vibratoOsc?.disconnect();
        voice.filters.forEach((f) => f.disconnect());
        voice.gainNode.disconnect();
      } catch {}
      this.activeVoices.delete(noteId);
    }, (releaseTime + 0.05) * 1000);
  }

  /**
   * Ambient Drone Pad
   */
  public toggleDronePad(freq: number): boolean {
    this.initContext();
    if (!this.ctx || !this.masterGain) return false;

    if (this.droneVoice) {
      const isSame = this.droneFrequency === freq;
      this.stopDronePad();
      if (isSame) return false;
    }

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();

    if (this.currentInstrument === 'flute' && this.fluteWave) {
      osc1.setPeriodicWave(this.fluteWave);
      osc2.setPeriodicWave(this.fluteWave);
    } else {
      osc1.type = 'triangle';
      osc2.type = 'sine';
    }

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc1.detune.setValueAtTime(2.5, now);
    osc2.detune.setValueAtTime(-2.5, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.8);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);

    this.droneVoice = { oscs: [osc1, osc2], gain };
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
        dv.oscs.forEach((o) => {
          o.stop();
          o.disconnect();
        });
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
