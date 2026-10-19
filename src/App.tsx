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
  Search
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

export const App: React.FC = () => {
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

  // Modals
  const [isMetronomeOpen, setIsMetronomeOpen] = useState<boolean>(false);
  const [isChordsOpen, setIsChordsOpen] = useState<boolean>(false);
  const [isTuningModalOpen, setIsTuningModalOpen] = useState<boolean>(false);
  const [isSongSearchOpen, setIsSongSearchOpen] = useState<boolean>(false);

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

    // Volume calculation
    const vol = getRMSVolume(buffer);
    setRmsVolume(vol);

    // Noise gate threshold: ignore quiet room murmur
    if (vol > 0.012) {
      const result = detectPitchMPM(buffer, sampleRate, 30, 1200, 0.82);
      if (result) {
        const { frequency, clarity } = result;
        setDetectedFreq(frequency);
        setDetectedClarity(clarity);

        if (isAutoMode) {
          // Find the string in the current tuning that is closest to this frequency
          let closestIndex = 0;
          let minCentsDiff = 9999;

          currentTuning.strings.forEach((str, idx) => {
            const cents = Math.abs(calculateCents(frequency, str.targetFreq));
            if (cents < minCentsDiff) {
              minCentsDiff = cents;
              closestIndex = idx;
            }
          });

          // If within reasonable range of a guitar string (e.g. 180 cents), lock to that string
          if (minCentsDiff < 180) {
            setActiveStringIndex(closestIndex);
            const target = currentTuning.strings[closestIndex];
            setTargetFreq(target.targetFreq);
            setDetectedNote(target.note);
            setDetectedOctave(target.octave);
            const cents = calculateCents(frequency, target.targetFreq);
            setCentsOffset(cents);

            // In-tune chime trigger
            if (Math.abs(cents) <= 2.0 && clarity > 0.85) {
              inTuneDurationRef.current += 1;
              const now = performance.now();
              if (inTuneDurationRef.current > 12 && now - lastChimeTimeRef.current > 2500) {
                playInTuneChime();
                lastChimeTimeRef.current = now;
              }
            } else {
              inTuneDurationRef.current = 0;
            }
          } else {
            // General chromatic note fallback
            const chromatic = frequencyToNote(frequency, referenceA4);
            setDetectedNote(chromatic.noteName);
            setDetectedOctave(chromatic.octave);
            setTargetFreq(chromatic.targetFreq);
            setCentsOffset(chromatic.cents);
          }
        } else {
          // Manual Locked String Mode
          const target = currentTuning.strings[activeStringIndex];
          setTargetFreq(target.targetFreq);
          setDetectedNote(target.note);
          setDetectedOctave(target.octave);
          const cents = calculateCents(frequency, target.targetFreq);
          setCentsOffset(cents);

          if (Math.abs(cents) <= 2.0 && clarity > 0.85) {
            inTuneDurationRef.current += 1;
            const now = performance.now();
            if (inTuneDurationRef.current > 12 && now - lastChimeTimeRef.current > 2500) {
              playInTuneChime();
              lastChimeTimeRef.current = now;
            }
          } else {
            inTuneDurationRef.current = 0;
          }
        }
      }
    } else {
      // Quiet silence decay
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

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <span className="text-sm">🎸</span>
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                <span>AuraTuner</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                A4 = {referenceA4}Hz • 0.1¢ PRECISION
              </div>
            </div>
          </div>

          {/* Mode Switcher (Studio vs Peterson Strobe) */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setTunerMode('studio')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                tunerMode === 'studio'
                  ? 'bg-emerald-500 text-black shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> STUDIO
            </button>
            <button
              onClick={() => setTunerMode('strobe')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                tunerMode === 'strobe'
                  ? 'bg-cyan-500 text-black shadow-sm font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> STROBE (0.1¢)
            </button>
          </div>
        </div>
      </header>

      {/* Main Tuner Body */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 flex flex-col items-center justify-between">
        {/* Tuning Selector Header Bar */}
        <div className="w-full flex items-center justify-between gap-3 mb-2">
          {/* Tuning Dropdown Trigger */}
          <button
            onClick={() => setIsTuningModalOpen(true)}
            className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group cursor-pointer"
          >
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">CURRENT PRESET</span>
              <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                {currentTuning.name}
              </span>
            </div>
            <SlidersHorizontal className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          {/* Quick Song Search Button */}
          <button
            onClick={() => setIsSongSearchOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition flex items-center justify-center cursor-pointer"
            title="Search Songs & Chords"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Auto vs Lock Mode Toggle */}
          <button
            onClick={() => setIsAutoMode(!isAutoMode)}
            className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isAutoMode
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isAutoMode ? 'Auto String Detection Active' : 'Manual String Locked'}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isAutoMode ? 'AUTO' : 'LOCK'}</span>
          </button>
        </div>

        {/* Mic Permission Warning / Notification */}
        {micError && (
          <div className="w-full p-3 my-2 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{micError}. Please allow microphone access in your browser to tune!</span>
          </div>
        )}

        {/* Center Display: Studio Headstock OR Peterson Strobe */}
        <div className="w-full flex-1 flex flex-col items-center justify-center py-2">
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
        <div className="w-full flex flex-col items-center gap-3 my-3">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-full max-w-sm py-3.5 rounded-2xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer shadow-xl ${
              isListening
                ? 'bg-slate-800/90 text-rose-400 border border-rose-500/30 hover:bg-slate-800'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" /> STOP TUNER
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" /> START TUNER (MIC)
              </>
            )}
          </button>

          {/* Real-time volume signal visualizer bar */}
          {isListening && (
            <div className="w-full max-w-sm flex items-center gap-2 px-2 text-[10px] text-slate-500 font-mono">
              <span>INPUT</span>
              <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, rmsVolume * 600)}%` }}
                />
              </div>
              <span>{Math.round(rmsVolume * 100)}%</span>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Musician Toolbar */}
      <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur-md px-3 py-3">
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-1.5">
          {/* Songs & Tabs Searcher */}
          <button
            onClick={() => setIsSongSearchOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer group"
          >
            <Music className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-emerald-400 mt-1">
              Songs
            </span>
          </button>

          {/* Metronome Button */}
          <button
            onClick={() => setIsMetronomeOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer group"
          >
            <Clock className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white mt-1">
              Metronome
            </span>
          </button>

          {/* Chords Library Button */}
          <button
            onClick={() => setIsChordsOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer group"
          >
            <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white mt-1">
              Chords
            </span>
          </button>

          {/* Play Target Pitch Reference */}
          <button
            onClick={() => {
              if (targetFreq) handlePlayActiveString(targetFreq);
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer group"
          >
            <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white mt-1">
              Play Tone
            </span>
          </button>

          {/* Tuning Presets Button */}
          <button
            onClick={() => setIsTuningModalOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer group"
          >
            <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white mt-1">
              Tunings
            </span>
          </button>
        </div>
      </footer>

      {/* Modals */}
      <SongSearchModal
        isOpen={isSongSearchOpen}
        onClose={() => setIsSongSearchOpen(false)}
        onOpenChordInfo={() => setIsChordsOpen(true)}
      />

      <MetronomeModal
        isOpen={isMetronomeOpen}
        onClose={() => setIsMetronomeOpen(false)}
      />

      <ChordLibraryModal
        isOpen={isChordsOpen}
        onClose={() => setIsChordsOpen(false)}
      />

      <TuningModal
        isOpen={isTuningModalOpen}
        onClose={() => setIsTuningModalOpen(false)}
        currentTuning={currentTuning}
        onSelectTuning={handleSelectTuning}
        referenceA4={referenceA4}
        onSetReferenceA4={setReferenceA4}
      />
    </div>
  );
};
