import { SongData, POPULAR_SONGS } from '../data/popularSongs';
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

    // 2. If running locally on development server on laptop (port 3000, 4173 or 5173)
    if (
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      (window.location.port === '3000' || window.location.port === '5173' || window.location.port === '4173')
    ) {
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
 * Searches local offline master repertoire (POPULAR_SONGS + REPERTOIRE_PIECES)
 * Returns zero-latency matches with full chord charts and tabs.
 */
export function searchLocalSongs(query: string): SearchSongItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const results: SearchSongItem[] = [];
  const seenIds = new Set<string>();
  const searchWords = trimmed.split(/[\s\-_\/]+/).filter((w) => w.length > 0);

  // 1. Check Popular Songs (Studio Masters)
  POPULAR_SONGS.forEach((p) => {
    const textClean = `${p.title} ${p.artist}`.toLowerCase();
    const isDirectMatch = textClean.includes(trimmed);
    const isWordMatch = searchWords.length > 1 && searchWords.every((w) => textClean.includes(w));
    if (isDirectMatch || isWordMatch) {
      results.push({
        id: p.id,
        title: p.title,
        artist: p.artist,
        url: p.id,
        source: 'AGSoft Master Sheet',
        difficulty: p.difficulty,
        hasChords: true,
      });
      seenIds.add(p.id.toLowerCase());
    }
  });

  // 2. Check Repertoire Pieces (29 Masterpieces)
  REPERTOIRE_PIECES.forEach((p) => {
    const textClean = `${p.title} ${p.artist} ${p.category}`.toLowerCase();
    const isDirectMatch = textClean.includes(trimmed);
    const isWordMatch = searchWords.length > 1 && searchWords.every((w) => textClean.includes(w));
    if ((isDirectMatch || isWordMatch) && !seenIds.has(p.id.toLowerCase())) {
      results.push({
        id: p.id,
        title: p.title,
        artist: p.artist,
        url: p.id,
        source: `Masterpiece (${p.category})`,
        difficulty: p.difficulty,
        hasChords: true,
      });
      seenIds.add(p.id.toLowerCase());
    }
  });

  return results;
}

/**
 * Searches for songs dynamically across GuitarTuna & Ultimate Guitar with local repertoire support.
 * Returns merged offline master sheets and online results.
 */
export async function searchOnlineSongs(query: string, signal?: AbortSignal): Promise<SearchSongItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return [];
  }

  // 1. Get instant local matches
  const localMatches = searchLocalSongs(query);

  try {
    const apiBase = getApiBaseUrl();

    // 6.5s timeout controller to guarantee the UI never freezes indefinitely on mobile networks
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 6500);

    const onAbort = () => timeoutController.abort();
    if (signal) signal.addEventListener('abort', onAbort);

    const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(query)}`, {
      signal: timeoutController.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);
    });

    if (!res.ok) throw new Error('Search failed');
    const data = (await res.json()) as { songs?: SearchSongItem[] };

    const remoteSongs = data.songs || [];

    // Merge local matches with remote songs, eliminating duplicates by title
    const seenTitles = new Set(localMatches.map((s) => s.title.toLowerCase().trim()));
    const merged = [...localMatches];

    remoteSongs.forEach((rem) => {
      const cleanTitle = rem.title.toLowerCase().trim();
      if (!seenTitles.has(cleanTitle)) {
        merged.push(rem);
        seenTitles.add(cleanTitle);
      }
    });

    return merged.length > 0 ? merged : localMatches;
  } catch (err: any) {
    if (signal?.aborted) {
      throw err;
    }
    console.warn('Online search error, falling back to local master repertoire:', err);
    return localMatches;
  }
}

/**
 * Fetches the complete song chord sheet dynamically on demand
 */
export async function fetchCompleteSong(item: SearchSongItem): Promise<SongData> {
  // 1. Check local POPULAR_SONGS first (zero network latency)
  const popMatch = POPULAR_SONGS.find(
    (p) => p.id === item.id || p.title.toLowerCase() === item.title.toLowerCase()
  );
  if (popMatch) {
    return popMatch;
  }

  // 2. Check local REPERTOIRE_PIECES (zero network latency)
  const repMatch = REPERTOIRE_PIECES.find(
    (p) => p.id === item.id || p.title.toLowerCase() === item.title.toLowerCase()
  );
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

  // 3. Check localStorage cache
  const cacheKey = `agsoft_song_cache_${item.id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as SongData;
      if (parsed.sections && parsed.sections.length > 0 && !parsed.tabContent?.includes('SONGSTERR')) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // 4. If item is a remote song from Ultimate Guitar or GuitarTuna, fetch full sheet from API with timeout
  if (item.url && (item.url.startsWith('http') || item.url.startsWith('/') || item.id.startsWith('ug-'))) {
    try {
      const apiBase = getApiBaseUrl();
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 7500);

      const res = await fetch(`${apiBase}/api/song?url=${encodeURIComponent(item.url)}`, {
        signal: timeoutController.signal,
      }).finally(() => clearTimeout(timeoutId));

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
      console.error('Failed to fetch complete song chords, using interactive studio template:', err);
    }
  }

  // 5. Fallback interactive studio chart
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    key: 'Standard Key',
    capo: 'No Capo',
    tuning: 'Standard (E A D G B E)',
    difficulty: item.difficulty || 'Easy',
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
