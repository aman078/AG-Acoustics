import React, { useState, useEffect } from 'react';
import { TunedString } from '../data/tunings';
import { Volume2, Radio } from 'lucide-react';
import { startToneDrone, stopToneDrone } from '../audio/toneGenerator';

interface HeadstockTunerProps {
  strings: TunedString[];
  activeStringIndex: number;
  onSelectString: (index: number) => void;
  frequency: number | null;
  cents: number;
  clarity: number;
  isAutoMode: boolean;
  onPlayTone: (freq: number) => void;
}

export const HeadstockTuner: React.FC<HeadstockTunerProps> = ({
  strings,
  activeStringIndex,
  onSelectString,
  frequency,
  cents,
  clarity,
  isAutoMode,
  onPlayTone,
}) => {
  const [isDroneMode, setIsDroneMode] = useState<boolean>(false);
  const [droningFreq, setDroningFreq] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      stopToneDrone();
    };
  }, []);

  const handlePegClick = (actualIdx: number, targetFreq: number) => {
    onSelectString(actualIdx);
    if (isDroneMode) {
      if (droningFreq === targetFreq) {
        stopToneDrone();
        setDroningFreq(null);
      } else {
        startToneDrone(targetFreq);
        setDroningFreq(targetFreq);
      }
    } else {
      onPlayTone(targetFreq);
    }
  };
  const activeString = strings[activeStringIndex] || strings[0];
  const isInTune = Math.abs(cents) <= 2.5 && clarity > 0.7 && frequency !== null;
  const isClose = Math.abs(cents) <= 8 && clarity > 0.6 && frequency !== null;

  // Clamp cents between -50 and +50 for the visual needle range
  const clampedCents = Math.max(-50, Math.min(50, cents));
  // Needle rotation angle (-45 deg to +45 deg)
  const needleAngle = (clampedCents / 50) * 45;

  // Split strings into left and right sides for 3x3 or asymmetrical headstock
  const half = Math.ceil(strings.length / 2);
  // On a standard 6-string: left is 6, 5, 4 (low strings); right is 3, 2, 1 (high strings)
  const leftStrings = strings.slice(0, half);
  const rightStrings = strings.slice(half).reverse(); // high strings top to bottom on right

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Precision Arc Needle Meter */}
      <div className="relative w-full max-w-sm flex flex-col items-center pt-2 pb-4">
        {/* Arc Background Dial */}
        <div className="relative w-64 h-32 overflow-hidden flex items-end justify-center">
          {/* Tick marks */}
          <svg className="w-64 h-32 overflow-visible" viewBox="0 0 200 100">
            {/* Center target zone */}
            <path
              d="M 90 20 A 80 80 0 0 1 110 20"
              fill="none"
              stroke={isInTune ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Left Flat Zone */}
            <path
              d="M 30 70 A 80 80 0 0 1 85 22"
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="3"
            />
            {/* Right Sharp Zone */}
            <path
              d="M 115 22 A 80 80 0 0 1 170 70"
              fill="none"
              stroke="rgba(245, 158, 11, 0.25)"
              strokeWidth="3"
            />

            {/* Major Ticks (-50, -25, 0, +25, +50) */}
            {[-45, -22.5, 0, 22.5, 45].map((deg) => {
              const rad = ((deg - 90) * Math.PI) / 180;
              const x1 = 100 + 75 * Math.cos(rad);
              const y1 = 100 + 75 * Math.sin(rad);
              const x2 = 100 + 85 * Math.cos(rad);
              const y2 = 100 + 85 * Math.sin(rad);
              const isCenter = deg === 0;

              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isCenter ? (isInTune ? '#10b981' : '#64748b') : '#334155'}
                  strokeWidth={isCenter ? '3' : '1.5'}
                />
              );
            })}
          </svg>

          {/* Dynamic Needle */}
          <div
            className="absolute bottom-0 left-1/2 w-1 h-24 origin-bottom -translate-x-1/2 transition-transform duration-75 ease-out"
            style={{
              transform: `translateX(-50%) rotate(${needleAngle}deg)`,
            }}
          >
            <div
              className={`w-full h-full rounded-t-full transition-colors duration-200 ${
                isInTune
                  ? 'bg-emerald-400 shadow-[0_0_12px_#10b981]'
                  : isClose
                  ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                  : cents < 0
                  ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                  : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
              }`}
            />
          </div>

          {/* Needle pivot hub */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 shadow-lg flex items-center justify-center z-10">
            <div className={`w-2 h-2 rounded-full ${isInTune ? 'bg-emerald-400' : 'bg-slate-400'}`} />
          </div>
        </div>

        {/* Cent & Tuning State Readout */}
        <div className="mt-3 flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-5xl font-extrabold tracking-tight transition-colors duration-200 ${
                isInTune
                  ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : 'text-white'
              }`}
            >
              {activeString.note}
            </span>
            <span className="text-xl font-semibold text-slate-400">{activeString.octave}</span>
          </div>

          <div
            className={`mt-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 ${
              isInTune
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                : isClose
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : cents < 0
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {frequency && clarity > 0.6
              ? isInTune
                ? 'PERFECT • IN TUNE'
                : cents < 0
                ? `TUNE UP (${Math.abs(cents).toFixed(1)}¢ FLAT)`
                : `TUNE DOWN (${Math.abs(cents).toFixed(1)}¢ SHARP)`
              : 'PLUCK STRING'}
          </div>
        </div>
      </div>

      {/* Modern Studio Headstock & Interactive Tuning Pegs */}
      <div className="relative w-full max-w-sm px-4 py-4 mt-1 bg-slate-900/40 backdrop-blur border border-slate-800/80 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <button
            onClick={() => {
              if (isDroneMode) {
                stopToneDrone();
                setIsDroneMode(false);
                setDroningFreq(null);
              } else {
                setIsDroneMode(true);
              }
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isDroneMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Ear training reference drone: sound a continuous pitch center to practice scales and tuning"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isDroneMode ? 'DRONE ACTIVE' : 'DRONE MODE'}</span>
          </button>
          <span className="text-[11px] text-slate-500 font-mono">
            {isDroneMode ? 'TAP STRING TO DRONE' : isAutoMode ? '⚡ AUTO-DETECTING' : 'TAP PEG TO PLUCK'}
          </span>
        </div>

        {/* Headstock body */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left Pegs (Bass strings) */}
          <div className="flex flex-col gap-2.5">
            {leftStrings.map((str, idx) => {
              const actualIdx = idx;
              const isSelected = activeStringIndex === actualIdx;
              const isDroning = droningFreq === str.targetFreq;

              return (
                <button
                  key={str.name + idx}
                  onClick={() => handlePegClick(actualIdx, str.targetFreq)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                    isDroning
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/50'
                      : isSelected
                      ? isInTune
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-800/90 border-slate-600 shadow-md ring-1 ring-white/10'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                        isDroning
                          ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                          : isSelected
                          ? isInTune
                            ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                            : 'bg-white text-slate-950'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                      }`}
                    >
                      {str.note}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {str.name}
                        <span className="text-[10px] text-slate-500 ml-1.5 font-normal">
                          {str.label}th
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {str.targetFreq.toFixed(1)} Hz
                      </div>
                    </div>
                  </div>

                  {isDroning ? (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Pegs (Treble strings) */}
          <div className="flex flex-col gap-2.5">
            {rightStrings.map((str, idx) => {
              const actualIdx = strings.length - 1 - idx;
              const isSelected = activeStringIndex === actualIdx;
              const isDroning = droningFreq === str.targetFreq;

              return (
                <button
                  key={str.name + idx}
                  onClick={() => handlePegClick(actualIdx, str.targetFreq)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                    isDroning
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/50'
                      : isSelected
                      ? isInTune
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-800/90 border-slate-600 shadow-md ring-1 ring-white/10'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                        isDroning
                          ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                          : isSelected
                          ? isInTune
                            ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                            : 'bg-white text-slate-950'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                      }`}
                    >
                      {str.note}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {str.name}
                        <span className="text-[10px] text-slate-500 ml-1.5 font-normal">
                          {str.label}st
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {str.targetFreq.toFixed(1)} Hz
                      </div>
                    </div>
                  </div>

                  {isDroning ? (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
