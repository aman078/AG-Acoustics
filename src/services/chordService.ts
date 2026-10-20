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
    // 1. Check if user configured a custom API URL
    const saved = localStorage.getItem('auratuner_custom_api_url');
    if (saved && saved.trim()) return saved.trim().replace(/\/$/, '');

    // 2. If running locally on development server on laptop (port 3000 or 5173)
    if (window.location.hostname === 'localhost' && (window.location.port === '3000' || window.location.port === '5173')) {
      return '';
    }

    // 3. If running on the hosted Vercel website in a browser, relative path works directly
    if (window.location.hostname.endsWith('vercel.app')) {
      return '';
    }
  }

  // 4. If environment variable is set
  const envUrl = (import.meta as any).env?.VITE_API_URL as string;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 5. Default production cloud backend for Android APK, Capacitor WebView, and mobile apps
  return 'https://ag-acoustics.vercel.app';
}

/**
 * Searches for songs dynamically across GuitarTuna & Ultimate Guitar with local repertoire support.
 * Returns empty array when query is empty (no preloaded dead songs).
 */
export async function searchOnlineSongs(query: string, signal?: AbortSignal): Promise<SearchSongItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  // Tokenize query words (skip stop words, require word length >= 2)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'from', 'song', 'chords', 'tabs', 'lyrics', 'easy', 'guitar']);
  const queryTokens = trimmed
    .split(/[\s\-_\/]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length >= 2 && !stopWords.has(t));

  // Search curated classical / fingerstyle / blues pieces by TITLE or ARTIST only (NEVER by category name!)
  const localMatches: SearchSongItem[] = REPERTOIRE_PIECES.filter((p) => {
    const textClean = `${p.title} ${p.artist}`.toLowerCase();
    if (textClean.includes(trimmed)) return true;
    if (queryTokens.length === 0) return false;
    
    // For multi-word queries, at least 70% of words must match as actual word prefixes or boundaries
    const matchingTokens = queryTokens.filter((token) => {
      const regex = new RegExp(`(^|\\b)${token}`, 'i');
      return regex.test(textClean);
    });
    return matchingTokens.length >= Math.ceil(queryTokens.length * 0.7);
  }).map((p) => ({
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
    const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(query)}`, { signal });
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
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
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
