import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Pause, 
  Clock, 
  Info,
  Waves,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Compass,
  Check,
  Music
} from 'lucide-react';
import { 
  RAGAS_DATABASE, 
  Raga,
  CHROMATIC_NOTES, 
  SEMITONES_MAP,
  getTransposedNotes,
  getTransposedAscendingNotes,
  getTransposedDescendingNotes,
  getTransposedTwist,
  getTransposedSoulNote,
  getTransposedRiffTab,
  getTransposedRiffFrequencies
} from '../data/ragas';
import { tanpura } from '../audio/tanpuraEngine';
import { 
  speechService, 
  analyzeMoodAndMatchRaag, 
  getCurrentTimeContext, 
  getRagasForCurrentTime,
  RasaAnalysisResult 
} from '../services/rasaAI';

interface RasaViewProps {
  onBackToTuner?: () => void;
}

const STRINGS_OPEN = [
  { stringNum: 1, openSemitone: 4, baseFreq: 329.63, name: 'e' }, // High E
  { stringNum: 2, openSemitone: 11, baseFreq: 246.94, name: 'B' }, // B
  { stringNum: 3, openSemitone: 7, baseFreq: 196.00, name: 'G' },  // G
  { stringNum: 4, openSemitone: 2, baseFreq: 146.83, name: 'D' },  // D
  { stringNum: 5, openSemitone: 9, baseFreq: 110.00, name: 'A' },  // A
  { stringNum: 6, openSemitone: 4, baseFreq: 82.41, name: 'E' },   // Low E
];

const ALL_CURATED_MOODS = [
  { 
    label: '🧘 Peaceful Sunset', 
    sentence: 'Feeling peaceful and serene, unwinding after a long day and taking in the sunset.',
    keywords: 'peaceful evening sunset unwind grateful serene calm' 
  },
  { 
    label: '🌧️ Heavy & Exhausted', 
    sentence: 'Feeling heavy and emotionally exhausted, looking for solace and rest.',
    keywords: 'exhausted tired stressed heavy heart solace burnout' 
  },
  { 
    label: '🌌 Midnight Thoughts', 
    sentence: 'Quiet midnight thoughts, feeling deep, existential, and reflective.',
    keywords: 'midnight insomnia overthinking dark quiet thoughts deep' 
  },
  { 
    label: '☕ Rainy Groove', 
    sentence: 'Cozy rainy day mood, listening to the rain with a warm cup of coffee.',
    keywords: 'rain monsoon cozy blues coffee chill groove creative' 
  },
  { 
    label: '🌅 Morning Awakening', 
    sentence: 'Fresh morning energy, feeling optimistic, bright, and clear.',
    keywords: 'fresh start morning sun clarity optimistic bright awakening' 
  },
  { 
    label: '💖 Sweet Romance', 
    sentence: 'Warm, romantic and nostalgic, reminiscing by candlelight.',
    keywords: 'warm flirtatious romantic sweet crush nostalgia candlelight' 
  },
  { 
    label: '🌀 Deep Meditation', 
    sentence: 'Seeking deep inner stillness, meditation, and spiritual grounding.',
    keywords: 'meditation trance silence spiritual mystic intense focus' 
  },
  { 
    label: '🦁 Triumphant & Bold', 
    sentence: 'Feeling inspired, victorious, confident, and full of energy.',
    keywords: 'confident inspired victorious triumphant energy clear light' 
  },
  { 
    label: '🕊️ Solace & Letting Go', 
    sentence: 'Letting go of heartache, finding bittersweet peace and quiet acceptance.',
    keywords: 'letting go bittersweet acceptance heartache healing peace' 
  },
  { 
    label: '🍂 Nostalgic Reminiscing', 
    sentence: 'Thinking about old memories, simpler days, and sweet longing.',
    keywords: 'nostalgia old memories reminiscing simpler days college longing' 
  },
  { 
    label: '⚡ Work Burnout Relief', 
    sentence: 'Relieving screen fatigue and work pressure, needing to disconnect.',
    keywords: 'burnout screens all day pressure fatigue release disconnect' 
  },
  { 
    label: '🛋️ Cozy & Unwinding', 
    sentence: 'Cozy evening unwinding, resting warmly and letting thoughts quiet down.',
    keywords: 'cozy tea evening warm room quiet relax soft' 
  },
];

export const RasaView: React.FC<RasaViewProps> = () => {
  // Time context & Curated Raags for the current hour
  const timeContext = getCurrentTimeContext();
  const timeMatchedRagas = getRagasForCurrentTime(timeContext.hour);

  // Default matched raag based on current time of day
  const defaultRaga = timeMatchedRagas[0] || RAGAS_DATABASE[0];

  // User narrative & mood analysis state
  const [userStory, setUserStory] = useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [showAllMoods, setShowAllMoods] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<RasaAnalysisResult>(() => ({
    primaryRaga: defaultRaga,
    secondaryRaga: timeMatchedRagas[1] || RAGAS_DATABASE[1],
    suggestedRagas: timeMatchedRagas.slice(0, 3).length >= 2 ? timeMatchedRagas.slice(0, 3) : RAGAS_DATABASE.slice(0, 3),
    detectedEmotion: defaultRaga.rasa,
    detectedKeywords: ['time-of-day alignment'],
    empatheticReflection: defaultRaga.poeticReflection,
    timeContext: `${timeContext.label} (${timeContext.period})`,
    userPromptPreview: 'Aligned with current time of day'
  }));

  // Global Root Key state (defaults to C, user can select any key: C, D, E, G, A, etc.)
  const [tanpuraKey, setTanpuraKey] = useState<string>('C');

  // Tanpura state
  const [isTanpuraPlaying, setIsTanpuraPlaying] = useState<boolean>(false);
  const [tanpuraStep, setTanpuraStep] = useState<number>(0);
  const [tanpuraVolume, setTanpuraVolume] = useState<number>(0.8);
  const [isRiffPlaying, setIsRiffPlaying] = useState<boolean>(false);

  // Subscribe to Tanpura cycles
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

  // Sync Tanpura tuning whenever Key or Matched Raag changes
  useEffect(() => {
    tanpura.setConfig({
      rootKey: tanpuraKey,
      firstString: analysis.primaryRaga.tanpuraTuning,
      volume: tanpuraVolume
    });
  }, [tanpuraKey, analysis.primaryRaga, tanpuraVolume]);

  // Voice recording logic with non-destructive transcription
  const handleToggleVoiceRecording = () => {
    if (!speechService.isSupported()) {
      alert('Speech recognition is not supported in this browser. Please type your thoughts.');
      return;
    }

    if (isRecordingVoice) {
      speechService.stop();
      setIsRecordingVoice(false);
    } else {
      setIsRecordingVoice(true);
      const existing = userStory.trim();
      speechService.start(
        existing,
        (accumulatedText: string) => {
          setUserStory(accumulatedText);
        },
        undefined,
        () => {
          setIsRecordingVoice(false);
        }
      );
    }
  };

  // Analyze the accumulated story/text when user explicitly clicks the button
  const handleAnalyzeStory = (overrideText?: string) => {
    if (isRecordingVoice) {
      speechService.stop();
      setIsRecordingVoice(false);
    }

    const textToAnalyze = overrideText !== undefined ? overrideText : userStory;
    const result = analyzeMoodAndMatchRaag(textToAnalyze);
    setAnalysis(result);

    // Tanpura automatically matches tuning
    tanpura.setConfig({
      rootKey: tanpuraKey,
      firstString: result.primaryRaga.tanpuraTuning
    });
  };

  // Direct Raag selection
  const handleSelectRaagDirectly = (selectedRaga: Raga) => {
    setAnalysis((prev) => ({
      ...prev,
      primaryRaga: selectedRaga,
      detectedEmotion: selectedRaga.rasa,
      detectedKeywords: ['Selected: ' + selectedRaga.name],
      empatheticReflection: selectedRaga.poeticReflection
    }));

    tanpura.setConfig({
      rootKey: tanpuraKey,
      firstString: selectedRaga.tanpuraTuning
    });
  };

  const handleSelectQuickChip = (mood: typeof ALL_CURATED_MOODS[0]) => {
    setUserStory(mood.sentence);
    handleAnalyzeStory(mood.keywords);
  };

  const handleToggleTanpura = () => {
    tanpura.toggle();
  };

  const currentRaga = analysis.primaryRaga;

  // Transposed helpers for current key
  const transposedNotes = getTransposedNotes(currentRaga, tanpuraKey);
  const transposedAscendingNotes = getTransposedAscendingNotes(currentRaga, tanpuraKey);
  const transposedDescendingNotes = getTransposedDescendingNotes(currentRaga, tanpuraKey);
  const transposedTwist = getTransposedTwist(currentRaga, tanpuraKey);
  const transposedSoulNote = getTransposedSoulNote(currentRaga, tanpuraKey);
  const transposedTab = getTransposedRiffTab(currentRaga, tanpuraKey);
  const transposedRiffFreqs = getTransposedRiffFrequencies(currentRaga, tanpuraKey);

  const handlePlayRiff = () => {
    setIsRiffPlaying(true);
    tanpura.playMagicRiff(
      transposedRiffFreqs,
      currentRaga.signatureRiff.durations
    );
    const totalDuration = currentRaga.signatureRiff.durations.reduce((a, b) => a + b, 0);
    setTimeout(() => {
      setIsRiffPlaying(false);
    }, totalDuration * 1000 + 400);
  };

  // Calculate dynamic scale notes across all 12 frets based on selected root key
  const rootSemitone = SEMITONES_MAP[tanpuraKey] ?? 0;
  const scaleSemitones = new Set<number>();
  currentRaga.scaleIntervalOffsets.forEach((off) => {
    scaleSemitones.add((rootSemitone + off) % 12);
  });

  const soulSemitone = (rootSemitone + currentRaga.soulNoteOffset) % 12;

  // Generate complete 12-fret neck note mapping (proportional spacing to fit container perfectly)
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
      
      {/* 1. Header with Time Prahar Alignment */}
      <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f15a24] to-amber-500 flex items-center justify-center text-white shadow-md">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>RASA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f15a24]/15 text-[#f15a24] font-bold">
                SOUL & MOOD
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Demystified Raags for Any Guitar Key
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

      {/* 2. PROMINENT ROOT KEY SELECTOR (Sa) */}
      <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-[#f15a24]" />
            <span className="text-xs font-mono font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              SELECT ROOT KEY (SA):
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#f15a24]">
            Active Key: {tanpuraKey} (Sa = {tanpuraKey})
          </span>
        </div>

        {/* 12 Chromatic Root Buttons */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
          {CHROMATIC_NOTES.map((key) => {
            const isSelected = tanpuraKey === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setTanpuraKey(key);
                  tanpura.setConfig({ rootKey: key });
                }}
                className={`py-1.5 sm:py-2 rounded-xl text-xs font-mono font-black transition-all cursor-pointer flex flex-col items-center justify-center border ${
                  isSelected
                    ? 'bg-[#f15a24] text-white border-[#f15a24] shadow-[0_0_12px_rgba(241,90,36,0.35)] scale-105'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-[#f15a24]/40 hover:text-[#f15a24]'
                }`}
              >
                <span>{key}</span>
                <span className="text-[8px] opacity-75 font-normal">Sa</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RAGAS FOR THIS HOUR (Direct 1-Tap Selection to Skip Story Step) */}
      <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f15a24]" />
            <span>RAAGS FOR THIS HOUR ({timeContext.label.split('&')[0]}):</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">Tap to play directly</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {timeMatchedRagas.map((raga) => {
            const isSelected = currentRaga.id === raga.id;
            return (
              <button
                key={raga.id}
                onClick={() => handleSelectRaagDirectly(raga)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-[#f15a24] text-white border-[#f15a24] shadow-md font-extrabold'
                    : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                }`}
              >
                <span>{raga.name}</span>
                <span className="text-[10px] opacity-80 font-serif">({raga.hindiName})</span>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. "How are you feeling today?" Interactive Story Card */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold font-mono tracking-wider uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span>OR TELL US: HOW ARE YOU FEELING TODAY?</span>
          </label>
          <span className="text-[10px] font-mono text-[#f15a24] font-semibold">1-Tap Voice or Text</span>
        </div>

        {/* Text Area & Voice Input */}
        <div className="relative w-full">
          <textarea
            value={userStory}
            onChange={(e) => setUserStory(e.target.value)}
            placeholder="Tell us what happened today or how you feel... Speak freely as much as you want. When you're finished, tap 'Find My Raag' below."
            rows={3}
            className="w-full p-3.5 pr-14 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#f15a24] transition resize-none leading-relaxed"
          />

          <button
            onClick={handleToggleVoiceRecording}
            className={`absolute right-3 bottom-3 p-2 rounded-xl transition cursor-pointer shadow-sm ${
              isRecordingVoice
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-[#f15a24]'
            }`}
            title={isRecordingVoice ? 'Recording... Tap to stop speaking' : 'Tap to speak your thoughts'}
          >
            {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {isRecordingVoice && (
          <div className="flex items-center gap-2 text-xs font-mono text-rose-500 animate-pulse px-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Listening... Speak freely. Words will accumulate here. Tap mic again when finished.</span>
          </div>
        )}

        {/* Pinned Quick Moods Row with Always-Visible "Explore More Moods" Button */}
        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-mono">
          <span className="text-slate-400 shrink-0 text-[10px] font-bold uppercase">
            QUICK MOODS:
          </span>
          <button
            onClick={() => setShowAllMoods(!showAllMoods)}
            className="px-2.5 py-1 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#f15a24] font-bold border border-[#f15a24]/30 transition shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>{showAllMoods ? 'Hide Moods' : 'Explore All 12 Moods'}</span>
            {showAllMoods ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Horizontal Chips Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
          {ALL_CURATED_MOODS.map((m, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectQuickChip(m)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-[#f15a24] hover:border-[#f15a24]/40 transition shrink-0 cursor-pointer"
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Expanded Moods Drawer */}
        {showAllMoods && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-xs font-mono">
            {ALL_CURATED_MOODS.map((m, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectQuickChip(m)}
                className="py-1.5 px-2 rounded-xl text-left bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:text-[#f15a24] hover:border-[#f15a24]/40 transition truncate cursor-pointer"
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Action Button: Analyses at the end */}
        <button
          onClick={() => handleAnalyzeStory()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#f15a24] to-orange-500 hover:to-orange-600 text-white font-extrabold text-xs font-mono tracking-wider uppercase transition active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          <span>FIND MY RAAG & TANPURA BED</span>
        </button>
      </div>

      {/* 5. SUGGESTED RAAGS FOR YOUR MOOD (Multiple Raga Suggestions) */}
      <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#f15a24]" />
            <span className="text-xs font-mono font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              SUGGESTED RAAGS FOR YOUR MOOD ({analysis.suggestedRagas.length}):
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Tap to switch active raag
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {analysis.suggestedRagas.map((raga, idx) => {
            const isSelected = currentRaga.id === raga.id;
            const badgeLabel = idx === 0 ? 'Primary Match' : idx === 1 ? 'Alternative Mood' : 'Harmonic Solace';
            return (
              <button
                key={raga.id}
                onClick={() => handleSelectRaagDirectly(raga)}
                className={`p-3 rounded-2xl text-left border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#f15a24]/10 border-[#f15a24] shadow-[0_0_15px_rgba(241,90,36,0.25)]'
                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                    idx === 0 
                      ? 'bg-[#f15a24] text-white' 
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}>
                    {badgeLabel}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#f15a24]" />}
                </div>

                <div className="mt-2">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {raga.name}
                  </div>
                  <div className="text-[11px] font-serif text-slate-400">
                    {raga.hindiName}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {raga.rasa.split('&')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Current Active Raag Hero Card */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#f15a24]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-[#f15a24] font-extrabold tracking-wider mb-0.5">
              CURRENT ACTIVE RAAG
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

      {/* 7. Acoustic Tanpura Bed Engine (Miraj Sound Model - Real Acoustic Recordings) */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-[#f15a24]" />
            <div>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase block">
                ACOUSTIC TANPURA BED (CONCERT MIRAJ)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Authentic pumpkin gourd & silk Javari buzz (matching Tanpura Droid)
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f15a24]/15 text-[#f15a24] font-bold">
            {tanpuraKey} • {currentRaga.tanpuraTuning} Tuning
          </span>
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
                <Play className="w-4 h-4 fill-white" /> START TANPURA DRONE ({tanpuraKey})
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

      {/* 8. The Guitarist's Demystified Formula Card with Western Roman Degrees */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
            THE GUITARIST&apos;S FORMULA
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/30">
            ROOT: {tanpuraKey} (Sa = {tanpuraKey})
          </span>
        </div>

        {/* Dynamic Scale Name & Notes with Roman Degrees */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">WESTERN SCALE:</span>
            <span className="font-extrabold text-[#f15a24]">
              {tanpuraKey} {currentRaga.westernScaleName}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-white/[0.04]">
            <span className="text-[10px] uppercase font-bold text-slate-400">SCALE NOTES ({tanpuraKey}):</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 tracking-wider">
              {transposedNotes.join(' • ')}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-white/[0.04]">
            <span className="text-[10px] uppercase font-bold text-slate-400">WESTERN ROMAN DEGREES:</span>
            <span className="font-bold text-[#f15a24] tracking-wider">
              {currentRaga.scaleRoman.join(' • ')}
            </span>
          </div>
        </div>

        {/* The Simple Twist Callout */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <strong className="font-extrabold block mb-0.5">The Simple Guitar Twist:</strong>
            {transposedTwist}
          </div>
        </div>

        {/* Rules: Ascending vs Descending with Actual Western Notes in Selected Key */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] font-bold text-[#f15a24] uppercase block tracking-wider">
                CLIMBING UP (AAROH IN {tanpuraKey}):
              </span>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-wider my-1">
                {transposedAscendingNotes.join(' → ')}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {currentRaga.ascendingRule}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[9px] uppercase font-bold text-slate-400">WESTERN ROMAN:</span>
              <span className="font-bold text-[#f15a24] tracking-wider">{currentRaga.ascendingRoman}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block tracking-wider">
                FALLING DOWN (AVROH IN {tanpuraKey}):
              </span>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-wider my-1">
                {transposedDescendingNotes.join(' → ')}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {currentRaga.descendingRule}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[9px] uppercase font-bold text-slate-400">WESTERN ROMAN:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">{currentRaga.descendingRoman}</span>
            </div>
          </div>
        </div>

        {/* Soul Note (Vadi) dynamically transposed */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
              THE SOUL NOTE (VADI SWARA IN {tanpuraKey}):
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              {transposedSoulNote.note} ({transposedSoulNote.swara})
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
              {transposedSoulNote.description}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-sm shadow-inner shrink-0">
            {transposedSoulNote.note}
          </div>
        </div>
      </div>

      {/* 9. The 3-Note Magic Riff (Pakad) - Dynamically Transposed for Selected Key */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
                3-NOTE MAGIC RIFF (PAKAD)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f15a24]/15 text-[#f15a24] font-extrabold">
                IN {tanpuraKey}
              </span>
            </div>
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
            <span>{isRiffPlaying ? `PLAYING IN ${tanpuraKey}...` : `HEAR RIFF IN ${tanpuraKey}`}</span>
          </button>
        </div>

        {/* Tablature Display Box (Transposed to Selected Key) */}
        <div className="w-full p-3 rounded-2xl bg-slate-900 dark:bg-slate-950 font-mono text-emerald-400 text-xs sm:text-sm overflow-x-auto shadow-inner leading-relaxed">
          {transposedTab.map((line, idx) => (
            <div key={idx} className="whitespace-pre">
              {line}
            </div>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 italic">
          💡 <strong>Guitar Tip:</strong> {currentRaga.signatureRiff.guitarTip}
        </div>
      </div>

      {/* 10. FULL 12-FRET INTERACTIVE GUITAR FRETBOARD (Zero Scrollbar - Fits 100% Seamlessly) */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/[0.08]">
          <div>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase block">
              FULL 12-FRET GUITAR FRETBOARD
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Root Key: {tanpuraKey} (Sa = {tanpuraKey}) • Tap any note to play
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f15a24] inline-block" /> Root ({tanpuraKey})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Soul Note ({transposedSoulNote.note})
            </span>
          </div>
        </div>

        {/* Fretboard SVG: Scales seamlessly inside the card with ZERO horizontal scrollbar */}
        <div className="w-full py-1">
          <svg 
            viewBox="0 0 635 142" 
            className="w-full h-auto select-none block overflow-visible"
          >
            {/* Wooden Fretboard base */}
            <rect x="18" y="10" width="606" height="114" rx="6" fill="#1e293b" opacity="0.12" />

            {/* Nut Bar */}
            <line x1="32" y1="10" x2="32" y2="124" stroke="#94a3b8" strokeWidth="4.5" />

            {/* 12 Fret Wires */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((fret) => {
              const x = 32 + fret * 48;
              return (
                <g key={fret}>
                  <line x1={x} y1="10" x2={x} y2="124" stroke="#cbd5e1" strokeWidth="1.2" strokeOpacity="0.4" />
                  <text x={x - 24} y="136" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    {fret}
                  </text>
                  {/* Classical Inlay Marker Dots (3, 5, 7, 9, double at 12) */}
                  {[3, 5, 7, 9].includes(fret) && (
                    <circle cx={x - 24} cy="67" r="3.2" fill="#94a3b8" opacity="0.25" />
                  )}
                  {fret === 12 && (
                    <>
                      <circle cx={x - 24} cy="45" r="2.8" fill="#94a3b8" opacity="0.25" />
                      <circle cx={x - 24} cy="89" r="2.8" fill="#94a3b8" opacity="0.25" />
                    </>
                  )}
                </g>
              );
            })}

            {/* 6 Guitar Strings (1=High e to 6=Low E) */}
            {[1, 2, 3, 4, 5, 6].map((str) => {
              const y = 17 + (str - 1) * 20;
              const width = 2.4 - (str - 1) * 0.32;
              return (
                <line
                  key={str}
                  x1="32"
                  y1={y}
                  x2="618"
                  y2={y}
                  stroke="#94a3b8"
                  strokeWidth={width}
                  strokeOpacity="0.55"
                />
              );
            })}

            {/* Dynamic Scale Note Badges Across the Entire 12 Frets in Selected Key */}
            {fretboardNotes.map((pos, idx) => {
              const y = 17 + (pos.stringNum - 1) * 20;
              const x = pos.fret === 0 ? 20 : 32 + pos.fret * 48 - 24;
              const isRoot = pos.isRoot;
              const isSoul = pos.isSoul;

              const badgeFill = isRoot ? '#f15a24' : isSoul ? '#10b981' : '#38bdf8';

              return (
                <g 
                  key={idx} 
                  onClick={() => handlePlayFretNote(pos.freq)}
                  className="cursor-pointer group"
                >
                  {/* Stationary halo ring for Soul Note (Zero wobble) */}
                  {isSoul && (
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="10.5" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="1.8" 
                      strokeDasharray="3 2"
                      opacity="0.9"
                    />
                  )}
                  {isRoot && (
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="10" 
                      fill="none" 
                      stroke="#f15a24" 
                      strokeWidth="1.5" 
                      opacity="0.8"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isRoot || isSoul ? 8 : 6.8}
                    fill={badgeFill}
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="group-hover:scale-110 transition-transform"
                  />
                  <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={isRoot || isSoul ? "8" : "7"}
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
