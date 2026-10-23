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
import { playGuitarStringTone, playInTuneChime, stopToneDrone } from './audio/toneGenerator';
import { TUNINGS, TuningPreset } from './data/tunings';
import { StrobeTuner } from './components/StrobeTuner';
import { HeadstockTuner } from './components/HeadstockTuner';
import { MetronomeModal } from './components/MetronomeModal';
import { ChordLibraryModal } from './components/ChordLibraryModal';
import { TuningModal } from './components/TuningModal';
import { SongSearchModal } from './components/SongSearchModal';
import { InstallModal } from './components/InstallModal';
import { AutoUpdateModal } from './components/AutoUpdateModal';
import { checkForAppUpdate, AppUpdateInfo, CURRENT_APP_VERSION } from './services/updateService';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

type ActiveTab = 'tuner' | 'songs' | 'metronome' | 'chords';

export const App: React.FC = () => {
  // Seamless Native Splash Screen Handshake
  // Dismiss native splash screen smoothly as soon as React is mounted
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hide({
          fadeOutDuration: 300
        });
      } catch {
        // Fallback for web browser execution
      }
    };

    hideSplash();
    const raf = requestAnimationFrame(() => {
      hideSplash();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

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
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      } else {
        document.documentElement.classList.remove('clean-theme');
        document.body.classList.remove('clean-theme');
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // Navigation Dock
  const [activeTab, setActiveTab] = useState<ActiveTab>('tuner');

  // Tuner Modes: 'studio' (GuitarTuna visual headstock) vs 'strobe' (Peterson 0.1c Strobe)
  const [tunerMode, setTunerMode] = useState<'studio' | 'strobe'>(() => {
    try {
      const saved = localStorage.getItem('agsoft_tuner_mode');
      if (saved === 'studio' || saved === 'strobe') return saved;
    } catch {}
    return 'studio';
  });

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_tuner_mode', tunerMode);
    } catch {}
  }, [tunerMode]);

  // Tuning Preset persistence
  const [currentTuning, setCurrentTuning] = useState<TuningPreset>(() => {
    try {
      const savedId = localStorage.getItem('agsoft_tuning_id');
      if (savedId) {
        const found = TUNINGS.find((t) => t.id === savedId || t.name === savedId);
        if (found) return found;
      }
    } catch {}
    return TUNINGS[0];
  });

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_tuning_id', currentTuning.id);
    } catch {}
  }, [currentTuning]);

  const [activeStringIndex, setActiveStringIndex] = useState<number>(0);

  // Auto String Detection persistence
  const [isAutoMode, setIsAutoMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('agsoft_is_auto_mode');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_is_auto_mode', JSON.stringify(isAutoMode));
    } catch {}
  }, [isAutoMode]);

  // Concert Pitch A4 persistence
  const [referenceA4, setReferenceA4] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('agsoft_reference_a4');
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 420 && val <= 460) return val;
      }
    } catch {}
    return 440;
  });

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_reference_a4', String(referenceA4));
    } catch {}
  }, [referenceA4]);

  // Audio State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [detectedClarity, setDetectedClarity] = useState<number>(0);
  const [rmsVolume, setRmsVolume] = useState<number>(0);
  const [detectedNote, setDetectedNote] = useState<string>('');
  const [detectedOctave, setDetectedOctave] = useState<number | null>(null);
  const [centsOffset, setCentsOffset] = useState<number>(0);
  const [targetFreq, setTargetFreq] = useState<number | null>(() => currentTuning?.strings?.[0]?.targetFreq || 82.41);

  // Safety clamp activeStringIndex whenever currentTuning changes
  useEffect(() => {
    if (activeStringIndex >= currentTuning.strings.length) {
      setActiveStringIndex(0);
    }
  }, [currentTuning, activeStringIndex]);

  // Tuning Preset Modal
  const [isTuningModalOpen, setIsTuningModalOpen] = useState<boolean>(false);

  // Auto-Update States
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [isManualUpdateCheck, setIsManualUpdateCheck] = useState<boolean>(false);

  // Background auto-update check on application launch
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const info = await checkForAppUpdate();
        if (info.updateAvailable) {
          setUpdateInfo(info);
          setIsUpdateModalOpen(true);
        }
      } catch {
        // Silent failure in background
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleManualUpdateCheck = async () => {
    setIsCheckingUpdate(true);
    setIsManualUpdateCheck(true);
    setIsUpdateModalOpen(true);
    try {
      const info = await checkForAppUpdate();
      setUpdateInfo(info);
    } catch {
      // ignore
    } finally {
      setIsCheckingUpdate(false);
    }
  };

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
          } else if (isUpdateModalOpen) {
            setIsUpdateModalOpen(false);
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
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    stopToneDrone();
    setIsListening(false);
    setDetectedFreq(null);
    setCentsOffset(0);
    setRmsVolume(0);
  };

  // Continuous Pitch Detection Loop
  const processAudio = useCallback(() => {
    if (!analyserRef.current || !audioBufferRef.current || !audioContextRef.current) return;
    if (!isListening || activeTab !== 'tuner' || isSongOpen) return;

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
  }, [currentTuning, activeStringIndex, isAutoMode, referenceA4, isListening, activeTab, isSongOpen]);

  // Completely shut down tuner microphone & audio processing when leaving the Tuner tab or when a song is open
  useEffect(() => {
    if (activeTab !== 'tuner' || isSongOpen) {
      if (isListening) {
        stopListening();
      }
      stopToneDrone();
    }
  }, [activeTab, isSongOpen, isListening]);

  useEffect(() => {
    if (isListening && activeTab === 'tuner' && !isSongOpen) {
      animFrameRef.current = requestAnimationFrame(processAudio);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening, activeTab, isSongOpen, processAudio]);

  // Handle tuning change
  const handleSelectTuning = (tuning: TuningPreset) => {
    setCurrentTuning(tuning);
    setActiveStringIndex(0);
    setTargetFreq(tuning.strings[0].targetFreq);
  };

  const handlePlayActiveString = (freq: number) => {
    playGuitarStringTone(freq, 2.0);
  };

  // Status helper calculations (guarded against out-of-bound string indexing)
  const currentTargetString = currentTuning?.strings?.[activeStringIndex] || currentTuning?.strings?.[0] || {
    note: 'E',
    octave: 2,
    targetFreq: 82.41,
    name: 'Low E'
  };
  const isInTune = isListening && detectedFreq && Math.abs(centsOffset) <= 3;
  const isFlat = isListening && detectedFreq && centsOffset < -3;
  const isSharp = isListening && detectedFreq && centsOffset > 3;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-[#f15a24] selection:text-white font-sans pb-[max(80px,calc(5rem+env(safe-area-inset-bottom,0px)))]">
      {/* Top Studio Navbar with iOS Notch Safe-Area Inset */}
      <header className="border-b border-white/[0.08] bg-[#0A0D15]/90 backdrop-blur-xl sticky top-0 z-40 px-4 pt-[max(12px,env(safe-area-inset-top,0px))] pb-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Identity with Zostel Orange Accent */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f15a24] via-amber-500 to-orange-400 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(241,90,36,0.35)] shrink-0">
              <div className="w-full h-full bg-[#07090E] rounded-[10px] flex items-center justify-center">
                <Guitar className="w-5 h-5 text-[#f15a24]" />
              </div>
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <span className="text-white">AGSOFT</span>
                <span className="text-[#f15a24] tracking-wider font-black">ACOUSTICS</span>
                <span className="hidden sm:inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  STUDIO SUITE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>0.1¢ SCIENTIFIC</span>
                <span>•</span>
                <button
                  onClick={() => setIsTuningModalOpen(true)}
                  className="hover:text-[#f15a24] underline decoration-slate-600 transition cursor-pointer"
                >
                  A4 = {referenceA4}Hz
                </button>
              </div>
            </div>
          </div>

          {/* Header Controls: Tuning Preset + Dual Engine Switch */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle: Clean Studio Light vs Stage Dark */}
            <button
              onClick={() => setTheme(theme === 'clean' ? 'dark' : 'clean')}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold min-h-[36px] ${
                theme === 'clean'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]'
              }`}
              title={theme === 'clean' ? 'Switch to Stage Dark Mode' : 'Switch to Clean Light Mode'}
            >
              {theme === 'clean' ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-cyan-400" />}
              <span className="hidden sm:inline">{theme === 'clean' ? 'CLEAN' : 'DARK'}</span>
            </button>

            {/* Single, Direct 1-Click Install App Button */}
            {!isInstalled && (
              <button
                onClick={handleTriggerInstall}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer min-h-[36px]"
                title="Add to Home Screen / Install App"
              >
                <Download className="w-3.5 h-3.5 text-[#f15a24]" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            {/* Version / Update Action (Only shown when installed or when an update is ready) */}
            {isInstalled && (
              <button
                onClick={handleManualUpdateCheck}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 transition cursor-pointer min-h-[36px]"
                title={
                  updateInfo?.updateAvailable
                    ? `Update Available: v${updateInfo.latestVersionName}`
                    : `AGSoft Acoustics v${CURRENT_APP_VERSION.versionName}`
                }
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                {updateInfo?.updateAvailable && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#f15a24] rounded-full" />
                )}
              </button>
            )}

            <button
              onClick={() => setIsTuningModalOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-[#f15a24] transition cursor-pointer min-h-[36px]"
              title="Change Instrument / Alternate Tuning"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Body Depending on Active Tab */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col items-center justify-start">
        {/* TAB 1: TUNER VIEW */}
        {activeTab === 'tuner' && (
          <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-between flex-1 space-y-3.5">
            {/* Tuner Engine Mode Selector Strip (Instant Thumb Access for Mobile & iPhone) */}
            <div className="w-full grid grid-cols-2 p-1 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-xs">
              <button
                onClick={() => setTunerMode('studio')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tunerMode === 'studio'
                    ? 'bg-[#f15a24] text-white shadow-md font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>STUDIO NEEDLE</span>
              </button>
              <button
                onClick={() => setTunerMode('strobe')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tunerMode === 'strobe'
                    ? 'bg-cyan-500 text-black shadow-md font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>0.1¢ STROBE</span>
              </button>
            </div>

            {/* Quick Tuning Selector Strip */}
            <div className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] shadow-xs">
              <button
                onClick={() => setIsTuningModalOpen(true)}
                className="flex items-center gap-2 text-left cursor-pointer group"
              >
                <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">TUNING:</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#f15a24] transition">
                  {currentTuning.name}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAutoMode(!isAutoMode)}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${
                    isAutoMode
                      ? 'bg-[#f15a24]/15 border-[#f15a24]/40 text-[#f15a24] dark:text-[#ff7a45]'
                      : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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

            {/* HERO PITCH DISPLAY (Active in 0.1¢ Strobe Mode; in Studio Mode, Luthier Blueprint contains its integrated HUD) */}
            {tunerMode === 'strobe' && (
              <div className="w-full py-5 px-6 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col items-center">
                {/* In-Tune Background Ambient Beam */}
                {isInTune && (
                  <div className="absolute inset-0 bg-emerald-500/10 blur-2xl animate-pulse pointer-events-none" />
                )}

                {/* Status Header Badge */}
                <div className="mb-2">
                  {isInTune ? (
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-black text-xs font-extrabold tracking-widest flex items-center gap-1.5 shadow-md animate-bounce">
                      <CheckCircle2 className="w-3.5 h-3.5" /> IN TUNE
                    </span>
                  ) : isFlat ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold font-mono tracking-wider">
                      TUNE UP ▲
                    </span>
                  ) : isSharp ? (
                    <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 text-[11px] font-bold font-mono tracking-wider">
                      TUNE DOWN ▼
                    </span>
                  ) : isListening ? (
                    <span className="text-[11px] font-mono font-semibold tracking-widest text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      LISTENING FOR PLUCK...
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                      MICROPHONE PAUSED
                    </span>
                  )}
                </div>

                {/* Big Giant Note Readout */}
                <div className="flex items-baseline justify-center gap-1 my-1">
                  <span className={`text-6xl sm:text-7xl font-extrabold tracking-tighter transition-all duration-150 ${
                    isInTune 
                      ? 'text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105' 
                      : isFlat
                      ? 'text-amber-600 dark:text-amber-300'
                      : isSharp
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {isListening && detectedNote ? detectedNote : currentTargetString.note}
                  </span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-slate-500 dark:text-slate-400">
                    {isListening && detectedOctave !== null ? detectedOctave : currentTargetString.octave}
                  </span>
                </div>

                {/* Deviation in Cents & Frequency */}
                <div className="flex items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                  <span>
                    FREQ: <strong className="text-slate-900 dark:text-white font-bold">{detectedFreq ? `${detectedFreq.toFixed(1)} Hz` : `${currentTargetString.targetFreq.toFixed(1)} Hz`}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    DEV: <strong className={isInTune ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-800 dark:text-slate-200 font-bold'}>
                      {isListening && detectedFreq ? `${centsOffset > 0 ? '+' : ''}${centsOffset.toFixed(1)}¢` : '0.0¢'}
                    </strong>
                  </span>
                </div>

                {/* High-Precision Deviation Visual Bar */}
                <div className="w-full max-w-md mt-4 flex flex-col items-center">
                  <div className="w-full relative h-3 bg-slate-200 dark:bg-slate-950 rounded-full border border-slate-300 dark:border-white/[0.08] overflow-hidden flex items-center">
                    {/* Center In-Tune Mark */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-emerald-500 z-10 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                    {/* Tolerance Window (+/- 3 cents) */}
                    <div className="absolute left-[47%] w-[6%] h-full bg-emerald-500/25 z-0" />
                    
                    {/* Real-time Needle Dot */}
                    {isListening && detectedFreq && (
                      <div
                        className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75 shadow-md ${
                          isInTune ? 'bg-emerald-500' : isFlat ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{
                          left: `calc(${Math.min(97, Math.max(3, 50 + centsOffset))}% - 5px)`
                        }}
                      />
                    )}
                  </div>

                  <div className="w-full flex justify-between text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 mt-1 px-1">
                    <span>-50¢ (FLAT)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">0¢ PERFECT</span>
                    <span>+50¢ (SHARP)</span>
                  </div>
                </div>

                {/* Strobe Mode String Selector Bar */}
                <div className="w-full flex items-center justify-center gap-1.5 pt-4 mt-3 border-t border-slate-200 dark:border-white/[0.08]">
                  {currentTuning.strings.map((str, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveStringIndex(idx);
                        setIsAutoMode(false);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition ${
                        activeStringIndex === idx
                          ? 'bg-cyan-500 text-black font-extrabold shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {str.note}{str.octave}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    : 'bg-gradient-to-r from-[#f15a24] via-orange-500 to-[#ea580c] text-white font-extrabold shadow-[0_0_30px_rgba(241,90,36,0.45)] hover:brightness-110'
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

      {/* Persistent Bottom Glass Dock Navigation with iOS Home-Indicator Safe-Area Inset */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#0A0D15]/95 backdrop-blur-2xl px-4 pt-2 pb-[max(10px,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          {/* 1. Tuner */}
          <button
            onClick={() => setActiveTab('tuner')}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
              activeTab === 'tuner'
                ? 'bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/40 shadow-[0_0_15px_rgba(241,90,36,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Guitar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Tuner</span>
          </button>

          {/* 2. Songs & Chords */}
          <button
            onClick={() => {
              if (isListening) stopListening();
              stopToneDrone();
              setActiveTab('songs');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
              activeTab === 'songs'
                ? 'bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/40 shadow-[0_0_15px_rgba(241,90,36,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Music className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Songs</span>
          </button>

          {/* 3. Metronome */}
          <button
            onClick={() => {
              if (isListening) stopListening();
              stopToneDrone();
              setActiveTab('metronome');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
              activeTab === 'metronome'
                ? 'bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/40 shadow-[0_0_15px_rgba(241,90,36,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-tight">Metronome</span>
          </button>

          {/* 4. Chords */}
          <button
            onClick={() => {
              if (isListening) stopListening();
              stopToneDrone();
              setActiveTab('chords');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition cursor-pointer ${
              activeTab === 'chords'
                ? 'bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/40 shadow-[0_0_15px_rgba(241,90,36,0.25)]'
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
        onCheckForUpdates={handleManualUpdateCheck}
      />

      {/* PWA & Native App Installation Guide Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        canInstallPrompt={canInstall}
        onTriggerInstallPrompt={handleTriggerInstall}
      />

      {/* In-App Auto-Update Notification & APK Installer */}
      <AutoUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setIsManualUpdateCheck(false);
        }}
        updateInfo={updateInfo}
        isChecking={isCheckingUpdate}
        isManualCheck={isManualUpdateCheck}
      />
    </div>
  );
};
