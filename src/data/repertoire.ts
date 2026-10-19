export interface RepertoirePiece {
  id: string;
  title: string;
  artist: string;
  category: 'classical' | 'fingerstyle' | 'blues';
  tuning: string;
  key: string;
  capo: string;
  difficulty: 'Easy' | 'Intermediate' | 'Advanced';
  tempo: string;
  description: string;
  allChords: string[];
  sections: {
    sectionTitle: string;
    lines: {
      lyrics: string;
      chords: { chord: string; position: number }[];
    }[];
  }[];
}

export const REPERTOIRE_PIECES: RepertoirePiece[] = [
  // --- CLASSICAL ---
  {
    id: 'cuban-dance-brouwer',
    title: 'Cuban Dance (Danza Cubana)',
    artist: 'Traditional / Leo Brouwer',
    category: 'classical',
    tuning: 'Standard (E A D G B E)',
    key: 'A Minor / D Minor',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Allegretto (112 BPM)',
    description: 'Iconic afro-cuban syncopated classical study. Features habanera rhythm with rasgueado accents and melodic bass lines.',
    allChords: ['Am', 'E7', 'Dm', 'A7', 'C', 'G7'],
    sections: [
      {
        sectionTitle: 'Theme A - Habanera Syncopation',
        lines: [
          {
            lyrics: '| [Bass A pluck] - [Staccato triad] - [Habanera pulse] |',
            chords: [{ chord: 'Am', position: 2 }, { chord: 'E7', position: 20 }]
          },
          {
            lyrics: '| [Melodic descending run: E - D - C - B - A]        |',
            chords: [{ chord: 'Dm', position: 2 }, { chord: 'Am', position: 22 }]
          },
          {
            lyrics: '| [Arpeggiated cadence with thumb rest stroke]      |',
            chords: [{ chord: 'E7', position: 2 }, { chord: 'Am', position: 20 }]
          }
        ]
      },
      {
        sectionTitle: 'Theme B - Subdominant Modulation',
        lines: [
          {
            lyrics: '| [Turn to D minor: dynamic swell with thumb bass]  |',
            chords: [{ chord: 'A7', position: 2 }, { chord: 'Dm', position: 20 }]
          },
          {
            lyrics: '| [Syncopated rhythm: 3-3-2 habanera accentuation] |',
            chords: [{ chord: 'G7', position: 2 }, { chord: 'C', position: 20 }]
          },
          {
            lyrics: '| [Resolution to dominant E7 with full roll]        |',
            chords: [{ chord: 'E7', position: 2 }, { chord: 'Am', position: 20 }]
          }
        ]
      },
      {
        sectionTitle: 'Coda - Fast Rasgueado Strum',
        lines: [
          {
            lyrics: '| [Accelerando flourish finishing on crisp Am chord]|',
            chords: [{ chord: 'Dm', position: 2 }, { chord: 'E7', position: 16 }, { chord: 'Am', position: 30 }]
          }
        ]
      }
    ]
  },
  {
    id: 'romance-anonimo',
    title: 'Romance Anónimo (Spanish Romance)',
    artist: 'Traditional Spanish Classical',
    category: 'classical',
    tuning: 'Standard (E A D G B E)',
    key: 'E Minor / E Major',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Andante (84 BPM)',
    description: 'The definitive classical guitar study. Continuous triplets on high E string over moving bass notes using finger picking (p-a-m-i).',
    allChords: ['Em', 'Am', 'B7', 'E', 'G#m', 'F#m'],
    sections: [
      {
        sectionTitle: 'Part 1 - Minor Theme (E Minor)',
        lines: [
          {
            lyrics: '| 7-7-7 7-5-3 3-2-0 | Triplet melody on 1st string  |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'Am', position: 24 }]
          },
          {
            lyrics: '| 0-3-7 12-12-12 12-10-8 | High register reach      |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'B7', position: 26 }]
          },
          {
            lyrics: '| 8-7-5 5-7-8 7-8-7 | B7 barre on 2nd fret cadence   |',
            chords: [{ chord: 'Am', position: 2 }, { chord: 'B7', position: 22 }, { chord: 'Em', position: 38 }]
          }
        ]
      },
      {
        sectionTitle: 'Part 2 - Major Theme (E Major Modulation)',
        lines: [
          {
            lyrics: '| 4-4-4 4-2-0 0-0-0 | Bright switch to E Major       |',
            chords: [{ chord: 'E', position: 2 }, { chord: 'G#m', position: 22 }]
          },
          {
            lyrics: '| Bar 9th fret: 9-9-9 9-11-9 | Expressive rubato     |',
            chords: [{ chord: 'A', position: 2 }, { chord: 'F#m', position: 22 }, { chord: 'B7', position: 35 }]
          },
          {
            lyrics: '| Final gentle resolution to ringing harmonic E      |',
            chords: [{ chord: 'E', position: 2 }]
          }
        ]
      }
    ]
  },
  {
    id: 'bourree-in-e-minor',
    title: 'Bourrée in E Minor (BWV 996)',
    artist: 'Johann Sebastian Bach',
    category: 'classical',
    tuning: 'Standard (E A D G B E)',
    key: 'E Minor',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Vivace (138 BPM)',
    description: 'Bach’s most famous lute suite movement. Masterclass in two-voice counterpoint where thumb and fingers play independent melodies.',
    allChords: ['Em', 'D', 'G', 'C', 'B7', 'Am'],
    sections: [
      {
        sectionTitle: 'Section A - Counterpoint Opening',
        lines: [
          {
            lyrics: '| Upbeat pickup: G - F# | Walking bass meets soprano |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'D', position: 24 }]
          },
          {
            lyrics: '| Steady quarter-note bass line driving 8th-note run|',
            chords: [{ chord: 'G', position: 2 }, { chord: 'C', position: 18 }, { chord: 'B7', position: 32 }]
          },
          {
            lyrics: '| Cadence into relative major G with ornament        |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'B7', position: 20 }, { chord: 'G', position: 36 }]
          }
        ]
      },
      {
        sectionTitle: 'Section B - Harmonic Development',
        lines: [
          {
            lyrics: '| Chromatic bass ascension: C - C# - D - D#         |',
            chords: [{ chord: 'Am', position: 2 }, { chord: 'B7', position: 22 }]
          },
          {
            lyrics: '| Dramatic tension resolving to Em tonic chord       |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'C', position: 16 }, { chord: 'B7', position: 28 }, { chord: 'Em', position: 40 }]
          }
        ]
      }
    ]
  },
  {
    id: 'lagrima-tarrega',
    title: 'Lágrima (Preludio)',
    artist: 'Francisco Tárrega',
    category: 'classical',
    tuning: 'Standard (E A D G B E)',
    key: 'E Major / E Minor',
    capo: 'No Capo',
    difficulty: 'Easy',
    tempo: 'Andante Cantabile (68 BPM)',
    description: 'Poetic, expressive romantic miniature by Tárrega. Tender cantabile phrasing followed by a melancholic E minor middle section.',
    allChords: ['E', 'A', 'B7', 'F#m', 'Em', 'Am'],
    sections: [
      {
        sectionTitle: 'Theme A - E Major (Lyrical & Sweet)',
        lines: [
          {
            lyrics: '| Delicate melody played with ring finger (anular)  |',
            chords: [{ chord: 'E', position: 2 }, { chord: 'A', position: 22 }, { chord: 'B7', position: 36 }]
          },
          {
            lyrics: '| Glissando slide into sweet 7th position harmony    |',
            chords: [{ chord: 'E', position: 2 }, { chord: 'B7', position: 20 }, { chord: 'E', position: 34 }]
          }
        ]
      },
      {
        sectionTitle: 'Theme B - E Minor (Tearful Mood)',
        lines: [
          {
            lyrics: '| Somber mood shift with plaintive minor notes       |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'Am', position: 20 }, { chord: 'B7', position: 34 }]
          },
          {
            lyrics: '| Return Da Capo al Fine to warm major theme         |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'B7', position: 18 }, { chord: 'E', position: 32 }]
          }
        ]
      }
    ]
  },

  // --- FINGERSTYLE ---
  {
    id: 'dust-in-the-wind-kansas',
    title: 'Dust in the Wind',
    artist: 'Kansas',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'C Major',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Moderato (94 BPM)',
    description: 'The ultimate Travis picking benchmark. Steady alternating thumb between 5th and 4th strings with melodic index/middle pull-offs.',
    allChords: ['C', 'Cmaj7', 'Cadd9', 'Asus2', 'Asus4', 'Am', 'G/B', 'D/F#'],
    sections: [
      {
        sectionTitle: 'Intro - Travis Picking Master Pattern',
        lines: [
          {
            lyrics: '| C - Cmaj7 - Cadd9 - C | Asus2 - Asus4 - Am - Asus2 |',
            chords: [{ chord: 'C', position: 2 }, { chord: 'Cmaj7', position: 6 }, { chord: 'Cadd9', position: 14 }, { chord: 'Am', position: 26 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'I close my eyes only for a moment and the moment\'s gone',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G/B', position: 16 }, { chord: 'Am', position: 35 }, { chord: 'G', position: 52 }]
          },
          {
            lyrics: 'All my dreams pass before my eyes, a curiosity',
            chords: [{ chord: 'Dm', position: 0 }, { chord: 'Am', position: 24 }, { chord: 'G', position: 40 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus',
        lines: [
          {
            lyrics: 'Dust in the wind, all they are is dust in the wind',
            chords: [{ chord: 'D/F#', position: 0 }, { chord: 'G', position: 14 }, { chord: 'Am', position: 20 }, { chord: 'D/F#', position: 34 }, { chord: 'G', position: 42 }, { chord: 'Am', position: 47 }]
          }
        ]
      }
    ]
  },
  {
    id: 'blackbird-the-beatles',
    title: 'Blackbird',
    artist: 'The Beatles (Paul McCartney)',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'G Major',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Folk / Acoustic (94 BPM)',
    description: 'Inspired by Bach’s Bourrée. Simultaneous thumb plucking on bass while index finger flicks up on the high B/E strings with rhythmic foot tap.',
    allChords: ['G', 'Am7', 'G/B', 'C', 'C#dim', 'D', 'Em', 'Eb', 'A7'],
    sections: [
      {
        sectionTitle: 'Intro & Verse',
        lines: [
          {
            lyrics: 'Blackbird singing in the dead of night',
            chords: [{ chord: 'G', position: 0 }, { chord: 'Am7', position: 10 }, { chord: 'G/B', position: 20 }, { chord: 'G', position: 34 }]
          },
          {
            lyrics: 'Take these broken wings and learn to fly',
            chords: [{ chord: 'C', position: 0 }, { chord: 'C#dim', position: 12 }, { chord: 'D', position: 22 }, { chord: 'Em', position: 32 }, { chord: 'Eb', position: 37 }]
          },
          {
            lyrics: 'All your life, you were only waiting for this moment to arise',
            chords: [{ chord: 'D', position: 0 }, { chord: 'C#dim', position: 10 }, { chord: 'C', position: 16 }, { chord: 'Cm', position: 28 }, { chord: 'G/B', position: 38 }, { chord: 'A7', position: 46 }, { chord: 'D7', position: 52 }, { chord: 'G', position: 60 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus',
        lines: [
          {
            lyrics: 'Blackbird fly, blackbird fly, into the light of the dark black night',
            chords: [{ chord: 'F', position: 0 }, { chord: 'Em', position: 10 }, { chord: 'Dm', position: 15 }, { chord: 'C', position: 24 }, { chord: 'Bb', position: 32 }, { chord: 'C', position: 40 }]
          }
        ]
      }
    ]
  },
  {
    id: 'classical-gas-mason-williams',
    title: 'Classical Gas',
    artist: 'Mason Williams',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'A Minor',
    capo: 'No Capo',
    difficulty: 'Advanced',
    tempo: 'Presto (160 BPM)',
    description: 'The golden standard of solo fingerstyle acoustic guitar. Combines lightning syncopated bass lines with chord-melody cascades and rapid strums.',
    allChords: ['Am', 'Am7/G', 'F', 'Em', 'Dm', 'G', 'C', 'E7'],
    sections: [
      {
        sectionTitle: 'Theme 1 - Cascading Am Run',
        lines: [
          {
            lyrics: '| Fast bass descending: A - G - F - E in lightning tempo |',
            chords: [{ chord: 'Am', position: 2 }, { chord: 'Am7/G', position: 16 }, { chord: 'F', position: 28 }, { chord: 'Em', position: 36 }]
          },
          {
            lyrics: '| Dm roll to G with soaring high E string melody         |',
            chords: [{ chord: 'Dm', position: 2 }, { chord: 'G', position: 18 }, { chord: 'C', position: 32 }, { chord: 'E7', position: 44 }]
          }
        ]
      },
      {
        sectionTitle: 'Theme 2 - Staccato Accentuation',
        lines: [
          {
            lyrics: '| Percussive thumb tap on the soundboard on beats 2 & 4 |',
            chords: [{ chord: 'Am', position: 2 }, { chord: 'G', position: 20 }, { chord: 'F', position: 34 }, { chord: 'E7', position: 46 }]
          }
        ]
      }
    ]
  },
  {
    id: 'tears-in-heaven-clapton',
    title: 'Tears in Heaven',
    artist: 'Eric Clapton',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'A Major',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Andante (76 BPM)',
    description: 'Warm acoustic nylon-string fingerstyle masterwork. Features tasteful hammer-ons on the high strings with descending bass notes.',
    allChords: ['A', 'E/G#', 'F#m', 'A/E', 'D/F#', 'E7', 'C#m', 'Bm7'],
    sections: [
      {
        sectionTitle: 'Intro & Signature Lick',
        lines: [
          {
            lyrics: '| A - E/G# - F#m - A/E | D/F# - E7sus4 - A hammer-on |',
            chords: [{ chord: 'A', position: 2 }, { chord: 'E/G#', position: 6 }, { chord: 'F#m', position: 13 }, { chord: 'D/F#', position: 24 }, { chord: 'E7', position: 32 }, { chord: 'A', position: 42 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse',
        lines: [
          {
            lyrics: 'Would you know my name, if I saw you in heaven?',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E/G#', position: 12 }, { chord: 'F#m', position: 22 }, { chord: 'D', position: 30 }, { chord: 'A', position: 38 }, { chord: 'E', position: 44 }]
          },
          {
            lyrics: 'Would it be the same, if I saw you in heaven?',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E/G#', position: 12 }, { chord: 'F#m', position: 22 }, { chord: 'D', position: 30 }, { chord: 'A', position: 38 }, { chord: 'E', position: 44 }]
          }
        ]
      }
    ]
  },

  // --- DELTA BLUES & RAGTIME ---
  {
    id: 'cross-road-blues-robert-johnson',
    title: 'Cross Road Blues',
    artist: 'Robert Johnson',
    category: 'blues',
    tuning: 'Standard (E A D G B E) or Open D/G',
    key: 'E Delta Blues',
    capo: 'Capo 2nd Fret (Optional)',
    difficulty: 'Intermediate',
    tempo: 'Delta Shuffle (88 BPM)',
    description: 'The foundation of delta acoustic blues. Features walking monotonic thumb shuffle on the low E string with sliding triplet double-stops.',
    allChords: ['E7', 'A7', 'B7', 'E9'],
    sections: [
      {
        sectionTitle: 'Turnaround & Intro Lick',
        lines: [
          {
            lyrics: '| Sliding 6th intervals down from 12th fret: E - D - C# - B |',
            chords: [{ chord: 'E7', position: 2 }, { chord: 'B7', position: 38 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 1 - 12 Bar Delta Progression',
        lines: [
          {
            lyrics: 'I went to the crossroad, fell down on my knees',
            chords: [{ chord: 'E7', position: 0 }, { chord: 'A7', position: 24 }, { chord: 'E7', position: 40 }]
          },
          {
            lyrics: 'I went to the crossroad, fell down on my knees',
            chords: [{ chord: 'A7', position: 0 }, { chord: 'E7', position: 36 }]
          },
          {
            lyrics: 'Asked the Lord above, have mercy now, save poor Bob if you please',
            chords: [{ chord: 'B7', position: 0 }, { chord: 'A7', position: 22 }, { chord: 'E7', position: 42 }, { chord: 'B7', position: 60 }]
          }
        ]
      }
    ]
  },
  {
    id: 'freight-train-elizabeth-cotten',
    title: 'Freight Train',
    artist: 'Elizabeth Cotten',
    category: 'blues',
    tuning: 'Standard (E A D G B E)',
    key: 'C Major Piedmont Blues',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Piedmont Ragtime (108 BPM)',
    description: 'Piedmont ragtime blues benchmark ("Cotten Picking"). Alternating syncopated thumb bass between root and fifth with sweet treble melodies.',
    allChords: ['C', 'G7', 'E7', 'F'],
    sections: [
      {
        sectionTitle: 'Theme & Melody',
        lines: [
          {
            lyrics: 'Freight train, freight train, run so fast',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G7', position: 24 }]
          },
          {
            lyrics: 'Freight train, freight train, run so fast',
            chords: [{ chord: 'G7', position: 0 }, { chord: 'C', position: 24 }]
          },
          {
            lyrics: 'Please don\'t tell what train I\'m on',
            chords: [{ chord: 'E7', position: 0 }, { chord: 'F', position: 20 }]
          },
          {
            lyrics: 'So they won\'t know where I am gone',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G7', position: 15 }, { chord: 'C', position: 28 }]
          }
        ]
      }
    ]
  },
  {
    id: 'sweet-home-chicago-blues',
    title: 'Sweet Home Chicago',
    artist: 'Robert Johnson / Standard 12-Bar',
    category: 'blues',
    tuning: 'Standard (E A D G B E)',
    key: 'E Standard Blues',
    capo: 'No Capo',
    difficulty: 'Easy',
    tempo: 'Acoustic Shuffle (116 BPM)',
    description: 'The world standard 12-bar acoustic blues in E. Practice the famous blues boogie shuffle rhythm (root-5th to root-6th pulse).',
    allChords: ['E', 'E7', 'A', 'A7', 'B7'],
    sections: [
      {
        sectionTitle: 'Verse 1 - 12 Bar Blues in E',
        lines: [
          {
            lyrics: 'Come on, baby don\'t you want to go',
            chords: [{ chord: 'E7', position: 0 }]
          },
          {
            lyrics: 'Come on, baby don\'t you want to go',
            chords: [{ chord: 'A7', position: 0 }, { chord: 'E7', position: 25 }]
          },
          {
            lyrics: 'Back to that same old place, sweet home Chicago',
            chords: [{ chord: 'B7', position: 0 }, { chord: 'A7', position: 20 }, { chord: 'E7', position: 38 }, { chord: 'B7', position: 46 }]
          }
        ]
      }
    ]
  }
];
