import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Plus, Minus, RotateCcw, Volume2 } from 'lucide-react';
import { TAAL_PRESETS, TaalPreset } from '../audio/taalEngine';
import { riyaazEnsemble, RiyaazEnsembleState } from '../audio/riyaazEnsemble';
import { getSharedAudioContext } from '../audio/audioContext';

interface MetronomeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const MetronomeModal: React.FC<MetronomeModalProps> = ({ isOpen = true, onClose, isEmbedded = false }) => {
  // Rhythm Mode: 'western' (Classic metronome) vs 'taal' (Indian Classical Tabla Cycles)
  const [rhythmMode, setRhythmMode] = useState<'western' | 'taal'>(() => {
    try {
      const saved = localStorage.getItem('agsoft_rhythm_mode');
      if (saved === 'western' || saved === 'taal') return saved;
    } catch {}
    return 'western';
  });

  // Subscribe to the unified riyaazEnsemble singleton
  const [ensembleState, setEnsembleState] = useState<RiyaazEnsembleState>(() => riyaazEnsemble.getState());

  useEffect(() => {
    const unsub = riyaazEnsemble.subscribe((state) => {
      setEnsembleState(state);
    });
    return () => {
      unsub();
    };
  }, []);

  // Western metronome state
  const [westernBpm, setWesternBpm] = useState<number>(() => ensembleState.bpm);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('agsoft_metronome_beats');
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 1 && val <= 16) return val;
      }
    } catch {}
    return 4;
  });
  const [isWesternPlaying, setIsWesternPlaying] = useState<boolean>(false);
  const [westernBeat, setWesternBeat] = useState<number>(0);

  // Synchronize western BPM with ensemble BPM when changed
  useEffect(() => {
    setWesternBpm(ensembleState.bpm);
  }, [ensembleState.bpm]);

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_rhythm_mode', rhythmMode);
    } catch {}
  }, [rhythmMode]);

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_metronome_beats', String(beatsPerMeasure));
    } catch {}
  }, [beatsPerMeasure]);

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);

  // Western audio refs
  const westernTimerRef = useRef<number | null>(null);
  const westernNextNoteTimeRef = useRef<number>(0);
  const westernBeatRef = useRef<number>(0);
  const westernBpmRef = useRef<number>(westernBpm);
  westernBpmRef.current = westernBpm;
  const beatsPerMeasureRef = useRef<number>(beatsPerMeasure);
  beatsPerMeasureRef.current = beatsPerMeasure;
  const isHapticRef = useRef<boolean>(ensembleState.isHapticEnabled);
  isHapticRef.current = ensembleState.isHapticEnabled;

  const scheduleWesternClick = (beatIndex: number, time: number) => {
    const ctx = getSharedAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const isFirstBeat = beatIndex === 0;
    osc.frequency.setValueAtTime(isFirstBeat ? 1000 : 700, time);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);

    if (isHapticRef.current && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(isFirstBeat ? 40 : 12);
      } catch {}
    }
  };

  const westernScheduler = () => {
    const ctx = getSharedAudioContext();
    while (westernNextNoteTimeRef.current < ctx.currentTime + 0.1) {
      scheduleWesternClick(westernBeatRef.current, westernNextNoteTimeRef.current);
      setWesternBeat(westernBeatRef.current);

      const currentBpm = Math.max(30, westernBpmRef.current);
      const secondsPerBeat = 60.0 / currentBpm;
      westernNextNoteTimeRef.current += secondsPerBeat;
      westernBeatRef.current = (westernBeatRef.current + 1) % beatsPerMeasureRef.current;
    }
    westernTimerRef.current = window.setTimeout(westernScheduler, 25);
  };

  const stopWestern = () => {
    if (westernTimerRef.current) {
      clearTimeout(westernTimerRef.current);
      westernTimerRef.current = null;
    }
    setIsWesternPlaying(false);
    setWesternBeat(0);
    westernBeatRef.current = 0;
  };

  const startWestern = () => {
    const ctx = getSharedAudioContext();
    westernNextNoteTimeRef.current = ctx.currentTime + 0.05;
    westernBeatRef.current = 0;
    setIsWesternPlaying(true);
    westernScheduler();
  };

  // Cleanup Western timer on unmount
  useEffect(() => {
    return () => {
      if (westernTimerRef.current) {
        clearTimeout(westernTimerRef.current);
      }
    };
  }, []);

  // When switching modes, stop conflicting playback
  const handleSwitchMode = (mode: 'western' | 'taal') => {
    setRhythmMode(mode);
    if (mode === 'western') {
      if (ensembleState.isPlaying) {
        riyaazEnsemble.stop();
      }
    } else {
      if (isWesternPlaying) {
        stopWestern();
      }
    }
  };

  // Master Play/Pause toggle
  const togglePlay = () => {
    if (rhythmMode === 'taal') {
      if (isWesternPlaying) stopWestern();
      riyaazEnsemble.togglePlay(ensembleState.rootKey);
    } else {
      if (ensembleState.isPlaying) riyaazEnsemble.stop();
      if (isWesternPlaying) {
        stopWestern();
      } else {
        startWestern();
      }
    }
  };

  // BPM change handler (updates ensemble & storage in real time)
  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(30, Math.min(260, newBpm));
    riyaazEnsemble.setBpm(clamped);
    setWesternBpm(clamped);

    // If Western is playing, adjust its schedule immediately
    if (isWesternPlaying) {
      const ctx = getSharedAudioContext();
      const secondsPerBeat = 60.0 / clamped;
      if (westernNextNoteTimeRef.current > ctx.currentTime + secondsPerBeat) {
        westernNextNoteTimeRef.current = ctx.currentTime + secondsPerBeat * 0.5;
      }
    }
  };

  const handleSelectTaal = (taal: TaalPreset) => {
    riyaazEnsemble.setSelectedTaal(taal);
    handleBpmChange(taal.defaultBpm);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      tapTimesRef.current = [];
    }
    tapTimesRef.current.push(now);

    if (tapTimesRef.current.length > 1) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 30 && calculatedBpm <= 260) {
        handleBpmChange(calculatedBpm);
      }
    }
  };

  if (!isOpen) return null;

  const activeIsPlaying = rhythmMode === 'taal' ? ensembleState.isPlaying : isWesternPlaying;
  const activeCurrentBeat = rhythmMode === 'taal' ? ensembleState.currentBeat : westernBeat;
  const currentMatra = rhythmMode === 'taal' ? ensembleState.selectedTaal.matras[activeCurrentBeat % ensembleState.selectedTaal.matras.length] : null;

  const content = (
    <div className={`relative w-full ${isEmbedded ? 'max-w-md my-auto' : 'max-w-sm sm:max-w-md'} metronome-card bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center backdrop-blur-xl transition-all`}>
      {/* Close Button */}
      {!isEmbedded && onClose && (
        <button
          onClick={() => {
            if (rhythmMode === 'western' && isWesternPlaying) {
              stopWestern();
            }
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Mode Switcher: Western BPM vs Indian Taal */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl mb-4 w-full">
        <button
          onClick={() => handleSwitchMode('western')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            rhythmMode === 'western'
              ? 'bg-[#f15a24] text-white shadow-xs font-extrabold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>♩</span>
          <span>Western BPM</span>
        </button>
        <button
          onClick={() => handleSwitchMode('taal')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            rhythmMode === 'taal'
              ? 'bg-[#f15a24] text-white shadow-xs font-extrabold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🪘</span>
          <span>Indian Taal</span>
        </button>
      </div>

      {/* Taal Selector Dropdown (Shown in Taal Mode) */}
      {rhythmMode === 'taal' && (
        <div className="w-full mb-3 flex flex-col gap-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            <span>SELECT TAAL:</span>
            <span className="font-mono text-[#f15a24] dark:text-[#ff7a45]">{ensembleState.selectedTaal.structure}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {TAAL_PRESETS.map((taal) => (
              <button
                key={taal.id}
                onClick={() => handleSelectTaal(taal)}
                className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition flex flex-col items-center cursor-pointer border ${
                  ensembleState.selectedTaal.id === taal.id
                    ? 'bg-[#f15a24]/15 border-[#f15a24] text-[#f15a24] dark:text-[#ff7a45] shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span>{taal.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75 font-normal">{taal.totalMatras} Matras</span>
              </button>
            ))}
          </div>

          {/* Lehra Nagma Melody & Root Key Selector */}
          <div className="mt-2 p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between text-xs font-mono">
            <button
              onClick={() => riyaazEnsemble.setToggles({ lehra: !ensembleState.isLehraEnabled })}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                ensembleState.isLehraEnabled
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              <span>🎹</span>
              <span>Lehra (Nagma): {ensembleState.isLehraEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Root Key for Lehra */}
            <select
              value={ensembleState.rootKey}
              onChange={(e) => riyaazEnsemble.setRootKey(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-orange-500/30 rounded-lg px-2 py-1 text-slate-900 dark:text-amber-300 font-bold outline-hidden cursor-pointer"
              title="Root Key for Harmonium Lehra"
            >
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Bol Banner in Taal Mode */}
      {rhythmMode === 'taal' && currentMatra && (
        <div className="w-full py-2 px-3 my-1 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-[#f15a24]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              currentMatra.mark === 'sam' ? 'bg-[#f15a24] animate-ping' : currentMatra.mark === 'khali' ? 'bg-cyan-400' : 'bg-amber-400'
            }`}></span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              Matra {currentMatra.index}/{ensembleState.selectedTaal.totalMatras}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-mono tracking-wider text-[#f15a24] dark:text-[#ff7a45]">
              {currentMatra.bol}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black ${
              currentMatra.mark === 'sam'
                ? 'bg-[#f15a24] text-white'
                : currentMatra.mark === 'khali'
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                : currentMatra.mark === 'tali'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'text-slate-400'
            }`}>
              {currentMatra.mark === 'sam' ? 'SAM (X)' : currentMatra.mark === 'khali' ? 'KHALI (0)' : currentMatra.mark === 'tali' ? 'TALI' : '•'}
            </span>
          </div>
        </div>
      )}

      {/* Big BPM Display */}
      <div className="flex flex-col items-center my-1.5 select-none">
        <div className="metronome-bpm-val text-5xl sm:text-6xl font-black tracking-tight font-mono text-slate-950 dark:text-white">
          {ensembleState.bpm}
        </div>
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
          {rhythmMode === 'taal' ? 'LAYA (TEMPO / BPM)' : 'BEATS PER MINUTE'}
        </span>
      </div>

      {/* Beat Indicator Dots / Matra Ring */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-3 w-full flex-wrap px-2">
        {rhythmMode === 'taal'
          ? ensembleState.selectedTaal.matras.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center transition-all duration-75 ${
                  activeIsPlaying && activeCurrentBeat === idx ? 'scale-115' : 'opacity-80'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold transition-all ${
                    activeIsPlaying && activeCurrentBeat === idx
                      ? m.mark === 'sam'
                        ? 'bg-[#f15a24] text-white ring-4 ring-orange-500/40 shadow-lg'
                        : m.mark === 'khali'
                        ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-400/40 shadow-md'
                        : 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40 shadow-md'
                      : m.mark === 'sam'
                      ? 'bg-orange-500/30 border border-orange-500 text-orange-500'
                      : m.mark === 'khali'
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-500'
                      : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {m.mark === 'sam' ? 'X' : m.mark === 'khali' ? '0' : m.index}
                </div>
                <span className="text-[8px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  {m.bol}
                </span>
              </div>
            ))
          : Array.from({ length: beatsPerMeasure }).map((_, idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-75 ${
                  activeIsPlaying && activeCurrentBeat === idx
                    ? idx === 0
                      ? 'bg-[#f15a24] scale-125 shadow-[0_0_15px_rgba(241,90,36,0.6)]'
                      : 'bg-amber-400 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                    : 'metronome-dot-inactive bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                }`}
              />
            ))}
      </div>

      {/* BPM Stepper Controls */}
      <div className="flex items-center gap-2 sm:gap-3 my-2 w-full justify-center">
        <button
          onClick={() => handleBpmChange(ensembleState.bpm - 5)}
          className="metronome-stepper flex-1 max-w-[62px] h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer text-xs"
          title="Decrease by 5 BPM"
        >
          -5
        </button>
        <button
          onClick={() => handleBpmChange(ensembleState.bpm - 1)}
          className="metronome-stepper flex-1 max-w-[62px] h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer"
          title="Decrease by 1 BPM"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleBpmChange(ensembleState.bpm + 1)}
          className="metronome-stepper flex-1 max-w-[62px] h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer"
          title="Increase by 1 BPM"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleBpmChange(ensembleState.bpm + 5)}
          className="metronome-stepper flex-1 max-w-[62px] h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer text-xs"
          title="Increase by 5 BPM"
        >
          +5
        </button>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="30"
        max="260"
        value={ensembleState.bpm}
        onChange={(e) => handleBpmChange(Number(e.target.value))}
        className="w-full accent-[#f15a24] my-2 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
      />

      {/* Bottom Actions: Tap Tempo & Play */}
      <div className="grid grid-cols-2 gap-3 w-full mt-2">
        <button
          onClick={handleTapTempo}
          className="metronome-stepper py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-200 active:scale-95 transition tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>TAP TEMPO</span>
        </button>
        <button
          onClick={togglePlay}
          className={`py-3 px-4 rounded-xl font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-lg ${
            activeIsPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
              : 'bg-[#f15a24] hover:bg-[#d94816] text-white shadow-orange-500/30 font-extrabold'
          }`}
        >
          {activeIsPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" /> <span>STOP</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> <span>{rhythmMode === 'taal' ? 'START TAAL' : 'START'}</span>
            </>
          )}
        </button>
      </div>

      {/* Time Signature Buttons (Western Mode) */}
      {rhythmMode === 'western' && (
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-bold">TIME:</span>
          {[2, 3, 4, 6].map((num) => (
            <button
              key={num}
              onClick={() => {
                setBeatsPerMeasure(num);
                setWesternBeat(0);
              }}
              className={`px-3 py-1 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                beatsPerMeasure === num
                  ? 'bg-[#f15a24] text-white font-extrabold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
              }`}
            >
              {num}/4
            </button>
          ))}
        </div>
      )}

      {/* Haptic Pulse Toggle for Rehearsals */}
      <button
        onClick={() => {
          const next = !ensembleState.isHapticEnabled;
          riyaazEnsemble.setToggles({ haptic: next });
          if (next && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(30);
            } catch (e) {}
          }
        }}
        className={`w-full mt-3 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
          ensembleState.isHapticEnabled
            ? 'bg-orange-50 dark:bg-[#f15a24]/10 border-orange-200 dark:border-[#f15a24]/30 text-[#f15a24] dark:text-[#ff7a45]'
            : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Vibrate phone on each beat so you feel the tempo in your pocket"
      >
        <span>📳</span>
        <span>Haptic Pocket Pulse: {ensembleState.isHapticEnabled ? 'ENABLED' : 'OFF'}</span>
      </button>
    </div>
  );

  if (isEmbedded) {
    return <div className="w-full h-full flex items-center justify-center p-4">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      {content}
    </div>
  );
};
