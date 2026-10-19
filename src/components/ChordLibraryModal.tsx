import React, { useState } from 'react';
import { X, Volume2, Search } from 'lucide-react';
import { playGuitarStringTone } from '../audio/toneGenerator';

export interface ChordVoicing {
  positionName: string; // e.g. "Pos 1 (Open)", "Pos 2 (Fret 8 Barre)"
  baseFret: number;
  frets: (number | 'x')[]; // 6 strings: [E, A, D, G, B, E]
  fingers: (number | null)[]; // 1=index, 2=middle, 3=ring, 4=pinky
}

export interface ChordDef {
  name: string;
  root: string;
  type: string;
  frets: (number | 'x')[]; // 6 strings: [E, A, D, G, B, E]
  fingers: (number | null)[]; // 1=index, 2=middle, 3=ring, 4=pinky
  baseFret?: number;
  voicings?: ChordVoicing[];
}

export const CHORD_DATABASE: ChordDef[] = [
  // C family
  { name: 'C Major', root: 'C', type: 'Major', frets: ['x', 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  { name: 'C7', root: 'C', type: '7th', frets: ['x', 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  { name: 'Cadd9', root: 'C', type: 'Add9', frets: ['x', 3, 2, 0, 3, 3], fingers: [null, 2, 1, null, 3, 4] },
  { name: 'Cm', root: 'C', type: 'Minor', frets: ['x', 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1], baseFret: 3 },
  { name: 'Cmaj7', root: 'C', type: 'Maj7', frets: ['x', 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },

  // D family
  { name: 'D Major', root: 'D', type: 'Major', frets: ['x', 'x', 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  { name: 'Dm', root: 'D', type: 'Minor', frets: ['x', 'x', 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  { name: 'D7', root: 'D', type: '7th', frets: ['x', 'x', 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
  { name: 'Dsus4', root: 'D', type: 'Sus4', frets: ['x', 'x', 0, 2, 3, 3], fingers: [null, null, null, 1, 3, 4] },
  { name: 'Dsus2', root: 'D', type: 'Sus2', frets: ['x', 'x', 0, 2, 3, 0], fingers: [null, null, null, 1, 3, null] },

  // E family
  { name: 'E Major', root: 'E', type: 'Major', frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  { name: 'Em', root: 'E', type: 'Minor', frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  { name: 'E7', root: 'E', type: '7th', frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  { name: 'Em7', root: 'E', type: 'Minor 7th', frets: [0, 2, 2, 0, 3, 0], fingers: [null, 1, 2, null, 3, null] },
  { name: 'Esus4', root: 'E', type: 'Sus4', frets: [0, 2, 2, 2, 0, 0], fingers: [null, 2, 3, 4, null, null] },

  // F family
  { name: 'F Major', root: 'F', type: 'Major', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1 },
  { name: 'Fm', root: 'F', type: 'Minor', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1 },
  { name: 'Fmaj7', root: 'F', type: 'Maj7', frets: ['x', 3, 3, 2, 1, 0], fingers: [null, 3, 4, 2, 1, null] },
  { name: 'F#m', root: 'F#', type: 'Minor', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2 },

  // G family
  { name: 'G Major', root: 'G', type: 'Major', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  { name: 'G7', root: 'G', type: '7th', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  { name: 'Gsus4', root: 'G', type: 'Sus4', frets: [3, 'x', 0, 0, 1, 3], fingers: [3, null, null, null, 1, 4] },
  { name: 'Gm', root: 'G', type: 'Minor', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3 },

  // A family
  { name: 'A Major', root: 'A', type: 'Major', frets: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  { name: 'Am', root: 'A', type: 'Minor', frets: ['x', 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  { name: 'A7', root: 'A', type: '7th', frets: ['x', 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  { name: 'Asus4', root: 'A', type: 'Sus4', frets: ['x', 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 3, null] },
  { name: 'Asus2', root: 'A', type: 'Sus2', frets: ['x', 0, 2, 2, 0, 0], fingers: [null, null, 1, 2, null, null] },

  // B family
  { name: 'B Major', root: 'B', type: 'Major', frets: ['x', 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1], baseFret: 2 },
  { name: 'Bm', root: 'B', type: 'Minor', frets: ['x', 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], baseFret: 2 },
  { name: 'B7', root: 'B', type: '7th', frets: ['x', 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
];

// Open string frequencies in standard tuning: [E2, A2, D3, G3, B3, E4]
export const STANDARD_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

/**
 * Strums a chord voicing sequentially across strings for realistic guitar preview
 */
export function strumChordVoicing(frets: (number | 'x')[], baseFret = 1) {
  frets.forEach((fret, stringIdx) => {
    if (fret !== 'x') {
      const baseFreq = STANDARD_FREQS[stringIdx];
      const actualFret = typeof fret === 'number' ? fret : 0;
      const fretMultiplier = Math.pow(2, actualFret / 12);
      const chordNoteFreq = baseFreq * fretMultiplier;
      setTimeout(() => {
        playGuitarStringTone(chordNoteFreq, 1.8);
      }, stringIdx * 35);
    }
  });
}

/**
 * Returns multiple positions and voicings for any acoustic guitar chord
 */
export function getChordVoicings(chordName: string): ChordVoicing[] {
  if (!chordName) return [];
  const clean = chordName.trim();
  const match = clean.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return [];

  let root = match[1];
  const quality = match[2].trim().toLowerCase();

  const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const ALIASES: { [k: string]: string } = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  const normalizedRoot = ALIASES[root] || root;
  const rootIdx = CHROMATIC.indexOf(normalizedRoot);
  if (rootIdx === -1) return [];

  const voicings: ChordVoicing[] = [];

  const isMinor = quality.startsWith('m') && !quality.startsWith('maj');
  const is7th = quality.includes('7') && !quality.includes('maj7');

  if (isMinor) {
    // 1. Root on E (String 6) - E Minor Barre Shape
    const fretE = (rootIdx - 4 + 12) % 12;
    if (fretE === 0) {
      voicings.push({
        positionName: 'Pos 1 (Open)',
        baseFret: 1,
        frets: [0, 2, 2, 0, 0, 0],
        fingers: [null, 2, 3, null, null, null],
      });
    } else {
      voicings.push({
        positionName: `Pos 1 (Fret ${fretE})`,
        baseFret: fretE,
        frets: [fretE, fretE + 2, fretE + 2, fretE, fretE, fretE],
        fingers: [1, 3, 4, 1, 1, 1],
      });
    }

    // 2. Root on A (String 5) - A Minor Barre Shape
    const fretA = (rootIdx - 9 + 12) % 12;
    if (fretA === 0) {
      voicings.push({
        positionName: 'Pos 2 (Open)',
        baseFret: 1,
        frets: ['x', 0, 2, 2, 1, 0],
        fingers: [null, null, 2, 3, 1, null],
      });
    } else {
      voicings.push({
        positionName: `Pos 2 (Fret ${fretA})`,
        baseFret: fretA,
        frets: ['x', fretA, fretA + 2, fretA + 2, fretA + 1, fretA],
        fingers: [null, 1, 3, 4, 2, 1],
      });
    }
  } else if (is7th) {
    // 1. Dominant 7th E-shape
    const fretE = (rootIdx - 4 + 12) % 12;
    if (fretE === 0) {
      voicings.push({
        positionName: 'Pos 1 (Open)',
        baseFret: 1,
        frets: [0, 2, 0, 1, 0, 0],
        fingers: [null, 2, null, 1, null, null],
      });
    } else {
      voicings.push({
        positionName: `Pos 1 (Fret ${fretE})`,
        baseFret: fretE,
        frets: [fretE, fretE + 2, fretE, fretE + 1, fretE, fretE],
        fingers: [1, 3, 1, 2, 1, 1],
      });
    }

    // 2. Dominant 7th A-shape
    const fretA = (rootIdx - 9 + 12) % 12;
    if (fretA === 0) {
      voicings.push({
        positionName: 'Pos 2 (Open)',
        baseFret: 1,
        frets: ['x', 0, 2, 0, 2, 0],
        fingers: [null, null, 2, null, 3, null],
      });
    } else {
      voicings.push({
        positionName: `Pos 2 (Fret ${fretA})`,
        baseFret: fretA,
        frets: ['x', fretA, fretA + 2, fretA, fretA + 2, fretA],
        fingers: [null, 1, 3, 1, 4, 1],
      });
    }
  } else {
    // Standard Major Shapes
    // Check handcrafted open database first
    const dbMatch = CHORD_DATABASE.find((c) => {
      const matchDb = c.name.toLowerCase();
      return matchDb === clean.toLowerCase() || matchDb.replace(' major', '') === clean.toLowerCase();
    });

    if (dbMatch) {
      voicings.push({
        positionName: 'Pos 1 (Open)',
        baseFret: dbMatch.baseFret || 1,
        frets: dbMatch.frets,
        fingers: dbMatch.fingers,
      });
    }

    // E-shape Barre
    const fretE = (rootIdx - 4 + 12) % 12;
    if (fretE > 0) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (Fret ${fretE})`,
        baseFret: fretE,
        frets: [fretE, fretE + 2, fretE + 2, fretE + 1, fretE, fretE],
        fingers: [1, 3, 4, 2, 1, 1],
      });
    }

    // A-shape Barre
    const fretA = (rootIdx - 9 + 12) % 12;
    if (fretA > 0) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (Fret ${fretA})`,
        baseFret: fretA,
        frets: ['x', fretA, fretA + 2, fretA + 2, fretA + 2, fretA],
        fingers: [null, 1, 2, 3, 4, 1],
      });
    }
  }

  // Sort voicings so lowest fret is first
  voicings.sort((a, b) => a.baseFret - b.baseFret);
  // Re-label nicely Pos 1, Pos 2...
  return voicings.map((v, i) => ({
    ...v,
    positionName: v.baseFret === 1 && !v.positionName.includes('Fret') ? `Pos ${i + 1} (Open)` : `Pos ${i + 1} (fr. ${v.baseFret})`,
  }));
}

export function findChordDiagram(chordName: string): ChordDef | null {
  if (!chordName) return null;
  const raw = chordName.trim();
  const normalized = raw.toLowerCase();
  
  const found = CHORD_DATABASE.find((c) => {
    const dbName = c.name.toLowerCase();
    if (dbName === normalized) return true;
    if (dbName.replace(' major', '') === normalized) return true;
    if (dbName.replace(' minor', 'm') === normalized) return true;
    if (c.root.toLowerCase() === normalized && c.type === 'Major') return true;
    return false;
  });

  if (found) {
    return {
      ...found,
      voicings: getChordVoicings(chordName),
    };
  }

  const voicings = getChordVoicings(chordName);
  if (voicings.length > 0) {
    const v1 = voicings[0];
    return {
      name: chordName,
      root: chordName[0],
      type: chordName.includes('m') ? 'Minor' : 'Major',
      frets: v1.frets,
      fingers: v1.fingers,
      baseFret: v1.baseFret,
      voicings,
    };
  }

  return null;
}

interface ChordLibraryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const ChordLibraryModal: React.FC<ChordLibraryModalProps> = ({ isOpen = true, onClose, isEmbedded = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoot, setSelectedRoot] = useState<string>('ALL');

  if (!isOpen) return null;

  const roots = ['ALL', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];

  const filteredChords = CHORD_DATABASE.filter((chord) => {
    const matchesSearch = chord.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoot = selectedRoot === 'ALL' || chord.root === selectedRoot;
    return matchesSearch && matchesRoot;
  });

  const strumChord = (frets: (number | 'x')[]) => {
    // Strum all 6 strings sequentially with 30ms offset
    frets.forEach((fret, stringIdx) => {
      if (fret !== 'x') {
        const baseFreq = STANDARD_FREQS[stringIdx];
        const fretMultiplier = Math.pow(2, fret / 12);
        const chordNoteFreq = baseFreq * fretMultiplier;
        setTimeout(() => {
          playGuitarStringTone(chordNoteFreq, 1.8);
        }, stringIdx * 35);
      }
    });
  };

  if (!isOpen) return null;

  const content = (
    <div className={`relative w-full ${isEmbedded ? 'max-w-4xl h-full' : 'max-w-2xl max-h-[85vh]'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>CHORD DICTIONARY</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              AUDIO PREVIEW
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Essential guitar chords & interactive fretboard fingerings</p>
        </div>
        {!isEmbedded && onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search & Root Filter */}
      <div className="flex flex-col sm:flex-row gap-3 my-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search chord (e.g. Dm, C, G7)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {roots.map((root) => (
            <button
              key={root}
              onClick={() => setSelectedRoot(root)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedRoot === root
                  ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white border border-slate-300 dark:border-transparent'
              }`}
            >
              {root}
            </button>
          ))}
        </div>
      </div>

      {/* Chord Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-1">
        {filteredChords.map((chord) => (
          <div
            key={chord.name}
            className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{chord.name}</span>
              <button
                onClick={() => strumChord(chord.frets)}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer"
                title="Strum Chord"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

              {/* Fretboard SVG */}
              <div className="w-36 h-44 flex items-center justify-center">
                <svg viewBox="0 0 120 150" className="w-full h-full select-none">
                  {/* Nut line */}
                  <line x1="20" y1="20" x2="100" y2="20" stroke="#94a3b8" strokeWidth="4" />

                  {/* Frets (5 frets) */}
                  {[44, 68, 92, 116, 140].map((y) => (
                    <line key={y} x1="20" y1={y} x2="100" y2={y} stroke="#475569" strokeWidth="1.5" />
                  ))}

                  {/* Strings (6 strings: Low E on left to High E on right) */}
                  {[20, 36, 52, 68, 84, 100].map((x, idx) => (
                    <line
                      key={x}
                      x1={x}
                      y1="20"
                      x2={x}
                      y2="140"
                      stroke="#64748b"
                      strokeWidth={2.5 - idx * 0.3} // Low strings thicker!
                    />
                  ))}

                  {/* String Markers (X or O at the top) */}
                  {chord.frets.map((fret, sIdx) => {
                    const x = 20 + sIdx * 16;
                    if (fret === 'x') {
                      return (
                        <text
                          key={sIdx}
                          x={x}
                          y="14"
                          textAnchor="middle"
                          fill="#ef4444"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          ×
                        </text>
                      );
                    }
                    if (fret === 0) {
                      return (
                        <circle
                          key={sIdx}
                          cx={x}
                          cy="11"
                          r="3"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.5"
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Finger Dots */}
                  {chord.frets.map((fret, sIdx) => {
                    if (typeof fret === 'number' && fret > 0) {
                      const x = 20 + sIdx * 16;
                      const y = 20 + fret * 24 - 12;
                      const finger = chord.fingers[sIdx];

                      return (
                        <g key={sIdx}>
                          <circle cx={x} cy={y} r="6.5" fill="#10b981" />
                          {finger && (
                            <text
                              x={x}
                              y={y + 3}
                              textAnchor="middle"
                              fill="#000"
                              fontSize="8"
                              fontWeight="bold"
                            >
                              {finger}
                            </text>
                          )}
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (isEmbedded) {
    return <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      {content}
    </div>
  );
};
