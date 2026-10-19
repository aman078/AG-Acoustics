export interface SongChordSection {
  sectionTitle: string; // "Verse 1", "Chorus", etc.
  lines: {
    lyrics: string;
    chords: { chord: string; position: number }[]; // position is character offset in lyrics
  }[];
}

export interface SongData {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  key: string;
  capo: string;
  tuning: string;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced' | string;
  allChords: string[];
  tabContent?: string;
  sections: SongChordSection[];
}

export const POPULAR_SONGS: SongData[] = [
  {
    id: 'perfect-ed-sheeran',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    key: 'G Major (Original Ab)',
    capo: 'Capo 1st Fret',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Easy',
    allChords: ['G', 'Em', 'C', 'D'],
    sections: [
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'I found a love for me',
            chords: [{ chord: 'G', position: 0 }, { chord: 'Em', position: 14 }]
          },
          {
            lyrics: 'Darling, just dive right in and follow my lead',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 28 }]
          },
          {
            lyrics: 'Well, I found a girl, beautiful and sweet',
            chords: [{ chord: 'G', position: 0 }, { chord: 'Em', position: 19 }]
          },
          {
            lyrics: 'Oh, I never knew you were the someone waiting for me',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 35 }]
          }
        ]
      },
      {
        sectionTitle: 'Pre-Chorus',
        lines: [
          {
            lyrics: "'Cause we were just kids when we fell in love",
            chords: [{ chord: 'G', position: 0 }]
          },
          {
            lyrics: 'Not knowing what it was',
            chords: [{ chord: 'Em', position: 0 }]
          },
          {
            lyrics: 'I will not give you up this time',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 15 }, { chord: 'D', position: 26 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus',
        lines: [
          {
            lyrics: 'Baby, I\'m dancing in the dark with you between my arms',
            chords: [{ chord: 'G', position: 0 }, { chord: 'Em', position: 22 }, { chord: 'C', position: 38 }]
          },
          {
            lyrics: 'Barefoot on the grass, listening to our favorite song',
            chords: [{ chord: 'D', position: 0 }, { chord: 'G', position: 22 }, { chord: 'Em', position: 35 }]
          },
          {
            lyrics: 'When you said you looked a mess, I whispered underneath my breath',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 33 }]
          },
          {
            lyrics: 'But you heard it, darling, you look perfect tonight',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 24 }, { chord: 'G', position: 40 }]
          }
        ]
      }
    ]
  },
  {
    id: 'yellow-coldplay',
    title: 'Yellow',
    artist: 'Coldplay',
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
    key: 'B Major',
    capo: 'No Capo',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Easy',
    allChords: ['G', 'D', 'C', 'Em'],
    sections: [
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'Look at the stars, look how they shine for you',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 18 }]
          },
          {
            lyrics: 'And everything you do, yeah they were all yellow',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 36 }]
          },
          {
            lyrics: 'I came along, I wrote a song for you',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 15 }]
          },
          {
            lyrics: 'And all the things you do, and it was called Yellow',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 39 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus',
        lines: [
          {
            lyrics: 'Your skin, oh yeah your skin and bones',
            chords: [{ chord: 'C', position: 0 }, { chord: 'Em', position: 24 }]
          },
          {
            lyrics: 'Turn into something beautiful',
            chords: [{ chord: 'D', position: 0 }, { chord: 'C', position: 15 }]
          },
          {
            lyrics: 'You know, you know I love you so',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'D', position: 17 }]
          }
        ]
      }
    ]
  },
  {
    id: 'wonderwall-oasis',
    title: 'Wonderwall',
    artist: 'Oasis',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    key: 'F#m (Original)',
    capo: 'Capo 2nd Fret',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Easy',
    allChords: ['Em7', 'G', 'Dsus4', 'A7sus4', 'C', 'D'],
    sections: [
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'Today is gonna be the day that they\'re gonna throw it back to you',
            chords: [{ chord: 'Em7', position: 0 }, { chord: 'G', position: 20 }, { chord: 'Dsus4', position: 40 }, { chord: 'A7sus4', position: 55 }]
          },
          {
            lyrics: 'By now you should\'ve somehow realized what you gotta do',
            chords: [{ chord: 'Em7', position: 0 }, { chord: 'G', position: 20 }, { chord: 'Dsus4', position: 35 }, { chord: 'A7sus4', position: 50 }]
          },
          {
            lyrics: 'I don\'t believe that anybody feels the way I do about you now',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 25 }, { chord: 'Em7', position: 45 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus',
        lines: [
          {
            lyrics: '\'Cause maybe, you\'re gonna be the one that saves me',
            chords: [{ chord: 'C', position: 0 }, { chord: 'Em7', position: 13 }, { chord: 'G', position: 32 }, { chord: 'Em7', position: 44 }]
          },
          {
            lyrics: 'And after all, you\'re my wonderwall',
            chords: [{ chord: 'C', position: 0 }, { chord: 'Em7', position: 13 }, { chord: 'G', position: 24 }, { chord: 'Em7', position: 32 }]
          }
        ]
      }
    ]
  },
  {
    id: 'knockin-on-heavens-door-bob-dylan',
    title: "Knockin' On Heaven's Door",
    artist: 'Bob Dylan',
    albumArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80',
    key: 'G Major',
    capo: 'No Capo',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Easy',
    allChords: ['G', 'D', 'Am', 'C'],
    sections: [
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'Mama, take this badge off of me',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'Am', position: 25 }]
          },
          {
            lyrics: "I can't use it anymore",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 10 }, { chord: 'C', position: 18 }]
          },
          {
            lyrics: "It's gettin' dark, too dark to see",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'Am', position: 25 }]
          },
          {
            lyrics: "Feel like I'm knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'C', position: 26 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 1',
        lines: [
          {
            lyrics: "Knock, knock, knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'Am', position: 26 }]
          },
          {
            lyrics: "Knock, knock, knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'C', position: 26 }]
          },
          {
            lyrics: "Knock, knock, knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'Am', position: 26 }]
          },
          {
            lyrics: "Knock, knock, knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'C', position: 26 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 2',
        lines: [
          {
            lyrics: 'Mama, put my guns in the ground',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'Am', position: 24 }]
          },
          {
            lyrics: "I can't shoot them anymore",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 10 }, { chord: 'C', position: 20 }]
          },
          {
            lyrics: "That long black cloud is comin' down",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 15 }, { chord: 'Am', position: 29 }]
          },
          {
            lyrics: "I feel like I'm knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 14 }, { chord: 'C', position: 28 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 2 & Outro',
        lines: [
          {
            lyrics: "Knock, knock, knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'Am', position: 26 }]
          },
          {
            lyrics: "Knock, knock, knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'C', position: 26 }]
          },
          {
            lyrics: "Oooh, yeah, yeah, yeah, knockin' on heaven's door",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 15 }, { chord: 'Am', position: 35 }]
          },
          {
            lyrics: "Knock, knock, knockin' on heaven's door (fade out)",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'C', position: 26 }]
          }
        ]
      }
    ]
  },
  {
    id: 'hotel-california-eagles',
    title: 'Hotel California',
    artist: 'Eagles',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    key: 'Bm',
    capo: 'Capo 7th Fret (for easy open chords) or No Capo',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Intermediate',
    allChords: ['Bm', 'F#', 'A', 'E', 'G', 'D', 'Em'],
    sections: [
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'On a dark desert highway, cool wind in my hair',
            chords: [{ chord: 'Bm', position: 0 }, { chord: 'F#', position: 22 }]
          },
          {
            lyrics: 'Warm smell of colitas, rising up through the air',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 23 }]
          },
          {
            lyrics: 'Up ahead in the distance, I saw a shimmering light',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 24 }]
          },
          {
            lyrics: 'My head grew heavy and my sight grew dim, I had to stop for the night',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 36 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus',
        lines: [
          {
            lyrics: 'Welcome to the Hotel California',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 15 }]
          },
          {
            lyrics: 'Such a lovely place (such a lovely place), such a lovely face',
            chords: [{ chord: 'F#', position: 0 }, { chord: 'Bm', position: 35 }]
          },
          {
            lyrics: 'Plenty of room at the Hotel California',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 18 }]
          },
          {
            lyrics: 'Any time of year, you can find it here',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 20 }]
          }
        ]
      }
    ]
  },
  {
    id: 'im-yours-jason-mraz',
    title: "I'm Yours",
    artist: 'Jason Mraz',
    albumArt: 'https://images.unsplash.com/photo-1520523839898-5071282543e1?w=200&auto=format&fit=crop&q=80',
    key: 'B Major',
    capo: 'Capo 4th Fret',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Easy',
    allChords: ['G', 'D', 'Em', 'C'],
    sections: [
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'Well, you done done me and you bet I felt it',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 23 }]
          },
          {
            lyrics: 'I tried to be chill, but you\'re so hot that I melted',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'C', position: 25 }]
          },
          {
            lyrics: 'I fell right through the cracks, and now I\'m tryin\' to get back',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 31 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus',
        lines: [
          {
            lyrics: 'It cannot wait, I\'m yours',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 14 }]
          },
          {
            lyrics: 'No need to complicate, our time is short, this is our fate, I\'m yours',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'C', position: 27 }, { chord: 'G', position: 58 }]
          }
        ]
      }
    ]
  }
];

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  // Match root (e.g. F# or Bb or C)
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  let root = match[1];
  const suffix = match[2];

  // Convert flats to sharps
  const flatToSharp: { [k: string]: string } = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  if (flatToSharp[root]) root = flatToSharp[root];

  const idx = NOTES.indexOf(root);
  if (idx === -1) return chord;

  const newIdx = (idx + semitones + 12 * 10) % 12;
  return NOTES[newIdx] + suffix;
}

export interface CapoRecommendation {
  fret: number;
  openShapeKey: string;
  recommendation: string;
}

/**
 * Calculates optimal acoustic capo placement for comfortable open chord voicings
 */
export function calculateSmartCapo(originalKey: string, semitones = 0): CapoRecommendation | null {
  if (!originalKey) return null;
  const match = originalKey.match(/^([A-G][#b]?)/);
  if (!match) return null;

  let root = match[1];
  const isMinor = originalKey.toLowerCase().includes('m') && !originalKey.toLowerCase().includes('major');

  const flatToSharp: { [k: string]: string } = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  };
  if (flatToSharp[root]) root = flatToSharp[root];

  const idx = NOTES.indexOf(root);
  if (idx === -1) return null;

  const targetIdx = (idx + semitones + 12 * 10) % 12;
  const targetNote = NOTES[targetIdx];

  // Preferred open acoustic shapes
  const openShapes = isMinor
    ? [
        { shape: 'Em', baseIdx: 4 },
        { shape: 'Am', baseIdx: 9 },
        { shape: 'Dm', baseIdx: 2 },
      ]
    : [
        { shape: 'G', baseIdx: 7 },
        { shape: 'C', baseIdx: 0 },
        { shape: 'D', baseIdx: 2 },
        { shape: 'E', baseIdx: 4 },
        { shape: 'A', baseIdx: 9 },
      ];

  // Check if targetNote is already a natural open shape
  for (const s of openShapes) {
    if (s.baseIdx === targetIdx) {
      return {
        fret: 0,
        openShapeKey: s.shape,
        recommendation: `Play open in ${targetNote}${isMinor ? 'm' : ''} with open chords`,
      };
    }
  }

  // Find best capo placement between fret 1 and 5
  let bestCapo: { fret: number; shape: string } | null = null;
  for (const s of openShapes) {
    const fret = (targetIdx - s.baseIdx + 12) % 12;
    if (fret > 0 && fret <= 5) {
      if (!bestCapo || fret < bestCapo.fret) {
        bestCapo = { fret, shape: s.shape };
      }
    }
  }

  if (bestCapo) {
    return {
      fret: bestCapo.fret,
      openShapeKey: bestCapo.shape,
      recommendation: `Capo Fret ${bestCapo.fret} to play open ${bestCapo.shape} shapes`,
    };
  }

  return null;
}

