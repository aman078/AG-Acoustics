/**
 * Global Shared Master AudioContext
 *
 * Web Audio contexts are hardware-bound resources. Browsers and mobile WebViews enforce
 * a strict limit (often 3-6) on concurrent AudioContexts. Creating uncoordinated instances
 * across Tanpura, Metronome, Riyaz Ensemble, Swarmandal, and Swara Keyboard causes
 * audio thread exhaustion, suspended contexts, and silent dropouts on tab switches.
 *
 * This singleton ensures all audio engines share one master AudioContext.
 */

let masterAudioCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!masterAudioCtx || masterAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    masterAudioCtx = new AudioCtx();
  }
  if (masterAudioCtx.state === 'suspended') {
    masterAudioCtx.resume().catch(() => {});
  }
  return masterAudioCtx;
}

export function resumeSharedAudioContext(): Promise<void> {
  const ctx = getSharedAudioContext();
  if (ctx.state === 'suspended') {
    return ctx.resume();
  }
  return Promise.resolve();
}
