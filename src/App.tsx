import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  SlidersHorizontal, 
  BookOpen, 
  Clock, 
  RotateCcw, 
  Radio, 
  Volume2, 
  Flame, 
  Sparkles,
  Info,
  Music,
  Search,
  CheckCircle2,
  Guitar,
  Download,
  Smartphone,
  Sun,
  Moon
} from 'lucide-react';
import { detectPitchMPM, frequencyToNote, calculateCents, getRMSVolume } from './audio/pitchDetection';
import { playGuitarStringTone, playInTuneChime } from './audio/toneGenerator';
import { TUNINGS, TuningPreset } from './data/tunings';
import { StrobeTuner } from './components/StrobeTuner';
import { HeadstockTuner } from './components/HeadstockTuner';
import { MetronomeModal } from './components/MetronomeModal';
import { ChordLibraryModal } from './components/ChordLibraryModal';
import { TuningModal } from './components/TuningModal';
import { SongSearchModal } from './components/SongSearchModal';
import { InstallModal } from './components/InstallModal';
import { App as CapApp } from '@capacitor/app';

type ActiveTab = 'tuner' | 'songs' | 'metronome' | 'chords';

export const App: React.FC = () => {
  // Theme Mode: 'clean' (clean light modern studio) vs 'dark' (obsidian stage)
  const [theme, setTheme] = useState<'clean' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('agsoft_theme');
      return (saved as 'clean' | 'dark') || 'clean';
    } catch {
      return 'clean';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_theme', theme);
      if (theme === 'clean') {
        document.documentElement.classList.add('clean-theme');
        document.body.classList.add('clean-theme');
      } else {
        document.documentElement.classList.remove('clean-theme');
        document.body.classList.remove('clean-theme');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // Navigation Dock
  const [activeTab, setActiveTab] = useState<ActiveTab>('tuner');

  // Tuner Modes: 'studio' (GuitarTuna visual headstock) vs 'strobe' (Peterson 0.1c Strobe)
  const [tunerMode, setTunerMode] = useState<'studio' | 'strobe'>('studio');
  const [currentTuning, setCurrentTuning] = useState<TuningPreset>(TUNINGS[0]);
  const [activeStringIndex, setActiveStringIndex] = useState<number>(0);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [referenceA4, setReferenceA4] = useState<number>(440);

  // Audio State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [detectedClarity, setDetectedClarity] = useState<number>(0);
  const [rmsVolume, setRmsVolume] = useState<number>(0);
  const [detectedNote, setDetectedNote] = useState<string>('');
  const [detectedOctave, setDetectedOctave] = useState<number | null>(null);
  const [centsOffset, setCentsOffset] = useState<number>(0);
  const [targetFreq, setTargetFreq] = useState<number | null>(currentTuning.strings[0].targetFreq);

  // Tuning Preset Modal
  const [isTuningModalOpen, setIsTuningModalOpen] = useState<boolean>(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isSongOpen, setIsSongOpen] = useState<boolean>(false);

  // Android Hardware & Gesture Back Button Handling
  useEffect(() => {
    let listenerHandle: any = null;

    const setupBackButton = async () => {
      try {
        listenerHandle = await CapApp.addListener('backButton', () => {
          if (isSongOpen) {
            // Close the full-screen song sheet or chord inspector
            window.dispatchEvent(new CustomEvent('agsoft_close_song'));
          } else if (isTuningModalOpen) {
            setIsTuningModalOpen(false);
          } else if (isInstallModalOpen) {
            setIsInstallModalOpen(false);
          } else if (activeTab !== 'tuner') {
            // Return to the home Tuner tab
            setActiveTab('tuner');
          } else {
            // On home screen with nothing open: exit app
            CapApp.exitApp();
          }
        });
      } catch (err) {
        console.warn('Capacitor App plugin not active:', err);
      }
    };

    setupBackButton();

    return () => {
      if (listenerHandle?.remove) {
        listenerHandle.remove();
      }
    };
  }, [isSongOpen, isTuningModalOpen, isInstallModalOpen, activeTab]);

  useEffect(() => {
    // Detect if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Audio Nodes & Animation
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const lastChimeTimeRef = useRef<number>(0);
  const inTuneDurationRef = useRef<number>(0);

  // Start / Stop Microphone Stream
  const startListening = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      // Large buffer allows detecting low bass frequencies down to 30Hz
      analyser.fftSize = 4096;
      source.connect(analyser);
      analyserRef.current = analyser;

      audioBufferRef.current = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
      setIsListening(true);
    } catch (err: unknown) {
      console.error('Microphone error:', err);
      const msg = err instanceof Error ? err.message : 'Microphone permission denied';
      setMicError(msg);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setDetectedFreq(null);
    setCentsOffset(0);
    setRmsVolume(0);
  };

  // Continuous Pitch Detection Loop
  const processAudio = useCallback(() => {
    if (!analyserRef.current || !audioBufferRef.current || !audioContextRef.current) return;

    analyserRef.current.getFloatTimeDomainData(audioBufferRef.current);
    const buffer = audioBufferRef.current;
    const sampleRate = audioContextRef.current.sampleRate;

    const volume = getRMSVolume(buffer);
    setRmsVolume(volume);

    // Noise gate threshold
    const NOISE_GATE = 0.005;
    if (volume < NOISE_GATE) {
      setDetectedClarity(0);
      inTuneDurationRef.current = 0;
      animFrameRef.current = requestAnimationFrame(processAudio);
      return;
    }

    // Run MPM (McLeod Pitch Method) with clarity 0.60, minFreq 50, maxFreq 1200
    const pitchResult = detectPitchMPM(buffer, sampleRate, 0.60, 50, 1200);

    if (pitchResult) {
      const { frequency, clarity } = pitchResult;
      setDetectedFreq(frequency);
      setDetectedClarity(clarity);

      if (isAutoMode) {
        // Auto-detect closest string in the current tuning
        let closestIndex = 0;
        let minDiff = Infinity;

        currentTuning.strings.forEach((str, idx) => {
          const diff = Math.abs(frequency - str.targetFreq);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = idx;
          }
        });

        setActiveStringIndex(closestIndex);
        const currentTarget = currentTuning.strings[closestIndex].targetFreq;
        setTargetFreq(currentTarget);

        const rawCents = calculateCents(frequency, currentTarget);
        setCentsOffset((prev) => Number((prev * 0.3 + rawCents * 0.7).toFixed(1)));

        const { noteName, octave } = frequencyToNote(frequency, referenceA4);
        setDetectedNote(noteName);
        setDetectedOctave(octave);

        // Check if string is in tune (within +/- 3 cents)
        if (Math.abs(rawCents) <= 3) {
          inTuneDurationRef.current += 1;
          const now = Date.now();
          if (inTuneDurationRef.current > 8 && now - lastChimeTimeRef.current > 2500) {
            playInTuneChime();
            lastChimeTimeRef.current = now;
          }
        } else {
          inTuneDurationRef.current = 0;
        }
      } else {
        // Manual mode: locked to activeStringIndex
        const currentTarget = currentTuning.strings[activeStringIndex].targetFreq;
        setTargetFreq(currentTarget);

        const rawCents = calculateCents(frequency, currentTarget);
        setCentsOffset((prev) => Number((prev * 0.3 + rawCents * 0.7).toFixed(1)));

        const { noteName, octave } = frequencyToNote(frequency, referenceA4);
        setDetectedNote(noteName);
        setDetectedOctave(octave);

        if (Math.abs(rawCents) <= 3) {
          inTuneDurationRef.current += 1;
          const now = Date.now();
          if (inTuneDurationRef.current > 8 && now - lastChimeTimeRef.current > 2500) {
            playInTuneChime();
            lastChimeTimeRef.current = now;
          }
        } else {
          inTuneDurationRef.current = 0;
        }
      }
    } else {
      inTuneDurationRef.current = 0;
    }

    animFrameRef.current = requestAnimationFrame(processAudio);
  }, [currentTuning, activeStringIndex, isAutoMode, referenceA4]);

  useEffect(() => {
    if (isListening) {
      animFrameRef.current = requestAnimationFrame(processAudio);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening, processAudio]);

  // Handle tuning change
  const handleSelectTuning = (tuning: TuningPreset) => {
    setCurrentTuning(tuning);
    setActiveStringIndex(0);
    setTargetFreq(tuning.strings[0].targetFreq);
  };

  const handlePlayActiveString = (freq: number) => {
    playGuitarStringTone(freq, 2.0);
  };

  // Status helper calculations
  const currentTargetString = currentTuning.strings[activeStringIndex];
  const isInTune = isListening && detectedFreq && Math.abs(centsOffset) <= 3;
  const isFlat = isListening && detectedFreq && centsOffset < -3;
  const isSharp = isListening && detectedFreq && centsOffset > 3;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black font-sans pb-20 sm:pb-24">
      {/* Top Studio Navbar */}
      <header className="border-b border-white/[0.08] bg-[#0A0D15]/90 backdrop-blur-xl sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <div className="w-full h-full bg-[#07090E] rounded-[10px] flex items-center justify-center">
                <Guitar className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <span className="text-white">AGSOFT</span>
                <span className="text-emerald-400 tracking-wider">ACOUSTICS</span>
                <span className="hidden sm:inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  STUDIO SUITE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>0.1¢ SCIENTIFIC</span>
                <span>•</span>
                <button
                  onClick={() => setIsTuningModalOpen(true)}
                  className="hover:text-emerald-400 underline decoration-slate-600 transition cursor-pointer"
                >
                  A4 = {referenceA4}Hz
                </button>
              </div>
            </div>
          </div>

          {/* Header Controls: Tuning Preset + Dual Engine Switch */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle: Clean Studio Light vs Stage Dark */}
            <button
              onClick={() => setTheme(theme === 'clean' ? 'dark' : 'clean')}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                theme === 'clean'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]'
              }`}
              title={theme === 'clean' ? 'Switch to Stage Dark Mode' : 'Switch to Clean Light Mode'}
            >
              {theme === 'clean' ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-cyan-400" />}
              <span className="hidden sm:inline">{theme === 'clean' ? 'CLEAN' : 'DARK'}</span>
            </button>

            {activeTab === 'tuner' && (
              <div className="flex items-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs">
                <button
                  onClick={() => setTunerMode('studio')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    tunerMode === 'studio'
                      ? 'bg-emerald-500 text-black shadow-sm font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Studio Needle View"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">STUDIO</span>
                </button>
                <button
                  onClick={() => setTunerMode('strobe')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    tunerMode === 'strobe'
                      ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Peterson 0.1¢ Mechanical Strobe"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">STROBE</span>
                </button>
              </div>
            )}

            {/* Install App Button */}
            {!isInstalled && (
              <button
                onClick={handleTriggerInstall}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                title="Install AGSoft Acoustics App"
              >
                <Download className="w-3.5 h-3.5 animate-bounce" />
                <span className="hidden sm:inline">INSTALL</span>
              </button>
            )}

            <button
              onClick={() => setIsTuningModalOpen(true)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-emerald-400 transition cursor-pointer"
              title="Change Instrument / Alternate Tuning"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* PWA In-App Banner if not installed */}
      {!isInstalled && (
        <div className="w-full max-w-4xl mx-auto px-4 pt-3 pb-1">
          <div className="pwa-install-banner flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-teal-950/60 border border-emerald-500/30 shadow-lg text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-900 dark:text-white leading-tight">Install AGSoft Acoustics</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Run full-screen without browser bar • Instant offline launch</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleTriggerInstall}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] font-mono tracking-wider transition shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                INSTALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Body Depending on Active Tab */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col items-center justify-start">
        {/* TAB 1: TUNER VIEW */}
        {activeTab === 'tuner' && (
          <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-between flex-1 space-y-4">
            {/* Quick Tuning Selector Strip */}
            <div className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <button
                onClick={() => setIsTuningModalOpen(true)}
                className="flex items-center gap-2 text-left cursor-pointer group"
              >
                <span className="text-[10px] font-mono uppercase text-slate-400">TUNING:</span>
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                  {currentTuning.name}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAutoMode(!isAutoMode)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
                    isAutoMode
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{isAutoMode ? 'AUTO DETECT' : 'LOCKED'}</span>
                </button>
              </div>
            </div>

            {/* Mic Permission Warning */}
            {micError && (
              <div className="w-full p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{micError}. Please allow microphone access in your browser to tune!</span>
              </div>
            )}

            {/* HERO PITCH DISPLAY (The Centerpiece Note Badge) */}
            <div className="w-full py-4 px-6 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] shadow-2xl relative overflow-hidden flex flex-col items-center">
              {/* In-Tune Background Ambient Beam */}
              {isInTune && (
                <div className="absolute inset-0 bg-emerald-500/10 blur-2xl animate-pulse pointer-events-none" />
              )}

              {/* Status Header Badge */}
              <div className="mb-2">
                {isInTune ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-extrabold tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-bounce">
                    <CheckCircle2 className="w-3.5 h-3.5" /> IN TUNE
                  </span>
                ) : isFlat ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold font-mono tracking-wider">
                    TUNE UP ▲
                  </span>
                ) : isSharp ? (
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold font-mono tracking-wider">
                    TUNE DOWN ▼
                  </span>
                ) : isListening ? (
                  <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    LISTENING FOR PLUCK...
                  </span>
                ) : (
                  <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
                    MICROPHONE PAUSED
                  </span>
                )}
              </div>

              {/* Big Giant Note Readout */}
              <div className="flex items-baseline justify-center gap-1 my-1">
                <span className={`text-6xl sm:text-7xl font-extrabold tracking-tighter transition-all duration-150 ${
                  isInTune 
                    ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.7)] scale-105' 
                    : isFlat
                    ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                    : isSharp
                    ? 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'text-white'
                }`}>
                  {isListening && detectedNote ? detectedNote : currentTargetString.note}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-slate-400">
                  {isListening && detectedOctave !== null ? detectedOctave : currentTargetString.octave}
                </span>
              </div>

              {/* Deviation in Cents & Frequency */}
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-1">
                <span>
                  FREQ: <strong className="text-white">{detectedFreq ? `${detectedFreq.toFixed(1)} Hz` : `${currentTargetString.targetFreq.toFixed(1)} Hz`}</strong>
                </span>
                <span>•</span>
                <span>
                  DEV: <strong className={isInTune ? 'text-emerald-400' : 'text-slate-200'}>
                    {isListening && detectedFreq ? `${centsOffset > 0 ? '+' : ''}${centsOffset.toFixed(1)}¢` : '0.0¢'}
                  </strong>
                </span>
              </div>

              {/* High-Precision Deviation Visual Bar */}
              <div className="w-full max-w-md mt-4 flex flex-col items-center">
                <div className="w-full relative h-3 bg-slate-950 rounded-full border border-white/[0.08] overflow-hidden flex items-center">
                  {/* Center In-Tune Mark */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-emerald-400 z-10 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  {/* Tolerance Window (+/- 3 cents) */}
                  <div className="absolute left-[47%] w-[6%] h-full bg-emerald-500/30 z-0" />
                  
                  {/* Real-time Needle Dot */}
                  {isListening && detectedFreq && (
                    <div
                      className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75 shadow-md ${
                        isInTune ? 'bg-emerald-300' : isFlat ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{
                        left: `calc(${Math.min(97, Math.max(3, 50 + centsOffset))}% - 5px)`
                      }}
                    />
                  )}
                </div>

                <div className="w-full flex justify-between text-[10px] font-mono text-slate-400 mt-1 px-1">
                  <span>-50¢ (FLAT)</span>
                  <span className="text-emerald-400 font-bold">0¢ PERFECT</span>
                  <span>+50¢ (SHARP)</span>
                </div>
              </div>
            </div>

            {/* Quick String Peg Bar (Direct Access to all 6 Strings) */}
            <div className="w-full flex items-center justify-between gap-1.5 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              {currentTuning.strings.map((str, idx) => {
                const isActive = activeStringIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveStringIndex(idx);
                      setIsAutoMode(false);
                      handlePlayActiveString(str.targetFreq);
                    }}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-white/[0.02] border border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-sm font-bold font-mono">{str.note}</span>
                    <span className="text-[9px] font-mono text-slate-400">{str.targetFreq.toFixed(0)}Hz</span>
                  </button>
                );
              })}
            </div>

            {/* DUAL TUNER ENGINE: Studio Headstock OR Peterson Strobe */}
            <div className="w-full flex-1 flex flex-col items-center justify-center py-1">
              {tunerMode === 'studio' ? (
                <HeadstockTuner
                  strings={currentTuning.strings}
                  activeStringIndex={activeStringIndex}
                  onSelectString={(idx) => {
                    setActiveStringIndex(idx);
                    setIsAutoMode(false);
                  }}
                  frequency={isListening ? detectedFreq : null}
                  cents={centsOffset}
                  clarity={detectedClarity}
                  isAutoMode={isAutoMode}
                  onPlayTone={handlePlayActiveString}
                />
              ) : (
                <StrobeTuner
                  frequency={isListening ? detectedFreq : null}
                  targetFreq={targetFreq}
                  noteName={detectedNote}
                  octave={detectedOctave}
                  cents={centsOffset}
                  clarity={detectedClarity}
                />
              )}
            </div>

            {/* Big Mic Start / Listen Action */}
            <div className="w-full flex flex-col items-center gap-2.5 my-2">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`w-full max-w-sm py-4 rounded-2xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition active:scale-[0.98] cursor-pointer shadow-xl ${
                  isListening
                    ? 'bg-slate-900 text-rose-400 border border-rose-500/30 hover:bg-slate-800'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-black font-extrabold shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:brightness-110'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" /> PAUSE TUNER
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" /> START STUDIO TUNER (MIC)
                  </>
                )}
              </button>

              {/* Real-time volume signal visualizer bar */}
              {isListening && (
                <div className="w-full max-w-sm flex items-center gap-2 px-2 text-[10px] text-slate-400 font-mono">
                  <span>INPUT LEVEL</span>
                  <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/[0.08]">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${Math.min(100, rmsVolume * 600)}%` }}
                    />
                  </div>
                  <span>{Math.round(rmsVolume * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SONGS & TABS */}
        {activeTab === 'songs' && (
          <div className="w-full h-[80vh] flex flex-col">
            <SongSearchModal
              isOpen={true}
              isEmbedded={true}
              onClose={() => setActiveTab('tuner')}
              onOpenChordInfo={() => setActiveTab('chords')}
              onSongStateChange={setIsSongOpen}
            />
          </div>
        )}

        {/* TAB 3: PRO METRONOME */}
        {activeTab === 'metronome' && (
          <div className="w-full h-[78vh] flex items-center justify-center">
            <MetronomeModal
              isOpen={true}
              isEmbedded={true}
              onClose={() => setActiveTab('tuner')}
            />
          </div>
        )}

        {/* TAB 4: CHORD DICTIONARY */}
        {activeTab === 'chords' && (
          <div className="w-full h-[80vh] flex flex-col">
            <ChordLibraryModal
              isOpen={true}
              isEmbedded={true}
              onClose={() => setActiveTab('tuner')}
            />
          </div>
        )}
      </main>

      {/* Persistent Bottom Glass Dock Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#0A0D15]/95 backdrop-blur-2xl px-4 py-2.5">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          {/* 1. Tuner */}
          <button
            onClick={() => setActiveTab('tuner')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
              activeTab === 'tuner'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Guitar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Tuner</span>
          </button>

          {/* 2. Songs & Chords */}
          <button
            onClick={() => setActiveTab('songs')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
              activeTab === 'songs'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Music className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Songs</span>
          </button>

          {/* 3. Metronome */}
          <button
            onClick={() => setActiveTab('metronome')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
              activeTab === 'metronome'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Metronome</span>
          </button>

          {/* 4. Chords */}
          <button
            onClick={() => setActiveTab('chords')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
              activeTab === 'chords'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Chords</span>
          </button>
        </div>
      </nav>

      {/* Tuning Presets & Calibration Modal */}
      <TuningModal
        isOpen={isTuningModalOpen}
        onClose={() => setIsTuningModalOpen(false)}
        currentTuning={currentTuning}
        onSelectTuning={handleSelectTuning}
        referenceA4={referenceA4}
        onSetReferenceA4={setReferenceA4}
      />

      {/* PWA & Native App Installation Guide Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        canInstallPrompt={canInstall}
        onTriggerInstallPrompt={handleTriggerInstall}
      />
    </div>
  );
};
