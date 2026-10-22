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
  tempo?: number | string;
  sections: SongChordSection[];
}

export const POPULAR_SONGS: SongData[] = [
  {
    id: 'hotel-california-eagles',
    title: 'Hotel California',
    artist: 'Eagles',
    albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
    key: 'Bm',
    capo: 'Capo 7th Fret (or Capo 2nd Fret in Am)',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Intermediate',
    allChords: ['Bm', 'F#', 'A', 'E', 'G', 'D', 'Em'],
    sections: [
      {
        sectionTitle: 'Intro',
        lines: [
          {
            lyrics: '| Bm - F# | A - E | G - D | Em - F# | (x2)',
            chords: [{ chord: 'Bm', position: 2 }, { chord: 'F#', position: 7 }, { chord: 'A', position: 12 }, { chord: 'E', position: 16 }, { chord: 'G', position: 20 }, { chord: 'D', position: 24 }, { chord: 'Em', position: 28 }, { chord: 'F#', position: 33 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'On a dark desert highway, cool wind in my hair',
            chords: [{ chord: 'Bm', position: 0 }, { chord: 'F#', position: 26 }]
          },
          {
            lyrics: 'Warm smell of colitas, rising up through the air',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 23 }]
          },
          {
            lyrics: 'Up ahead in the distance, I saw a shimmering light',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 26 }]
          },
          {
            lyrics: 'My head grew heavy and my sight grew dim, I had to stop for the night',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 42 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 2',
        lines: [
          {
            lyrics: 'There she stood in the doorway, I heard the mission bell',
            chords: [{ chord: 'Bm', position: 0 }, { chord: 'F#', position: 32 }]
          },
          {
            lyrics: 'And I was thinking to myself, "This could be Heaven or this could be Hell"',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 30 }]
          },
          {
            lyrics: 'Then she lit up a candle, and she showed me the way',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 26 }]
          },
          {
            lyrics: 'There were voices down the corridor, I thought I heard them say...',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 37 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 1',
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
      },
      {
        sectionTitle: 'Verse 3',
        lines: [
          {
            lyrics: 'Her mind is Tiffany-twisted, she got the Mercedes bends',
            chords: [{ chord: 'Bm', position: 0 }, { chord: 'F#', position: 28 }]
          },
          {
            lyrics: 'She got a lot of pretty, pretty boys that she calls friends',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 30 }]
          },
          {
            lyrics: 'How they dance in the courtyard, sweet summer sweat',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 25 }]
          },
          {
            lyrics: 'Some dance to remember, some dance to forget',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 24 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 4',
        lines: [
          {
            lyrics: 'So I called up the Captain, "Please bring me my wine"',
            chords: [{ chord: 'Bm', position: 0 }, { chord: 'F#', position: 28 }]
          },
          {
            lyrics: 'He said, "We haven\'t had that spirit here since nineteen sixty-nine"',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 35 }]
          },
          {
            lyrics: 'And still those voices are calling from far away',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 27 }]
          },
          {
            lyrics: 'Wake you up in the middle of the night just to hear them say...',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 35 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 2',
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
            lyrics: 'They livin\' it up at the Hotel California',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 20 }]
          },
          {
            lyrics: 'What a nice surprise, bring your alibis',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 21 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 5',
        lines: [
          {
            lyrics: 'Mirrors on the ceiling, the pink champagne on ice',
            chords: [{ chord: 'Bm', position: 0 }, { chord: 'F#', position: 23 }]
          },
          {
            lyrics: 'And she said, "We are all just prisoners here of our own device"',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 32 }]
          },
          {
            lyrics: 'And in the master\'s chambers, they gathered for the feast',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 28 }]
          },
          {
            lyrics: 'They stab it with their steely knives, but they just can\'t kill the beast',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 38 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 6 & Outro',
        lines: [
          {
            lyrics: 'Last thing I remember, I was running for the door',
            chords: [{ chord: 'Bm', position: 0 }, { chord: 'F#', position: 23 }]
          },
          {
            lyrics: 'I had to find the passage back to the place I was before',
            chords: [{ chord: 'A', position: 0 }, { chord: 'E', position: 29 }]
          },
          {
            lyrics: '"Relax," said the night man, "We are programmed to receive"',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 29 }]
          },
          {
            lyrics: '"You can check out any time you like, but you can never leave!"',
            chords: [{ chord: 'Em', position: 0 }, { chord: 'F#', position: 38 }]
          },
          {
            lyrics: '[Iconic Dual Guitar Solo: Don Felder & Joe Walsh - Fade out]',
            chords: [{ chord: 'Bm', position: 1 }, { chord: 'F#', position: 15 }, { chord: 'A', position: 30 }, { chord: 'E', position: 42 }]
          }
        ]
      }
    ]
  },
  {
    id: 'hallelujah-leonard-cohen',
    title: 'Hallelujah',
    artist: 'Leonard Cohen (Jeff Buckley)',
    albumArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80',
    key: 'C Major',
    capo: 'No Capo',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Easy',
    allChords: ['C', 'Am', 'F', 'G', 'E7'],
    sections: [
      {
        sectionTitle: 'Intro',
        lines: [
          {
            lyrics: '| C - Am | C - Am | (6/8 Fingerpicking Arpeggios)',
            chords: [{ chord: 'C', position: 2 }, { chord: 'Am', position: 6 }, { chord: 'C', position: 11 }, { chord: 'Am', position: 15 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'Now I\'ve heard there was a secret chord that David played, and it pleased the Lord',
            chords: [{ chord: 'C', position: 0 }, { chord: 'Am', position: 27 }, { chord: 'C', position: 42 }, { chord: 'Am', position: 62 }]
          },
          {
            lyrics: 'But you don\'t really care for music, do you?',
            chords: [{ chord: 'F', position: 0 }, { chord: 'G', position: 25 }, { chord: 'C', position: 35 }, { chord: 'G', position: 40 }]
          },
          {
            lyrics: 'It goes like this: the fourth, the fifth, the minor fall, the major lift',
            chords: [{ chord: 'C', position: 0 }, { chord: 'F', position: 19 }, { chord: 'G', position: 31 }, { chord: 'Am', position: 42 }, { chord: 'F', position: 58 }]
          },
          {
            lyrics: 'The baffled king composing Hallelujah',
            chords: [{ chord: 'G', position: 0 }, { chord: 'E7', position: 17 }, { chord: 'Am', position: 27 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 1',
        lines: [
          {
            lyrics: 'Hallelujah, Hallelujah',
            chords: [{ chord: 'F', position: 0 }, { chord: 'Am', position: 12 }]
          },
          {
            lyrics: 'Hallelujah, Hallelu---jah',
            chords: [{ chord: 'F', position: 0 }, { chord: 'C', position: 12 }, { chord: 'G', position: 18 }, { chord: 'C', position: 22 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 2',
        lines: [
          {
            lyrics: 'Your faith was strong but you needed proof, you saw her bathing on the roof',
            chords: [{ chord: 'C', position: 0 }, { chord: 'Am', position: 26 }, { chord: 'C', position: 43 }, { chord: 'Am', position: 62 }]
          },
          {
            lyrics: 'Her beauty and the moonlight overthrew ya',
            chords: [{ chord: 'F', position: 0 }, { chord: 'G', position: 23 }, { chord: 'C', position: 33 }, { chord: 'G', position: 38 }]
          },
          {
            lyrics: 'She tied you to a kitchen chair, she broke your throne, and she cut your hair',
            chords: [{ chord: 'C', position: 0 }, { chord: 'F', position: 22 }, { chord: 'G', position: 33 }, { chord: 'Am', position: 48 }, { chord: 'F', position: 66 }]
          },
          {
            lyrics: 'And from your lips she drew the Hallelujah',
            chords: [{ chord: 'G', position: 0 }, { chord: 'E7', position: 20 }, { chord: 'Am', position: 32 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 2',
        lines: [
          {
            lyrics: 'Hallelujah, Hallelujah',
            chords: [{ chord: 'F', position: 0 }, { chord: 'Am', position: 12 }]
          },
          {
            lyrics: 'Hallelujah, Hallelu---jah',
            chords: [{ chord: 'F', position: 0 }, { chord: 'C', position: 12 }, { chord: 'G', position: 18 }, { chord: 'C', position: 22 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 3',
        lines: [
          {
            lyrics: 'Baby I have been here before, I know this room, I\'ve walked this floor',
            chords: [{ chord: 'C', position: 0 }, { chord: 'Am', position: 24 }, { chord: 'C', position: 41 }, { chord: 'Am', position: 58 }]
          },
          {
            lyrics: 'I used to live alone before I knew ya',
            chords: [{ chord: 'F', position: 0 }, { chord: 'G', position: 20 }, { chord: 'C', position: 29 }, { chord: 'G', position: 34 }]
          },
          {
            lyrics: 'I\'ve seen your flag on the marble arch, love is not a victory march',
            chords: [{ chord: 'C', position: 0 }, { chord: 'F', position: 24 }, { chord: 'G', position: 38 }, { chord: 'Am', position: 47 }, { chord: 'F', position: 60 }]
          },
          {
            lyrics: 'It\'s a cold and it\'s a broken Hallelujah',
            chords: [{ chord: 'G', position: 0 }, { chord: 'E7', position: 20 }, { chord: 'Am', position: 30 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 3 & Outro',
        lines: [
          {
            lyrics: 'Hallelujah, Hallelujah',
            chords: [{ chord: 'F', position: 0 }, { chord: 'Am', position: 12 }]
          },
          {
            lyrics: 'Hallelujah, Hallelu---jah (Fade out)',
            chords: [{ chord: 'F', position: 0 }, { chord: 'C', position: 12 }, { chord: 'G', position: 18 }, { chord: 'C', position: 22 }]
          }
        ]
      }
    ]
  },
  {
    id: 'wish-you-were-here-pink-floyd',
    title: 'Wish You Were Here',
    artist: 'Pink Floyd',
    albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
    key: 'G Major',
    capo: 'No Capo',
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Intermediate',
    allChords: ['Em7', 'G', 'A7sus4', 'Cadd9', 'C', 'D', 'Am'],
    sections: [
      {
        sectionTitle: 'Intro Acoustic Riff',
        lines: [
          {
            lyrics: '| Em7 - G | Em7 - G | Em7 - A7sus4 | Em7 - A7sus4 - G |',
            chords: [{ chord: 'Em7', position: 2 }, { chord: 'G', position: 8 }, { chord: 'Em7', position: 12 }, { chord: 'G', position: 18 }, { chord: 'A7sus4', position: 28 }, { chord: 'G', position: 48 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 1',
        lines: [
          {
            lyrics: 'So, so you think you can tell Heaven from Hell?',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 27 }, { chord: 'Am', position: 36 }]
          },
          {
            lyrics: 'Blue skies from pain? Can you tell a green field from a cold steel rail?',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 18 }, { chord: 'C', position: 32 }, { chord: 'Am', position: 56 }]
          },
          {
            lyrics: 'A smile from a veil? Do you think you can tell?',
            chords: [{ chord: 'G', position: 0 }]
          }
        ]
      },
      {
        sectionTitle: 'Verse 2',
        lines: [
          {
            lyrics: 'Did they get you to trade your heroes for ghosts?',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 26 }, { chord: 'Am', position: 38 }]
          },
          {
            lyrics: 'Hot ashes for trees? Hot air for a cool breeze? Cold comfort for change?',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 21 }, { chord: 'C', position: 44 }, { chord: 'Am', position: 60 }]
          },
          {
            lyrics: 'Did you exchange a walk-on part in the war for a lead role in a cage?',
            chords: [{ chord: 'G', position: 0 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus',
        lines: [
          {
            lyrics: 'How I wish, how I wish you were here',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 18 }, { chord: 'Am', position: 28 }]
          },
          {
            lyrics: 'We\'re just two lost souls swimming in a fish bowl, year after year',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 24 }, { chord: 'C', position: 48 }, { chord: 'Am', position: 58 }]
          },
          {
            lyrics: 'Running over the same old ground, what have we found?',
            chords: [{ chord: 'G', position: 0 }, { chord: 'Em7', position: 25 }, { chord: 'G', position: 45 }]
          },
          {
            lyrics: 'The same old fears, wish you were here',
            chords: [{ chord: 'A7sus4', position: 0 }, { chord: 'Em7', position: 17 }, { chord: 'A7sus4', position: 27 }, { chord: 'G', position: 35 }]
          }
        ]
      }
    ]
  },
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
        sectionTitle: 'Pre-Chorus 1',
        lines: [
          {
            lyrics: '\'Cause we were just kids when we fell in love',
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
        sectionTitle: 'Chorus 1',
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
      },
      {
        sectionTitle: 'Verse 2',
        lines: [
          {
            lyrics: 'Well, I found a woman, stronger than anyone I know',
            chords: [{ chord: 'G', position: 0 }, { chord: 'Em', position: 20 }]
          },
          {
            lyrics: 'She shares my dreams, I hope that someday I\'ll share her home',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 30 }]
          },
          {
            lyrics: 'I found a love to carry more than just my secrets',
            chords: [{ chord: 'G', position: 0 }, { chord: 'Em', position: 19 }]
          },
          {
            lyrics: 'To carry love, to carry children of our own',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 24 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 2 & Outro',
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
            lyrics: 'I have faith in what I see, now I know I have met an angel in person',
            chords: [{ chord: 'C', position: 0 }, { chord: 'D', position: 30 }]
          },
          {
            lyrics: 'And she looks perfect, no I don\'t deserve this, you look perfect tonight',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 25 }, { chord: 'G', position: 55 }]
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
        sectionTitle: 'Chorus 1',
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
      },
      {
        sectionTitle: 'Verse 2',
        lines: [
          {
            lyrics: 'I swam across, I jumped across for you',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 18 }]
          },
          {
            lyrics: 'Oh what a thing to do, \'cause you were all yellow',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 35 }]
          },
          {
            lyrics: 'I drew a line, I drew a line for you',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 17 }]
          },
          {
            lyrics: 'Oh what a thing to do, and it was all yellow',
            chords: [{ chord: 'C', position: 0 }, { chord: 'G', position: 32 }]
          }
        ]
      },
      {
        sectionTitle: 'Chorus 2 & Outro',
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
            lyrics: 'Look at the stars, look how they shine for you',
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 20 }, { chord: 'C', position: 38 }]
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
        sectionTitle: 'Verse 2',
        lines: [
          {
            lyrics: 'Backbeat, the word is on the street that the fire in your heart is out',
            chords: [{ chord: 'Em7', position: 0 }, { chord: 'G', position: 23 }, { chord: 'Dsus4', position: 41 }, { chord: 'A7sus4', position: 55 }]
          },
          {
            lyrics: 'I\'m sure you\'ve heard it all before, but you never really had a doubt',
            chords: [{ chord: 'Em7', position: 0 }, { chord: 'G', position: 24 }, { chord: 'Dsus4', position: 42 }, { chord: 'A7sus4', position: 55 }]
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
            lyrics: "Knock, knock, knockin' on heaven's door (fade out)",
            chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 12 }, { chord: 'C', position: 26 }]
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
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  let root = match[1];
  const suffix = match[2];

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

  for (const s of openShapes) {
    if (s.baseIdx === targetIdx) {
      return {
        fret: 0,
        openShapeKey: s.shape,
        recommendation: `Play open in ${targetNote}${isMinor ? 'm' : ''} with open chords`,
      };
    }
  }

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
