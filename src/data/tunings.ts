export interface TunedString {
  name: string;        // E.g. 'E2'
  note: string;        // 'E'
  octave: number;      // 2
  targetFreq: number;  // 82.41
  label: string;       // '6th'
}

export interface TuningPreset {
  id: string;
  name: string;
  instrument: string;
  category: string;
  description: string;
  strings: TunedString[];
}

export const INSTRUMENTS = [
  { id: 'guitar', name: 'Guitar', icon: '🎸' },
  { id: 'bass', name: 'Bass Guitar', icon: '🔊' },
  { id: 'ukulele', name: 'Ukulele', icon: '🌺' },
  { id: 'violin', name: 'Violin', icon: '🎻' },
  { id: 'banjo', name: 'Banjo', icon: '🪕' },
];

export const TUNINGS: TuningPreset[] = [
  // GUITAR 6-STRING
  {
    id: 'guitar-standard',
    name: 'Standard (E A D G B E)',
    instrument: 'guitar',
    category: 'Standard',
    description: 'The universal tuning used in 95% of guitar music.',
    strings: [
      { name: 'E2', note: 'E', octave: 2, targetFreq: 82.41, label: '6' },
      { name: 'A2', note: 'A', octave: 2, targetFreq: 110.00, label: '5' },
      { name: 'D3', note: 'D', octave: 3, targetFreq: 146.83, label: '4' },
      { name: 'G3', note: 'G', octave: 3, targetFreq: 196.00, label: '3' },
      { name: 'B3', note: 'B', octave: 3, targetFreq: 246.94, label: '2' },
      { name: 'E4', note: 'E', octave: 4, targetFreq: 329.63, label: '1' },
    ],
  },
  {
    id: 'guitar-drop-d',
    name: 'Drop D (D A D G B E)',
    instrument: 'guitar',
    category: 'Drop Tunings',
    description: 'Low E dropped to D for heavy one-finger power chords in Rock/Metal.',
    strings: [
      { name: 'D2', note: 'D', octave: 2, targetFreq: 73.42, label: '6' },
      { name: 'A2', note: 'A', octave: 2, targetFreq: 110.00, label: '5' },
      { name: 'D3', note: 'D', octave: 3, targetFreq: 146.83, label: '4' },
      { name: 'G3', note: 'G', octave: 3, targetFreq: 196.00, label: '3' },
      { name: 'B3', note: 'B', octave: 3, targetFreq: 246.94, label: '2' },
      { name: 'E4', note: 'E', octave: 4, targetFreq: 329.63, label: '1' },
    ],
  },
  {
    id: 'guitar-dadgad',
    name: 'DADGAD (Celtic / Kashmir)',
    instrument: 'guitar',
    category: 'Modal Tunings',
    description: 'Famous drone tuning popularized by Jimmy Page (Led Zeppelin) and Celtic folk.',
    strings: [
      { name: 'D2', note: 'D', octave: 2, targetFreq: 73.42, label: '6' },
      { name: 'A2', note: 'A', octave: 2, targetFreq: 110.00, label: '5' },
      { name: 'D3', note: 'D', octave: 3, targetFreq: 146.83, label: '4' },
      { name: 'G3', note: 'G', octave: 3, targetFreq: 196.00, label: '3' },
      { name: 'A3', note: 'A', octave: 3, targetFreq: 220.00, label: '2' },
      { name: 'D4', note: 'D', octave: 4, targetFreq: 293.66, label: '1' },
    ],
  },
  {
    id: 'guitar-half-step-down',
    name: 'Half Step Down (Eb Ab Db Gb Bb Eb)',
    instrument: 'guitar',
    category: 'Shifted',
    description: 'Favored by Jimi Hendrix, Stevie Ray Vaughan, Guns N Roses, and Nirvana.',
    strings: [
      { name: 'Eb2', note: 'D#', octave: 2, targetFreq: 77.78, label: '6' },
      { name: 'Ab2', note: 'G#', octave: 2, targetFreq: 103.83, label: '5' },
      { name: 'Db3', note: 'C#', octave: 3, targetFreq: 138.59, label: '4' },
      { name: 'Gb3', note: 'F#', octave: 3, targetFreq: 185.00, label: '3' },
      { name: 'Bb3', note: 'A#', octave: 3, targetFreq: 233.08, label: '2' },
      { name: 'Eb4', note: 'D#', octave: 4, targetFreq: 311.13, label: '1' },
    ],
  },
  {
    id: 'guitar-open-g',
    name: 'Open G (D G D G B D)',
    instrument: 'guitar',
    category: 'Open Tunings',
    description: 'Keith Richards (Rolling Stones) 5/6-string rock and blues slide tuning.',
    strings: [
      { name: 'D2', note: 'D', octave: 2, targetFreq: 73.42, label: '6' },
      { name: 'G2', note: 'G', octave: 2, targetFreq: 98.00, label: '5' },
      { name: 'D3', note: 'D', octave: 3, targetFreq: 146.83, label: '4' },
      { name: 'G3', note: 'G', octave: 3, targetFreq: 196.00, label: '3' },
      { name: 'B3', note: 'B', octave: 3, targetFreq: 246.94, label: '2' },
      { name: 'D4', note: 'D', octave: 4, targetFreq: 293.66, label: '1' },
    ],
  },
  {
    id: 'guitar-open-d',
    name: 'Open D (D A D F# A D)',
    instrument: 'guitar',
    category: 'Open Tunings',
    description: 'Rich resonant open major chord tuning, great for acoustic fingerstyle.',
    strings: [
      { name: 'D2', note: 'D', octave: 2, targetFreq: 73.42, label: '6' },
      { name: 'A2', note: 'A', octave: 2, targetFreq: 110.00, label: '5' },
      { name: 'D3', note: 'D', octave: 3, targetFreq: 146.83, label: '4' },
      { name: 'F#3', note: 'F#', octave: 3, targetFreq: 185.00, label: '3' },
      { name: 'A3', note: 'A', octave: 3, targetFreq: 220.00, label: '2' },
      { name: 'D4', note: 'D', octave: 4, targetFreq: 293.66, label: '1' },
    ],
  },
  {
    id: 'guitar-7-string-standard',
    name: '7-String Standard (B E A D G B E)',
    instrument: 'guitar',
    category: 'Extended Range',
    description: 'Low B string for modern prog, metal, and jazz extended range.',
    strings: [
      { name: 'B1', note: 'B', octave: 1, targetFreq: 61.74, label: '7' },
      { name: 'E2', note: 'E', octave: 2, targetFreq: 82.41, label: '6' },
      { name: 'A2', note: 'A', octave: 2, targetFreq: 110.00, label: '5' },
      { name: 'D3', note: 'D', octave: 3, targetFreq: 146.83, label: '4' },
      { name: 'G3', note: 'G', octave: 3, targetFreq: 196.00, label: '3' },
      { name: 'B3', note: 'B', octave: 3, targetFreq: 246.94, label: '2' },
      { name: 'E4', note: 'E', octave: 4, targetFreq: 329.63, label: '1' },
    ],
  },

  // BASS 4-STRING
  {
    id: 'bass-standard',
    name: '4-String Bass Standard (E A D G)',
    instrument: 'bass',
    category: 'Standard',
    description: 'Standard 4-string electric & acoustic bass tuning.',
    strings: [
      { name: 'E1', note: 'E', octave: 1, targetFreq: 41.20, label: '4' },
      { name: 'A1', note: 'A', octave: 1, targetFreq: 55.00, label: '3' },
      { name: 'D2', note: 'D', octave: 2, targetFreq: 73.42, label: '2' },
      { name: 'G2', note: 'G', octave: 2, targetFreq: 98.00, label: '1' },
    ],
  },
  {
    id: 'bass-drop-d',
    name: '4-String Bass Drop D (D A D G)',
    instrument: 'bass',
    category: 'Drop Tunings',
    description: 'Low E dropped to D to match Drop D guitars.',
    strings: [
      { name: 'D1', note: 'D', octave: 1, targetFreq: 36.71, label: '4' },
      { name: 'A1', note: 'A', octave: 1, targetFreq: 55.00, label: '3' },
      { name: 'D2', note: 'D', octave: 2, targetFreq: 73.42, label: '2' },
      { name: 'G2', note: 'G', octave: 2, targetFreq: 98.00, label: '1' },
    ],
  },
  {
    id: 'bass-5-string',
    name: '5-String Bass Standard (B E A D G)',
    instrument: 'bass',
    category: 'Extended Range',
    description: 'Low B string for sub-bass power down to 30.87 Hz.',
    strings: [
      { name: 'B0', note: 'B', octave: 0, targetFreq: 30.87, label: '5' },
      { name: 'E1', note: 'E', octave: 1, targetFreq: 41.20, label: '4' },
      { name: 'A1', note: 'A', octave: 1, targetFreq: 55.00, label: '3' },
      { name: 'D2', note: 'D', octave: 2, targetFreq: 73.42, label: '2' },
      { name: 'G2', note: 'G', octave: 2, targetFreq: 98.00, label: '1' },
    ],
  },

  // UKULELE
  {
    id: 'ukulele-standard',
    name: 'Standard Ukulele (G C E A - Reentrant)',
    instrument: 'ukulele',
    category: 'Standard',
    description: 'Standard re-entrant Hawaiian tuning with high G string.',
    strings: [
      { name: 'G4', note: 'G', octave: 4, targetFreq: 392.00, label: '4' },
      { name: 'C4', note: 'C', octave: 4, targetFreq: 261.63, label: '3' },
      { name: 'E4', note: 'E', octave: 4, targetFreq: 329.63, label: '2' },
      { name: 'A4', note: 'A', octave: 4, targetFreq: 440.00, label: '1' },
    ],
  },
  {
    id: 'ukulele-low-g',
    name: 'Low G Ukulele (G C E A)',
    instrument: 'ukulele',
    category: 'Alternate',
    description: 'Linear tuning with low G3 for deeper melodic range.',
    strings: [
      { name: 'G3', note: 'G', octave: 3, targetFreq: 196.00, label: '4' },
      { name: 'C4', note: 'C', octave: 4, targetFreq: 261.63, label: '3' },
      { name: 'E4', note: 'E', octave: 4, targetFreq: 329.63, label: '2' },
      { name: 'A4', note: 'A', octave: 4, targetFreq: 440.00, label: '1' },
    ],
  },

  // VIOLIN
  {
    id: 'violin-standard',
    name: 'Standard Violin (G D A E)',
    instrument: 'violin',
    category: 'Standard',
    description: 'Tuned in perfect fifths: G3, D4, A4, E5.',
    strings: [
      { name: 'G3', note: 'G', octave: 3, targetFreq: 196.00, label: '4' },
      { name: 'D4', note: 'D', octave: 4, targetFreq: 293.66, label: '3' },
      { name: 'A4', note: 'A', octave: 4, targetFreq: 440.00, label: '2' },
      { name: 'E5', note: 'E', octave: 5, targetFreq: 659.25, label: '1' },
    ],
  },

  // BANJO
  {
    id: 'banjo-open-g',
    name: '5-String Banjo Open G (g D G B D)',
    instrument: 'banjo',
    category: 'Standard',
    description: 'Standard Bluegrass & Scruggs style banjo tuning.',
    strings: [
      { name: 'G4', note: 'G', octave: 4, targetFreq: 392.00, label: '5' },
      { name: 'D3', note: 'D', octave: 3, targetFreq: 146.83, label: '4' },
      { name: 'G3', note: 'G', octave: 3, targetFreq: 196.00, label: '3' },
      { name: 'B3', note: 'B', octave: 3, targetFreq: 246.94, label: '2' },
      { name: 'D4', note: 'D', octave: 4, targetFreq: 293.66, label: '1' },
    ],
  },
];
