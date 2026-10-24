import React, { useState, useEffect } from 'react';
import { 
  Flower2, 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Pause, 
  Sparkles, 
  Compass, 
  Clock, 
  Info,
  Waves
} from 'lucide-react';
import { RAGAS_DATABASE, Raga } from '../data/ragas';
import { tanpura } from '../audio/tanpuraEngine';
import { 
  speechService, 
  analyzeMoodAndMatchRaag, 
  getCurrentTimeContext, 
  RasaAnalysisResult 
} from '../services/rasaAI';

interface RasaViewProps {
  onBackToTuner?: () => void;
}

const SEMITONES_MAP: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const STRINGS_OPEN = [
  { stringNum: 1, openSemitone: 4, baseFreq: 329.63, name: 'e' }, // High E
  { stringNum: 2, openSemitone: 11, baseFreq: 246.94, name: 'B' }, // B
  { stringNum: 3, openSemitone: 7, baseFreq: 196.00, name: 'G' },  // G
  { stringNum: 4, openSemitone: 2, baseFreq: 146.83, name: 'D' },  // D
  { stringNum: 5, openSemitone: 9, baseFreq: 110.00, name: 'A' },  // A
  { stringNum: 6, openSemitone: 4, baseFreq: 82.41, name: 'E' },   // Low E
];

const INTERVAL_OFFSETS: Record<string, number[]> = {
  '1': [0],
  'b2': [1],
  '2': [2],
  'b3': [3],
  '3': [4],
  '4': [5],
  '#4': [6],
  '5': [7],
  'b6': [8],
  '6': [9],
  'b7': [10],
  '7': [11],
  'b7/7': [10, 11]
};

export const RasaView: React.FC<RasaViewProps> = () => {
  // State for user narrative
  const [userStory, setUserStory] = useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<RasaAnalysisResult>(() => 
    analyzeMoodAndMatchRaag('peaceful evening sunset unwind')
  );

  // Tanpura state
  const [isTanpuraPlaying, setIsTanpuraPlaying] = useState<boolean>(false);
  const [tanpuraStep, setTanpuraStep] = useState<number>(0);
  const [tanpuraKey, setTanpuraKey] = useState<string>('C');
  const [tanpuraVolume, setTanpuraVolume] = useState<number>(0.8);
  const [isRiffPlaying, setIsRiffPlaying] = useState<boolean>(false);

  // Time context
  const timeContext = getCurrentTimeContext();

  // Subscribe to Tanpura plucking cycles
  useEffect(() => {
    const unsubscribe = tanpura.subscribe((step, playing) => {
      setTanpuraStep(step);
      setIsTanpuraPlaying(playing);
    });
    return () => {
      unsubscribe();
      tanpura.stop();
    };
  }, []);

  // Update Tanpura configuration whenever key or matched raag changes
  useEffect(() => {
    tanpura.setConfig({
      rootKey: tanpuraKey,
      firstString: analysis.primaryRaga.tanpuraTuning,
      volume: tanpuraVolume
    });
  }, [tanpuraKey, analysis.primaryRaga, tanpuraVolume]);

  // Voice note handling
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      speechService.stop();
      setIsRecordingVoice(false);
      if (userStory.trim()) {
        const result = analyzeMoodAndMatchRaag(userStory);
        setAnalysis(result);
      }
    } else {
      setIsRecordingVoice(true);
      speechService.start(
        (transcript) => {
          setUserStory(transcript);
        },
        (err) => {
          console.warn('Speech recognition error:', err);
          setIsRecordingVoice(false);
        },
        () => {
          setIsRecordingVoice(false);
        }
      );
    }
  };

  const handleAnalyzeStory = (customText?: string) => {
    const textToAnalyze = customText || userStory;
    if (!textToAnalyze.trim()) return;
    const result = analyzeMoodAndMatchRaag(textToAnalyze);
    setAnalysis(result);
  };

  const handleSelectQuickChip = (chipText: string) => {
    setUserStory(chipText);
    handleAnalyzeStory(chipText);
  };

  const handleToggleTanpura = () => {
    tanpura.toggle();
  };

  const handlePlayRiff = () => {
    if (isRiffPlaying) return;
    setIsRiffPlaying(true);
    tanpura.playMagicRiff(
      analysis.primaryRaga.signatureRiff.frequenciesAtC,
      analysis.primaryRaga.signatureRiff.durations
    );
    const totalDuration = analysis.primaryRaga.signatureRiff.durations.reduce((a, b) => a + b, 0);
    setTimeout(() => {
      setIsRiffPlaying(false);
    }, (totalDuration + 0.5) * 1000);
  };

  const currentRaga = analysis.primaryRaga;

  // Calculate dynamic scale notes across all 12 frets based on selected root key
  const rootSemitone = SEMITONES_MAP[tanpuraKey] ?? 0;
  const scaleSemitones = new Set<number>();
  currentRaga.scaleIntervals.forEach((interval) => {
    const offsets = INTERVAL_OFFSETS[interval] || [0];
    offsets.forEach((off) => {
      scaleSemitones.add((rootSemitone + off) % 12);
    });
  });

  // Calculate soul note semitone offset
  let soulOffset = 4; // default Major 3rd
  if (currentRaga.soulNote.swara.includes('Gandhar')) {
    soulOffset = currentRaga.scaleIntervals.includes('b3') ? 3 : 4;
  } else if (currentRaga.soulNote.swara.includes('Madhyam')) {
    soulOffset = 5;
  } else if (currentRaga.soulNote.swara.includes('Pancham')) {
    soulOffset = 7;
  } else if (currentRaga.soulNote.swara.includes('Rishabh')) {
    soulOffset = 2;
  }
  const soulSemitone = (rootSemitone + soulOffset) % 12;

  // Generate complete 12-fret neck note mapping
  const fretboardNotes: {
    stringNum: number;
    fret: number;
    noteName: string;
    freq: number;
    isRoot: boolean;
    isSoul: boolean;
  }[] = [];

  STRINGS_OPEN.forEach((str) => {
    for (let fret = 0; fret <= 12; fret++) {
      const noteSemitone = (str.openSemitone + fret) % 12;
      if (scaleSemitones.has(noteSemitone)) {
        const noteName = CHROMATIC_NOTES[noteSemitone];
        const isRoot = noteSemitone === rootSemitone;
        const isSoul = noteSemitone === soulSemitone;
        const freq = str.baseFreq * Math.pow(2, fret / 12);
        fretboardNotes.push({
          stringNum: str.stringNum,
          fret,
          noteName,
          freq,
          isRoot,
          isSoul
        });
      }
    }
  });

  const handlePlayFretNote = (freq: number) => {
    tanpura.playMagicRiff([freq], [0.6]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-4 pb-24 select-none">
      
      {/* 1. Header with Sacred Lotus Icon & Time Prahar Alignment */}
      <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f15a24] to-amber-500 flex items-center justify-center text-white shadow-md">
            <Flower2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>RASA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f15a24]/15 text-[#f15a24] font-bold">
                SOUL & MOOD
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Demystified Raags for the Modern Guitarist
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1">
            <Clock className="w-3.5 h-3.5 text-[#f15a24]" />
            <span>{timeContext.period}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {timeContext.label}
          </div>
        </div>
      </div>

      {/* 2. "How are you feeling today?" Interactive Story Card */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold font-mono tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>HOW ARE YOU FEELING TODAY?</span>
          </label>
          <span className="text-[10px] font-mono text-[#f15a24] font-semibold">1-Tap Voice or Text</span>
        </div>

        {/* Text Area & Voice Input */}
        <div className="relative w-full">
          <textarea
            value={userStory}
            onChange={(e) => setUserStory(e.target.value)}
            placeholder="Tell us what happened today or how you feel... (e.g. 'Exhausting day at work, stuck in traffic in the rain, just want to decompress and play something peaceful...')"
            rows={3}
            className="w-full p-3.5 pr-14 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f15a24] transition resize-none leading-relaxed"
          />

          {/* Voice Note Button */}
          <button
            onClick={toggleVoiceRecording}
            className={`absolute right-2.5 bottom-3.5 p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center shadow-md ${
              isRecordingVoice
                ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                : 'bg-[#f15a24] text-white hover:bg-orange-600 shadow-[0_0_12px_rgba(241,90,36,0.35)]'
            }`}
            title={isRecordingVoice ? 'Recording... Tap to stop' : 'Tap to speak your thoughts'}
          >
            {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Mood Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
          <span className="text-slate-400 shrink-0 text-[10px] font-bold">QUICK:</span>
          <button
            onClick={() => handleSelectQuickChip('peaceful evening sunset unwind grateful')}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-[#f15a24] hover:border-[#f15a24]/40 transition shrink-0 cursor-pointer"
          >
            🧘 Peaceful Sunset
          </button>
          <button
            onClick={() => handleSelectQuickChip('exhausted tired stressed heavy heart solace burnout')}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-[#f15a24] hover:border-[#f15a24]/40 transition shrink-0 cursor-pointer"
          >
            🌧️ Heavy & Exhausted
          </button>
          <button
            onClick={() => handleSelectQuickChip('midnight insomnia overthinking dark quiet thoughts')}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-[#f15a24] hover:border-[#f15a24]/40 transition shrink-0 cursor-pointer"
          >
            🌌 Midnight Thoughts
          </button>
          <button
            onClick={() => handleSelectQuickChip('rain monsoon cozy blues coffee chill')}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-[#f15a24] hover:border-[#f15a24]/40 transition shrink-0 cursor-pointer"
          >
            ☕ Rainy Groove
          </button>
          <button
            onClick={() => handleSelectQuickChip('fresh start morning sun clarity optimistic bright')}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-[#f15a24] hover:border-[#f15a24]/40 transition shrink-0 cursor-pointer"
          >
            🌅 Morning Light
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleAnalyzeStory()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#f15a24] to-orange-500 hover:to-orange-600 text-white font-extrabold text-xs font-mono tracking-wider uppercase transition active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>FIND MY RAAG & TANPURA BED</span>
        </button>
      </div>

      {/* 3. Matched Raag Hero Card */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#f15a24]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-[#f15a24] font-extrabold tracking-wider mb-0.5">
              YOUR HARMONIC MATCH
            </div>
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {currentRaga.name}
              </h2>
              <span className="text-sm font-semibold text-slate-400 font-serif">
                {currentRaga.hindiName}
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
            {currentRaga.timeOfDay.split('(')[0]}
          </div>
        </div>

        {/* Empathetic Reflection */}
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-[#f15a24] pl-3 py-0.5">
          &ldquo;{analysis.empatheticReflection}&rdquo;
        </p>

        {/* Rasa Emotional Flavor Tag */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-white">EMOTIONAL RASA:</span>
          <span>{currentRaga.rasa}</span>
        </div>
      </div>

      {/* 4. Acoustic Tanpura Bed Engine (Miraj Sound Model) */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-[#f15a24]" />
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
              ACOUSTIC TANPURA BED (CONCERT MIRAJ JAVARI)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Key Selector Dropdown */}
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-500">
              <span>KEY:</span>
              <select
                value={tanpuraKey}
                onChange={(e) => setTanpuraKey(e.target.value)}
                className="bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-0.5 text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'A', 'Bb', 'B'].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 font-bold">
              {currentRaga.tanpuraTuning} Tuning
            </span>
          </div>
        </div>

        {/* 4 Animated Acoustic Tanpura Strings */}
        <div className="grid grid-cols-4 gap-2 py-2">
          {[
            { label: currentRaga.tanpuraTuning, desc: '1st String' },
            { label: 'Sa', desc: 'Jod Sa' },
            { label: 'Sa', desc: 'Jod Sa' },
            { label: 'Kharaj Sa', desc: 'Bass Sa' }
          ].map((str, idx) => {
            const isPlucking = isTanpuraPlaying && tanpuraStep === idx;
            return (
              <div
                key={idx}
                className={`py-2 px-1 rounded-xl text-center border transition-all duration-150 ${
                  isPlucking
                    ? 'bg-[#f15a24]/20 border-[#f15a24] text-[#f15a24] shadow-[0_0_12px_rgba(241,90,36,0.35)] scale-105'
                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="text-xs font-mono font-extrabold">{str.label}</div>
                <div className="text-[9px] font-mono opacity-70">{str.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Controls: Play/Pause and Master Volume */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <button
            onClick={handleToggleTanpura}
            className={`flex-1 py-3 px-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
              isTanpuraPlaying
                ? 'bg-slate-900 dark:bg-slate-800 text-rose-400 border border-rose-500/30 hover:bg-slate-800'
                : 'bg-gradient-to-r from-[#f15a24] to-orange-500 text-white font-black hover:brightness-110 shadow-[0_0_20px_rgba(241,90,36,0.35)]'
            }`}
          >
            {isTanpuraPlaying ? (
              <>
                <Pause className="w-4 h-4" /> PAUSE TANPURA DRONE
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> START TANPURA DRONE
              </>
            )}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0">
            <Volume2 className="w-3.5 h-3.5" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={tanpuraVolume}
              onChange={(e) => setTanpuraVolume(parseFloat(e.target.value))}
              className="w-20 accent-[#f15a24] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. The Guitarist's Demystified Formula Card */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
            THE GUITARIST&apos;S FORMULA
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/30">
            ANCHOR: {currentRaga.westernAnchor}
          </span>
        </div>

        {/* The Simple Twist Callout */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <strong className="font-extrabold block mb-0.5">The Simple Guitar Twist:</strong>
            {currentRaga.theSimpleTwist}
          </div>
        </div>

        {/* Rules: Ascending vs Descending */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
            <span className="text-[10px] font-bold text-[#f15a24] uppercase block">CLIMBING UP (AAROH):</span>
            <span className="text-slate-700 dark:text-slate-300">{currentRaga.ascendingRule}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">FALLING DOWN (AVROH):</span>
            <span className="text-slate-700 dark:text-slate-300">{currentRaga.descendingRule}</span>
          </div>
        </div>

        {/* Soul Note (Vadi) */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
              THE SOUL NOTE (VADI SWARA):
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              {currentRaga.soulNote.note} ({currentRaga.soulNote.swara})
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
              {currentRaga.soulNote.description}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-sm shadow-inner">
            {currentRaga.soulNote.note}
          </div>
        </div>
      </div>

      {/* 6. The 3-Note Magic Riff (Pakad) */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
          <div>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase block">
              3-NOTE MAGIC RIFF (PAKAD)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {currentRaga.signatureRiff.title}
            </span>
          </div>

          <button
            onClick={handlePlayRiff}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isRiffPlaying
                ? 'bg-emerald-500 text-black animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-[#f15a24] border border-slate-200 dark:border-white/10'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isRiffPlaying ? 'PLAYING RIFF...' : 'HEAR MAGIC RIFF'}</span>
          </button>
        </div>

        {/* Tablature Display Box */}
        <div className="w-full p-3 rounded-2xl bg-slate-900 dark:bg-slate-950 font-mono text-emerald-400 text-xs sm:text-sm overflow-x-auto shadow-inner leading-relaxed">
          {currentRaga.signatureRiff.tabDisplay.map((line, idx) => (
            <div key={idx} className="whitespace-pre">
              {line}
            </div>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 italic">
          💡 <strong>Guitar Tip:</strong> {currentRaga.signatureRiff.guitarTip}
        </div>
      </div>

      {/* 7. FULL 12-FRET INTERACTIVE GUITAR FRETBOARD (Zero Wobble, Complete Scale Map) */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/[0.08]">
          <div>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase block">
              FULL 12-FRET GUITAR FRETBOARD
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Root Key: {tanpuraKey} • Tap any note to play
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f15a24] inline-block" /> Root (Sa)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Soul Note (Vadi)
            </span>
          </div>
        </div>

        {/* Fretboard SVG (Full 12 Frets across all 6 strings) */}
        <div className="w-full overflow-x-auto py-2 scrollbar-thin">
          <svg viewBox="0 0 710 145" className="w-full min-w-[660px] max-w-full select-none">
            {/* Wooden Fretboard base */}
            <rect x="25" y="10" width="675" height="115" rx="6" fill="#1e293b" opacity="0.12" />

            {/* Nut Bar */}
            <line x1="38" y1="10" x2="38" y2="125" stroke="#94a3b8" strokeWidth="5" />

            {/* 12 Fret Wires */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((fret) => {
              const x = 38 + fret * 52;
              return (
                <g key={fret}>
                  <line x1={x} y1="10" x2={x} y2="125" stroke="#cbd5e1" strokeWidth="1.5" strokeOpacity="0.4" />
                  <text x={x - 26} y="138" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    {fret}
                  </text>
                  {/* Classical Inlay Marker Dots (3, 5, 7, 9, double at 12) */}
                  {[3, 5, 7, 9].includes(fret) && (
                    <circle cx={x - 26} cy="67.5" r="3.5" fill="#94a3b8" opacity="0.25" />
                  )}
                  {fret === 12 && (
                    <>
                      <circle cx={x - 26} cy="45" r="3" fill="#94a3b8" opacity="0.25" />
                      <circle cx={x - 26} cy="90" r="3" fill="#94a3b8" opacity="0.25" />
                    </>
                  )}
                </g>
              );
            })}

            {/* 6 Guitar Strings (1=High e to 6=Low E) */}
            {[1, 2, 3, 4, 5, 6].map((str) => {
              const y = 17 + (str - 1) * 20;
              const width = 2.6 - (str - 1) * 0.35;
              return (
                <line
                  key={str}
                  x1="38"
                  y1={y}
                  x2="695"
                  y2={y}
                  stroke="#94a3b8"
                  strokeWidth={width}
                  strokeOpacity="0.55"
                />
              );
            })}

            {/* Dynamic Scale Note Badges Across the Entire 12 Frets */}
            {fretboardNotes.map((pos, idx) => {
              const y = 17 + (pos.stringNum - 1) * 20;
              const x = pos.fret === 0 ? 25 : 38 + pos.fret * 52 - 26;
              const isRoot = pos.isRoot;
              const isSoul = pos.isSoul;

              const badgeFill = isRoot ? '#f15a24' : isSoul ? '#10b981' : '#38bdf8';

              return (
                <g 
                  key={idx} 
                  onClick={() => handlePlayFretNote(pos.freq)}
                  className="cursor-pointer group"
                >
                  {/* Clean stationary halo ring for Soul Note (Zero erratic spinning) */}
                  {isSoul && (
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="11" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2" 
                      strokeDasharray="3 2"
                      opacity="0.85"
                    />
                  )}
                  {isRoot && (
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="10.5" 
                      fill="none" 
                      stroke="#f15a24" 
                      strokeWidth="1.5" 
                      opacity="0.7"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isRoot || isSoul ? 8.5 : 7}
                    fill={badgeFill}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    className="group-hover:scale-110 transition-transform"
                  />
                  <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={isRoot || isSoul ? "8.5" : "7.5"}
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {pos.noteName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

    </div>
  );
};
