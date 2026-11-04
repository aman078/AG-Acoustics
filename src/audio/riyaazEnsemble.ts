import { tanpura } from './tanpuraEngine';
import { TAAL_PRESETS, TaalPreset, playSyntheticTablaStroke } from './taalEngine';
import { playLehraNote } from './lehraEngine';
import { swarmandal } from './swarmandalEngine';

/**
 * Unified Riyaz Ensemble Engine (Adapted from iShala)
 * Coordinates Tanpura Drone + Tabla Taal + Harmonium Lehra in one master loop,
 * perfectly synchronized to the active Root Key (Sa) and Raga.
 */
class RiyaazEnsembleEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timer: any = null;
  private nextNoteTime: number = 0;
  private currentBeat: number = 0;

  // Configuration
  private bpm: number = 90;
  private rootKey: string = 'C';
  private selectedTaal: TaalPreset = TAAL_PRESETS[0]; // Teentaal default
  private isTablaEnabled: boolean = true;
  private isLehraEnabled: boolean = true;
  private isTanpuraEnabled: boolean = true;

  private listeners: Set<(state: { isPlaying: boolean; currentBeat: number; bpm: number }) => void> = new Set();

  public subscribe(fn: (state: { isPlaying: boolean; currentBeat: number; bpm: number }) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) =>
      fn({
        isPlaying: this.isPlaying,
        currentBeat: this.currentBeat,
        bpm: this.bpm,
      })
    );
  }

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

  public setConfig(config: {
    rootKey?: string;
    bpm?: number;
    taalId?: string;
    isTablaEnabled?: boolean;
    isLehraEnabled?: boolean;
    isTanpuraEnabled?: boolean;
  }) {
    if (config.rootKey) {
      this.rootKey = config.rootKey;
      tanpura.setConfig({ rootKey: this.rootKey });
    }
    if (config.bpm !== undefined) {
      this.bpm = Math.max(30, Math.min(260, config.bpm));
    }
    if (config.taalId) {
      const found = TAAL_PRESETS.find((t) => t.id === config.taalId);
      if (found) this.selectedTaal = found;
    }
    if (config.isTablaEnabled !== undefined) this.isTablaEnabled = config.isTablaEnabled;
    if (config.isLehraEnabled !== undefined) this.isLehraEnabled = config.isLehraEnabled;
    if (config.isTanpuraEnabled !== undefined) this.isTanpuraEnabled = config.isTanpuraEnabled;
  }

  public togglePlay(rootKey: string = 'C', ragaTanpuraTuning: 'Pa' | 'Ma' | 'Ni' = 'Pa') {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start(rootKey, ragaTanpuraTuning);
    }
  }

  public start(rootKey: string = 'C', ragaTanpuraTuning: 'Pa' | 'Ma' | 'Ni' = 'Pa') {
    this.rootKey = rootKey;
    const ctx = this.getAudioContext();

    // 1. Start Tanpura Drone
    if (this.isTanpuraEnabled) {
      tanpura.setConfig({ rootKey: this.rootKey, firstString: ragaTanpuraTuning });
      if (!tanpura.getIsPlaying()) {
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
    tanpura.stop();
    this.currentBeat = 0;
    this.notify();
  }

  private scheduler = () => {
    if (!this.isPlaying) return;
    const ctx = this.getAudioContext();
    const cycleLength = this.selectedTaal.matras.length;

    while (this.nextNoteTime < ctx.currentTime + 0.1) {
      const beatIdx = this.currentBeat;
      const beatDuration = 60.0 / this.bpm;

      // Play Tabla Stroke
      if (this.isTablaEnabled) {
        const matra = this.selectedTaal.matras[beatIdx % cycleLength];
        if (matra) {
          playSyntheticTablaStroke(ctx, matra.type, this.nextNoteTime);
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

  public getToggles() {
    return {
      tabla: this.isTablaEnabled,
      lehra: this.isLehraEnabled,
      tanpura: this.isTanpuraEnabled,
    };
  }
}

export const riyaazEnsemble = new RiyaazEnsembleEngine();
