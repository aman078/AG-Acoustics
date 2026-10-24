import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Crown, 
  Sparkles, 
  Volume2, 
  Music, 
  Play, 
  RotateCcw, 
  Radio, 
  HelpCircle,
  Award,
  CheckCircle2,
  Flame,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { Raga, CHROMATIC_NOTES, SEMITONES_MAP } from '../data/ragas';
import { 
  swaraAudio, 
  InstrumentSoundType, 
  INSTRUMENT_PRESETS 
} from '../audio/swaraKeyboardEngine';

interface SwaraKeyItem {
  id: string;
  keyChar: string; // 'Q', 'W', 'E', etc.
  noteName: string; // 'C', 'D', 'E' etc.
  swaraName: string; // 'Sa', 'Re', 'Ga' etc.
  roman: string; // 'I', 'II', 'III' etc.
  freq: number;
  isRoot: boolean;
  isVadi: boolean;
  isSamvadi: boolean;
  isNyas: boolean;
  intervalOffset: number;
}

interface SwaraKeyboardProps {
  raga: Raga;
  rootKey: string; // e.g. 'C', 'D', etc.
  onPlayNote?: (noteName: string) => void;
}

const QWERTY_KEYS = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O'];

const SWARA_NAMES_BY_INTERVAL: Record<number, string> = {
  0: 'Sa',
  1: 'komal Re',
  2: 'Re',
  3: 'komal Ga',
  4: 'Ga',
  5: 'Ma',
  6: 'tivra Ma',
  7: 'Pa',
  8: 'komal Dha',
  9: 'Dha',
  10: 'komal Ni',
  11: 'Ni',
  12: 'Taar Sa',
  13: 'Taar komal Re',
  14: 'Taar Re',
  15: 'Taar komal Ga',
  16: 'Taar Ga'
};

export const SwaraKeyboard: React.FC<SwaraKeyboardProps> = ({ raga, rootKey, onPlayNote }) => {
  const [activeKeyIds, setActiveKeyIds] = useState<Set<string>>(new Set());
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentSoundType>('flute');
  const [droneKeyId, setDroneKeyId] = useState<string | null>(null);
  const [isDroneModeActive, setIsDroneModeActive] = useState<boolean>(false);
  
  // Guided Riff / "Teach Me The Pakad" State
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(false);
  const [guidedStepIndex, setGuidedStepIndex] = useState<number>(0);
  const [guidedCombo, setGuidedCombo] = useState<number>(0);
  const [isGuidedCompleted, setIsGuidedCompleted] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchingKeyIdRef = useRef<string | null>(null);

  // 1. Calculate Base Frequency for Chosen Root Key (around middle C4 ~ 261.63 Hz)
  const rootSemi = SEMITONES_MAP[rootKey] ?? 0;
  const baseC4Freq = 261.63;
  const rootBaseFreq = baseC4Freq * Math.pow(2, (rootSemi - SEMITONES_MAP['C']) / 12);

  // 2. Build ordered scale keys for the current raga
  const keysList: SwaraKeyItem[] = [];
  const vadiOffset = raga.vadi.offset;
  const samvadiOffset = raga.samvadi.offset;
  const nyasOffsets = new Set(raga.nyas.offsets);

  // Add the raga scale offsets (e.g. [0, 2, 4, 6, 7, 9, 11] + octave [12])
  const uniqueOffsets = Array.from(new Set([...raga.scaleIntervalOffsets, 12])).sort((a, b) => a - b);

  uniqueOffsets.slice(0, QWERTY_KEYS.length).forEach((offset, idx) => {
    const keyChar = QWERTY_KEYS[idx];
    const noteSemitone = (rootSemi + offset) % 12;
    const noteName = CHROMATIC_NOTES[noteSemitone];
    const freq = rootBaseFreq * Math.pow(2, offset / 12);
    const swaraName = SWARA_NAMES_BY_INTERVAL[offset] || 'Swar';
    const isRoot = offset === 0 || offset === 12;
    const isVadi = offset % 12 === vadiOffset % 12;
    const isSamvadi = offset % 12 === samvadiOffset % 12;
    const isNyas = nyasOffsets.has(offset % 12);

    const roman = raga.scaleRoman[idx % raga.scaleRoman.length] || (offset === 12 ? 'I (8ve)' : `${idx + 1}`);

    keysList.push({
      id: `key-${offset}-${idx}`,
      keyChar,
      noteName: offset === 12 ? `${noteName}'` : noteName,
      swaraName,
      roman,
      freq,
      isRoot,
      isVadi,
      isSamvadi,
      isNyas,
      intervalOffset: offset
    });
  });

  // Guided Riff Steps: Map the raga's signature riff frequencies/notes to keyboard keys
  const guidedTargetKeys: SwaraKeyItem[] = [];
  if (raga.signatureRiff.notes && raga.signatureRiff.notes.length > 0) {
    raga.signatureRiff.notes.forEach((riffNoteStr) => {
      const cleanNote = riffNoteStr.replace(/\d/g, '');
      const match = keysList.find((k) => k.noteName.replace("'", '') === cleanNote) || keysList[0];
      guidedTargetKeys.push(match);
    });
  }

  const currentGuidedTarget = guidedTargetKeys[guidedStepIndex] || null;

  // Change Instrument Sound Preset
  const handleSelectInstrument = (preset: InstrumentSoundType) => {
    setSelectedInstrument(preset);
    swaraAudio.setInstrument(preset);
    
    // Play a preview sound of Root Sa
    if (keysList.length > 0) {
      const rootKeyItem = keysList[0];
      swaraAudio.noteOn('preview', rootKeyItem.freq);
      setTimeout(() => {
        swaraAudio.noteOff('preview');
      }, 350);
    }
  };

  // Handle Note Trigger
  const triggerNoteOn = useCallback((item: SwaraKeyItem, glideFrom?: number) => {
    setActiveKeyIds((prev) => new Set(prev).add(item.id));
    onPlayNote?.(item.noteName);

    if (isDroneModeActive) {
      const active = swaraAudio.toggleDronePad(item.freq);
      setDroneKeyId(active ? item.id : null);
    } else {
      swaraAudio.noteOn(item.id, item.freq, glideFrom);
    }

    // Check Guided Mode Progress
    if (isGuidedMode && currentGuidedTarget && !isGuidedCompleted) {
      if (item.id === currentGuidedTarget.id || item.noteName === currentGuidedTarget.noteName) {
        const nextStep = guidedStepIndex + 1;
        setGuidedCombo((c) => c + 1);
        if (nextStep >= guidedTargetKeys.length) {
          setIsGuidedCompleted(true);
        } else {
          setGuidedStepIndex(nextStep);
        }
      }
    }
  }, [isDroneModeActive, isGuidedMode, currentGuidedTarget, guidedStepIndex, guidedTargetKeys.length, isGuidedCompleted, onPlayNote]);

  const triggerNoteOff = useCallback((item: SwaraKeyItem) => {
    setActiveKeyIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    if (!isDroneModeActive) {
      swaraAudio.noteOff(item.id);
    }
  }, [isDroneModeActive]);

  // QWERTY Physical Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.repeat) return;

      const pressedChar = e.key.toUpperCase();
      const matchedItem = keysList.find((k) => k.keyChar === pressedChar);
      if (matchedItem) {
        e.preventDefault();
        triggerNoteOn(matchedItem);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const pressedChar = e.key.toUpperCase();
      const matchedItem = keysList.find((k) => k.keyChar === pressedChar);
      if (matchedItem) {
        e.preventDefault();
        triggerNoteOff(matchedItem);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      swaraAudio.releaseAll();
    };
  }, [keysList, triggerNoteOn, triggerNoteOff]);

  // Reset guided mode on raga change
  useEffect(() => {
    setGuidedStepIndex(0);
    setGuidedCombo(0);
    setIsGuidedCompleted(false);
  }, [raga.id, rootKey]);

  const activePreset = INSTRUMENT_PRESETS.find((p) => p.id === selectedInstrument) || INSTRUMENT_PRESETS[0];

  return (
    <div 
      ref={containerRef}
      className="w-full p-4 sm:p-5 rounded-3xl bg-slate-900/90 dark:bg-white/[0.04] border border-slate-700/60 dark:border-white/[0.08] shadow-lg flex flex-col space-y-3.5 select-none text-white backdrop-blur-xl"
    >
      {/* 1. Header Toolbar: Instrument Dropdown & Mode Toggles */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              SWARA KEYBOARD (IN {rootKey})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 font-semibold border border-white/10">
              QWERTY + TOUCH
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
            {activePreset.emoji} <strong>{activePreset.name}:</strong> {activePreset.description}
          </span>
        </div>

        {/* Feature Action Buttons & Instrument Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Instrument Dropdown Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 dark:bg-white/[0.06] border border-amber-500/35 rounded-xl px-2 py-1 shadow-xs">
            <span className="text-xs">{activePreset.emoji}</span>
            <select
              value={selectedInstrument}
              onChange={(e) => handleSelectInstrument(e.target.value as InstrumentSoundType)}
              className="bg-transparent text-amber-300 text-xs font-mono font-bold cursor-pointer outline-hidden pr-1"
              title="Select authentic acoustic instrument sound"
            >
              {INSTRUMENT_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white font-mono">
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ambient Drone Mode Toggle */}
          <button
            onClick={() => {
              const next = !isDroneModeActive;
              setIsDroneModeActive(next);
              if (!next) {
                swaraAudio.stopDronePad();
                setDroneKeyId(null);
              }
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border ${
              isDroneModeActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border-white/10'
            }`}
            title="When active, tapping a key keeps it gently droning in the background"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>DRONE: {isDroneModeActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Guided Play-Along Toggle */}
          <button
            onClick={() => {
              setIsGuidedMode(!isGuidedMode);
              setGuidedStepIndex(0);
              setGuidedCombo(0);
              setIsGuidedCompleted(false);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border ${
              isGuidedMode
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>FOLLOW LIGHT: {isGuidedMode ? 'ACTIVE' : 'START'}</span>
          </button>
        </div>
      </div>

      {/* 2. Guided Game HUD Banner (When active) */}
      {isGuidedMode && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between text-xs font-mono animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-black">
              {isGuidedCompleted ? <Award className="w-5 h-5 text-amber-300" /> : <Play className="w-4 h-4 fill-current" />}
            </div>
            <div>
              {isGuidedCompleted ? (
                <div>
                  <span className="font-extrabold text-amber-300 text-sm block">
                    🎉 PAKAD MASTERED!
                  </span>
                  <span className="text-[11px] text-slate-300">
                    You just played the signature phrase of {raga.name}!
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                    STEP {guidedStepIndex + 1} OF {guidedTargetKeys.length} • TAP HIGHLIGHTED KEY:
                  </span>
                  <span className="font-black text-white text-sm">
                    {currentGuidedTarget?.swaraName} ({currentGuidedTarget?.noteName}) — Press Key [{currentGuidedTarget?.keyChar}]
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {guidedCombo > 0 && !isGuidedCompleted && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-500/30">
                <Flame className="w-3 h-3 fill-current" /> {guidedCombo} Combo
              </span>
            )}
            {isGuidedCompleted && (
              <button
                onClick={() => {
                  setGuidedStepIndex(0);
                  setGuidedCombo(0);
                  setIsGuidedCompleted(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-white/[0.1] hover:bg-white/[0.2] text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Replay
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. The Physical Keys / Swara Touch Pad Strip */}
      <div 
        className="w-full grid gap-1.5 sm:gap-2 select-none"
        style={{
          gridTemplateColumns: `repeat(${keysList.length}, minmax(0, 1fr))`
        }}
      >
        {keysList.map((item) => {
          const isActive = activeKeyIds.has(item.id);
          const isDroneActive = droneKeyId === item.id;
          const isGuidedTarget = isGuidedMode && !isGuidedCompleted && currentGuidedTarget?.id === item.id;

          // Badges and styles
          let borderColor = 'border-white/10';
          let bgColor = 'bg-slate-800/80 hover:bg-slate-700/80';
          let textColor = 'text-white';
          let glowClass = '';

          if (item.isVadi) {
            borderColor = 'border-amber-500/50';
            bgColor = 'bg-amber-500/15 hover:bg-amber-500/25';
          } else if (item.isSamvadi) {
            borderColor = 'border-purple-500/50';
            bgColor = 'bg-purple-500/15 hover:bg-purple-500/25';
          } else if (item.isRoot) {
            borderColor = 'border-[#f15a24]/50';
            bgColor = 'bg-[#f15a24]/15 hover:bg-[#f15a24]/25';
          }

          if (isGuidedTarget) {
            borderColor = 'border-emerald-400';
            bgColor = 'bg-emerald-500/30';
            glowClass = 'animate-pulse ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]';
          }

          if (isActive) {
            bgColor = item.isVadi 
              ? 'bg-amber-400 text-slate-950 font-black' 
              : item.isSamvadi 
              ? 'bg-purple-400 text-slate-950 font-black' 
              : item.isRoot 
              ? 'bg-[#f15a24] text-white font-black' 
              : 'bg-sky-400 text-slate-950 font-black';
            glowClass = 'scale-[0.97] shadow-[0_0_25px_rgba(255,255,255,0.4)]';
          }

          return (
            <div
              key={item.id}
              onMouseDown={() => triggerNoteOn(item)}
              onMouseUp={() => triggerNoteOff(item)}
              onMouseLeave={() => triggerNoteOff(item)}
              onTouchStart={(e) => {
                e.preventDefault();
                touchingKeyIdRef.current = item.id;
                triggerNoteOn(item);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                touchingKeyIdRef.current = null;
                triggerNoteOff(item);
              }}
              onTouchMove={(e) => {
                // Seamless touch drag glide (Meend)
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                const targetKeyId = element?.getAttribute('data-swara-id');
                if (targetKeyId && targetKeyId !== touchingKeyIdRef.current) {
                  const targetItem = keysList.find((k) => k.id === targetKeyId);
                  if (targetItem) {
                    if (touchingKeyIdRef.current) {
                      swaraAudio.noteOff(touchingKeyIdRef.current);
                    }
                    touchingKeyIdRef.current = targetKeyId;
                    triggerNoteOn(targetItem, item.freq);
                  }
                }
              }}
              data-swara-id={item.id}
              className={`relative flex flex-col items-center justify-between p-2 sm:p-3 rounded-2xl border ${borderColor} ${bgColor} ${glowClass} min-h-[110px] sm:min-h-[140px] cursor-pointer transition-all duration-75 select-none touch-none shadow-md`}
            >
              {/* Top Key Role Indicator (Crown for Vadi, Star for Samvadi, etc.) */}
              <div className="h-5 flex items-center justify-center">
                {item.isVadi && (
                  <span title="Vadi (King Note)" className="text-amber-400 flex items-center gap-0.5">
                    <Crown className="w-3.5 h-3.5" />
                  </span>
                )}
                {item.isSamvadi && (
                  <span title="Samvadi (Queen Note)" className="text-purple-400 flex items-center gap-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                )}
                {item.isRoot && !item.isVadi && (
                  <span className="w-2 h-2 rounded-full bg-[#f15a24]" title="Root (Sa)" />
                )}
                {item.isNyas && !item.isVadi && !item.isSamvadi && !item.isRoot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Nyas Landing" />
                )}
              </div>

              {/* Center: Note Name & Swara */}
              <div className="flex flex-col items-center my-1 text-center">
                <span className={`text-base sm:text-lg font-black tracking-tight ${isActive ? '' : textColor}`}>
                  {item.noteName}
                </span>
                <span className={`text-[10px] sm:text-xs font-mono font-bold opacity-80 ${isActive ? '' : 'text-slate-300'}`}>
                  {item.swaraName}
                </span>
                <span className="text-[9px] font-mono opacity-60">
                  {item.roman}
                </span>
              </div>

              {/* Bottom: QWERTY Physical Keyboard Shortcut Badge */}
              <div className="w-full flex items-center justify-center pt-1 border-t border-white/[0.08]">
                <kbd className={`px-2 py-0.5 rounded-md font-mono text-[10px] sm:text-xs font-extrabold border ${
                  isActive 
                    ? 'bg-black/30 border-black/40 text-inherit' 
                    : 'bg-white/[0.08] border-white/20 text-slate-300 shadow-xs'
                }`}>
                  {item.keyChar}
                </kbd>
              </div>

              {/* Latch Indicator for Drone Mode */}
              {isDroneActive && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[9px] font-black shadow-xs">
                  ●
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Legend & Keyboard Tip Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f15a24]" /> Root (Sa)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Crown className="w-2.5 h-2.5" /> Vadi (King)
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <Sparkles className="w-2.5 h-2.5" /> Samvadi (Queen)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Nyas (Landing)
          </span>
        </div>

        <div className="italic text-slate-400">
          💡 <strong>Pro Tip:</strong> Drag your finger across pads on phone to create an authentic sitar <strong>Meend (glide)</strong>.
        </div>
      </div>
    </div>
  );
};
