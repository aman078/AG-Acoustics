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
  tabContent?: string;
  sections: {
    sectionTitle: string;
    lines: {
      lyrics: string;
      chords: { chord: string; position: number }[];
    }[];
  }[];
}

export const REPERTOIRE_PIECES: RepertoirePiece[] = [
  // ==========================================
  // --- FINGERSTYLE STANDARDS ---
  // ==========================================
  {
    id: 'dust-in-the-wind-kansas',
    title: 'Dust in the Wind',
    artist: 'Kansas (Kerry Livgren)',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'C Major',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Moderato (94 BPM)',
    description: 'The golden benchmark of Travis picking. Alternating thumb between 5th and 4th strings with melodic index/middle pull-offs across C, Cmaj7, Cadd9, Asus2, Asus4, Am.',
    allChords: ['C', 'Cmaj7', 'Cadd9', 'Asus2', 'Asus4', 'Am', 'G/B', 'D/F#', 'G', 'Dm'],
    tabContent: `[Intro - Travis Picking Master Pattern]
e|-----------------|-----------------|-----------------|-----------------|
B|-1-------1-------|-0-------0-------|-3-------3-------|-1-------1-------|
G|-----0-------0---|-----0-------0---|-----0-------0---|-----0-------0---|
D|---2-------2-----|---2-------2-----|---2-------2-----|---2-------2-----|
A|-3-----3---------|-3-----3---------|-3-----3---------|-3-----3---------|
E|-----------------|-----------------|-----------------|-----------------|
   C                 Cmaj7             Cadd9             C

e|-----------------|-----------------|-----------------|-----------------|
B|-0-------0-------|-3-------3-------|-1-------1-------|-0-------0-------|
G|-----2-------2---|-----2-------2---|-----2-------2---|-----2-------2---|
D|---2-------2-----|---2-------2-----|---2-------2-----|---2-------2-----|
A|-0-----0---------|-0-----0---------|-0-----0---------|-0-----0---------|
E|-----------------|-----------------|-----------------|-----------------|
   Asus2             Asus4             Am                Asus2

e|-----------------|-----------------|-----------------|-----------------|
B|-3-------3-------|-1-------1-------|-0-------0-------|-3-------3-------|
G|-----0-------0---|-----0-------0---|-----0-------0---|-----0-------0---|
D|---2-------2-----|---2-------2-----|---2-------2-----|---2-------2-----|
A|-3-----3---------|-3-----3---------|-3-----3---------|-3-----3---------|
E|-----------------|-----------------|-----------------|-----------------|
   Cadd9             C                 Cmaj7             Cadd9

e|-----------------|-----------------|-----------------|-----------------|
B|-1-------1-------|-0-------0-------|-3-------3-------|-1---3-----------|
G|-----2-------2---|-----2-------2---|-----2-------2---|-----------------|
D|---2-------2-----|---2-------2-----|---2-------2-----|-----------------|
A|-0-----0---------|-0-----0---------|-0-----0---------|-0---------------|
E|-----------------|-----------------|-----------------|-----------------|
   Am                Asus2             Asus4             Am

[Verse 1 Picking Pattern]
e|-----------------|-----------------|-----------------|-----------------|
B|-1-------1-------|-0-------0-------|-1-------1-------|-0-------0-------|
G|-----0-------0---|-----0-------0---|-----2-------2---|-----0-------0---|
D|---2-------2-----|---0-------0-----|---2-------2-----|---0-------0-----|
A|-3-----3---------|-2-----2---------|-0-----0---------|-----------------|
E|-----------------|-----------------|-----------------|-3-----3---------|
   I close my eyes   only for a moment and the moment's  gone...`,
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
    tabContent: `[Intro & Verse Riff]
e|-----------------|-----------------|-----------------|-----------------|
B|---0---1---3---12|---12--12---12---|---10--10---10---|---8---8---8-----|
G|-----------------|-----------------|-----------------|-----------------|
D|-----------------|-----------------|-----------------|-----------------|
A|-------0---2---10|---10--10---10---|---9---9----9----|---7---7---7-----|
E|---3-------------|-----------------|-----------------|-----------------|
     G  Am7 G/B   G (10th fret slide)

e|-----------------|-----------------|-----------------|-----------------|
B|---5---5---5-----|---3---3---3-----|---2---2---2-----|---3---3---3-----|
G|-----------------|-----------------|-----------------|-----------------|
D|-----------------|-----------------|-----------------|-----------------|
A|---5---5---5-----|---3---3---3-----|---2---2---2-----|---3---3---3-----|
E|-----------------|-----------------|-----------------|-----------------|
   Black-bird          sing-ing in the   dead    of       night...

e|-----------------|-----------------|-----------------|-----------------|
B|---5---5---7---7-|-8---8---7---5---|---3---3---2---2-|-3---3-----------|
G|-----------------|-----------------|-----------------|-----------------|
D|-----------------|-----------------|-----------------|-----------------|
A|---3---3---5---5-|-7---7---6---4---|---2---2---0---0-|-----------------|
E|-----------------|-----------------|-----------------|-3---3-----------|
   Take these bro-ken wings and learn to fly...`,
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
    tabContent: `[Main Theme - Rapid Cascading Run]
e|-----0-------0---|-----0-------0---|-----0-------0---|-----0-------0---|
B|---1---1---1---1-|---1---1---1---1-|---1---1---1---1-|---0---0---0---0-|
G|-2-------2-------|-0-------0-------|-----------------|-----------------|
D|-----------------|-----------------|-3-------3-------|-2-------2-------|
A|-0---------------|-----------------|-----------------|-----------------|
E|-----------------|-3---------------|-1---------------|-0---------------|
   Am                Am7/G             F                 Em

e|-----1-------1---|-----3-------3---|-----0-------0---|-----0-------0---|
B|---3---3---3---3-|---0---0---0---0-|---1---1---1---1-|---0---0---0---0-|
G|-2-------2-------|-0-------0-------|-0-------0-------|-1-------1-------|
D|-0---------------|-----------------|-----------------|-----------------|
A|-----------------|-----------------|-3---------------|-----------------|
E|-----------------|-3---------------|-----------------|-0---------------|
   Dm                G                 C                 E7`,
    sections: [
      {
        sectionTitle: 'Theme 1 - Cascading Am Run',
        lines: [
          {
            lyrics: '| Fast bass descending: A - G - F - E in lightning tempo |',
            chords: [{ chord: 'Am', position: 2 }, { chord: 'Am7/G', position: 16 }, { chord: 'F', position: 28 }, { chord: 'Em', position: 36 }]
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
    tabContent: `[Intro & Signature Riff]
e|-----------------|-----------------|-----------------|-----------------|
B|---2---2h3p2-0---|---2---2---------|---2h3p2-0-------|---0h2-----------|
G|---2---2-----2---|---2---2---------|---2-----2-2-----|---1---2---------|
D|---2---2-----2---|---2---2---------|---2-------2-----|---2---2---------|
A|-0---------------|-----------------|-----------------|-------0---------|
E|-----------------|-4-----2---------|-2---------0-----|-0---------------|
   A                 E/G#  F#m         D/F#      E7        A`,
    sections: [
      {
        sectionTitle: 'Intro & Signature Lick',
        lines: [
          {
            lyrics: '| A - E/G# - F#m - A/E | D/F# - E7sus4 - A hammer-on |',
            chords: [{ chord: 'A', position: 2 }, { chord: 'E/G#', position: 6 }, { chord: 'F#m', position: 13 }, { chord: 'D/F#', position: 24 }]
          }
        ]
      }
    ]
  },
  {
    id: 'shape-of-my-heart-sting',
    title: 'Shape of My Heart',
    artist: 'Sting / Dominic Miller',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'F# Minor',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Andante (84 BPM)',
    description: 'Dominic Miller’s legendary nylon acoustic arpeggio. Intricate voice leading with classical Spanish thumb counterpoint.',
    allChords: ['F#m', 'E6', 'D6', 'C#7', 'Bm7'],
    tabContent: `[Main Fingerstyle Motif]
e|-------9---------|-------7---------|-------5---------|-------4---------|
B|---------10------|---------9-------|---------7-------|---------6-------|
G|-----11----11----|-----9-----9-----|-----7-----7-----|-----6-----6-----|
D|---11--------11--|---9---------9---|---7---------7---|---6---------6---|
A|-9---------------|-7---------------|-5---------------|-4---------------|
E|-----------------|-----------------|-----------------|-----------------|
   F#m               E6                D6                C#7`,
    sections: [
      {
        sectionTitle: 'Main Motif',
        lines: [
          {
            lyrics: 'He deals the cards as a meditation...',
            chords: [{ chord: 'F#m', position: 0 }, { chord: 'E6', position: 15 }, { chord: 'D6', position: 25 }, { chord: 'C#7', position: 35 }]
          }
        ]
      }
    ]
  },
  {
    id: 'nothing-else-matters-metallica',
    title: 'Nothing Else Matters',
    artist: 'Metallica (James Hetfield)',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'E Minor',
    capo: 'No Capo',
    difficulty: 'Easy',
    tempo: '6/8 Slow Rock (46 BPM / 142 8ths)',
    description: 'The world-famous open-string fingerpicking introduction. Played purely on open strings (E-G-B-e) followed by harmonic bells on the 12th fret.',
    allChords: ['Em', 'D', 'C', 'G', 'B7'],
    tabContent: `[Signature Open-String Intro in 6/8]
e|-------0---------|-------0---------|-------0---------|-------0---------|
B|-----0---0-------|-----0---0-------|-----0---0-------|-----0---0-------|
G|---0-------0-----|---0-------0-----|---0-------0-----|---0-------0-----|
D|-----------------|-----------------|-----------------|-----------------|
A|-----------------|-----------------|-----------------|-----------------|
E|-0---------------|-0---------------|-0---------------|-0---------------|
   Em                Em                Em                Em

[12th Fret Harmonics & Melody]
e|---------<12>----|---------7-------|-7p0---0---------|-----------------|
B|-----<12>--------|-----0-----0-----|-----0---0-------|-----------------|
G|-<12>------------|---0---0-----0---|-----------0-----|-----------------|
D|-----------------|-----------------|-----------------|-----------------|
A|-----------------|-----------------|-----------------|-----------------|
E|-0---------------|-0---------------|-0---------------|-----------------|`,
    sections: [
      {
        sectionTitle: 'Intro Arpeggio',
        lines: [
          {
            lyrics: '| Em open strings in 6/8 time | 12th fret natural harmonics |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'D', position: 24 }, { chord: 'C', position: 36 }]
          }
        ]
      }
    ]
  },
  {
    id: 'here-comes-the-sun-beatles',
    title: 'Here Comes the Sun',
    artist: 'The Beatles (George Harrison)',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'A Major (Capo 7 in D shapes)',
    capo: 'Capo 7th Fret',
    difficulty: 'Intermediate',
    tempo: 'Allegro (130 BPM)',
    description: 'George Harrison’s sunny acoustic masterpiece. Delicate hammer-ons and pull-offs on the 1st and 2nd strings over open D, G, and A7 chords.',
    allChords: ['D', 'G', 'A7', 'E7', 'A'],
    tabContent: `[Intro & Verse Acoustic Riff (Relative to Capo 7)]
e|---2---0---2---3-|-2---0-----------|-------3---------|-3---0---2-------|
B|---3---3---3---3-|-3---3---3-------|-------0---------|-0---0---3-------|
G|---2---2---2---2-|-2---2---2-------|-------0---------|-0---0---2-------|
D|-0---0---0---0---|---0---0---0-----|-------0---------|-0---0---0-------|
A|-----------------|-----------------|---0-2---0-2---0-|-----------------|
E|-----------------|-----------------|-3-----------3---|-----------------|
   D                                   G                 A7      D`,
    sections: [
      {
        sectionTitle: 'Intro Riff',
        lines: [
          {
            lyrics: 'Here comes the sun, doo-doo-doo-doo...',
            chords: [{ chord: 'D', position: 0 }, { chord: 'G', position: 20 }, { chord: 'A7', position: 35 }]
          }
        ]
      }
    ]
  },
  {
    id: 'fast-car-tracy-chapman',
    title: 'Fast Car',
    artist: 'Tracy Chapman',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'A Major (Capo 2 in G shapes)',
    capo: 'Capo 2nd Fret',
    difficulty: 'Easy',
    tempo: 'Acoustic Folk (104 BPM)',
    description: 'Timeless 2-finger acoustic picking hook. Pluck bass and melody simultaneously with gentle percussive slaps on the backbeat.',
    allChords: ['C', 'G', 'Em', 'D'],
    tabContent: `[Main Acoustic Hook (Relative to Capo 2)]
e|---------|---------0h2---0-|-----------------|-----------------|
B|---0h1---|-0-------3-----3-|---3h5---3-------|-3-------3-------|
G|---0-----|-0-------2-----2-|---0-----0-------|-0h2p0---0h2p0---|
D|---------|-----------------|-----------------|-------0-------0-|
A|-3-------|-----------------|-----------------|-----------------|
E|---------|-3---------------|-0---------------|-----------------|
   C         G                 Em                D`,
    sections: [
      {
        sectionTitle: 'Main Hook',
        lines: [
          {
            lyrics: 'You got a fast car, I want a ticket to anywhere...',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 14 }, { chord: 'Em', position: 28 }, { chord: 'D', position: 38 }]
          }
        ]
      }
    ]
  },
  {
    id: 'stairway-to-heaven-led-zeppelin',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin (Jimmy Page)',
    category: 'fingerstyle',
    tuning: 'Standard (E A D G B E)',
    key: 'A Minor',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Andante (72 BPM)',
    description: 'Jimmy Page’s iconic acoustic arpeggio intro. Chromatic descending bass line (A - G# - G - F# - F) with soaring flute-like soprano voice.',
    allChords: ['Am', 'G#aug', 'C/G', 'D/F#', 'Fmaj7', 'G'],
    tabContent: `[Intro Acoustic Arpeggio]
e|-------5-7-----7-|-8-----8-2-----2-|-0---------------|---------|
B|-----5-----5-----|---5-------3-----|---1---1-3-----3-|-1-------|
G|---5---------5---|-----5-------2---|-----2-----0-----|---2---2-|
D|-7-------6-------|-5-------4-------|-3-----------0---|-----2---|
A|-----------------|-----------------|---------2-------|-0-------|
E|-----------------|-----------------|-----------------|---------|
   Am      G#aug     C/G     D/F#      Fmaj7   G         Am`,
    sections: [
      {
        sectionTitle: 'Intro Arpeggio',
        lines: [
          {
            lyrics: '| Am - G#aug - C/G - D/F# | Fmaj7 - G - Am |',
            chords: [{ chord: 'Am', position: 2 }, { chord: 'G#aug', position: 7 }, { chord: 'C/G', position: 15 }, { chord: 'D/F#', position: 21 }, { chord: 'Fmaj7', position: 28 }]
          }
        ]
      }
    ]
  },

  // ==========================================
  // --- CLASSICAL GUITAR MASTERWORKS ---
  // ==========================================
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
    description: 'Iconic Afro-Cuban syncopated classical study. Features authentic habanera 3-3-2 rhythm, rasgueado accents, and sharp melodic bass runs.',
    allChords: ['Am', 'E7', 'Dm', 'A7', 'C', 'G7'],
    tabContent: `[Theme A - Habanera Syncopated Staff]
e|-------0---------|-------0---------|-------1---------|-------0---------|
B|---1-----1---1---|---0-----0---0---|---3-----3---3---|---1-----1---1---|
G|-----2-----2-----|-----1-----1-----|-----2-----2-----|-----2-----2-----|
D|-----------------|-----------------|-0---------------|-----------------|
A|-0---------------|-----------------|-----------------|-0---------------|
E|-----------------|-0---------------|-----------------|-----------------|
   Am                E7                Dm                Am

[Theme B - Rasgueado Flourish & Descending Bass]
e|-5-5-5-5-3-1-0---|-------0---------|-1-0-------------|-------0---------|
B|-----------------|-3-1-0---3-1-0---|-----3-1-0-------|---1-----1---1---|
G|-----------------|-----------------|-----------2-1---|-----2-----2-----|
D|-----------------|-----------------|---------------2-|-----------------|
A|-0---------------|-----------------|-----------------|-0---------------|
E|-----------------|-0---------------|-0---------------|-----------------|
   Am                E7                E7                Am`,
    sections: [
      {
        sectionTitle: 'Theme A - Habanera Syncopation',
        lines: [
          {
            lyrics: '| [Bass A pluck] - [Staccato triad] - [Habanera pulse] |',
            chords: [{ chord: 'Am', position: 2 }, { chord: 'E7', position: 20 }]
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
    description: 'The world’s most beloved classical guitar piece. Continuous lyrical triplets on high E string over moving bass notes using finger picking (p-a-m-i).',
    allChords: ['Em', 'Am', 'B7', 'E', 'G#m', 'F#m'],
    tabContent: `[Part 1 - Minor Theme (E Minor)]
e|-7-----7-----7---|-7-----5-----3---|-3-----2-----0---|-0-----3-----7---|
B|---0-----0-----0-|---0-----0-----0-|---0-----0-----0-|---0-----0-----0-|
G|-----0-----0-----|-----0-----0-----|-----0-----0-----|-----0-----0-----|
D|-----------------|-----------------|-----------------|-----------------|
A|-----------------|-----------------|-----------------|-----------------|
E|-0---------------|-0---------------|-0---------------|-0---------------|
   Em

e|-12----12----12--|-12----10----8---|-8-----7-----5---|-5-----7-----8---|
B|---0-----0-----0-|---0-----0-----0-|---5-----5-----5-|---5-----5-----5-|
G|-----0-----0-----|-----0-----0-----|-----5-----5-----|-----5-----5-----|
D|-----------------|-----------------|-----------------|-----------------|
A|-----------------|-----------------|-0---------------|-0---------------|
E|-0---------------|-0---------------|-----------------|-----------------|
   Em                                  Am

e|-7-----8-----7---|-6-----7-----8---|-7-----5-----3---|-3-----2-----0---|
B|---7-----7-----7-|---7-----7-----7-|---0-----0-----0-|---0-----0-----0-|
G|-----8-----8-----|-----8-----8-----|-----0-----0-----|-----0-----0-----|
D|-----------------|-----------------|-----------------|-----------------|
A|-----------------|-----------------|-----------------|-----------------|
E|-7---------------|-7---------------|-0---------------|-0---------------|
   B7                                  Em`,
    sections: [
      {
        sectionTitle: 'Part 1 - Minor Theme',
        lines: [
          {
            lyrics: '| 7-7-7 7-5-3 3-2-0 | Continuous triplets on high E |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'Am', position: 24 }]
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
    tabContent: `[Counterpoint Section A]
e|-------|-----------------|-----------------|-----------------|
B|-------|---0---0---0---0-|---0---0---0---0-|---0---0---0---0-|
G|---0-2-|-0---0---0---0---|-0---0---0---0---|-0---0---0---0---|
D|-2-----|-----------------|-----------------|-----------------|
A|-------|-----------------|-2---------------|-3-------2-------|
E|-------|-0---------------|-----------------|-----------------|
           Em                B                 C       B`,
    sections: [
      {
        sectionTitle: 'Section A',
        lines: [
          {
            lyrics: '| Counterpoint pickup: G - F# with walking bass |',
            chords: [{ chord: 'Em', position: 2 }, { chord: 'D', position: 24 }]
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
    description: 'Romantic classical miniature by Tárrega. Tender cantabile phrasing followed by a melancholic E minor middle section.',
    allChords: ['E', 'A', 'B7', 'F#m', 'Em', 'Am'],
    tabContent: `[Theme A - Lyrical E Major]
e|-4-----5-----7---|-2-----0---------|-4-----5-----7---|-9---------------|
B|---0-----0-----0-|---0-----0---0---|---0-----0-----0-|---7-----7-------|
G|-----1-----2-----|-----1-----1-----|-----1-----2-----|-----8-----8-----|
D|-----------------|-----------------|-----------------|-------7---------|
A|-----------------|-----------------|-----------------|-----------------|
E|-0---------------|-0---------------|-0---------------|-7---------------|
   E                                                     B7`,
    sections: [
      {
        sectionTitle: 'Theme A - E Major',
        lines: [
          {
            lyrics: '| Delicate melody played with ring finger (anular) |',
            chords: [{ chord: 'E', position: 2 }, { chord: 'B7', position: 20 }]
          }
        ]
      }
    ]
  },
  {
    id: 'asturias-leyenda-albeniz',
    title: 'Asturias (Leyenda)',
    artist: 'Isaac Albéniz',
    category: 'classical',
    tuning: 'Standard (E A D G B E)',
    key: 'G Minor / D Minor',
    capo: 'No Capo',
    difficulty: 'Advanced',
    tempo: 'Allegro ma non troppo (132 BPM)',
    description: 'The dramatic pinnacle of Spanish classical guitar repertoire. Relentless pedal note on open B/D strings with lightning bass runs and fiery rasgueados.',
    allChords: ['Dm', 'A7', 'Gm', 'Bb', 'F'],
    tabContent: `[Opening Pedal-Point Theme]
e|-----------------|-----------------|-----------------|-----------------|
B|---3---3---3---3-|---3---3---3---3-|---3---3---3---3-|---3---3---3---3-|
G|-----------------|-----------------|-----------------|-----------------|
D|-0---0---0---0---|-2---2---3---3---|-2---2---0---0---|-----------------|
A|-----------------|-----------------|-----------------|-4---4---0---0---|
E|-----------------|-----------------|-----------------|-----------------|
   Dm                                                    A7`,
    sections: [
      {
        sectionTitle: 'Pedal Theme',
        lines: [
          {
            lyrics: '| Continuous open pedal note with moving bass voice |',
            chords: [{ chord: 'Dm', position: 2 }, { chord: 'A7', position: 24 }]
          }
        ]
      }
    ]
  },
  {
    id: 'greensleeves-traditional',
    title: 'Greensleeves',
    artist: 'Traditional English Renaissance',
    category: 'classical',
    tuning: 'Standard (E A D G B E)',
    key: 'A Dorian / A Minor',
    capo: 'No Capo',
    difficulty: 'Easy',
    tempo: 'Andante (108 BPM in 6/8)',
    description: 'Centuries-old English Renaissance air. Graceful 6/8 lilt with rich rolling arpeggios connecting A minor and G major cadences.',
    allChords: ['Am', 'G', 'F', 'E7', 'C'],
    tabContent: `[Theme in 6/8 Time]
e|-------0-|-1-----0---------|-------0-|-1-----0---------|
B|-1---3---|---3-----1-------|-3---1---|---3-----1---0---|
G|---2-----|-----2-----2---2-|---0-----|-----2-----2---1-|
D|---------|-0---------------|---------|-0---------------|
A|-0-------|---------0-------|---------|---------0-------|
E|---------|-----------------|-3-------|-------------0---|
   Am        Dm      Am        G         Dm      Am  E7`,
    sections: [
      {
        sectionTitle: 'Theme in 6/8',
        lines: [
          {
            lyrics: 'Alas, my love, you do me wrong to cast me off discourteously...',
            chords: [{ chord: 'Am', position: 0 }, { chord: 'G', position: 20 }, { chord: 'F', position: 35 }, { chord: 'E7', position: 45 }]
          }
        ]
      }
    ]
  },
  {
    id: 'malaguena-flamenco',
    title: 'Malagueña',
    artist: 'Traditional Spanish Flamenco',
    category: 'classical',
    tuning: 'Standard (E A D G B E)',
    key: 'E Phrygian',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Allegro con brio (124 BPM)',
    description: 'Fiery Spanish flamenco study. Rapid thumb-index alternation on low bass strings punctuated by explosive rasgueado E major strums.',
    allChords: ['E', 'F', 'G', 'Dm', 'Am'],
    tabContent: `[Phrygian Cadence & Bass Run]
e|-------0---------|-------0---------|-------0---------|-------0---------|
B|-------0---------|-------0---------|-------1---------|-------0---------|
G|-------1---------|-------2---------|-------2---------|-------1---------|
D|-------2---------|-------3---------|-------2---------|-------2---------|
A|-------2---------|-------3---------|-0---------------|-------2---------|
E|-0-2-3-0---------|-0-2-3-1---------|-----------------|-3-2-0-0---------|
   E                 F                 Am                E`,
    sections: [
      {
        sectionTitle: 'Phrygian Cadence',
        lines: [
          {
            lyrics: '| Low bass run into sharp rasgueado E Phrygian cadence |',
            chords: [{ chord: 'E', position: 2 }, { chord: 'F', position: 15 }, { chord: 'E', position: 30 }]
          }
        ]
      }
    ]
  },

  // ==========================================
  // --- DELTA BLUES, PIEDMONT & RAGTIME ---
  // ==========================================
  {
    id: 'cross-road-blues-robert-johnson',
    title: 'Cross Road Blues',
    artist: 'Robert Johnson',
    category: 'blues',
    tuning: 'Standard (E A D G B E) or Open D/G',
    key: 'E Delta Blues',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Delta Shuffle (88 BPM)',
    description: 'The cornerstone of Delta acoustic blues. Monotonic steady thumb shuffle on the low E string with sliding triplet double-stops on the high strings.',
    allChords: ['E7', 'A7', 'B7', 'E9'],
    tabContent: `[Turnaround & Intro Lick]
e|---12-12-12---11-11-11---10-10-10-|---9---9---9---0-|-----------------|
B|---12-12-12---11-11-11---10-10-10-|---9---9---9---0-|---0---0---0---0-|
G|-----------------------------------|-----------------|---1---1---1---1-|
D|-----------------------------------|-----------------|---0---0---0---0-|
A|-----------------------------------|-----------------|---2---2---2---2-|
E|-0----------0----------0----------|-0-----------0---|-0-------0-------|
   E7 slide from 12th fret                              B7 turnaround`,
    sections: [
      {
        sectionTitle: 'Turnaround & Intro',
        lines: [
          {
            lyrics: 'I went to the crossroad, fell down on my knees...',
            chords: [{ chord: 'E7', position: 0 }, { chord: 'A7', position: 25 }, { chord: 'E7', position: 40 }]
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
    description: 'The pinnacle of alternating-bass Piedmont fingerstyle ("Cotten Picking"). Bouncing thumb between 5th and 4th strings while fingers play sweet melody.',
    allChords: ['C', 'G7', 'E7', 'F'],
    tabContent: `[Piedmont Picking Melody]
e|---0---0---0---0-|-3---0-----------|---1---1---1---1-|-1---1-----------|
B|-----------------|---------3---1---|-----------------|---------3---0---|
G|-----------------|-----------------|-----------------|-----------------|
D|-----2-------2---|-----2-------2---|-----0-------0---|-----0-------0---|
A|-3---------------|-3---------------|-----------------|-----------------|
E|---------3-------|---------3-------|-3-------3-------|-3-------3-------|
   C                                   G7`,
    sections: [
      {
        sectionTitle: 'Theme & Melody',
        lines: [
          {
            lyrics: 'Freight train, freight train, run so fast...',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G7', position: 20 }, { chord: 'C', position: 35 }]
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
    description: 'The world standard 12-bar acoustic blues in E. Master the driving blues boogie shuffle rhythm (root-5th to root-6th pulse).',
    allChords: ['E', 'E7', 'A', 'A7', 'B7'],
    tabContent: `[12-Bar Acoustic Boogie Shuffle Riff]
e|-----------------|-----------------|-----------------|-----------------|
B|-----------------|-----------------|-----------------|-----------------|
G|-----------------|-----------------|-----------------|-----------------|
D|-----------------|-----------------|-----------------|-----------------|
A|---2---4---2---4-|---2---4---2---4-|---2---4---2---4-|---2---4---2---4-|
E|-0-0-0-0-0-0-0-0-|-0-0-0-0-0-0-0-0-|-0-0-0-0-0-0-0-0-|-0-0-0-0-0-0-0-0-|
   E5  E6  E5  E6 (Drive low thumb with swing shuffle)`,
    sections: [
      {
        sectionTitle: 'Verse 1 - 12 Bar Blues',
        lines: [
          {
            lyrics: 'Come on, baby don\'t you want to go...',
            chords: [{ chord: 'E7', position: 0 }, { chord: 'A7', position: 25 }, { chord: 'B7', position: 40 }]
          }
        ]
      }
    ]
  },
  {
    id: 'before-you-accuse-me-clapton',
    title: 'Before You Accuse Me',
    artist: 'Bo Diddley / Eric Clapton',
    category: 'blues',
    tuning: 'Standard (E A D G B E)',
    key: 'E Acoustic Blues',
    capo: 'No Capo',
    difficulty: 'Intermediate',
    tempo: 'Acoustic Shuffle (110 BPM)',
    description: 'Unplugged acoustic blues classic. Strumming muted shuffle chords combined with stinging pentatonic turnaround fills in E.',
    allChords: ['E', 'A', 'B7', 'E7'],
    tabContent: `[Acoustic Shuffle Fill in E]
e|---0-0---0-0-----|-----------------|-----------------|---0---0---0---0-|
B|---3-3---2-2-----|-0h2p0-----------|-----------------|---0---0---0---0-|
G|-----------------|-------1---------|-----------------|---1---1---1---1-|
D|-----------------|---------2-0-----|---0-1-2---------|---2---2---2---2-|
A|-----------------|-------------2---|-2-------2-1-0---|---2---2---2---2-|
E|-0-----0---------|-----------------|---------------3-|-0-------0-------|
   E7 turnaround fill                  B7                E`,
    sections: [
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'Before you accuse me, take a look at yourself...',
            chords: [{ chord: 'E', position: 0 }, { chord: 'A', position: 20 }, { chord: 'E', position: 35 }, { chord: 'B7', position: 45 }]
          }
        ]
      }
    ]
  },
  {
    id: 'hey-hey-big-bill-broonzy',
    title: 'Hey Hey',
    artist: 'Big Bill Broonzy / Eric Clapton',
    category: 'blues',
    tuning: 'Standard (E A D G B E)',
    key: 'E Ragtime Blues',
    capo: 'No Capo',
    difficulty: 'Advanced',
    tempo: 'Driving Ragtime (116 BPM)',
    description: 'High-energy acoustic fingerstyle ragtime blues. Fast hammer-ons on the G string with steady low E thumb pump.',
    allChords: ['E', 'A7', 'B7', 'E7'],
    tabContent: `[Signature Ragtime Lick]
e|-----------------|-----------------|-----------------|-----------------|
B|---0---0---0---0-|---0---0---0---0-|---0---0---0---0-|---0---0---0---0-|
G|---0h1-0h1-0h1-0h1---0h1-0h1-0h1-0h1---0h1-0h1-0h1-0h1---0h1-0h1-0h1---|
D|-----------------|-----------------|-----------------|-----------------|
A|-----------------|-----------------|-----------------|-----------------|
E|-0-------0-------|-0-------0-------|-0-------0-------|-0-------0-------|
   Driving thumb on beat with rapid G string hammer-on`,
    sections: [
      {
        sectionTitle: 'Main Riff',
        lines: [
          {
            lyrics: 'Hey, hey, hey, hey baby, hey...',
            chords: [{ chord: 'E', position: 0 }, { chord: 'A7', position: 15 }, { chord: 'B7', position: 30 }]
          }
        ]
      }
    ]
  }
];
