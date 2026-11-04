import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Plus, Minus, RotateCcw, Volume2 } from 'lucide-react';
import { TAAL_PRESETS, TaalPreset, playSyntheticTablaStroke } from '../audio/taalEngine';

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

  const [bpm, setBpm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('agsoft_metronome_bpm');
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val >= 30 && val <= 300) return val;
      }
    } catch {}
    return 120;
  });

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

  // Selected Indian Taal preset (Teentaal, Keherwa, Dadra, Rupak, Ektaal, Jhaptal)
  const [selectedTaal, setSelectedTaal] = useState<TaalPreset>(() => {
    try {
      const savedId = localStorage.getItem('agsoft_selected_taal_id');
      if (savedId) {
        const found = TAAL_PRESETS.find((t) => t.id === savedId);
        if (found) return found;
      }
    } catch {}
    return TAAL_PRESETS[0]; // Teentaal default
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [isHapticEnabled, setIsHapticEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('agsoft_metronome_haptic');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_rhythm_mode', rhythmMode);
    } catch {}
  }, [rhythmMode]);

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_selected_taal_id', selectedTaal.id);
    } catch {}
  }, [selectedTaal]);

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_metronome_bpm', String(bpm));
    } catch {}

    // When BPM changes on the fly while playing, recalculate next note deadline immediately
    if (isPlaying && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      const currentBpm = Math.max(30, bpm);
      const secondsPerBeat = 60.0 / currentBpm;
      // If nextNoteTime is scheduled further out than one full new beat duration, pull it in
      if (nextNoteTimeRef.current > ctx.currentTime + secondsPerBeat) {
        nextNoteTimeRef.current = ctx.currentTime + secondsPerBeat * 0.5;
      }
    }
  }, [bpm, isPlaying]);

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_metronome_beats', String(beatsPerMeasure));
    } catch {}
  }, [beatsPerMeasure]);

  useEffect(() => {
    try {
      localStorage.setItem('agsoft_metronome_haptic', JSON.stringify(isHapticEnabled));
    } catch {}
  }, [isHapticEnabled]);

  // Tap tempo state & audio refs
  const tapTimesRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);

  // Sync ref for access inside audio callback
  const bpmRef = useRef<number>(bpm);
  bpmRef.current = bpm;
  const rhythmModeRef = useRef<'western' | 'taal'>(rhythmMode);
  rhythmModeRef.current = rhythmMode;
  const selectedTaalRef = useRef<TaalPreset>(selectedTaal);
  selectedTaalRef.current = selectedTaal;
  const beatsPerMeasureRef = useRef<number>(beatsPerMeasure);
  beatsPerMeasureRef.current = beatsPerMeasure;
  const isHapticEnabledRef = useRef<boolean>(isHapticEnabled);
  isHapticEnabledRef.current = isHapticEnabled;

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const scheduleClick = (beatIndex: number, time: number) => {
    const ctx = getAudioContext();

    if (rhythmModeRef.current === 'taal') {
      // Indian Classical Taal Playback: Synthetic Tabla Strokes
      const taal = selectedTaalRef.current;
      const matra = taal.matras[beatIndex % taal.matras.length];
      if (matra) {
        playSyntheticTablaStroke(ctx, matra.type, time);

        // Haptic pulse: strong on Sam (Beat 1), medium on Tali, subtle on others
        if (isHapticEnabledRef.current && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            if (matra.mark === 'sam') {
              navigator.vibrate(50);
            } else if (matra.mark === 'tali') {
              navigator.vibrate(25);
            } else if (matra.mark !== 'khali') {
              navigator.vibrate(10);
            }
          } catch (e) {}
        }
      }
    } else {
      // Classic Western Click
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

      if (isHapticEnabledRef.current && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(isFirstBeat ? 40 : 12);
        } catch (e) {}
      }
    }
  };

  const scheduler = () => {
    const ctx = getAudioContext();
    const cycleLength = rhythmModeRef.current === 'taal' ? selectedTaalRef.current.matras.length : beatsPerMeasureRef.current;

    // Schedule ahead 100ms
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      scheduleClick(currentBeatRef.current, nextNoteTimeRef.current);

      const beatToUpdate = currentBeatRef.current;
      setCurrentBeat(beatToUpdate);

      // Advance beat dynamically using bpmRef (ensures instantaneous tempo response on the fly)
      const currentBpm = Math.max(30, bpmRef.current);
      const secondsPerBeat = 60.0 / currentBpm;
      nextNoteTimeRef.current += secondsPerBeat;
      currentBeatRef.current = (currentBeatRef.current + 1) % cycleLength;
    }
    timerRef.current = window.setTimeout(scheduler, 25);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      const ctx = getAudioContext();
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      currentBeatRef.current = 0;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // When switching modes or Taals, reset beat pointer
  const handleSwitchMode = (mode: 'western' | 'taal') => {
    setRhythmMode(mode);
    setCurrentBeat(0);
    currentBeatRef.current = 0;
    if (mode === 'taal' && selectedTaal) {
      setBpm(selectedTaal.defaultBpm);
    }
  };

  const handleSelectTaal = (taal: TaalPreset) => {
    setSelectedTaal(taal);
    setCurrentBeat(0);
    currentBeatRef.current = 0;
    setBpm(taal.defaultBpm);
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
        setBpm(calculatedBpm);
      }
    }
  };

  if (!isOpen) return null;

  const currentMatra = rhythmMode === 'taal' ? selectedTaal.matras[currentBeat % selectedTaal.matras.length] : null;

  const content = (
    <div className={`relative w-full ${isEmbedded ? 'max-w-md my-auto' : 'max-w-sm sm:max-w-md'} metronome-card bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col items-center backdrop-blur-xl transition-all`}>
      {/* Close Button */}
      {!isEmbedded && onClose && (
        <button
          onClick={() => {
            if (isPlaying) togglePlay();
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
            <span className="font-mono text-[#f15a24] dark:text-[#ff7a45]">{selectedTaal.structure}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {TAAL_PRESETS.map((taal) => (
              <button
                key={taal.id}
                onClick={() => handleSelectTaal(taal)}
                className={`py-1.5 px-2 rounded-xl text-left transition flex flex-col cursor-pointer border ${
                  selectedTaal.id === taal.id
                    ? 'bg-[#f15a24]/10 dark:bg-[#f15a24]/20 border-[#f15a24] text-[#f15a24] dark:text-[#ff7a45] font-extrabold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold truncate">{taal.name.split(' ')[0]}</span>
                <span className="text-[9px] font-mono opacity-70">{taal.totalMatras} Matras</span>
              </button>
            ))}
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
              Matra {currentMatra.index}/{selectedTaal.totalMatras}
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
          {bpm}
        </div>
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
          {rhythmMode === 'taal' ? 'LAYA (TEMPO / BPM)' : 'BEATS PER MINUTE'}
        </span>
      </div>

      {/* Beat Indicator Dots / Matra Ring */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-3 w-full flex-wrap px-2">
        {rhythmMode === 'taal'
          ? selectedTaal.matras.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center transition-all duration-75 ${
                  isPlaying && currentBeat === idx ? 'scale-115' : 'opacity-80'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold transition-all ${
                    isPlaying && currentBeat === idx
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
                  isPlaying && currentBeat === idx
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
          onClick={() => setBpm((prev) => Math.max(30, prev - 5))}
          className="metronome-stepper flex-1 max-w-[62px] h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer text-xs"
          title="Decrease by 5 BPM"
        >
          -5
        </button>
        <button
          onClick={() => setBpm((prev) => Math.max(30, prev - 1))}
          className="metronome-stepper flex-1 max-w-[62px] h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer"
          title="Decrease by 1 BPM"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setBpm((prev) => Math.min(280, prev + 1))}
          className="metronome-stepper flex-1 max-w-[62px] h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer"
          title="Increase by 1 BPM"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setBpm((prev) => Math.min(280, prev + 5))}
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
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
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
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
              : 'bg-[#f15a24] hover:bg-[#d94816] text-white shadow-orange-500/30 font-extrabold'
          }`}
        >
          {isPlaying ? (
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
                setCurrentBeat(0);
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
          const next = !isHapticEnabled;
          setIsHapticEnabled(next);
          if (next && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(30);
            } catch (e) {}
          }
        }}
        className={`w-full mt-3 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
          isHapticEnabled
            ? 'bg-orange-50 dark:bg-[#f15a24]/10 border-orange-200 dark:border-[#f15a24]/30 text-[#f15a24] dark:text-[#ff7a45]'
            : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
        title="Vibrate phone on each beat so you feel the tempo in your pocket"
      >
        <span>📳</span>
        <span>Haptic Pocket Pulse: {isHapticEnabled ? 'ENABLED' : 'OFF'}</span>
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
