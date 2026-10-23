/**
 * Knowledge Base for Movie Soundtracks & Artist Catalogs
 * Maps spoken movie titles and artist names to their iconic guitar tracks and hits.
 */

export interface MovieSoundtrack {
  movie: string;
  aliases: string[];
  hitSongs: string[];
}

export interface ArtistCatalog {
  artist: string;
  aliases: string[];
  hitSongs: string[];
}

export const MOVIE_SOUNDTRACKS: MovieSoundtrack[] = [
  {
    movie: 'Awaara Paagal Deewana',
    aliases: ['awaara pagal deewana', 'awarah pagal deewana', 'apd', 'awara pagal dewana'],
    hitSongs: [
      'Aisa Pehli Baar Hua Hai',
      'Yeh Tune Kya Kiya',
      'Maine To Khai Kasam',
      'More Sawariya',
    ],
  },
  {
    movie: 'Aashiqui 2',
    aliases: ['aashiqui', 'ashiqui 2', 'ashiqui', 'aashique 2'],
    hitSongs: [
      'Tum Hi Ho',
      'Sunn Raha Hai',
      'Chahun Main Ya Naa',
      'Bhula Dena',
      'Hum Mar Jayenge',
    ],
  },
  {
    movie: 'Rockstar',
    aliases: ['rock star', 'ranbir rockstar'],
    hitSongs: [
      'Nadaan Parinde',
      'Kun Faya Kun',
      'Tum Ho',
      'Jo Bhi Main',
      'Phir Se Ud Chala',
      'Hawaa Hawaa',
    ],
  },
  {
    movie: 'Kabir Singh',
    aliases: ['kabir sing', 'kabeer singh'],
    hitSongs: [
      'Bekhayali',
      'Tujhe Kitna Chahne Lage',
      'Kaise Hua',
      'Mere Sohneya',
      'Tera Ban Jaunga',
    ],
  },
  {
    movie: 'Dil Chahta Hai',
    aliases: ['dil chahta he', 'dch'],
    hitSongs: [
      'Dil Chahta Hai',
      'Jane Kyon',
      'Woh Ladki Hai Kahan',
      'Tanhayee',
      'Koi Kahe Kehta Rahe',
    ],
  },
  {
    movie: 'Zindagi Na Milegi Dobara',
    aliases: ['znmd', 'zindagi na milegi dobara', 'zindagi na milegi'],
    hitSongs: [
      'Senorita',
      'Khaabon Ke Parinday',
      'Der Lagi Lekin',
      'Ik Junoon',
      'Sooraj Ki Baahon Mein',
    ],
  },
  {
    movie: 'Yeh Jawaani Hai Deewani',
    aliases: ['yjhd', 'yeh jawani hai deewani', 'yeh jawani'],
    hitSongs: [
      'Kabira',
      'Ilahi',
      'Balam Pichkari',
      'Subhanallah',
      'Badtameez Dil',
    ],
  },
  {
    movie: '3 Idiots',
    aliases: ['three idiots', '3 idiots'],
    hitSongs: [
      'Give Me Some Sunshine',
      'All Izz Well',
      'Zoobi Doobi',
      'Jaane Nahin Denge Tujhe',
    ],
  },
  {
    movie: 'Laila Majnu',
    aliases: ['laila majnu', 'laila majnoo'],
    hitSongs: [
      'Aahista',
      'Hafiz Hafiz',
      'O Meri Laila',
      'Sarphiri',
    ],
  },
  {
    movie: 'Kedarnath',
    aliases: ['kedarnath', 'kedarnat'],
    hitSongs: [
      'Namo Namo',
      'Qaafirana',
      'Sweetheart',
      'Jaan Nisaar',
    ],
  },
  {
    movie: 'Animal',
    aliases: ['animal movie', 'animal ranbir'],
    hitSongs: [
      'Satranga',
      'Pehle Bhi Main',
      'Arjan Vailly',
      'Papa Meri Jaan',
      'Hua Main',
    ],
  },
  {
    movie: 'Sholay',
    aliases: ['sholay', 'sholey'],
    hitSongs: [
      'Yeh Dosti Hum Nahi Todenge',
      'Mehbooba Mehbooba',
      'Koi Haseena',
    ],
  },
  {
    movie: 'Jab We Met',
    aliases: ['jab we met', 'jab we mate'],
    hitSongs: [
      'Tum Se Hi',
      'Mauja Hi Mauja',
      'Aaoge Jab Tum',
      'Yeh Ishq Hai',
    ],
  },
  {
    movie: 'Barfi',
    aliases: ['barfi', 'burfi'],
    hitSongs: [
      'Kyon',
      'Ala Barfi',
      'Phir Le Aya Dil',
      'Saawali Si Raat',
    ],
  },
  {
    movie: 'Gangs of Wasseypur',
    aliases: ['wasseypur', 'gangs of wasseypur'],
    hitSongs: [
      'I Am a Hunter',
      'Keh Ke Lunga',
      'Womaniya',
      'Moora',
    ],
  },
];

export const ARTIST_CATALOGS: ArtistCatalog[] = [
  {
    artist: 'Arijit Singh',
    aliases: ['arijit', 'arijit singh', 'arijith singh', 'arjit singh', 'arijeet singh'],
    hitSongs: [
      'Tum Hi Ho',
      'Channa Mereya',
      'Kesariya',
      'Raabta',
      'Apna Bana Le',
      'Shayad',
      'Ae Dil Hai Mushkil',
      'Gerua',
      'Phir Aur Kya Chahiye',
      'Hamari Adhuri Kahani',
      'Muskurane Ki Wajah',
    ],
  },
  {
    artist: 'Atif Aslam',
    aliases: ['atif', 'atif aslam', 'aatif aslam'],
    hitSongs: [
      'Aadat',
      'Pehli Nazar Mein',
      'Tere Bin',
      'Jeene Laga Hoon',
      'Tajdar-e-Haram',
      'Woh Lamhe',
      'Doorie',
      'Dil Diyan Gallan',
    ],
  },
  {
    artist: 'Lucky Ali',
    aliases: ['lucky ali', 'lucky', 'luki ali'],
    hitSongs: [
      'O Sanam',
      'Gori Teri Aankhein',
      'Na Tum Jano Na Hum',
      'Jaane Kya Dhoondta Hai',
      'Safarnama',
      'Dekha Hai Aise Bhi',
    ],
  },
  {
    artist: 'Mohit Chauhan',
    aliases: ['mohit chauhan', 'mohit chouhan', 'silk route'],
    hitSongs: [
      'Dooba Dooba',
      'Tum Se Hi',
      'Nadaan Parinde',
      'Masakali',
      'Pee Loon',
      'Matargashti',
      'Tujhe Bhula Diya',
    ],
  },
  {
    artist: 'Kishore Kumar',
    aliases: ['kishore kumar', 'kishor kumar', 'kishore da'],
    hitSongs: [
      'O Mere Dil Ke Chain',
      'Roop Tera Mastana',
      'Pal Pal Dil Ke Paas',
      'Yeh Shaam Mastani',
      'Chookar Mere Man Ko',
      'Zindagi Ek Safar Hai Suhana',
      'Mere Sapno Ki Rani',
    ],
  },
  {
    artist: 'Prateek Kuhad',
    aliases: ['prateek kuhad', 'pratik kuhad'],
    hitSongs: [
      'cold/mess',
      'Kasoor',
      'Tune Kaha',
      'Kho Gaye Hum Kahan',
      'Kadam',
    ],
  },
  {
    artist: 'Anuv Jain',
    aliases: ['anuv jain', 'anuv', 'anubh jain'],
    hitSongs: [
      'Baarishein',
      'Husn',
      'Alag Aasmaan',
      'Mishri',
      'Gul',
      'Ocean',
    ],
  },
  {
    artist: 'Coldplay',
    aliases: ['coldplay', 'cold play', 'chris martin'],
    hitSongs: [
      'Yellow',
      'The Scientist',
      'Fix You',
      'Viva La Vida',
      'Sparks',
      'Clocks',
    ],
  },
  {
    artist: 'Ed Sheeran',
    aliases: ['ed sheeran', 'ed shiran', 'sheeran'],
    hitSongs: [
      'Perfect',
      'Photograph',
      'Thinking Out Loud',
      'Shape of You',
      'Castle On The Hill',
      'The A Team',
    ],
  },
];

/**
 * Strips conversational voice assistant filler phrases
 */
export function cleanVoiceQuery(transcript: string): string {
  let cleaned = transcript.toLowerCase().trim();

  // Common spoken prefixes & suffixes in English & Hindi/Hinglish
  const speechFillers = [
    /^(can you\s+)?(please\s+)?(find|search|play|get|show|open|bring up|give me|look for)\s+(me\s+)?(chords|tabs|guitar chords|guitar tabs|song|songs|the song|music)?\s*(for|of|from|by)?\s*/i,
    /^(chords|tabs|tab|guitar chords)\s+(of|for|from|by)\s*/i,
    /^(songs|song)\s+(of|from|by)\s*/i,
    /^(movie|film|cinema)\s+/i,
    /\s+(movie|film|cinema)$/i,
    /\s+(ke\s+gaane|ka\s+gana|ke\s+geet|gaana|chords|tabs|song|songs)$/i,
    /^(mujhe\s+)?(kisi\s+)?(gaane\s+dikhao|gana\s+bajao)\s*/i,
  ];

  for (const regex of speechFillers) {
    cleaned = cleaned.replace(regex, '').trim();
  }

  return cleaned.trim();
}

export interface VoiceResolvedResult {
  originalQuery: string;
  cleanedQuery: string;
  type: 'movie' | 'artist' | 'direct';
  title: string;
  searchKeywords: string[];
  suggestedSongs?: string[];
  bannerText?: string;
}

/**
 * Intelligent Entity Resolution: Checks if the spoken query matches
 * a movie soundtrack or an artist, returning relevant tracks.
 */
export function resolveVoiceContext(rawTranscript: string): VoiceResolvedResult {
  const cleaned = cleanVoiceQuery(rawTranscript);
  const lowerClean = cleaned.toLowerCase();

  // 1. Check Movie Soundtracks
  for (const m of MOVIE_SOUNDTRACKS) {
    const isDirectMatch =
      lowerClean === m.movie.toLowerCase() ||
      m.aliases.some((alias) => lowerClean === alias || lowerClean.includes(alias) || alias.includes(lowerClean));

    if (isDirectMatch) {
      return {
        originalQuery: rawTranscript,
        cleanedQuery: m.movie,
        type: 'movie',
        title: m.movie,
        searchKeywords: m.hitSongs,
        suggestedSongs: m.hitSongs,
        bannerText: `🎬 Movie Soundtrack: "${m.movie}" (${m.hitSongs.length} Songs)`,
      };
    }
  }

  // 2. Check Artist Catalogs
  for (const a of ARTIST_CATALOGS) {
    const isArtistMatch =
      lowerClean === a.artist.toLowerCase() ||
      a.aliases.some((alias) => lowerClean === alias || lowerClean.includes(alias) || alias.includes(lowerClean));

    if (isArtistMatch) {
      return {
        originalQuery: rawTranscript,
        cleanedQuery: a.artist,
        type: 'artist',
        title: a.artist,
        searchKeywords: [a.artist, ...a.hitSongs.slice(0, 4)],
        suggestedSongs: a.hitSongs,
        bannerText: `🎤 Artist Hits: "${a.artist}" (${a.hitSongs.length} Top Tracks)`,
      };
    }
  }

  // 3. Direct Song / Artist fallback
  return {
    originalQuery: rawTranscript,
    cleanedQuery: cleaned,
    type: 'direct',
    title: cleaned,
    searchKeywords: [cleaned],
  };
}
