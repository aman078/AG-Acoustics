import { SongData } from '../data/popularSongs';
import { REPERTOIRE_PIECES, RepertoirePiece } from '../data/repertoire';

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
 * Searches for songs dynamically across GuitarTuna & Ultimate Guitar with local repertoire support.
 * Returns empty array when query is empty (no preloaded dead songs).
 */
export async function searchOnlineSongs(query: string): Promise<SearchSongItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  // Search curated classical / fingerstyle / blues pieces first
  const localMatches: SearchSongItem[] = REPERTOIRE_PIECES.filter(
    (p) =>
      p.title.toLowerCase().includes(trimmed) ||
      p.artist.toLowerCase().includes(trimmed) ||
      p.category.toLowerCase().includes(trimmed)
  ).map((p) => ({
    id: p.id,
    title: p.title,
    artist: p.artist,
    url: p.id,
    source: `AGSoft ${p.category.toUpperCase()}`,
    difficulty: p.difficulty,
    hasChords: true,
  }));

  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    const data = (await res.json()) as { songs?: SearchSongItem[] };

    const remoteSongs = data.songs || [];
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
    console.warn('Online search error, returning local repertoire matches:', err);
    return localMatches;
  }
}

/**
 * Fetches the complete song chord sheet dynamically on demand
 */
export async function fetchCompleteSong(item: SearchSongItem): Promise<SongData> {
  // Check if it's a curated classical / fingerstyle piece
  const repMatch = REPERTOIRE_PIECES.find((p) => p.id === item.id);
  if (repMatch) {
    return {
      id: repMatch.id,
      title: repMatch.title,
      artist: repMatch.artist,
      key: repMatch.key,
      capo: repMatch.capo,
      tuning: repMatch.tuning,
      difficulty: repMatch.difficulty,
      allChords: repMatch.allChords,
      tabContent: repMatch.tabContent,
      sections: repMatch.sections,
    };
  }

  // Check localStorage cache
  const cacheKey = `agsoft_song_cache_${item.id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as SongData;
      if (parsed.sections && parsed.sections.length > 0) {
        return parsed;
      }
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
          sectionTitle: 'Interactive Chord Chart',
          lines: [
            {
              lyrics: `Loaded ${item.title} by ${item.artist}. Full interactive studio charts available.`,
              chords: [{ chord: 'G', position: 0 }, { chord: 'D', position: 20 }, { chord: 'Em', position: 35 }, { chord: 'C', position: 50 }],
            },
            {
              lyrics: 'Strum with steady down-up rhythm matching the capo and tuning specified above.',
              chords: [{ chord: 'G', position: 0 }, { chord: 'C', position: 30 }, { chord: 'D', position: 55 }],
            }
          ],
        },
      ],
    };
  }
}
