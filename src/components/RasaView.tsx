import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  Compass, 
  Sun, 
  Moon, 
  Info,
  CheckCircle2,
  ChevronRight,
  Flame,
  Clock
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
  const [tanpuraVolume, setTanpuraVolume] = useState<number>(0.75);
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
      // Auto analyze when voice stops
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

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-4 pb-20 select-none">
      
      {/* 1. Header with Time Prahar Alignment */}
      <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f15a24] to-amber-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
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
        {/* Ambient Glow */}
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

      {/* 4. Acoustic Tanpura Bed Engine */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#f15a24]" />
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
              ACOUSTIC TANPURA BED (JAVARI DRONE)
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

            {/* String 1 tuning */}
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

      {/* 7. Interactive Fretboard Visualizer */}
      <div className="w-full p-4 sm:p-5 rounded-3xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/[0.08]">
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">
            FRETBOARD EXPLORER ({tanpuraKey} Root)
          </span>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f15a24] inline-block" /> Root (Sa)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Soul Note (Vadi)
            </span>
          </div>
        </div>

        {/* Fretboard SVG (12 Frets) */}
        <div className="w-full overflow-x-auto py-2">
          <svg viewBox="0 0 600 130" className="w-full min-w-[540px] max-w-full">
            {/* Wooden Fretboard base */}
            <rect x="20" y="10" width="560" height="110" rx="6" fill="#1e293b" opacity="0.15" />

            {/* Nut Bar */}
            <line x1="30" y1="10" x2="30" y2="120" stroke="#94a3b8" strokeWidth="4" />

            {/* 12 Fret Wires */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((fret) => {
              const x = 30 + fret * 44;
              return (
                <g key={fret}>
                  <line x1={x} y1="10" x2={x} y2="120" stroke="#cbd5e1" strokeWidth="1.5" strokeOpacity="0.4" />
                  <text x={x - 22} y="128" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                    {fret}
                  </text>
                  {/* Fret marker dots on 3, 5, 7, 9, 12 */}
                  {[3, 5, 7, 9].includes(fret) && (
                    <circle cx={x - 22} cy="65" r="3" fill="#94a3b8" opacity="0.3" />
                  )}
                  {fret === 12 && (
                    <>
                      <circle cx={x - 22} cy="45" r="2.5" fill="#94a3b8" opacity="0.3" />
                      <circle cx={x - 22} cy="85" r="2.5" fill="#94a3b8" opacity="0.3" />
                    </>
                  )}
                </g>
              );
            })}

            {/* 6 Guitar Strings (Low E to High e) */}
            {[1, 2, 3, 4, 5, 6].map((str) => {
              const y = 15 + (str - 1) * 20;
              const width = 2.5 - (str - 1) * 0.35;
              return (
                <line
                  key={str}
                  x1="30"
                  y1={y}
                  x2="570"
                  y2={y}
                  stroke="#94a3b8"
                  strokeWidth={width}
                  strokeOpacity="0.6"
                />
              );
            })}

            {/* Raag Note Position Badges */}
            {currentRaga.fretboardPositionsAtC.map((pos, idx) => {
              const y = 15 + (pos.string - 1) * 20;
              const x = pos.fret === 0 ? 20 : 30 + pos.fret * 44 - 22;
              const isRoot = pos.isRoot;
              const isSoul = pos.isSoulNote;

              const badgeFill = isRoot ? '#f15a24' : isSoul ? '#10b981' : '#38bdf8';

              return (
                <g key={idx} className="cursor-pointer">
                  {isSoul && (
                    <circle cx={x} cy={y} r="10" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" className="animate-spin" />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isRoot || isSoul ? 8 : 6.5}
                    fill={badgeFill}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                  <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={isRoot || isSoul ? "8" : "7"}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {pos.note}
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
