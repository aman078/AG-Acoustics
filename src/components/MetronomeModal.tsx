import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Plus, Minus, RotateCcw } from 'lucide-react';

interface MetronomeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const MetronomeModal: React.FC<MetronomeModalProps> = ({ isOpen = true, onClose, isEmbedded = false }) => {
  const [bpm, setBpm] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(4);
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
    <div className={`relative w-full ${isEmbedded ? 'max-w-md my-auto' : 'max-w-sm'} metronome-card bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center backdrop-blur-xl`}>
      {/* Close Button */}
      {!isEmbedded && onClose && (
        <button
          onClick={() => {
            if (isPlaying) togglePlay();
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <h3 className="text-sm font-bold tracking-wider uppercase text-emerald-500 dark:text-emerald-400 mb-6 flex items-center gap-2">
        <span>AGSOFT PRO METRONOME</span>
      </h3>

        {/* Big BPM Display */}
        <div className="flex flex-col items-center my-2">
          <div className="text-6xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
            {bpm}
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
            BPM
          </span>
        </div>

        {/* Beat Indicator Dots */}
        <div className="flex items-center gap-3 my-5">
          {Array.from({ length: beatsPerMeasure }).map((_, idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-75 ${
                isPlaying && currentBeat === idx
                  ? idx === 0
                    ? 'bg-emerald-500 scale-125 shadow-[0_0_12px_#10b981]'
                    : 'bg-cyan-500 scale-110 shadow-[0_0_8px_#06b6d4]'
                  : 'metronome-dot-inactive bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* BPM Stepper Controls */}
        <div className="flex items-center gap-3 my-2">
          <button
            onClick={() => setBpm((prev) => Math.max(30, prev - 5))}
            className="metronome-stepper w-11 h-11 rounded-2xl bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-700 shadow-sm active:scale-95 transition"
          >
            -5
          </button>
          <button
            onClick={() => setBpm((prev) => Math.max(30, prev - 1))}
            className="metronome-stepper w-11 h-11 rounded-2xl bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-700 shadow-sm active:scale-95 transition"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBpm((prev) => Math.min(280, prev + 1))}
            className="metronome-stepper w-11 h-11 rounded-2xl bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-700 shadow-sm active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBpm((prev) => Math.min(280, prev + 5))}
            className="metronome-stepper w-11 h-11 rounded-2xl bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center border border-slate-700 shadow-sm active:scale-95 transition"
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
          className="w-full accent-emerald-500 my-4 cursor-pointer"
        />

        {/* Bottom Actions: Tap Tempo & Play */}
        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          <button
            onClick={handleTapTempo}
            className="metronome-stepper py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-200 hover:bg-slate-700 active:scale-95 transition tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> TAP TEMPO
          </button>
          <button
            onClick={togglePlay}
            className={`py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> STOP
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> START
              </>
            )}
          </button>
        </div>

        {/* Time Signature Buttons */}
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold">TIME:</span>
          {[2, 3, 4, 6].map((num) => (
            <button
              key={num}
              onClick={() => {
                setBeatsPerMeasure(num);
                setCurrentBeat(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs transition ${
                beatsPerMeasure === num
                  ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                  : 'metronome-stepper bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-white'
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
          className={`w-full mt-4 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            isHapticEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800/40 border-slate-700/60 text-slate-500 hover:text-slate-300'
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
