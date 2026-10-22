/**
 * Comprehensive Acoustic & Pop Song Tempo (BPM) Database
 * Contains verified studio tempos for iconic acoustic, rock, folk, pop, and indie pieces.
 */

export const KNOWN_SONG_TEMPOS: Record<string, number> = {
  // Eagles
  'hotel california': 74,
  'take it easy': 139,
  'tequila sunrise': 112,
  'desperado': 60,
  'lyin eyes': 132,
  "lyin' eyes": 132,
  'peaceful easy feeling': 143,
  'already gone': 150,
  'new kid in town': 107,
  'life in the fast lane': 110,
  'wasted time': 60,

  // Oasis
  'wonderwall': 87,
  "don't look back in anger": 84,
  'dont look back in anger': 84,
  'champagne supernova': 74,
  'live forever': 146,
  'stand by me oasis': 83,

  // The Beatles
  'let it be': 72,
  'here comes the sun': 129,
  'yesterday': 97,
  'blackbird': 94,
  'hey jude': 74,
  'something': 66,
  'in my life': 103,
  'across the universe': 75,
  'norwegian wood': 60,
  'while my guitar gently weeps': 62,
  'come together': 83,
  'help': 95,
  'all you need is love': 104,
  'eleanor rigby': 138,

  // Ed Sheeran
  'perfect': 63,
  'thinking out loud': 79,
  'photograph': 108,
  'castle on the hill': 135,
  'shape of you': 96,
  'the a team': 85,
  'lego house': 80,
  'supermarket flowers': 90,
  'bad habits': 126,
  'afterglow': 110,

  // Coldplay
  'yellow': 88,
  'fix you': 69,
  'the scientist': 73,
  'viva la vida': 138,
  'clocks': 131,
  'sparks': 103,
  'trouble': 70,
  'a sky full of stars': 125,

  // Pink Floyd
  'wish you were here': 60,
  'comfortably numb': 64,
  'time': 120,
  'breathe': 64,
  'hey you': 112,
  'mother': 67,

  // Bob Dylan
  'knockin on heavens door': 68,
  "knockin' on heaven's door": 68,
  'blowin in the wind': 88,
  "blowin' in the wind": 88,
  'like a rolling stone': 96,
  'dont think twice its all right': 112,
  "don't think twice, it's all right": 112,
  'tangled up in blue': 100,

  // Simon & Garfunkel
  'the sound of silence': 106,
  'sound of silence': 106,
  'the boxer': 93,
  'mrs robinson': 106,
  'scarborough fair': 130,
  'bridge over troubled water': 80,

  // Led Zeppelin
  'stairway to heaven': 72,
  'going to california': 78,
  'tangerine': 108,
  'over the hills and far away': 100,
  'babe im gonna leave you': 69,

  // Metallica
  'nothing else matters': 48,
  'the unforgiven': 69,
  'fade to black': 114,

  // Eric Clapton
  'tears in heaven': 78,
  'layla': 94,
  'wonderful tonight': 95,
  'change the world': 96,

  // John Denver
  'take me home country roads': 82,
  'country roads': 82,
  'annies song': 100,
  "annie's song": 100,
  'leaving on a jet plane': 116,
  'rocky mountain high': 76,

  // Passenger
  'let her go': 75,

  // Leonard Cohen / Jeff Buckley
  'hallelujah': 58,

  // Tracy Chapman
  'fast car': 104,
  'give me one reason': 100,
  'talkin bout a revolution': 120,

  // Green Day
  'good riddance': 95,
  'time of your life': 95,
  'boulevard of broken dreams': 83,
  '21 guns': 80,
  'wake me up when september ends': 105,

  // Fleetwood Mac
  'landslide': 79,
  'dreams': 120,
  'go your own way': 136,
  'rhiannon': 130,
  'never going back again': 87,
  'songbird': 104,

  // America
  'a horse with no name': 123,
  'horse with no name': 123,
  'ventura highway': 130,
  'sister golden hair': 136,
  'tin man': 124,

  // Vance Joy
  'riptide': 102,
  'georgia': 98,
  'missing piece': 104,

  // Lady Gaga & Bradley Cooper
  'shallow': 96,
  'always remember us this way': 65,

  // Radiohead
  'creep': 92,
  'karma police': 75,
  'fake plastic trees': 73,
  'high and dry': 88,
  'no surprises': 76,

  // Extreme
  'more than words': 92,

  // Kansas
  'dust in the wind': 94,

  // Lynyrd Skynyrd
  'sweet home alabama': 98,
  'simple man': 60,
  'free bird': 118,

  // Creedence Clearwater Revival (CCR)
  'have you ever seen the rain': 116,
  'bad moon rising': 90,
  'proud mary': 121,
  'lookin out my back door': 110,
  'fortunate son': 133,

  // Bob Marley
  'redemption song': 74,
  'three little birds': 74,
  'no woman no cry': 78,
  'is this love': 123,
  'one love': 76,

  // Johnny Cash
  'hurt': 80,
  'ring of fire': 104,
  'folsom prison blues': 110,
  'i walk the line': 106,

  // Guns N' Roses
  'sweet child o mine': 125,
  "sweet child o' mine": 125,
  'patience': 88,
  'dont cry': 65,
  "don't cry": 65,
  'november rain': 80,

  // Nirvana
  'about a girl': 131,
  'the man who sold the world': 116,
  'polly': 116,
  'come as you are': 120,
  'pennyroyal tea': 104,
  'where did you sleep last night': 68,

  // Pearl Jam
  'elderly woman': 76,
  'black': 72,
  'better man': 74,
  'just breathe': 84,

  // Goo Goo Dolls
  'iris': 78,
  'name': 80,
  'slide': 110,

  // The Lumineers
  'ho hey': 80,
  'ophelia': 76,
  'stubborn love': 72,
  'cleopatra': 112,

  // Mumford & Sons
  'little lion man': 140,
  'the cave': 142,
  'i will wait': 132,

  // Jack Johnson
  'banana pancakes': 60,
  'better together': 110,
  'sitting waiting wishing': 96,
  'flake': 92,

  // Jason Mraz
  'im yours': 76,
  "i'm yours": 76,
  'i wont give up': 68,
  "i won't give up": 68,
  'lucky': 130,

  // Neil Young
  'heart of gold': 85,
  'old man': 72,
  'harvest moon': 113,
  'needle and the damage done': 78,

  // Cat Stevens
  'father and son': 69,
  'wild world': 76,
  'morning has broken': 124,
  'peace train': 84,
  'moonshadow': 120,

  // James Taylor
  'fire and rain': 76,
  'youve got a friend': 78,
  "you've got a friend": 78,
  'carolina in my mind': 75,
  'sweet baby james': 86,

  // Dolly Parton
  'jolene': 110,
  'i will always love you': 68,
  '9 to 5': 105,

  // Tom Petty
  'free fallin': 84,
  "free fallin'": 84,
  'learning to fly': 84,
  'i wont back down': 114,
  'wildflowers': 87,

  // Don McLean
  'american pie': 138,
  'vincent': 76,

  // Harry Chapin
  'cats in the cradle': 78,
  "cat's in the cradle": 78,

  // John Mayer
  'gravity': 62,
  'daughters': 78,
  'stop this train': 96,
  'why georgia': 98,
  'slow dancing in a burning room': 67,

  // Billie Eilish
  'ocean eyes': 72,
  'when the partys over': 62,
  'everything i wanted': 60,

  // Olivia Rodrigo
  'drivers license': 72,
  'deja vu': 90,
  'traitor': 50,

  // Lewis Capaldi
  'someone you loved': 110,
  'before you go': 112,

  // Sam Smith
  'stay with me': 84,
  'im not the only one': 82,

  // Adele
  'someone like you': 68,
  'make you feel my love': 76,
  'when we were young': 72,
  'easy on me': 71,

  // Taylor Swift
  'love story': 119,
  'all too well': 93,
  'champagne problems': 86,
  'willow': 81,
  'cardigan': 130,

  // Classics
  'stand by me': 118,
  'brown eyed girl': 150,
  'dock of the bay': 103,
  'aint no sunshine': 78,
  "ain't no sunshine": 78,
  'lean on me': 79,
  'cant help falling in love': 68,
  "can't help falling in love": 68,
  'somewhere over the rainbow': 85,
};

/**
 * Normalizes title for fuzzy tempo matching
 */
function cleanSongKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/acoustic|chords|tab|live|remastered|version|official|video/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Automatically detects the authentic song tempo (BPM)
 */
export function detectSongTempo(
  title: string,
  artist?: string,
  rawContent?: string
): { bpm: number; source: 'sheet_meta' | 'verified_catalog' | 'intelligent_estimate' } {
  // 1. Check if raw tab content contains explicit BPM / Tempo notation
  if (rawContent) {
    const directMatch =
      rawContent.match(/(?:tempo|bpm)\s*[:=]?\s*(\d{2,3})/i) ||
      rawContent.match(/(?:♩|q)\s*=\s*(\d{2,3})/i) ||
      rawContent.match(/(\d{2,3})\s*bpm/i);

    if (directMatch) {
      const val = parseInt(directMatch[1], 10);
      if (val >= 40 && val <= 240) {
        return { bpm: val, source: 'sheet_meta' };
      }
    }
  }

  // 2. Check curated authentic acoustic tempo catalog
  const cleanTitle = cleanSongKey(title || '');
  if (cleanTitle) {
    // Exact or substring match
    for (const [key, bpm] of Object.entries(KNOWN_SONG_TEMPOS)) {
      if (cleanTitle === key || cleanTitle.includes(key) || key.includes(cleanTitle)) {
        return { bpm, source: 'verified_catalog' };
      }
    }

    if (artist) {
      const combined = cleanSongKey(`${title} ${artist}`);
      for (const [key, bpm] of Object.entries(KNOWN_SONG_TEMPOS)) {
        if (combined.includes(key)) {
          return { bpm, source: 'verified_catalog' };
        }
      }
    }
  }

  // 3. Intelligent default based on title emotional feel
  const t = cleanTitle.toLowerCase();
  if (t.includes('ballad') || t.includes('slow') || t.includes('cry') || t.includes('sad') || t.includes('lullaby')) {
    return { bpm: 68, source: 'intelligent_estimate' };
  }
  if (t.includes('shuffle') || t.includes('blues') || t.includes('ragtime')) {
    return { bpm: 108, source: 'intelligent_estimate' };
  }
  if (t.includes('rock') || t.includes('fast') || t.includes('drive') || t.includes('sun') || t.includes('dance')) {
    return { bpm: 120, source: 'intelligent_estimate' };
  }

  // Balanced mid-tempo standard acoustic default
  return { bpm: 84, source: 'intelligent_estimate' };
}
