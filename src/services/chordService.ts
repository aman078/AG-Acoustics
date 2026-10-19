import { SongData, POPULAR_SONGS } from '../data/popularSongs';

export interface SearchSongItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  source: string;
  difficulty?: string;
  hasChords?: boolean;
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // If running in development Vite server on laptop
    if (window.location.hostname === 'localhost' && window.location.port === '3000') {
      return '';
    }
    // If running directly on a hosted website (e.g. Vercel)
    if (window.location.protocol.startsWith('http') && !window.location.origin.includes('localhost')) {
      return '';
    }
    // Check if user saved a custom backend URL
    const saved = localStorage.getItem('auratuner_custom_api_url');
    if (saved) return saved.replace(/\/$/, '');
  }
  // Default to env or hosted fallback
  return ((import.meta as any).env?.VITE_API_URL as string) || '';
}

/**
 * Searches for songs dynamically across GuitarTuna & Songsterr with local offline fallback
 */
export async function searchOnlineSongs(query: string): Promise<SearchSongItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    // Return default popular songs
    return POPULAR_SONGS.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      url: s.id,
      source: 'Featured',
      difficulty: s.difficulty,
      hasChords: true,
    }));
  }

  // Filter local popular songs first
  const localMatches: SearchSongItem[] = POPULAR_SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(trimmed) || s.artist.toLowerCase().includes(trimmed)
  ).map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    url: s.id,
    source: 'Curated (Full Chords)',
    difficulty: s.difficulty,
    hasChords: true,
  }));

  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    const data = (await res.json()) as { songs?: SearchSongItem[] };

    const remoteSongs = data.songs || [];
    // Combine and deduplicate
    const combined = [...localMatches];
    const seen = new Set(localMatches.map((s) => s.title.toLowerCase()));

    for (const r of remoteSongs) {
      if (!seen.has(r.title.toLowerCase())) {
        seen.add(r.title.toLowerCase());
        combined.push(r);
      }
    }

    return combined;
  } catch (err) {
    console.warn('Online search error, falling back to local database:', err);
    return localMatches;
  }
}

/**
 * Fetches the complete song chord sheet dynamically on demand
 */
export async function fetchCompleteSong(item: SearchSongItem): Promise<SongData> {
  // Check if it's already a curated song
  const localMatch = POPULAR_SONGS.find((s) => s.id === item.id);
  if (localMatch && localMatch.sections.length > 3) {
    return localMatch;
  }

  // Check localStorage cache (v3 for clean visual alignment)
  const cacheKey = `auratuner_song_v3_${item.id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as SongData;
    }
  } catch {
    // ignore
  }

  // Fetch live from scraper endpoint
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/api/song?url=${encodeURIComponent(item.url)}`);
    if (!res.ok) throw new Error('Failed to load song from scraper');
    const data = (await res.json()) as SongData;

    // Cache locally for offline performance
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      // ignore
    }

    return data;
  } catch (err) {
    console.error('Failed to fetch complete song chords, using fallback:', err);
    // If local match exists, return it
    if (localMatch) return localMatch;

    // Minimal fallback
    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      key: 'Standard Key',
      capo: 'No Capo',
      tuning: 'Standard (E A D G B E)',
      difficulty: 'Easy',
      allChords: ['G', 'C', 'D', 'Em'],
      sections: [
        {
          sectionTitle: 'Notice',
          lines: [
            {
              lyrics: `Could not fetch live chords for ${item.title}. Check internet connection or visit ${item.url}`,
              chords: [{ chord: 'G', position: 0 }],
            },
          ],
        },
      ],
    };
  }
}
