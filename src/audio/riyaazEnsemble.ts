import { getSharedAudioContext } from './audioContext';
import { tanpura } from './tanpuraEngine';
import { TAAL_PRESETS, TaalPreset, playSyntheticTablaStroke } from './taalEngine';
import { playLehraNote } from './lehraEngine';
import { swarmandal } from './swarmandalEngine';

export interface RiyaazEnsembleState {
  isPlaying: boolean;
  currentBeat: number;
  bpm: number;
  selectedTaal: TaalPreset;
  rootKey: string;
  isTablaEnabled: boolean;
  isLehraEnabled: boolean;
  isTanpuraEnabled: boolean;
  isHapticEnabled: boolean;
}

/**
 * Unified Riyaz Ensemble Engine
 * Single rhythm and ensemble engine for BOTH Indian Taal in Metronome & Rasa Ensemble.
 * Synchronizes Tanpura Drone + Tabla Taal + Harmonium Lehra in one master loop,
 * perfectly synchronized to the active Root Key (Sa), Raga, and shared BPM.
 */
class RiyaazEnsembleEngine {
  private isPlaying: boolean = false;
  private timer: any = null;
  private nextNoteTime: number = 0;
  private currentBeat: number = 0;
  private startedTanpuraInternally: boolean = false;

  // Configuration backed by localStorage for global app synchronization
  private bpm: number = 120;
  private rootKey: string = 'C';
  private selectedTaal: TaalPreset = TAAL_PRESETS[0]; // Teentaal default
  private isTablaEnabled: boolean = true;
  private isLehraEnabled: boolean = true;
  private isTanpuraEnabled: boolean = true;
  private isHapticEnabled: boolean = true;

  private listeners: Set<(state: RiyaazEnsembleState) => void> = new Set();

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    try {
      const savedBpm = localStorage.getItem('agsoft_metronome_bpm');
      if (savedBpm) {
        const val = Number(savedBpm);
        if (!isNaN(val) && val >= 30 && val <= 260) this.bpm = val;
      }

      const savedTaalId = localStorage.getItem('agsoft_selected_taal_id');
      if (savedTaalId) {
        const found = TAAL_PRESETS.find((t) => t.id === savedTaalId);
        if (found) this.selectedTaal = found;
      }

      const savedLehra = localStorage.getItem('agsoft_lehra_enabled');
      if (savedLehra !== null) this.isLehraEnabled = JSON.parse(savedLehra);

      const savedKey = localStorage.getItem('agsoft_lehra_key');
      if (savedKey) this.rootKey = savedKey;

      const savedHaptic = localStorage.getItem('agsoft_metronome_haptic');
      if (savedHaptic !== null) this.isHapticEnabled = JSON.parse(savedHaptic);
    } catch {}
  }

  public subscribe(fn: (state: RiyaazEnsembleState) => void) {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  public getState(): RiyaazEnsembleState {
    return {
      isPlaying: this.isPlaying,
      currentBeat: this.currentBeat,
      bpm: this.bpm,
      selectedTaal: this.selectedTaal,
      rootKey: this.rootKey,
      isTablaEnabled: this.isTablaEnabled,
      isLehraEnabled: this.isLehraEnabled,
      isTanpuraEnabled: this.isTanpuraEnabled,
      isHapticEnabled: this.isHapticEnabled,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  private getAudioContext(): AudioContext {
    return getSharedAudioContext();
  }

  public setBpm(newBpm: number) {
    const clamped = Math.max(30, Math.min(260, Math.round(newBpm)));
    this.bpm = clamped;
    try {
      localStorage.setItem('agsoft_metronome_bpm', String(clamped));
    } catch {}

    // Dynamic real-time tempo compensation while playing
    if (this.isPlaying) {
      const ctx = this.getAudioContext();
      const secondsPerBeat = 60.0 / this.bpm;
      if (this.nextNoteTime > ctx.currentTime + secondsPerBeat) {
        this.nextNoteTime = ctx.currentTime + secondsPerBeat * 0.5;
      }
    }
    this.notify();
  }

  public setSelectedTaal(taal: TaalPreset) {
    this.selectedTaal = taal;
    this.currentBeat = 0;
    try {
      localStorage.setItem('agsoft_selected_taal_id', taal.id);
    } catch {}
    this.notify();
  }

  public setRootKey(key: string) {
    this.rootKey = key;
    try {
      localStorage.setItem('agsoft_lehra_key', key);
    } catch {}
    tanpura.setConfig({ rootKey: key });
    this.notify();
  }

  public setToggles(toggles: {
    tabla?: boolean;
    lehra?: boolean;
    tanpura?: boolean;
    haptic?: boolean;
  }) {
    if (toggles.tabla !== undefined) this.isTablaEnabled = toggles.tabla;
    if (toggles.lehra !== undefined) {
      this.isLehraEnabled = toggles.lehra;
      try {
        localStorage.setItem('agsoft_lehra_enabled', JSON.stringify(toggles.lehra));
      } catch {}
    }
    if (toggles.tanpura !== undefined) this.isTanpuraEnabled = toggles.tanpura;
    if (toggles.haptic !== undefined) {
      this.isHapticEnabled = toggles.haptic;
      try {
        localStorage.setItem('agsoft_metronome_haptic', JSON.stringify(toggles.haptic));
      } catch {}
    }
    this.notify();
  }

  public setConfig(config: {
    rootKey?: string;
    bpm?: number;
    taalId?: string;
    isTablaEnabled?: boolean;
    isLehraEnabled?: boolean;
    isTanpuraEnabled?: boolean;
    isHapticEnabled?: boolean;
  }) {
    if (config.rootKey) this.setRootKey(config.rootKey);
    if (config.bpm !== undefined) this.setBpm(config.bpm);
    if (config.taalId) {
      const found = TAAL_PRESETS.find((t) => t.id === config.taalId);
      if (found) this.setSelectedTaal(found);
    }
    this.setToggles({
      tabla: config.isTablaEnabled,
      lehra: config.isLehraEnabled,
      tanpura: config.isTanpuraEnabled,
      haptic: config.isHapticEnabled,
    });
  }

  public togglePlay(rootKey?: string, ragaTanpuraTuning: 'Pa' | 'Ma' | 'Ni' = 'Pa') {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start(rootKey, ragaTanpuraTuning);
    }
  }

  public start(rootKey?: string, ragaTanpuraTuning: 'Pa' | 'Ma' | 'Ni' = 'Pa') {
    if (rootKey) {
      this.rootKey = rootKey;
    }
    const ctx = this.getAudioContext();

    // 1. Harmonize Tanpura Drone
    if (this.isTanpuraEnabled) {
      tanpura.setConfig({ rootKey: this.rootKey, firstString: ragaTanpuraTuning });
      if (!tanpura.getIsPlaying()) {
        this.startedTanpuraInternally = true;
        tanpura.start(this.rootKey);
      }
    }

    // 2. Start Synchronized Tabla + Lehra Loop
    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.scheduler();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // Only stop Tanpura if it was initiated by the ensemble (preserves independent user Tanpura practice)
    if (this.startedTanpuraInternally) {
      tanpura.stop();
      this.startedTanpuraInternally = false;
    }
    this.currentBeat = 0;
    this.notify();
  }

  private scheduler = () => {
    if (!this.isPlaying) return;
    const ctx = this.getAudioContext();
    const cycleLength = this.selectedTaal.matras.length;

    while (this.nextNoteTime < ctx.currentTime + 0.1) {
      const beatIdx = this.currentBeat;
      const beatDuration = 60.0 / Math.max(30, this.bpm);

      // Play Tabla Stroke
      if (this.isTablaEnabled) {
        const matra = this.selectedTaal.matras[beatIdx % cycleLength];
        if (matra) {
          playSyntheticTablaStroke(ctx, matra.type, this.nextNoteTime);

          // Haptic pulse
          if (this.isHapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              if (matra.mark === 'sam') navigator.vibrate(50);
              else if (matra.mark === 'tali') navigator.vibrate(25);
              else if (matra.mark !== 'khali') navigator.vibrate(10);
            } catch {}
          }
        }
      }

      // Play Lehra Note
      if (this.isLehraEnabled) {
        playLehraNote(
          ctx,
          this.rootKey,
          this.selectedTaal.id,
          beatIdx % cycleLength,
          this.nextNoteTime,
          beatDuration
        );
      }

      this.currentBeat = (this.currentBeat + 1) % cycleLength;
      this.nextNoteTime += beatDuration;
      this.notify();
    }

    this.timer = setTimeout(this.scheduler, 25);
  };

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getSelectedTaal(): TaalPreset {
    return this.selectedTaal;
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getRootKey(): string {
    return this.rootKey;
  }

  public getCurrentBeat(): number {
    return this.currentBeat;
  }

  public getToggles() {
    return {
      tabla: this.isTablaEnabled,
      lehra: this.isLehraEnabled,
      tanpura: this.isTanpuraEnabled,
      haptic: this.isHapticEnabled,
    };
  }
}

export const riyaazEnsemble = new RiyaazEnsembleEngine();
