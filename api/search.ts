function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&eacute;/g, 'é')
    .replace(/&aacute;/g, 'á')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&auml;/g, 'ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&uuml;/g, 'ü');
}

function isRelevantMatch(query: string, title: string, artist: string): boolean {
  const qClean = query.toLowerCase().trim();
  const textClean = `${title} ${artist}`.toLowerCase();

  if (textClean.includes(qClean)) return true;

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'from', 'song', 'chords', 'tabs', 'lyrics', 'movie', 'easy', 'guitar', 'original', 'title'
  ]);

  const tokens = qClean
    .split(/[\s\-_\/]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length > 0 && !stopWords.has(t));

  if (tokens.length === 0) return true;

  const majorTokens = tokens.filter((t) => t.length >= 2);
  if (majorTokens.length === 0) return false;

  const matchCount = majorTokens.filter((token) => {
    const regex = new RegExp(`(^|\\b)${token}`, 'i');
    return regex.test(textClean);
  }).length;

  if (majorTokens.length > 1) {
    return matchCount >= Math.max(2, Math.ceil(majorTokens.length * 0.6));
  }

  return matchCount >= 1;
}

function generateSearchVariants(query: string): string[] {
  const qClean = query.trim();
  const variants = new Set<string>([qClean]);

  const translitMap: [RegExp, string][] = [
    [/\basa\b/gi, 'aisa'],
    [/\baisa\b/gi, 'asa'],
    [/\bna\b/gi, 'naa'],
    [/\bme\b/gi, 'mein'],
    [/\bmein\b/gi, 'me'],
    [/\bke\b/gi, 'ki'],
    [/\bpyar\b/gi, 'pyaar'],
    [/\bpyaar\b/gi, 'pyar'],
    [/\btum\b/gi, 'tumhi'],
  ];

  let mutated = qClean;
  for (const [regex, replacement] of translitMap) {
    if (regex.test(qClean)) {
      mutated = mutated.replace(regex, replacement);
    }
  }
  if (mutated !== qClean) variants.add(mutated);

  const stripped = qClean.replace(/\b(from|song|movie|chords|tabs|lyrics|easy|guitar)\b/gi, '').trim();
  if (stripped && stripped !== qClean) variants.add(stripped);

  const words = qClean.split(/\s+/);
  if (words.length > 2) {
    variants.add(words.slice(0, 2).join(' '));
    variants.add(words.slice(0, 3).join(' '));
  }

  return Array.from(variants).filter(Boolean);
}

/**
 * Searches Ultimate Guitar for complete human-verified chords & lyrics sheets
 */
// Multi-Tier Anti-Blocking Stealth Headers & User-Agent Rotation
const ROTATING_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
];

function getStealthHeaders() {
  const ua = ROTATING_USER_AGENTS[Math.floor(Math.random() * ROTATING_USER_AGENTS.length)];
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
}

async function fetchWithStealth(url: string, retries = 2): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: getStealthHeaders() });
      if (res.status === 429 || res.status === 503) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
          continue;
        }
      }
      if (!res.ok) return null;
      return await res.text();
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }
  return null;
}

async function searchUltimateGuitar(query: string) {
  const variants = generateSearchVariants(query);

  for (const qVar of variants) {
    const urls = [
      `https://www.ultimate-guitar.com/search.php?value=${encodeURIComponent(qVar)}`,
      `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(qVar)}`,
    ];

    for (const url of urls) {
      try {
        const html = await fetchWithStealth(url);
        if (!html) continue;
        const match = html.match(/class="js-store"\s+data-content="(.*?)"/);
        if (!match) continue;

        const raw = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const data = JSON.parse(raw);
        const results = data.store?.page?.data?.results || [];

        interface UGRawItem {
          id: number;
          song_name: string;
          artist_name: string;
          tab_url: string;
          type: string;
          rating?: number;
          votes?: number;
          version?: number;
        }

        const validResults = (results as UGRawItem[])
          .filter((r) => r.tab_url && (r.type === 'Chords' || r.type === 'Tab'))
          .filter(
            (r) =>
              isRelevantMatch(qVar, r.song_name, r.artist_name) ||
              isRelevantMatch(query, r.song_name, r.artist_name)
          );

        // Group by song + artist to pick the single highest-rated version
        const versionGroups = new Map<string, UGRawItem[]>();
        for (const item of validResults) {
          const key = `${item.song_name.toLowerCase().trim()}:::${item.artist_name.toLowerCase().trim()}`;
          const list = versionGroups.get(key) || [];
          list.push(item);
          versionGroups.set(key, list);
        }

        const champions: UGRawItem[] = [];
        for (const group of versionGroups.values()) {
          group.sort((a, b) => {
            // Prioritize Chords over pure Tab for acoustic singing
            const aIsChords = a.type === 'Chords' ? 1 : 0;
            const bIsChords = b.type === 'Chords' ? 1 : 0;
            if (bIsChords !== aIsChords) return bIsChords - aIsChords;

            // Highest votes then rating
            const aVotes = a.votes || 0;
            const bVotes = b.votes || 0;
            if (bVotes !== aVotes) return bVotes - aVotes;
            return (b.rating || 0) - (a.rating || 0);
          });

          champions.push(group[0]);
        }

        // Sort champions by votes descending
        champions.sort((a, b) => {
          const aVotes = a.votes || 0;
          const bVotes = b.votes || 0;
          if (bVotes !== aVotes) return bVotes - aVotes;
          return (b.rating || 0) - (a.rating || 0);
        });

        const formatted = champions.slice(0, 15).map((r) => {
          const ratingVal = r.rating || 0;
          const votesVal = r.votes || 0;
          const votesDisplay = votesVal >= 1000 ? `${(votesVal / 1000).toFixed(1)}k` : `${votesVal}`;
          const diffLabel = votesVal > 0 ? `${ratingVal.toFixed(1)}★ (${votesDisplay} votes)` : 'Verified';

          return {
            id: `ug-${r.id}`,
            title: decodeHtmlEntities(r.song_name),
            artist: decodeHtmlEntities(r.artist_name),
            url: r.tab_url,
            source: 'Studio Master Sheet',
            difficulty: diffLabel,
          };
        });

        if (formatted.length > 0) {
          return formatted;
        }
      } catch (err) {
        console.error('UG Search error for variant', qVar, err);
      }
    }
  }
  return [];
}

async function searchGuitarTuna(query: string) {
  try {
    const gtUrl = `https://guitartuna.com/chords?q=${encodeURIComponent(query)}`;
    const gtRes = await fetch(gtUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await gtRes.text();
    const linkRegex = /href="(\/chords\/([a-zA-Z0-9_\-]+))"/g;
    const results: Array<{ id: string; title: string; artist: string; url: string; source: string; difficulty: string }> = [];
    const seen = new Set<string>();

    let m;
    while ((m = linkRegex.exec(html)) !== null) {
      const href = m[1];
      const slug = m[2];
      if (!seen.has(href)) {
        seen.add(href);
        let clean = slug.replace(/-easy-guitar-chords-[a-f0-9]+$/i, '');
        clean = clean.replace(/-chords-[a-f0-9]+$/i, '');
        const parts = clean.split('-');
        const titleFormatted = parts
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ');

        if (isRelevantMatch(query, titleFormatted, 'Acoustic Repertoire')) {
          results.push({
            id: slug,
            title: decodeHtmlEntities(titleFormatted),
            artist: 'Acoustic Repertoire',
            url: href,
            source: 'Acoustic Studio Sheet',
            difficulty: 'Easy',
          });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

const SEARCH_CACHE = new Map<string, { timestamp: number; data: any }>();
const SEARCH_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours edge cache
const IN_FLIGHT_SEARCHES = new Map<string, Promise<any>>();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const query = (req.query?.q || '') as string;
    if (!query.trim()) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ songs: [] });
    }

    const cacheKey = query.trim().toLowerCase();
    const cached = SEARCH_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ songs: cached.data });
    }

    // In-flight deduplication: prevent thundering herd
    let searchPromise = IN_FLIGHT_SEARCHES.get(cacheKey);
    if (!searchPromise) {
      searchPromise = (async () => {
        const ugResults = await searchUltimateGuitar(query);
        let combined = ugResults;
        if (combined.length === 0) {
          combined = await searchGuitarTuna(query);
        }
        SEARCH_CACHE.set(cacheKey, { timestamp: Date.now(), data: combined });
        IN_FLIGHT_SEARCHES.delete(cacheKey);
        return combined;
      })();
      IN_FLIGHT_SEARCHES.set(cacheKey, searchPromise);
    }

    const combined = await searchPromise;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ songs: combined });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: msg });
  }
}
