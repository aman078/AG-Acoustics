import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Plus, Minus, RotateCcw } from 'lucide-react';

interface MetronomeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const MetronomeModal: React.FC<MetronomeModalProps> = ({ isOpen = true, onClose, isEmbedded = false }) => {
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
      localStorage.setItem('agsoft_metronome_bpm', String(bpm));
    } catch {}
  }, [bpm]);

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

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);

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

  const scheduleClick = (beat: number, time: number) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Beat 1 gets higher pitch click (1000Hz), others get 700Hz
    const isFirstBeat = beat === 0;
    osc.frequency.setValueAtTime(isFirstBeat ? 1000 : 700, time);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);

    // Haptic pocket vibration: strong pulse on Beat 1, softer on off-beats
    if (isHapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(isFirstBeat ? 40 : 12);
      } catch (e) {}
    }
  };

  const scheduler = () => {
    const ctx = getAudioContext();
    // Schedule ahead 100ms
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      scheduleClick(currentBeatRef.current, nextNoteTimeRef.current);
      
      const beatToUpdate = currentBeatRef.current;
      setCurrentBeat(beatToUpdate);

      // Advance beat
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasure;
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

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    // Clear taps if last tap was more than 2 seconds ago
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

  const content = (
    <div className={`relative w-full ${isEmbedded ? 'max-w-md my-auto' : 'max-w-sm sm:max-w-md'} metronome-card bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center backdrop-blur-xl transition-all`}>
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

      <h3 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 mb-4 sm:mb-6 flex items-center gap-2">
        <span>AGSOFT PRO METRONOME</span>
      </h3>

      {/* Big BPM Display */}
      <div className="flex flex-col items-center my-2 sm:my-3 select-none">
        <div className="metronome-bpm-val text-6xl sm:text-7xl font-black tracking-tight font-mono text-slate-950 dark:text-white">
          {bpm}
        </div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
          BEATS PER MINUTE
        </span>
      </div>

      {/* Beat Indicator Dots */}
      <div className="flex items-center justify-center gap-3 my-4 sm:my-5">
        {Array.from({ length: beatsPerMeasure }).map((_, idx) => (
          <div
            key={idx}
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-75 ${
              isPlaying && currentBeat === idx
                ? idx === 0
                  ? 'bg-emerald-500 scale-125 shadow-[0_0_15px_#10b981]'
                  : 'bg-cyan-500 scale-110 shadow-[0_0_10px_#06b6d4]'
                : 'metronome-dot-inactive bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
            }`}
          />
        ))}
      </div>

      {/* BPM Stepper Controls */}
      <div className="flex items-center gap-2 sm:gap-3 my-2 w-full justify-center">
        <button
          onClick={() => setBpm((prev) => Math.max(30, prev - 5))}
          className="metronome-stepper flex-1 max-w-[62px] h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer text-xs sm:text-sm"
          title="Decrease by 5 BPM"
        >
          -5
        </button>
        <button
          onClick={() => setBpm((prev) => Math.max(30, prev - 1))}
          className="metronome-stepper flex-1 max-w-[62px] h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer"
          title="Decrease by 1 BPM"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setBpm((prev) => Math.min(280, prev + 1))}
          className="metronome-stepper flex-1 max-w-[62px] h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer"
          title="Increase by 1 BPM"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setBpm((prev) => Math.min(280, prev + 5))}
          className="metronome-stepper flex-1 max-w-[62px] h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-mono font-bold flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-xs active:scale-95 transition cursor-pointer text-xs sm:text-sm"
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
        className="w-full accent-emerald-500 my-4 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
      />

      {/* Bottom Actions: Tap Tempo & Play */}
      <div className="grid grid-cols-2 gap-3 w-full mt-2">
        <button
          onClick={handleTapTempo}
          className="metronome-stepper py-3.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-200 active:scale-95 transition tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>TAP TEMPO</span>
        </button>
        <button
          onClick={togglePlay}
          className={`py-3.5 px-4 rounded-xl font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-lg ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30 font-extrabold'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-white" /> <span>STOP</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black" /> <span>START</span>
            </>
          )}
        </button>
      </div>

      {/* Time Signature Buttons */}
      <div className="flex items-center gap-2 mt-4 text-xs text-slate-600 dark:text-slate-400">
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
                ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {num}/4
          </button>
        ))}
      </div>

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
        className={`w-full mt-4 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
          isHapticEnabled
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
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
