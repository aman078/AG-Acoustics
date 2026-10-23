import React, { useState, useEffect } from 'react';
import { TunedString } from '../data/tunings';
import { Radio } from 'lucide-react';
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
  const hasAudio = frequency !== null && clarity > 0.55;
  const isInTune = hasAudio && Math.abs(cents) <= 2.5;
  const isFlat = hasAudio && cents < -2.5;
  const isSharp = hasAudio && cents > 2.5;

  // Clamp cents between -50 and +50
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const deviationPercent = ((clampedCents + 50) / 100) * 100;

  // Split strings symmetrically for 3+3 headstock layout (Bass on left, Treble on right)
  const half = Math.ceil(strings.length / 2);
  const leftStrings = strings.slice(0, half);
  const rightStrings = strings.slice(half).reverse();

  // Y-coordinates for peg levels
  const yCoords = [250, 170, 90]; // Bottom (Low E), Middle (A), Top (D)

  return (
    <div className="flex flex-col items-center w-full select-none max-w-lg mx-auto">
      
      {/* Top HUD Readout: Note, Frequency, and Cent Meter */}
      <div className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl mb-3 backdrop-blur-xl">
        
        {/* Top Status Bar: Drone Toggle & Auto Status */}
        <div className="flex items-center justify-between text-xs font-mono pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800/80">
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
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Ear training reference drone mode"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isDroneMode ? 'DRONE ACTIVE' : 'DRONE MODE'}</span>
          </button>

          <div
            className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border ${
              isInTune
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : isFlat
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : isSharp
                ? 'bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border-[#f15a24]/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {hasAudio ? (
              isInTune ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                  <span>IN TUNE (±0.0¢)</span>
                </>
              ) : isFlat ? (
                <>
                  <span>⤾</span> <span>TIGHTEN ({cents.toFixed(1)}¢ FLAT)</span>
                </>
              ) : (
                <>
                  <span>⤿</span> <span>LOOSEN (+{cents.toFixed(1)}¢ SHARP)</span>
                </>
              )
            ) : (
              <span>{isAutoMode ? '⚡ AUTO-DETECTING' : 'PLUCK STRING'}</span>
            )}
          </div>
        </div>

        {/* Big Detected Note & Cent Meter */}
        <div className="flex flex-col items-center my-1">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-5xl sm:text-6xl font-black tracking-tight font-mono transition-colors duration-200 ${
                isInTune
                  ? 'text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                  : hasAudio
                  ? 'text-[#f15a24] dark:text-[#ff7a45]'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {activeString.note}
            </span>
            <span className="text-xl font-bold text-slate-400 dark:text-slate-500">{activeString.octave}</span>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
            FREQ:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {frequency ? `${frequency.toFixed(1)} Hz` : `${activeString.targetFreq.toFixed(1)} Hz`}
            </strong>
          </div>

          {/* Cent Meter Needle Gauge Bar */}
          <div className="w-full max-w-xs mt-3 relative">
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
              {/* Center target zone */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-4 bg-emerald-500/30 rounded-full" />
              {/* Cursor indicator */}
              <div
                className={`absolute top-0 bottom-0 w-3 rounded-full -translate-x-1/2 transition-all duration-75 shadow-sm ${
                  isInTune
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                    : isFlat
                    ? 'bg-[#f15a24] shadow-[0_0_8px_#f15a24]'
                    : isSharp
                    ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                    : 'bg-slate-400'
                }`}
                style={{
                  left: hasAudio ? `${deviationPercent}%` : '50%',
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
              <span>-50¢ FLAT</span>
              <span className={isInTune ? 'text-emerald-500 font-bold' : ''}>0¢ PERFECT</span>
              <span>+50¢ SHARP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Luthier Blueprint Vector Headstock Stage */}
      <div className="relative w-full max-w-sm sm:max-w-md h-[470px] flex items-center justify-center bg-[#070b12] rounded-3xl border border-cyan-500/20 shadow-2xl overflow-hidden">
        
        {/* Subtle Blueprint Technical Coordinate Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="luthier-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#luthier-grid)" />
        </svg>

        {/* Technical Blueprint Specs Markings */}
        <div className="absolute top-3 left-3 text-[9px] font-mono text-cyan-400/50">SEC: 3L3R ACOUSTIC</div>
        <div className="absolute top-3 right-3 text-[9px] font-mono text-cyan-400/50">TOL: ±0.1¢</div>
        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-cyan-400/50">SCALE: 25.5&quot;</div>
        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-cyan-400/50">NUT: 43.0mm</div>

        {/* Master Vector Headstock Schematic SVG */}
        <svg viewBox="0 0 340 460" className="w-full h-full max-w-[360px]">
          <defs>
            <marker id="bp-arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f15a24" />
            </marker>
            <marker id="bp-arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Headstock Architectural Outer Contour (Cyan Dashed) */}
          <path
            d="M 96 410 L 96 295 C 90 250, 78 145, 90 70 C 100 38, 145 28, 170 44 C 195 28, 240 38, 250 70 C 262 145, 250 250, 244 295 L 244 410 Z"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />

          {/* Headstock Inner Chamfer Contour */}
          <path
            d="M 103 408 L 103 295 C 97 252, 86 148, 97 75 C 106 45, 144 36, 170 51 C 196 36, 234 45, 243 75 C 254 148, 243 252, 237 295 L 237 408 Z"
            fill="rgba(56, 189, 248, 0.03)"
            stroke="#0284c7"
            strokeWidth="1.4"
          />

          {/* Center AG Inlay */}
          <text x="170" y="96" textAnchor="middle" fill="#38bdf8" fontSize="13" fontFamily="monospace" fontWeight="900" letterSpacing="4">AGSOFT</text>
          <text x="170" y="110" textAnchor="middle" fill="#0284c7" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="2">ACOUSTICS STUDIO</text>
          {/* Blueprint Compass Rose */}
          <circle cx="170" cy="132" r="10" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="170" y1="118" x2="170" y2="146" stroke="#38bdf8" strokeWidth="1" />
          <line x1="156" y1="132" x2="184" y2="132" stroke="#38bdf8" strokeWidth="1" />

          {/* Bone Nut Bar (Bottom) */}
          <rect x="94" y="405" width="152" height="10" rx="2" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          <line x1="94" y1="410" x2="246" y2="410" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

          {/* ========================================== */}
          {/* 6 STRINGS: Authentic Gauge Paths           */}
          {/* ========================================== */}
          {strings.map((str, idx) => {
            const isSelected = activeStringIndex === idx;
            const isLeft = idx < half;
            // Nut X coords from Low E (idx 0) to High e (idx 5)
            const nutX = 112 + idx * 16 + (idx >= 3 ? 16 : 0);
            
            // Peg coordinates
            const levelIdx = isLeft ? idx : strings.length - 1 - idx;
            const targetY = yCoords[levelIdx] || 250;
            const targetPegX = isLeft ? 120 : 220;

            // Gauge thickness
            const gaugeWidth = 3.6 - idx * 0.5;

            return (
              <path
                key={str.name + idx}
                d={`M ${nutX} 410 L ${nutX} 295 L ${targetPegX} ${targetY}`}
                fill="none"
                stroke={
                  isSelected
                    ? isInTune
                      ? '#10b981'
                      : '#f15a24'
                    : '#38bdf8'
                }
                strokeWidth={gaugeWidth}
                opacity={isSelected ? 1 : 0.35}
                className={
                  isSelected
                    ? isInTune
                      ? 'string-active-green'
                      : 'string-active-orange'
                    : ''
                }
              />
            );
          })}

          {/* ============================================================ */}
          {/* 6 TUNING PEGS & MECHANICAL OPEN-GEAR COGS (Interactive)      */}
          {/* ============================================================ */}

          {/* Left Pegs (Bass: 6th, 5th, 4th) */}
          {leftStrings.map((str, idx) => {
            const actualIdx = idx;
            const isSelected = activeStringIndex === actualIdx;
            const y = yCoords[idx] || 250;
            const isDroning = droningFreq === str.targetFreq;
            const pegColor = isDroning
              ? '#f59e0b'
              : isSelected
              ? isInTune
                ? '#10b981'
                : '#f15a24'
              : '#38bdf8';

            const gearAnimationClass = isSelected && hasAudio
              ? isFlat
                ? 'gear-spinning-cw'
                : isSharp
                ? 'gear-spinning-ccw'
                : ''
              : '';

            return (
              <g
                key={str.name + idx}
                onClick={() => handlePegClick(actualIdx, str.targetFreq)}
                className="cursor-pointer group"
              >
                {/* Open Gear Cogwheel inside headstock */}
                <g className={gearAnimationClass}>
                  <circle
                    cx="120"
                    cy={y}
                    r={isSelected ? 12 : 10}
                    fill={isSelected ? 'rgba(241, 90, 36, 0.15)' : '#0f172a'}
                    stroke={pegColor}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  <path
                    d={`M 120 ${y - 12} L 120 ${y + 12} M 108 ${y} L 132 ${y} M 111 ${y - 9} L 129 ${y + 9} M 111 ${y + 9} L 129 ${y - 9}`}
                    stroke={pegColor}
                    strokeWidth={isSelected ? 2.5 : 1.8}
                  />
                  <circle cx="120" cy={y} r={isSelected ? 4 : 3.5} fill={pegColor} />
                </g>

                {/* Shaft to knob */}
                <line
                  x1="72"
                  y1={y}
                  x2="110"
                  y2={y}
                  stroke={pegColor}
                  strokeWidth={isSelected ? 3 : 2}
                />

                {/* Machine Head Knob */}
                <rect
                  x="48"
                  y={y - (isSelected ? 11 : 9)}
                  width="24"
                  height={isSelected ? 22 : 18}
                  rx="6"
                  fill={isSelected ? pegColor : '#0f172a'}
                  stroke={isSelected ? '#fff' : '#38bdf8'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  className="transition-all"
                />

                {/* Floating Note Badge */}
                <circle
                  cx="26"
                  cy={y}
                  r={isSelected ? 17 : 14}
                  fill={isSelected ? pegColor : '#0f172a'}
                  stroke={isSelected ? '#fff' : '#38bdf8'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  className="transition-all"
                />
                <text
                  x="26"
                  y={y + (isSelected ? 5 : 4.5)}
                  textAnchor="middle"
                  fill={isSelected ? '#fff' : '#38bdf8'}
                  fontSize={isSelected ? 14 : 12}
                  fontFamily="monospace"
                  fontWeight={isSelected ? 900 : 'bold'}
                >
                  {str.note}
                </text>

                {/* Directional Assist Indicator on Active Peg */}
                {isSelected && (
                  <g>
                    {isInTune ? (
                      <>
                        <circle
                          cx="26"
                          cy={y}
                          r="22"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="string-active-green"
                        />
                        <text
                          x="26"
                          y={y + 32}
                          textAnchor="middle"
                          fill="#10b981"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="900"
                        >
                          ✓ PERFECT
                        </text>
                      </>
                    ) : isFlat ? (
                      <>
                        <path
                          d={`M 26 ${y - 24} A 24 24 0 0 1 48 ${y}`}
                          fill="none"
                          stroke="#f15a24"
                          strokeWidth="2.5"
                          strokeDasharray="2 2"
                          markerEnd="url(#bp-arrow-orange)"
                        />
                        <text
                          x="26"
                          y={y + 32}
                          textAnchor="middle"
                          fill="#f15a24"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ⤾ TIGHTEN
                        </text>
                      </>
                    ) : isSharp ? (
                      <>
                        <path
                          d={`M 26 ${y + 24} A 24 24 0 0 1 4 ${y}`}
                          fill="none"
                          stroke="#f15a24"
                          strokeWidth="2.5"
                          strokeDasharray="2 2"
                          markerEnd="url(#bp-arrow-orange)"
                        />
                        <text
                          x="26"
                          y={y + 32}
                          textAnchor="middle"
                          fill="#f15a24"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ⤿ LOOSEN
                        </text>
                      </>
                    ) : null}
                  </g>
                )}
              </g>
            );
          })}

          {/* Right Pegs (Treble: 3rd, 2nd, 1st) */}
          {rightStrings.map((str, idx) => {
            const actualIdx = strings.length - 1 - idx;
            const isSelected = activeStringIndex === actualIdx;
            const y = yCoords[idx] || 250;
            const isDroning = droningFreq === str.targetFreq;
            const pegColor = isDroning
              ? '#f59e0b'
              : isSelected
              ? isInTune
                ? '#10b981'
                : '#f15a24'
              : '#38bdf8';

            const gearAnimationClass = isSelected && hasAudio
              ? isFlat
                ? 'gear-spinning-cw'
                : isSharp
                ? 'gear-spinning-ccw'
                : ''
              : '';

            return (
              <g
                key={str.name + idx}
                onClick={() => handlePegClick(actualIdx, str.targetFreq)}
                className="cursor-pointer group"
              >
                {/* Open Gear Cogwheel inside headstock */}
                <g className={gearAnimationClass}>
                  <circle
                    cx="220"
                    cy={y}
                    r={isSelected ? 12 : 10}
                    fill={isSelected ? 'rgba(241, 90, 36, 0.15)' : '#0f172a'}
                    stroke={pegColor}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  <path
                    d={`M 220 ${y - 12} L 220 ${y + 12} M 208 ${y} L 232 ${y} M 211 ${y - 9} L 229 ${y + 9} M 211 ${y + 9} L 229 ${y - 9}`}
                    stroke={pegColor}
                    strokeWidth={isSelected ? 2.5 : 1.8}
                  />
                  <circle cx="220" cy={y} r={isSelected ? 4 : 3.5} fill={pegColor} />
                </g>

                {/* Shaft to knob */}
                <line
                  x1="230"
                  y1={y}
                  x2="268"
                  y2={y}
                  stroke={pegColor}
                  strokeWidth={isSelected ? 3 : 2}
                />

                {/* Machine Head Knob */}
                <rect
                  x="268"
                  y={y - (isSelected ? 11 : 9)}
                  width="24"
                  height={isSelected ? 22 : 18}
                  rx="6"
                  fill={isSelected ? pegColor : '#0f172a'}
                  stroke={isSelected ? '#fff' : '#38bdf8'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  className="transition-all"
                />

                {/* Floating Note Badge */}
                <circle
                  cx="314"
                  cy={y}
                  r={isSelected ? 17 : 14}
                  fill={isSelected ? pegColor : '#0f172a'}
                  stroke={isSelected ? '#fff' : '#38bdf8'}
                  strokeWidth={isSelected ? 2 : 1.5}
                  className="transition-all"
                />
                <text
                  x="314"
                  y={y + (isSelected ? 5 : 4.5)}
                  textAnchor="middle"
                  fill={isSelected ? '#fff' : '#38bdf8'}
                  fontSize={isSelected ? 14 : 12}
                  fontFamily="monospace"
                  fontWeight={isSelected ? 900 : 'bold'}
                >
                  {str.note}
                </text>

                {/* Directional Assist Indicator on Active Peg */}
                {isSelected && (
                  <g>
                    {isInTune ? (
                      <>
                        <circle
                          cx="314"
                          cy={y}
                          r="22"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="string-active-green"
                        />
                        <text
                          x="314"
                          y={y + 32}
                          textAnchor="middle"
                          fill="#10b981"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="900"
                        >
                          ✓ PERFECT
                        </text>
                      </>
                    ) : isFlat ? (
                      <>
                        <path
                          d={`M 314 ${y - 24} A 24 24 0 0 0 292 ${y}`}
                          fill="none"
                          stroke="#f15a24"
                          strokeWidth="2.5"
                          strokeDasharray="2 2"
                          markerEnd="url(#bp-arrow-orange)"
                        />
                        <text
                          x="314"
                          y={y + 32}
                          textAnchor="middle"
                          fill="#f15a24"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ⤾ TIGHTEN
                        </text>
                      </>
                    ) : isSharp ? (
                      <>
                        <path
                          d={`M 314 ${y + 24} A 24 24 0 0 0 336 ${y}`}
                          fill="none"
                          stroke="#f15a24"
                          strokeWidth="2.5"
                          strokeDasharray="2 2"
                          markerEnd="url(#bp-arrow-orange)"
                        />
                        <text
                          x="314"
                          y={y + 32}
                          textAnchor="middle"
                          fill="#f15a24"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ⤿ LOOSEN
                        </text>
                      </>
                    ) : null}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
