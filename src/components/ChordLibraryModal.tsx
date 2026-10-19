import React, { useState } from 'react';
import { X, Volume2, Search } from 'lucide-react';
import { playGuitarStringTone } from '../audio/toneGenerator';

interface ChordDef {
  name: string;
  root: string;
  type: string;
  frets: (number | 'x')[]; // 6 strings: [E, A, D, G, B, E]
  fingers: (number | null)[]; // 1=index, 2=middle, 3=ring, 4=pinky
  baseFret?: number;
}

const CHORD_DATABASE: ChordDef[] = [
  // C family
  { name: 'C Major', root: 'C', type: 'Major', frets: ['x', 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  { name: 'C7', root: 'C', type: '7th', frets: ['x', 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  { name: 'Cadd9', root: 'C', type: 'Add9', frets: ['x', 3, 2, 0, 3, 3], fingers: [null, 2, 1, null, 3, 4] },
  { name: 'Cm', root: 'C', type: 'Minor', frets: ['x', 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1], baseFret: 3 },

  // D family
  { name: 'D Major', root: 'D', type: 'Major', frets: ['x', 'x', 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  { name: 'Dm', root: 'D', type: 'Minor', frets: ['x', 'x', 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  { name: 'D7', root: 'D', type: '7th', frets: ['x', 'x', 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
  { name: 'Dsus4', root: 'D', type: 'Sus4', frets: ['x', 'x', 0, 2, 3, 3], fingers: [null, null, null, 1, 3, 4] },

  // E family
  { name: 'E Major', root: 'E', type: 'Major', frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  { name: 'Em', root: 'E', type: 'Minor', frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  { name: 'E7', root: 'E', type: '7th', frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  { name: 'Em7', root: 'E', type: 'Minor 7th', frets: [0, 2, 2, 0, 3, 0], fingers: [null, 1, 2, null, 3, null] },

  // F family
  { name: 'F Major', root: 'F', type: 'Major', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1 },
  { name: 'Fm', root: 'F', type: 'Minor', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1 },

  // G family
  { name: 'G Major', root: 'G', type: 'Major', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  { name: 'G7', root: 'G', type: '7th', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  { name: 'Gsus4', root: 'G', type: 'Sus4', frets: [3, 'x', 0, 0, 1, 3], fingers: [3, null, null, null, 1, 4] },

  // A family
  { name: 'A Major', root: 'A', type: 'Major', frets: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  { name: 'Am', root: 'A', type: 'Minor', frets: ['x', 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  { name: 'A7', root: 'A', type: '7th', frets: ['x', 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  { name: 'Asus4', root: 'A', type: 'Sus4', frets: ['x', 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 3, null] },

  // B family
  { name: 'B Major', root: 'B', type: 'Major', frets: ['x', 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1], baseFret: 2 },
  { name: 'Bm', root: 'B', type: 'Minor', frets: ['x', 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], baseFret: 2 },
  { name: 'B7', root: 'B', type: '7th', frets: ['x', 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
];

// Open string frequencies in standard tuning: [E2, A2, D3, G3, B3, E4]
const STANDARD_FREQS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

interface ChordLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChordLibraryModal: React.FC<ChordLibraryModalProps> = ({ isOpen, onClose }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">CHORD DICTIONARY</h2>
            <p className="text-xs text-slate-400">Essential guitar chords & finger diagrams</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Root Filter */}
        <div className="flex flex-col sm:flex-row gap-3 my-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search chord (e.g. Dm, C, G7)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {roots.map((root) => (
              <button
                key={root}
                onClick={() => setSelectedRoot(root)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedRoot === root
                    ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
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
              className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-bold text-sm text-white">{chord.name}</span>
                <button
                  onClick={() => strumChord(chord.frets)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition"
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
    </div>
  );
};
