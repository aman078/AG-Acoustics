export interface Raga {
  id: string;
  name: string;
  hindiName: string;
  prahar: string;
  timeOfDay: string;
  idealHours: [number, number]; // [startHour, endHour] in 24h
  rasa: string; // The primary aesthetic emotion
  moodKeywords: string[];
  summary: string;
  poeticReflection: string;
  westernAnchor: 'C Major' | 'A Minor';
  westernScaleName: string;
  theSimpleTwist: string;
  ascendingRule: string;
  descendingRule: string;
  soulNote: {
    note: string;
    swara: string;
    description: string;
  };
  tanpuraTuning: 'Pa' | 'Ma' | 'Ni';
  scaleIntervals: string[]; // e.g. ["1", "2", "3", "#4", "5", "6", "7"]
  scaleNotesAtC: string[]; // notes when Root is C or A
  fretboardPositionsAtC: { string: number; fret: number; note: string; isSoulNote?: boolean; isRoot?: boolean }[];
  signatureRiff: {
    title: string;
    tabDisplay: string[];
    notes: string[];
    frequenciesAtC: number[];
    durations: number[];
    guitarTip: string;
  };
}

export const RAGAS_DATABASE: Raga[] = [
  {
    id: 'yaman',
    name: 'Raag Yaman',
    hindiName: 'राग यमन',
    prahar: '1st Prahar of Night (Prathama Prahara)',
    timeOfDay: 'Evening & Sunset (6:00 PM – 9:00 PM)',
    idealHours: [18, 21],
    rasa: 'Shringara (Romantic Devotion) & Shanta (Peace)',
    moodKeywords: ['peaceful', 'romantic', 'evening', 'relaxed', 'grateful', 'sunset', 'unwinding', 'serene', 'love', 'bliss', 'calm'],
    summary: 'The queen of evening serenity. Dissolves the day’s tension into quiet romantic gratitude.',
    poeticReflection: 'As the twilight settles, let the warmth of Yaman melt away the noise of the day into tranquil gratitude.',
    westernAnchor: 'C Major',
    westernScaleName: 'Lydian Mode',
    theSimpleTwist: 'Take the C Major scale you already know, but sharpen the 4th note: play F# instead of F.',
    ascendingRule: 'Leave space: Skip the Root (C) and 5th (G) going up (B - D - E - F# - A - B - C\').',
    descendingRule: 'Full cascade coming down (C\' - B - A - G - F# - E - D - C).',
    soulNote: {
      note: 'E',
      swara: 'Ga (Gandhar)',
      description: 'Rest your melody on E. Let it linger and bloom with a gentle vibrato.'
    },
    tanpuraTuning: 'Pa',
    scaleIntervals: ['1', '2', '3', '#4', '5', '6', '7'],
    scaleNotesAtC: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
    fretboardPositionsAtC: [
      { string: 5, fret: 3, note: 'C', isRoot: true },
      { string: 5, fret: 5, note: 'D' },
      { string: 4, fret: 2, note: 'E', isSoulNote: true },
      { string: 4, fret: 4, note: 'F#' },
      { string: 4, fret: 5, note: 'G' },
      { string: 3, fret: 2, note: 'A' },
      { string: 3, fret: 4, note: 'B' },
      { string: 3, fret: 5, note: 'C', isRoot: true },
      { string: 2, fret: 3, note: 'D' },
      { string: 2, fret: 5, note: 'E', isSoulNote: true },
      { string: 1, fret: 2, note: 'F#' },
      { string: 1, fret: 3, note: 'G' },
    ],
    signatureRiff: {
      title: 'The Golden Twilight Glide',
      tabDisplay: [
        'e|-------------------------|',
        'B|-------0--3/5--3---------|',
        'G|---2/4------------4--2---|',
        'D|-------------------------|',
        'A|-------------------------|',
        'E|-------------------------|'
      ],
      notes: ['B3', 'D4', 'E4', 'D4', 'B3', 'A3', 'E4'],
      frequenciesAtC: [246.94, 293.66, 329.63, 293.66, 246.94, 220.00, 329.63],
      durations: [0.4, 0.4, 0.8, 0.4, 0.4, 0.5, 1.0],
      guitarTip: 'Slide smoothly into the E note on the 5th fret of the B-string and let it breathe with slow finger vibrato.'
    }
  },
  {
    id: 'bhairavi',
    name: 'Raag Bhairavi',
    hindiName: 'राग भैरवी',
    prahar: 'Morning (or Universal Closing Raag)',
    timeOfDay: 'Early Morning (6:00 AM – 9:00 AM) or Anytime for Solace',
    idealHours: [5, 9],
    rasa: 'Karuna (Tender Pathos) & Vairagya (Detachment/Solace)',
    moodKeywords: ['sad', 'longing', 'melancholy', 'heartbroken', 'lonely', 'solace', 'bittersweet', 'acceptance', 'letting go', 'nostalgic', 'exhausted', 'tired'],
    summary: 'The ultimate solace for a heavy heart. Converts sadness into timeless poetic acceptance.',
    poeticReflection: 'When words fail to carry grief, Bhairavi opens an ancient sanctuary where longing turns into peaceful acceptance.',
    westernAnchor: 'A Minor',
    westernScaleName: 'Phrygian Mode',
    theSimpleTwist: 'Take the A Minor scale you know, but flatten the 2nd note: play Bb instead of B.',
    ascendingRule: 'Climb with care: A - Bb - C - D - E - F - G - A\'.',
    descendingRule: 'Full expressive descent. Linger tenderly on Bb before resolving to A.',
    soulNote: {
      note: 'C',
      swara: 'Ga (Komal Gandhar)',
      description: 'Linger on C (Minor 3rd). Slide gently up from Bb into C to create that deep vocal weeping effect.'
    },
    tanpuraTuning: 'Ma',
    scaleIntervals: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    scaleNotesAtC: ['A', 'Bb', 'C', 'D', 'E', 'F', 'G'],
    fretboardPositionsAtC: [
      { string: 5, fret: 0, note: 'A', isRoot: true },
      { string: 5, fret: 1, note: 'Bb' },
      { string: 5, fret: 3, note: 'C', isSoulNote: true },
      { string: 4, fret: 0, note: 'D' },
      { string: 4, fret: 2, note: 'E' },
      { string: 4, fret: 3, note: 'F' },
      { string: 3, fret: 0, note: 'G' },
      { string: 3, fret: 2, note: 'A', isRoot: true },
      { string: 2, fret: 3, note: 'D' },
      { string: 2, fret: 1, note: 'C', isSoulNote: true },
      { string: 1, fret: 1, note: 'F' },
      { string: 1, fret: 0, note: 'E' }
    ],
    signatureRiff: {
      title: 'Tears into Peace',
      tabDisplay: [
        'e|-------------------------|',
        'B|-------------------------|',
        'G|---2---0h2p0-------------|',
        'D|--------------3---2--0---|',
        'A|-------------------------|',
        'E|-------------------------|'
      ],
      notes: ['A3', 'G3', 'A3', 'G3', 'F3', 'E3', 'D3', 'A3'],
      frequenciesAtC: [220.00, 196.00, 220.00, 196.00, 174.61, 164.81, 146.83, 220.00],
      durations: [0.5, 0.3, 0.3, 0.3, 0.5, 0.6, 0.8, 1.0],
      guitarTip: 'Play the Bb to C transition with a subtle slide or micro-hammer to evoke the authentic weeping Meend of the sitar.'
    }
  },
  {
    id: 'darbari',
    name: 'Raag Darbari Kanada',
    hindiName: 'राग दरबारी कान्हड़ा',
    prahar: 'Midnight (Madhyaratra)',
    timeOfDay: 'Deep Midnight (11:00 PM – 2:00 AM)',
    idealHours: [23, 2],
    rasa: 'Gambhira (Solemn Majesty) & Karuna (Profound Solitude)',
    moodKeywords: ['midnight', 'insomnia', 'deep', 'existential', 'philosophical', 'quiet', 'solemn', 'alone', 'overwhelmed', 'thoughtful', 'heavy', 'dark'],
    summary: 'Created for Emperor Akbar’s midnight court to still an overburdened emperor’s mind into deep sleep.',
    poeticReflection: 'When the world is asleep and your thoughts feel loud, Darbari grounds the storm with majestic royal gravity.',
    westernAnchor: 'A Minor',
    westernScaleName: 'Natural Minor with Oscillating 3rd & 6th',
    theSimpleTwist: 'Take the A Minor scale, but apply a slow, wide vibrato on the C (flat 3rd) and F (flat 6th).',
    ascendingRule: 'Climb with majestic gravity: S - R - g - m - P - d - n - S\'.',
    descendingRule: 'Gliding descent with slow undulations on the flat notes.',
    soulNote: {
      note: 'D',
      swara: 'Ma (Madhyam)',
      description: 'Anchor on D. Its deep resonant gravity stills the mind instantly.'
    },
    tanpuraTuning: 'Pa',
    scaleIntervals: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    scaleNotesAtC: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    fretboardPositionsAtC: [
      { string: 5, fret: 0, note: 'A', isRoot: true },
      { string: 5, fret: 2, note: 'B' },
      { string: 5, fret: 3, note: 'C' },
      { string: 4, fret: 0, note: 'D', isSoulNote: true },
      { string: 4, fret: 2, note: 'E' },
      { string: 4, fret: 3, note: 'F' },
      { string: 3, fret: 0, note: 'G' },
      { string: 3, fret: 2, note: 'A', isRoot: true },
      { string: 2, fret: 3, note: 'D', isSoulNote: true },
    ],
    signatureRiff: {
      title: 'Midnight Majesty',
      tabDisplay: [
        'e|-------------------------|',
        'B|-------------------------|',
        'G|---2---0-----------------|',
        'D|----------3~---2---0-----|',
        'A|----------------------0--|',
        'E|-------------------------|'
      ],
      notes: ['A3', 'G3', 'F3', 'E3', 'D3', 'A2'],
      frequenciesAtC: [220.00, 196.00, 174.61, 164.81, 146.83, 110.00],
      durations: [0.6, 0.4, 0.8, 0.5, 0.8, 1.2],
      guitarTip: 'Do not rush. Hit the F note and vibrate the string slowly up and down like a heavy swinging bell.'
    }
  },
  {
    id: 'kafi',
    name: 'Raag Kafi',
    hindiName: 'राग काफी',
    prahar: 'Late Night (or Monsoon Rain)',
    timeOfDay: 'Late Evening & Night (9:00 PM – Midnight)',
    idealHours: [21, 24],
    rasa: 'Shringara (Sensual Playfulness) & Ananda (Earthy Joy)',
    moodKeywords: ['rain', 'earthy', 'playful', 'sensual', 'groove', 'creative', 'flowing', 'alive', 'cozy', 'warm', 'jamming'],
    summary: 'The soulful folk-blues of India. Rich, earthy, and spontaneous—the exact scale Carlos Santana made famous.',
    poeticReflection: 'Like the smell of wet earth after the first shower, Kafi awakens an effortless, playful groove.',
    westernAnchor: 'A Minor',
    westernScaleName: 'Dorian Mode',
    theSimpleTwist: 'Take the A Minor scale you know, but raise the 6th note: play F# instead of F natural.',
    ascendingRule: 'Climb with swing: A - B - C - D - E - F# - G - A\'.',
    descendingRule: 'Descend effortlessly through the Dorian blues colors.',
    soulNote: {
      note: 'E',
      swara: 'Pa (Pancham)',
      description: 'Linger on the 5th (E). It gives the scale its solid, joyous heartbeat.'
    },
    tanpuraTuning: 'Pa',
    scaleIntervals: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    scaleNotesAtC: ['A', 'B', 'C', 'D', 'E', 'F#', 'G'],
    fretboardPositionsAtC: [
      { string: 5, fret: 0, note: 'A', isRoot: true },
      { string: 5, fret: 2, note: 'B' },
      { string: 5, fret: 3, note: 'C' },
      { string: 4, fret: 0, note: 'D' },
      { string: 4, fret: 2, note: 'E', isSoulNote: true },
      { string: 4, fret: 4, note: 'F#' },
      { string: 3, fret: 0, note: 'G' },
      { string: 3, fret: 2, note: 'A', isRoot: true },
    ],
    signatureRiff: {
      title: 'Monsoon Rain Stroll',
      tabDisplay: [
        'e|-------------------------|',
        'B|-------------------------|',
        'G|-------0---2/4---2-------|',
        'D|---0h2---------------2---|',
        'A|-------------------------|',
        'E|-------------------------|'
      ],
      notes: ['D3', 'E3', 'G3', 'B3', 'A3', 'E3'],
      frequenciesAtC: [146.83, 164.81, 196.00, 246.94, 220.00, 164.81],
      durations: [0.3, 0.4, 0.4, 0.6, 0.5, 0.9],
      guitarTip: 'Add a little rhythmic bounce and syncopation—this is the quintessential groove raag.'
    }
  },
  {
    id: 'bhopali',
    name: 'Raag Bhopali',
    hindiName: 'राग भोपाली',
    prahar: 'Evening (Sandhya Prakash)',
    timeOfDay: 'Evening (7:00 PM – 10:00 PM)',
    idealHours: [19, 22],
    rasa: 'Bhakti (Uplifting Devotion) & Shanta (Calm Confidence)',
    moodKeywords: ['confident', 'inspired', 'hopeful', 'clear', 'uplifted', 'simple', 'honest', 'victorious', 'triumphant', 'happy'],
    summary: 'Pure, uncluttered grace. Built on just 5 notes with no dissonances—every single note sounds heavenly.',
    poeticReflection: 'When you strip away complexity, simplicity shines. Bhopali clears the fog and fills you with warm confidence.',
    westernAnchor: 'C Major',
    westernScaleName: 'Major Pentatonic',
    theSimpleTwist: 'Take the C Major scale, but leave out the 4th (F) and 7th (B). Play just C - D - E - G - A.',
    ascendingRule: 'Climb cleanly: C - D - E - G - A - C\'. No half steps.',
    descendingRule: 'Descend gracefully: C\' - A - G - E - D - C.',
    soulNote: {
      note: 'E',
      swara: 'Ga (Gandhar)',
      description: 'Linger on E. It gives Bhopali its bright, noble character.'
    },
    tanpuraTuning: 'Pa',
    scaleIntervals: ['1', '2', '3', '5', '6'],
    scaleNotesAtC: ['C', 'D', 'E', 'G', 'A'],
    fretboardPositionsAtC: [
      { string: 5, fret: 3, note: 'C', isRoot: true },
      { string: 5, fret: 5, note: 'D' },
      { string: 4, fret: 2, note: 'E', isSoulNote: true },
      { string: 4, fret: 5, note: 'G' },
      { string: 3, fret: 2, note: 'A' },
      { string: 3, fret: 5, note: 'C', isRoot: true },
      { string: 2, fret: 3, note: 'D' },
      { string: 2, fret: 5, note: 'E', isSoulNote: true },
      { string: 1, fret: 3, note: 'G' },
      { string: 1, fret: 5, note: 'A' }
    ],
    signatureRiff: {
      title: 'Noble Dawn of Confidence',
      tabDisplay: [
        'e|-------------------------|',
        'B|-------------------------|',
        'G|---------2---4/5---4--2--|',
        'D|---2--5------------------|',
        'A|-------------------------|',
        'E|-------------------------|'
      ],
      notes: ['E3', 'G3', 'A3', 'C4', 'B3', 'A3'],
      frequenciesAtC: [164.81, 196.00, 220.00, 261.63, 246.94, 220.00],
      durations: [0.4, 0.4, 0.5, 0.7, 0.4, 0.9],
      guitarTip: 'Every note here is resonant and harmonically sweet. Let each string ring out fully.'
    }
  },
  {
    id: 'malkauns',
    name: 'Raag Malkauns',
    hindiName: 'राग मालकौंस',
    prahar: 'Late Night (Tritiya Prahara)',
    timeOfDay: 'Midnight to Pre-Dawn (12:00 AM – 3:00 AM)',
    idealHours: [0, 3],
    rasa: 'Vira (Heroic Depth) & Shanta (Meditative Trance)',
    moodKeywords: ['trance', 'meditation', 'ancient', 'mystical', 'night', 'hypnotic', 'intense', 'deep', 'spiritual', 'silent'],
    summary: 'One of the most ancient ragas in human history. Pure midnight mysticism with raw emotional power.',
    poeticReflection: 'Under the vast, silent night sky, Malkauns draws you inward into a quiet, unwavering trance.',
    westernAnchor: 'A Minor',
    westernScaleName: 'Minor Pentatonic with flat 6th',
    theSimpleTwist: 'Take A Minor, but omit the 2nd (B) and 5th (E). Play only A - C - D - F - G.',
    ascendingRule: 'Omit 2nd and 5th completely: A - C - D - F - G - A\'.',
    descendingRule: 'Descend powerfully through the 5 mystical notes: A\' - G - F - D - C - A.',
    soulNote: {
      note: 'D',
      swara: 'Ma (Madhyam)',
      description: 'Linger on D. It acts as the magnetic center of gravity in the darkness.'
    },
    tanpuraTuning: 'Ma',
    scaleIntervals: ['1', 'b3', '4', 'b6', 'b7'],
    scaleNotesAtC: ['A', 'C', 'D', 'F', 'G'],
    fretboardPositionsAtC: [
      { string: 5, fret: 0, note: 'A', isRoot: true },
      { string: 5, fret: 3, note: 'C' },
      { string: 4, fret: 0, note: 'D', isSoulNote: true },
      { string: 4, fret: 3, note: 'F' },
      { string: 3, fret: 0, note: 'G' },
      { string: 3, fret: 2, note: 'A', isRoot: true },
      { string: 2, fret: 1, note: 'C' },
      { string: 2, fret: 3, note: 'D', isSoulNote: true },
    ],
    signatureRiff: {
      title: 'The Mystic Trance',
      tabDisplay: [
        'e|-------------------------|',
        'B|-------------------------|',
        'G|---2---0-----------------|',
        'D|----------3---0/2--------|',
        'A|-------------------3--0--|',
        'E|-------------------------|'
      ],
      notes: ['A3', 'G3', 'F3', 'D3', 'C3', 'A2'],
      frequenciesAtC: [220.00, 196.00, 174.61, 146.83, 130.81, 110.00],
      durations: [0.6, 0.4, 0.8, 0.5, 0.5, 1.2],
      guitarTip: 'Notice there is no 5th note (E). This absence gives Malkauns its mysterious, bottomless feel.'
    }
  },
  {
    id: 'khamaj',
    name: 'Raag Khamaj',
    hindiName: 'राग खमाज',
    prahar: 'Late Evening (Dwitiya Prahara)',
    timeOfDay: 'Late Evening (8:00 PM – 11:00 PM)',
    idealHours: [20, 23],
    rasa: 'Shringara (Sensual Sweetness & Flirtatious Warmth)',
    moodKeywords: ['warm', 'flirtatious', 'sweet', 'nostalgic', 'cozy', 'romantic', 'charming', 'relaxed', 'playful'],
    summary: 'The ultimate Thumri raag. Warm, romantic, and charming, shifting between two colors of the 7th note.',
    poeticReflection: 'Like laughing with an old flame by candlelight, Khamaj is filled with warmth, charm, and sweet longing.',
    westernAnchor: 'C Major',
    westernScaleName: 'Mixolydian with Dual 7ths',
    theSimpleTwist: 'Play C Major going up (using natural B), but coming down, switch B to Bb (flat 7th).',
    ascendingRule: 'Climb with natural B: C - E - F - G - A - B - C\'. (Omit D).',
    descendingRule: 'Descend with flat Bb: C\' - Bb - A - G - F - E - D - C.',
    soulNote: {
      note: 'E',
      swara: 'Ga (Gandhar)',
      description: 'Linger on E. It gives Khamaj its sweet, golden warmth.'
    },
    tanpuraTuning: 'Ni',
    scaleIntervals: ['1', '2', '3', '4', '5', '6', 'b7/7'],
    scaleNotesAtC: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb/B'],
    fretboardPositionsAtC: [
      { string: 5, fret: 3, note: 'C', isRoot: true },
      { string: 4, fret: 2, note: 'E', isSoulNote: true },
      { string: 4, fret: 3, note: 'F' },
      { string: 4, fret: 5, note: 'G' },
      { string: 3, fret: 2, note: 'A' },
      { string: 3, fret: 3, note: 'Bb' },
      { string: 3, fret: 4, note: 'B' },
      { string: 3, fret: 5, note: 'C', isRoot: true },
    ],
    signatureRiff: {
      title: 'Candlelight Thumri',
      tabDisplay: [
        'e|-------------------------|',
        'B|---1---------------------|',
        'G|-------3---2---0---------|',
        'D|-------------------3--2--|',
        'A|-------------------------|',
        'E|-------------------------|'
      ],
      notes: ['C4', 'Bb3', 'A3', 'G3', 'F3', 'E3'],
      frequenciesAtC: [261.63, 233.08, 220.00, 196.00, 174.61, 164.81],
      durations: [0.5, 0.4, 0.5, 0.4, 0.5, 1.0],
      guitarTip: 'Notice the contrast: natural B when climbing upward, sweet flat Bb when trickling down.'
    }
  },
  {
    id: 'bilawal',
    name: 'Raag Bilawal',
    hindiName: 'राग बिलावल',
    prahar: 'Morning (Prathama Prahara)',
    timeOfDay: 'Bright Morning (7:00 AM – 10:00 AM)',
    idealHours: [7, 10],
    rasa: 'Shanta (Peaceful Clarity) & Utsaha (Morning Energy)',
    moodKeywords: ['fresh', 'morning', 'energy', 'clear', 'optimistic', 'awakening', 'bright', 'grateful', 'starting', 'new'],
    summary: 'The mother scale of Indian music—the exact pristine C Major scale, celebrating dawn and clarity.',
    poeticReflection: 'As the sun cuts through the morning mist, Bilawal clears the mental canvas with pure, untouched light.',
    westernAnchor: 'C Major',
    westernScaleName: 'Natural Major Scale (Ionian)',
    theSimpleTwist: 'No twists needed! It is the exact natural C Major scale you already know by heart.',
    ascendingRule: 'C - D - E - F - G - A - B - C\'. Pure and natural.',
    descendingRule: 'C\' - B - A - G - F - E - D - C.',
    soulNote: {
      note: 'D',
      swara: 'Re (Rishabh)',
      description: 'Linger on D. It gently greets the day with youthful anticipation.'
    },
    tanpuraTuning: 'Pa',
    scaleIntervals: ['1', '2', '3', '4', '5', '6', '7'],
    scaleNotesAtC: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    fretboardPositionsAtC: [
      { string: 5, fret: 3, note: 'C', isRoot: true },
      { string: 5, fret: 5, note: 'D', isSoulNote: true },
      { string: 4, fret: 2, note: 'E' },
      { string: 4, fret: 3, note: 'F' },
      { string: 4, fret: 5, note: 'G' },
      { string: 3, fret: 2, note: 'A' },
      { string: 3, fret: 4, note: 'B' },
      { string: 3, fret: 5, note: 'C', isRoot: true }
    ],
    signatureRiff: {
      title: 'Morning Awakening',
      tabDisplay: [
        'e|-------------------------|',
        'B|-------0---1-------------|',
        'G|---2-----------2---0-----|',
        'D|----------------------2--|',
        'A|-------------------------|',
        'E|-------------------------|'
      ],
      notes: ['A3', 'B3', 'C4', 'A3', 'G3', 'E3'],
      frequenciesAtC: [220.00, 246.94, 261.63, 220.00, 196.00, 164.81],
      durations: [0.4, 0.4, 0.6, 0.4, 0.4, 0.9],
      guitarTip: 'Play with a light, crisp touch. Let the open strings shimmer over the C Tanpura drone.'
    }
  }
];
