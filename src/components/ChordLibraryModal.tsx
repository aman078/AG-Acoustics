import React, { useState, useMemo } from 'react';
import { X, Volume2, Search, Sparkles } from 'lucide-react';
import { playGuitarStringTone } from '../audio/toneGenerator';

export interface ChordVoicing {
  positionName: string; // e.g. "Pos 1 (Open)", "Pos 2 (fr. 8)"
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
 * Complete Professional Chord Database covering all 12 chromatic roots
 */
export const CHORD_DATABASE: ChordDef[] = [
  // ==========================================
  // --- C FAMILY ---
  // ==========================================
  { name: 'C Major', root: 'C', type: 'Major', frets: ['x', 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] },
  { name: 'Cm', root: 'C', type: 'Minor', frets: ['x', 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1], baseFret: 3 },
  { name: 'C7', root: 'C', type: '7th', frets: ['x', 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null] },
  { name: 'Cmaj7', root: 'C', type: 'Maj7', frets: ['x', 3, 2, 0, 0, 0], fingers: [null, 3, 2, null, null, null] },
  { name: 'Cm7', root: 'C', type: 'm7', frets: ['x', 3, 5, 3, 4, 3], fingers: [null, 1, 3, 1, 2, 1], baseFret: 3 },
  { name: 'Csus4', root: 'C', type: 'Sus4', frets: ['x', 3, 3, 0, 1, 1], fingers: [null, 3, 4, null, 1, 1] },
  { name: 'Csus2', root: 'C', type: 'Sus2', frets: ['x', 3, 0, 0, 1, 0], fingers: [null, 3, null, null, 1, null] },
  { name: 'Cadd9', root: 'C', type: 'Add9', frets: ['x', 3, 2, 0, 3, 3], fingers: [null, 2, 1, null, 3, 4] },
  { name: 'Cdim', root: 'C', type: 'Dim', frets: ['x', 3, 4, 2, 4, 'x'], fingers: [null, 2, 3, 1, 4, null], baseFret: 2 },
  { name: 'C6', root: 'C', type: '6th', frets: ['x', 3, 2, 2, 1, 0], fingers: [null, 3, 2, 2, 1, null] },
  { name: 'Caug', root: 'C', type: 'Aug', frets: ['x', 3, 2, 1, 1, 0], fingers: [null, 3, 2, 1, 1, null] },

  // ==========================================
  // --- C# / Db FAMILY ---
  // ==========================================
  { name: 'C# Major', root: 'C#', type: 'Major', frets: ['x', 4, 6, 6, 6, 4], fingers: [null, 1, 2, 3, 4, 1], baseFret: 4 },
  { name: 'C#m', root: 'C#', type: 'Minor', frets: ['x', 4, 6, 6, 5, 4], fingers: [null, 1, 3, 4, 2, 1], baseFret: 4 },
  { name: 'C#7', root: 'C#', type: '7th', frets: ['x', 4, 6, 4, 6, 4], fingers: [null, 1, 3, 1, 4, 1], baseFret: 4 },
  { name: 'C#maj7', root: 'C#', type: 'Maj7', frets: ['x', 4, 6, 5, 6, 4], fingers: [null, 1, 3, 2, 4, 1], baseFret: 4 },
  { name: 'C#m7', root: 'C#', type: 'm7', frets: ['x', 4, 6, 4, 5, 4], fingers: [null, 1, 3, 1, 2, 1], baseFret: 4 },
  { name: 'C#sus4', root: 'C#', type: 'Sus4', frets: ['x', 4, 6, 6, 7, 4], fingers: [null, 1, 2, 3, 4, 1], baseFret: 4 },
  { name: 'C#sus2', root: 'C#', type: 'Sus2', frets: ['x', 4, 6, 6, 4, 4], fingers: [null, 1, 3, 4, 1, 1], baseFret: 4 },
  { name: 'C#add9', root: 'C#', type: 'Add9', frets: ['x', 4, 3, 6, 4, 4], fingers: [null, 2, 1, 4, 2, 2], baseFret: 3 },
  { name: 'C#dim', root: 'C#', type: 'Dim', frets: ['x', 'x', 2, 3, 2, 3], fingers: [null, null, 1, 3, 2, 4], baseFret: 2 },

  // ==========================================
  // --- D FAMILY ---
  // ==========================================
  { name: 'D Major', root: 'D', type: 'Major', frets: ['x', 'x', 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2] },
  { name: 'Dm', root: 'D', type: 'Minor', frets: ['x', 'x', 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1] },
  { name: 'D7', root: 'D', type: '7th', frets: ['x', 'x', 0, 2, 1, 2], fingers: [null, null, null, 2, 1, 3] },
  { name: 'Dmaj7', root: 'D', type: 'Maj7', frets: ['x', 'x', 0, 2, 2, 2], fingers: [null, null, null, 1, 1, 1] },
  { name: 'Dm7', root: 'D', type: 'm7', frets: ['x', 'x', 0, 2, 1, 1], fingers: [null, null, null, 2, 1, 1] },
  { name: 'Dsus4', root: 'D', type: 'Sus4', frets: ['x', 'x', 0, 2, 3, 3], fingers: [null, null, null, 1, 3, 4] },
  { name: 'Dsus2', root: 'D', type: 'Sus2', frets: ['x', 'x', 0, 2, 3, 0], fingers: [null, null, null, 1, 3, null] },
  { name: 'Dadd9', root: 'D', type: 'Add9', frets: ['x', 5, 4, 0, 3, 0], fingers: [null, 3, 2, null, 1, null] },
  { name: 'Ddim', root: 'D', type: 'Dim', frets: ['x', 'x', 0, 1, 3, 1], fingers: [null, null, null, 1, 3, 2] },
  { name: 'D6', root: 'D', type: '6th', frets: ['x', 'x', 0, 2, 0, 2], fingers: [null, null, null, 1, null, 2] },
  { name: 'Daug', root: 'D', type: 'Aug', frets: ['x', 'x', 0, 3, 3, 2], fingers: [null, null, null, 2, 3, 1] },

  // ==========================================
  // --- D# / Eb FAMILY ---
  // ==========================================
  { name: 'Eb Major', root: 'D#', type: 'Major', frets: ['x', 6, 8, 8, 8, 6], fingers: [null, 1, 2, 3, 4, 1], baseFret: 6 },
  { name: 'Ebm', root: 'D#', type: 'Minor', frets: ['x', 6, 8, 8, 7, 6], fingers: [null, 1, 3, 4, 2, 1], baseFret: 6 },
  { name: 'Eb7', root: 'D#', type: '7th', frets: ['x', 6, 8, 6, 8, 6], fingers: [null, 1, 3, 1, 4, 1], baseFret: 6 },
  { name: 'Ebmaj7', root: 'D#', type: 'Maj7', frets: ['x', 6, 8, 7, 8, 6], fingers: [null, 1, 3, 2, 4, 1], baseFret: 6 },
  { name: 'Ebm7', root: 'D#', type: 'm7', frets: ['x', 6, 8, 6, 7, 6], fingers: [null, 1, 3, 1, 2, 1], baseFret: 6 },
  { name: 'Ebsus4', root: 'D#', type: 'Sus4', frets: ['x', 6, 8, 8, 9, 6], fingers: [null, 1, 2, 3, 4, 1], baseFret: 6 },
  { name: 'Ebsus2', root: 'D#', type: 'Sus2', frets: ['x', 6, 8, 8, 6, 6], fingers: [null, 1, 3, 4, 1, 1], baseFret: 6 },
  { name: 'Ebadd9', root: 'D#', type: 'Add9', frets: ['x', 6, 5, 8, 6, 6], fingers: [null, 2, 1, 4, 2, 2], baseFret: 5 },
  { name: 'Ebdim', root: 'D#', type: 'Dim', frets: ['x', 'x', 1, 2, 1, 2], fingers: [null, null, 1, 3, 2, 4], baseFret: 1 },

  // ==========================================
  // --- E FAMILY ---
  // ==========================================
  { name: 'E Major', root: 'E', type: 'Major', frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null] },
  { name: 'Em', root: 'E', type: 'Minor', frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null] },
  { name: 'E7', root: 'E', type: '7th', frets: [0, 2, 0, 1, 0, 0], fingers: [null, 2, null, 1, null, null] },
  { name: 'Emaj7', root: 'E', type: 'Maj7', frets: [0, 2, 1, 1, 0, 0], fingers: [null, 3, 1, 2, null, null] },
  { name: 'Em7', root: 'E', type: 'm7', frets: [0, 2, 2, 0, 3, 0], fingers: [null, 1, 2, null, 3, null] },
  { name: 'Esus4', root: 'E', type: 'Sus4', frets: [0, 2, 2, 2, 0, 0], fingers: [null, 2, 3, 4, null, null] },
  { name: 'Esus2', root: 'E', type: 'Sus2', frets: [0, 2, 4, 4, 0, 0], fingers: [null, 1, 3, 4, null, null] },
  { name: 'Eadd9', root: 'E', type: 'Add9', frets: [0, 2, 4, 1, 0, 0], fingers: [null, 2, 4, 1, null, null] },
  { name: 'Edim', root: 'E', type: 'Dim', frets: ['x', 'x', 2, 3, 2, 3], fingers: [null, null, 1, 3, 2, 4], baseFret: 2 },
  { name: 'E6', root: 'E', type: '6th', frets: [0, 2, 2, 1, 2, 0], fingers: [null, 2, 3, 1, 4, null] },
  { name: 'Eaug', root: 'E', type: 'Aug', frets: [0, 3, 2, 1, 1, 0], fingers: [null, 3, 2, 1, 1, null] },

  // ==========================================
  // --- F FAMILY ---
  // ==========================================
  { name: 'F Major', root: 'F', type: 'Major', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1 },
  { name: 'Fm', root: 'F', type: 'Minor', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1 },
  { name: 'F7', root: 'F', type: '7th', frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1 },
  { name: 'Fmaj7', root: 'F', type: 'Maj7', frets: ['x', 3, 3, 2, 1, 0], fingers: [null, 3, 4, 2, 1, null] },
  { name: 'Fm7', root: 'F', type: 'm7', frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], baseFret: 1 },
  { name: 'Fsus4', root: 'F', type: 'Sus4', frets: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], baseFret: 1 },
  { name: 'Fsus2', root: 'F', type: 'Sus2', frets: ['x', 'x', 3, 0, 1, 1], fingers: [null, null, 3, null, 1, 1] },
  { name: 'Fadd9', root: 'F', type: 'Add9', frets: [1, 3, 3, 2, 1, 3], fingers: [1, 3, 4, 2, 1, 4], baseFret: 1 },
  { name: 'Fdim', root: 'F', type: 'Dim', frets: ['x', 'x', 3, 4, 3, 4], fingers: [null, null, 1, 3, 2, 4], baseFret: 3 },
  { name: 'F6', root: 'F', type: '6th', frets: ['x', 'x', 3, 2, 3, 1], fingers: [null, null, 3, 2, 4, 1] },

  // ==========================================
  // --- F# / Gb FAMILY ---
  // ==========================================
  { name: 'F# Major', root: 'F#', type: 'Major', frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2 },
  { name: 'F#m', root: 'F#', type: 'Minor', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2 },
  { name: 'F#7', root: 'F#', type: '7th', frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2 },
  { name: 'F#maj7', root: 'F#', type: 'Maj7', frets: [2, 4, 3, 3, 2, 2], fingers: [1, 4, 2, 3, 1, 1], baseFret: 2 },
  { name: 'F#m7', root: 'F#', type: 'm7', frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2 },
  { name: 'F#sus4', root: 'F#', type: 'Sus4', frets: [2, 4, 4, 4, 2, 2], fingers: [1, 2, 3, 4, 1, 1], baseFret: 2 },
  { name: 'F#sus2', root: 'F#', type: 'Sus2', frets: ['x', 4, 4, 1, 2, 2], fingers: [null, 3, 4, 1, 2, 2], baseFret: 1 },
  { name: 'F#dim', root: 'F#', type: 'Dim', frets: ['x', 'x', 1, 2, 1, 2], fingers: [null, null, 1, 3, 2, 4], baseFret: 1 },

  // ==========================================
  // --- G FAMILY ---
  // ==========================================
  { name: 'G Major', root: 'G', type: 'Major', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3] },
  { name: 'Gm', root: 'G', type: 'Minor', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3 },
  { name: 'G7', root: 'G', type: '7th', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1] },
  { name: 'Gmaj7', root: 'G', type: 'Maj7', frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, null, null, null, 3] },
  { name: 'Gm7', root: 'G', type: 'm7', frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], baseFret: 3 },
  { name: 'Gsus4', root: 'G', type: 'Sus4', frets: [3, 'x', 0, 0, 1, 3], fingers: [3, null, null, null, 1, 4] },
  { name: 'Gsus2', root: 'G', type: 'Sus2', frets: [3, 0, 0, 0, 3, 3], fingers: [1, null, null, null, 3, 4] },
  { name: 'Gadd9', root: 'G', type: 'Add9', frets: [3, 2, 0, 2, 0, 3], fingers: [2, 1, null, 3, null, 4] },
  { name: 'Gdim', root: 'G', type: 'Dim', frets: ['x', 'x', 2, 3, 2, 3], fingers: [null, null, 1, 3, 2, 4], baseFret: 2 },
  { name: 'G6', root: 'G', type: '6th', frets: [3, 2, 0, 0, 0, 0], fingers: [2, 1, null, null, null, null] },
  { name: 'Gaug', root: 'G', type: 'Aug', frets: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, null, null, 4] },

  // ==========================================
  // --- G# / Ab FAMILY ---
  // ==========================================
  { name: 'Ab Major', root: 'G#', type: 'Major', frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4 },
  { name: 'Abm', root: 'G#', type: 'Minor', frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4 },
  { name: 'Ab7', root: 'G#', type: '7th', frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], baseFret: 4 },
  { name: 'Abmaj7', root: 'G#', type: 'Maj7', frets: [4, 6, 5, 5, 4, 4], fingers: [1, 4, 2, 3, 1, 1], baseFret: 4 },
  { name: 'Abm7', root: 'G#', type: 'm7', frets: [4, 6, 4, 4, 4, 4], fingers: [1, 3, 1, 1, 1, 1], baseFret: 4 },
  { name: 'Absus4', root: 'G#', type: 'Sus4', frets: [4, 6, 6, 6, 4, 4], fingers: [1, 2, 3, 4, 1, 1], baseFret: 4 },
  { name: 'Absus2', root: 'G#', type: 'Sus2', frets: ['x', 'x', 1, 1, 4, 4], fingers: [null, null, 1, 1, 3, 4], baseFret: 1 },
  { name: 'Abdim', root: 'G#', type: 'Dim', frets: ['x', 'x', 3, 4, 3, 4], fingers: [null, null, 1, 3, 2, 4], baseFret: 3 },

  // ==========================================
  // --- A FAMILY ---
  // ==========================================
  { name: 'A Major', root: 'A', type: 'Major', frets: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] },
  { name: 'Am', root: 'A', type: 'Minor', frets: ['x', 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null] },
  { name: 'A7', root: 'A', type: '7th', frets: ['x', 0, 2, 0, 2, 0], fingers: [null, null, 2, null, 3, null] },
  { name: 'Amaj7', root: 'A', type: 'Maj7', frets: ['x', 0, 2, 1, 2, 0], fingers: [null, null, 2, 1, 3, null] },
  { name: 'Am7', root: 'A', type: 'm7', frets: ['x', 0, 2, 0, 1, 0], fingers: [null, null, 2, null, 1, null] },
  { name: 'Asus4', root: 'A', type: 'Sus4', frets: ['x', 0, 2, 2, 3, 0], fingers: [null, null, 1, 2, 3, null] },
  { name: 'Asus2', root: 'A', type: 'Sus2', frets: ['x', 0, 2, 2, 0, 0], fingers: [null, null, 1, 2, null, null] },
  { name: 'Aadd9', root: 'A', type: 'Add9', frets: ['x', 0, 2, 4, 2, 0], fingers: [null, null, 1, 3, 2, null] },
  { name: 'Adim', root: 'A', type: 'Dim', frets: ['x', 0, 1, 2, 1, 'x'], fingers: [null, null, 1, 3, 2, null] },
  { name: 'A6', root: 'A', type: '6th', frets: ['x', 0, 2, 2, 2, 2], fingers: [null, null, 1, 1, 1, 1] },
  { name: 'Aaug', root: 'A', type: 'Aug', frets: ['x', 0, 3, 2, 2, 1], fingers: [null, null, 4, 2, 3, 1] },

  // ==========================================
  // --- A# / Bb FAMILY ---
  // ==========================================
  { name: 'Bb Major', root: 'A#', type: 'Major', frets: ['x', 1, 3, 3, 3, 1], fingers: [null, 1, 2, 3, 4, 1], baseFret: 1 },
  { name: 'Bbm', root: 'A#', type: 'Minor', frets: ['x', 1, 3, 3, 2, 1], fingers: [null, 1, 3, 4, 2, 1], baseFret: 1 },
  { name: 'Bb7', root: 'A#', type: '7th', frets: ['x', 1, 3, 1, 3, 1], fingers: [null, 1, 3, 1, 4, 1], baseFret: 1 },
  { name: 'Bbmaj7', root: 'A#', type: 'Maj7', frets: ['x', 1, 3, 2, 3, 1], fingers: [null, 1, 3, 2, 4, 1], baseFret: 1 },
  { name: 'Bbm7', root: 'A#', type: 'm7', frets: ['x', 1, 3, 1, 2, 1], fingers: [null, 1, 3, 1, 2, 1], baseFret: 1 },
  { name: 'Bbsus4', root: 'A#', type: 'Sus4', frets: ['x', 1, 3, 3, 4, 1], fingers: [null, 1, 2, 3, 4, 1], baseFret: 1 },
  { name: 'Bbsus2', root: 'A#', type: 'Sus2', frets: ['x', 1, 3, 3, 1, 1], fingers: [null, 1, 3, 4, 1, 1], baseFret: 1 },
  { name: 'Bbdim', root: 'A#', type: 'Dim', frets: ['x', 1, 2, 0, 2, 0], fingers: [null, 1, 2, null, 3, null] },

  // ==========================================
  // --- B FAMILY ---
  // ==========================================
  { name: 'B Major', root: 'B', type: 'Major', frets: ['x', 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1], baseFret: 2 },
  { name: 'Bm', root: 'B', type: 'Minor', frets: ['x', 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1], baseFret: 2 },
  { name: 'B7', root: 'B', type: '7th', frets: ['x', 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, null, 4] },
  { name: 'Bmaj7', root: 'B', type: 'Maj7', frets: ['x', 2, 4, 3, 4, 2], fingers: [null, 1, 3, 2, 4, 1], baseFret: 2 },
  { name: 'Bm7', root: 'B', type: 'm7', frets: ['x', 2, 0, 2, 0, 2], fingers: [null, 2, null, 3, null, 4] },
  { name: 'Bsus4', root: 'B', type: 'Sus4', frets: ['x', 2, 4, 4, 5, 2], fingers: [null, 1, 2, 3, 4, 1], baseFret: 2 },
  { name: 'Bsus2', root: 'B', type: 'Sus2', frets: ['x', 2, 4, 4, 2, 2], fingers: [null, 1, 3, 4, 1, 1], baseFret: 2 },
  { name: 'Badd9', root: 'B', type: 'Add9', frets: ['x', 2, 4, 4, 2, 2], fingers: [null, 1, 3, 4, 1, 1], baseFret: 2 },
  { name: 'Bdim', root: 'B', type: 'Dim', frets: ['x', 2, 3, 1, 3, 1], fingers: [null, 2, 3, 1, 4, 1], baseFret: 1 },
  { name: 'B6', root: 'B', type: '6th', frets: ['x', 2, 4, 4, 4, 4], fingers: [null, 1, 2, 3, 4, 4], baseFret: 2 },
];

/**
 * Returns multiple playable positions and voicings for any acoustic guitar chord
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

  // Check handcrafted open database first
  const dbMatches = CHORD_DATABASE.filter((c) => {
    const matchDb = c.name.toLowerCase();
    const cleanLower = clean.toLowerCase();
    return (
      matchDb === cleanLower ||
      matchDb.replace(' major', '') === cleanLower ||
      matchDb.replace(' minor', 'm') === cleanLower
    );
  });

  if (dbMatches.length > 0) {
    const primary = dbMatches[0];
    voicings.push({
      positionName: (primary.baseFret || 1) === 1 ? 'Pos 1 (Open)' : `Pos 1 (fr. ${primary.baseFret})`,
      baseFret: primary.baseFret || 1,
      frets: primary.frets,
      fingers: primary.fingers,
    });
  }

  const isMinor = quality.startsWith('m') && !quality.startsWith('maj');
  const is7th = quality.includes('7') && !quality.includes('maj7');
  const isMaj7 = quality.includes('maj7');
  const isSus4 = quality.includes('sus4') || quality === 'sus';
  const isSus2 = quality.includes('sus2');

  // Compute Barre Voicing 1: Root on 6th String (E-shape Barre)
  const fretE = (rootIdx - 4 + 12) % 12;
  if (fretE > 0) {
    if (isMinor) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretE})`,
        baseFret: fretE,
        frets: [fretE, fretE + 2, fretE + 2, fretE, fretE, fretE],
        fingers: [1, 3, 4, 1, 1, 1],
      });
    } else if (is7th) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretE})`,
        baseFret: fretE,
        frets: [fretE, fretE + 2, fretE, fretE + 1, fretE, fretE],
        fingers: [1, 3, 1, 2, 1, 1],
      });
    } else if (isSus4) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretE})`,
        baseFret: fretE,
        frets: [fretE, fretE + 2, fretE + 2, fretE + 2, fretE, fretE],
        fingers: [1, 2, 3, 4, 1, 1],
      });
    } else {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretE})`,
        baseFret: fretE,
        frets: [fretE, fretE + 2, fretE + 2, fretE + 1, fretE, fretE],
        fingers: [1, 3, 4, 2, 1, 1],
      });
    }
  }

  // Compute Barre Voicing 2: Root on 5th String (A-shape Barre)
  const fretA = (rootIdx - 9 + 12) % 12;
  if (fretA > 0) {
    if (isMinor) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretA})`,
        baseFret: fretA,
        frets: ['x', fretA, fretA + 2, fretA + 2, fretA + 1, fretA],
        fingers: [null, 1, 3, 4, 2, 1],
      });
    } else if (is7th) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretA})`,
        baseFret: fretA,
        frets: ['x', fretA, fretA + 2, fretA, fretA + 2, fretA],
        fingers: [null, 1, 3, 1, 4, 1],
      });
    } else if (isSus4) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretA})`,
        baseFret: fretA,
        frets: ['x', fretA, fretA + 2, fretA + 2, fretA + 3, fretA],
        fingers: [null, 1, 2, 3, 4, 1],
      });
    } else if (isSus2) {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretA})`,
        baseFret: fretA,
        frets: ['x', fretA, fretA + 2, fretA + 2, fretA, fretA],
        fingers: [null, 1, 3, 4, 1, 1],
      });
    } else {
      voicings.push({
        positionName: `Pos ${voicings.length + 1} (fr. ${fretA})`,
        baseFret: fretA,
        frets: ['x', fretA, fretA + 2, fretA + 2, fretA + 2, fretA],
        fingers: [null, 1, 2, 3, 4, 1],
      });
    }
  }

  // Deduplicate and sort by base fret
  const seenFret = new Set<string>();
  const uniqueVoicings: ChordVoicing[] = [];
  for (const v of voicings) {
    const key = `${v.baseFret}-${v.frets.join(',')}`;
    if (!seenFret.has(key)) {
      seenFret.add(key);
      uniqueVoicings.push(v);
    }
  }

  uniqueVoicings.sort((a, b) => a.baseFret - b.baseFret);
  return uniqueVoicings.map((v, i) => ({
    ...v,
    positionName: v.baseFret === 1 ? `Pos ${i + 1} (Open)` : `Pos ${i + 1} (fr. ${v.baseFret})`,
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

export const ChordLibraryModal: React.FC<ChordLibraryModalProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoot, setSelectedRoot] = useState<string>('ALL');
  const [selectedQuality, setSelectedQuality] = useState<string>('ALL');
  const [selectedVoicingMap, setSelectedVoicingMap] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const ROOTS = ['ALL', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const QUALITY_FILTERS = ['ALL', 'Major', 'Minor', '7th', 'Maj7', 'm7', 'Sus4', 'Sus2', 'Add9', 'Dim'];

  // Normalize voice-to-text / speech recognition search terms
  const normalizedSearch = searchTerm
    .trim()
    .toLowerCase()
    .replace(/\bsearch\s*four\b/gi, 'sus4')
    .replace(/\bsearch\s*4\b/gi, 'sus4')
    .replace(/\bsus\s*four\b/gi, 'sus4')
    .replace(/\bsus\s*4\b/gi, 'sus4')
    .replace(/\bsearch\s*two\b/gi, 'sus2')
    .replace(/\bsearch\s*2\b/gi, 'sus2')
    .replace(/\bsus\s*two\b/gi, 'sus2')
    .replace(/\bsus\s*2\b/gi, 'sus2');

  const filteredChords = useMemo(() => {
    return CHORD_DATABASE.filter((chord) => {
      // 1. Root matching (supports enharmonics like Db for C#, etc.)
      const matchesRoot =
        selectedRoot === 'ALL' ||
        chord.root === selectedRoot ||
        (selectedRoot === 'C#' && chord.name.includes('Db')) ||
        (selectedRoot === 'D#' && chord.name.includes('Eb')) ||
        (selectedRoot === 'F#' && chord.name.includes('Gb')) ||
        (selectedRoot === 'G#' && chord.name.includes('Ab')) ||
        (selectedRoot === 'A#' && chord.name.includes('Bb'));

      // 2. Quality matching
      const matchesQuality =
        selectedQuality === 'ALL' ||
        chord.type.toLowerCase() === selectedQuality.toLowerCase() ||
        (selectedQuality === 'Minor' && chord.type.toLowerCase() === 'minor') ||
        (selectedQuality === 'Major' && chord.type.toLowerCase() === 'major');

      // 3. Search query matching
      if (!normalizedSearch) {
        return matchesRoot && matchesQuality;
      }

      const chordNameClean = chord.name.toLowerCase();
      const chordTypeClean = chord.type.toLowerCase();
      const chordRootClean = chord.root.toLowerCase();

      // Support searches like "sus4", "Csus4", "C sus4", "m7", "minor", etc.
      const matchesSearch =
        chordNameClean.includes(normalizedSearch) ||
        chordTypeClean.includes(normalizedSearch) ||
        chordNameClean.replace(/\s+/g, '').includes(normalizedSearch.replace(/\s+/g, '')) ||
        (normalizedSearch === 'sus' && chordTypeClean.includes('sus')) ||
        (normalizedSearch === 'm' && chordTypeClean === 'minor') ||
        (normalizedSearch.startsWith(chordRootClean) && chordTypeClean.includes(normalizedSearch.slice(chordRootClean.length).trim()));

      return matchesRoot && matchesQuality && matchesSearch;
    });
  }, [selectedRoot, selectedQuality, normalizedSearch]);

  const handleStrum = (frets: (number | 'x')[], baseFret = 1) => {
    strumChordVoicing(frets, baseFret);
  };

  const content = (
    <div className={`relative w-full ${isEmbedded ? 'max-w-4xl h-full' : 'max-w-4xl max-h-[90vh]'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col overflow-hidden transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>CHORD DICTIONARY</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/30 font-semibold">
              {filteredChords.length} CHORDS
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acoustic guitar chord library with interactive positions & audio previews
          </p>
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

      {/* Filter Controls Bar */}
      <div className="flex flex-col gap-2.5 my-3 shrink-0">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search any chord (e.g. Sus4, Cadd9, Dm7, F#m, B7)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-9.5 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#f15a24] transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Root Notes Scrollable Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">
            ROOT:
          </span>
          {ROOTS.map((root) => {
            const isActive = selectedRoot === root;
            return (
              <button
                key={root}
                onClick={() => setSelectedRoot(root)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#f15a24] text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white border border-slate-200 dark:border-transparent'
                }`}
              >
                {root}
              </button>
            );
          })}
        </div>

        {/* Quality Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">
            TYPE:
          </span>
          {QUALITY_FILTERS.map((quality) => {
            const isActive = selectedQuality === quality;
            return (
              <button
                key={quality}
                onClick={() => setSelectedQuality(quality)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#f15a24] text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:text-white'
                }`}
              >
                {quality}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chords Grid Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredChords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-semibold">No chords found for "{searchTerm}"</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Try selecting "ALL" root or clearing the search filter above to view all variations.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRoot('ALL');
                setSelectedQuality('ALL');
              }}
              className="mt-3 px-3 py-1.5 rounded-xl bg-[#f15a24] text-white text-xs font-bold shadow-md hover:bg-[#d94816] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredChords.map((chord) => {
              const voicings = getChordVoicings(chord.name);
              const activeVoicingIndex = selectedVoicingMap[chord.name] || 0;
              const activeVoicing = voicings[activeVoicingIndex] || {
                positionName: 'Pos 1 (Open)',
                baseFret: chord.baseFret || 1,
                frets: chord.frets,
                fingers: chord.fingers,
              };
              const baseFret = activeVoicing.baseFret || 1;

              return (
                <div
                  key={chord.name}
                  className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 flex flex-col items-center hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs"
                >
                  {/* Top Chord Title & Strum Action */}
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{chord.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#f15a24]/15 text-[#f15a24] dark:text-[#ff7a45] font-bold">
                          {chord.type}
                        </span>
                      </h4>
                    </div>

                    <button
                      onClick={() => handleStrum(activeVoicing.frets, activeVoicing.baseFret)}
                      className="p-1.5 rounded-lg bg-[#f15a24]/15 hover:bg-[#f15a24]/25 text-[#f15a24] dark:text-[#ff7a45] border border-[#f15a24]/30 transition cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold"
                      title="Strum Chord Voicing"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">STRUM</span>
                    </button>
                  </div>

                  {/* Multi-Position Voicing Pills */}
                  {voicings.length > 1 && (
                    <div className="flex items-center gap-1 w-full mb-2 p-0.5 bg-slate-200/60 dark:bg-slate-900 rounded-lg">
                      {voicings.map((v, vIdx) => {
                        const isSelected = vIdx === activeVoicingIndex;
                        return (
                          <button
                            key={vIdx}
                            onClick={() => {
                              setSelectedVoicingMap((prev) => ({ ...prev, [chord.name]: vIdx }));
                              handleStrum(v.frets, v.baseFret);
                            }}
                            className={`flex-1 py-0.5 px-1.5 rounded text-[10px] font-mono font-bold transition cursor-pointer truncate ${
                              isSelected
                                ? 'bg-[#f15a24] text-white shadow-xs font-extrabold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {v.positionName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Fretboard SVG (Accurately renders baseFret offsets & finger dots) */}
                  <div className="w-36 h-44 flex items-center justify-center select-none relative">
                    {/* Base Fret Badge when higher up neck */}
                    {baseFret > 1 && (
                      <span className="absolute top-3 left-0 text-[10px] font-mono font-bold text-[#f15a24] dark:text-[#ff7a45] bg-[#f15a24]/15 px-1 rounded">
                        fr.{baseFret}
                      </span>
                    )}

                    <svg viewBox="0 0 120 150" className="w-full h-full">
                      {/* Nut line: thick if fret 1, standard if up neck */}
                      <line
                        x1="20"
                        y1="22"
                        x2="100"
                        y2="22"
                        stroke={baseFret === 1 ? '#334155' : '#64748b'}
                        strokeWidth={baseFret === 1 ? 4 : 2}
                      />

                      {/* 5 Fret lines */}
                      {[46, 70, 94, 118, 142].map((y) => (
                        <line key={y} x1="20" y1={y} x2="100" y2={y} stroke="#64748b" strokeWidth="1.2" />
                      ))}

                      {/* 6 String lines (Low E to High e) */}
                      {[20, 36, 52, 68, 84, 100].map((x, idx) => (
                        <line
                          key={x}
                          x1={x}
                          y1="22"
                          x2={x}
                          y2="142"
                          stroke="#94a3b8"
                          strokeWidth={2.4 - idx * 0.3}
                        />
                      ))}

                      {/* Open / Mute Indicators */}
                      {activeVoicing.frets.map((fret, sIdx) => {
                        const x = 20 + sIdx * 16;
                        if (fret === 'x') {
                          return (
                            <text
                              key={sIdx}
                              x={x}
                              y="16"
                              textAnchor="middle"
                              fill="#ef4444"
                              fontSize="11"
                              fontWeight="bold"
                            >
                              ✕
                            </text>
                          );
                        }
                        if (fret === 0) {
                          return (
                            <circle
                              key={sIdx}
                              cx={x}
                              cy="13"
                              r="3.2"
                              fill="none"
                              stroke="#f15a24"
                              strokeWidth="1.5"
                            />
                          );
                        }
                        return null;
                      })}

                      {/* Finger Dots */}
                      {activeVoicing.frets.map((fret, sIdx) => {
                        if (typeof fret === 'number' && fret > 0) {
                          const relativeFret = fret - baseFret + 1;
                          if (relativeFret >= 1 && relativeFret <= 5) {
                            const x = 20 + sIdx * 16;
                            const y = 22 + relativeFret * 24 - 12;
                            const finger = activeVoicing.fingers[sIdx];

                            return (
                              <g key={sIdx}>
                                <circle cx={x} cy={y} r="6.5" fill="#f15a24" className="shadow-xs" />
                                {finger && (
                                  <text
                                    x={x}
                                    y={y + 3}
                                    textAnchor="middle"
                                    fill="#fff"
                                    fontSize="8"
                                    fontWeight="900"
                                    fontFamily="monospace"
                                  >
                                    {finger}
                                  </text>
                                )}
                              </g>
                            );
                          }
                        }
                        return null;
                      })}
                    </svg>
                  </div>

                  {/* String tuning notes */}
                  <div className="flex justify-between w-32 mt-0.5 px-1 text-[9px] font-mono text-slate-400 dark:text-slate-500">
                    <span>E</span><span>A</span><span>D</span><span>G</span><span>B</span><span>e</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
