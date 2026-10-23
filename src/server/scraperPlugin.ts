import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

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

function isChordToken(text: string): boolean {
  if (!text) return false;
  return /^[A-G][b#]?(?:m|maj|min|dim|aug|sus\d?|\d)?$/i.test(text.trim());
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

function extractChordsWithVisualPosition(str: string): Array<{ chord: string; position: number }> {
  const cleanLine = str.replace(/\[\/?tab\]/g, '');
  const chords: Array<{ chord: string; position: number }> = [];
  let visualOffset = 0;

  const tokenRegex = /\[ch\](.*?)\[\/ch\]|([^\[]+|\[(?!ch\]|\/ch\]))/g;
  let match;
  while ((match = tokenRegex.exec(cleanLine)) !== null) {
    if (match[1] !== undefined) {
      const chord = match[1].trim();
      chords.push({ chord, position: visualOffset });
      visualOffset += chord.length;
    } else if (match[2] !== undefined) {
      visualOffset += match[2].length;
    }
  }
  return chords;
}

export interface SongChordSection {
  sectionTitle: string;
  lines: {
    lyrics: string;
    chords: { chord: string; position: number }[];
  }[];
}

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
            const aIsChords = a.type === 'Chords' ? 1 : 0;
            const bIsChords = b.type === 'Chords' ? 1 : 0;
            if (bIsChords !== aIsChords) return bIsChords - aIsChords;

            const aVotes = a.votes || 0;
            const bVotes = b.votes || 0;
            if (bVotes !== aVotes) return bVotes - aVotes;
            return (b.rating || 0) - (a.rating || 0);
          });

          champions.push(group[0]);
        }

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

async function parseUltimateGuitarTab(tabUrl: string) {
  const html = await fetchWithStealth(tabUrl);
  if (!html) throw new Error('Could not fetch tab content');
  const match = html.match(/class="js-store"\s+data-content="(.*?)"/);
  if (!match) throw new Error('Could not parse UG tab store');

  const raw = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const data = JSON.parse(raw);
  const tabContent = (data.store?.page?.data?.tab_view?.wiki_tab?.content || '') as string;
  const songName = decodeHtmlEntities(data.store?.page?.data?.tab?.song_name || 'Song');
  const artistName = decodeHtmlEntities(data.store?.page?.data?.tab?.artist_name || 'Artist');
  const capoVal = data.store?.page?.data?.tab_view?.meta?.capo;
  const capo = capoVal ? `Capo ${capoVal}th Fret` : 'No Capo';
  const tuningVal = data.store?.page?.data?.tab_view?.meta?.tuning?.value || 'Standard (E A D G B E)';

  // Detect BPM / Tempo from metadata or tab sheet
  const metaTempo = data.store?.page?.data?.tab_view?.meta?.tempo;
  const tabTempo = data.store?.page?.data?.tab?.tempo;
  let detectedTempo: number | undefined = undefined;
  if (typeof metaTempo === 'number' && metaTempo >= 40 && metaTempo <= 260) {
    detectedTempo = metaTempo;
  } else if (typeof tabTempo === 'number' && tabTempo >= 40 && tabTempo <= 260) {
    detectedTempo = tabTempo;
  } else {
    const tempoMatch =
      tabContent.match(/(?:tempo|bpm)\s*[:=]?\s*(\d{2,3})/i) ||
      tabContent.match(/(?:♩|q)\s*=\s*(\d{2,3})/i) ||
      tabContent.match(/(\d{2,3})\s*bpm/i);
    if (tempoMatch) {
      const parsed = parseInt(tempoMatch[1], 10);
      if (parsed >= 40 && parsed <= 260) detectedTempo = parsed;
    }
  }

  const rawLines = tabContent.split('\n');

  const sections: SongChordSection[] = [];
  let currentSection: SongChordSection = {
    sectionTitle: 'Chords',
    lines: [],
  };

  const allChordsSet = new Set<string>();

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].replace(/\r$/, '');
    if (!rawLine.trim()) continue;

    const headerMatch = rawLine.match(/^\[?(Verse\s*\d*|Chorus\s*\d*|Intro|Bridge|Outro|Pre-Chorus\s*[A-Z]?|Solo)\]?:?/i);
    if (headerMatch) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        sectionTitle: headerMatch[1].trim(),
        lines: [],
      };
      continue;
    }

    if (rawLine.includes('[ch]')) {
      const chordsOnLine = extractChordsWithVisualPosition(rawLine);
      for (const c of chordsOnLine) {
        allChordsSet.add(c.chord);
      }

      const nextRaw = rawLines[i + 1] ? rawLines[i + 1].replace(/\r$/, '') : '';
      const isNextHeader = nextRaw.match(/^\[?(Verse|Chorus|Intro|Bridge|Outro|Pre-Chorus|Solo)/i);

      if (nextRaw && !nextRaw.includes('[ch]') && !isNextHeader) {
        const cleanNext = nextRaw
          .replace(/\[\/?tab\]/g, '')
          .replace(/\[\/?ch\]/g, '');
        currentSection.lines.push({
          lyrics: decodeHtmlEntities(cleanNext),
          chords: chordsOnLine,
        });
        i++;
      } else {
        currentSection.lines.push({
          lyrics: '',
          chords: chordsOnLine,
        });
      }
    } else {
      const cleanLine = rawLine.replace(/\[\/?tab\]/g, '');
      currentSection.lines.push({
        lyrics: decodeHtmlEntities(cleanLine),
        chords: [],
      });
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return {
    id: tabUrl,
    title: songName,
    artist: artistName,
    key: 'Standard Key',
    capo,
    tuning: tuningVal,
    difficulty: 'Verified',
    allChords: Array.from(allChordsSet),
    tempo: detectedTempo,
    sections,
  };
}

async function parseGuitarTunaSong(songUrl: string) {
  let fullUrl = songUrl;
  if (!fullUrl.startsWith('http')) {
    if (!fullUrl.startsWith('/')) fullUrl = '/' + fullUrl;
    fullUrl = 'https://guitartuna.com' + fullUrl;
  }

  const pageRes = await fetch(fullUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  let html = await pageRes.text();

  html = html.replace(/<span\s+class="sr-only">.*?<\/span>/gis, '');

  const titleMatch = html.match(/<title>(.*?)\s*\|\s*GuitarTuna<\/title>/i);
  let title = 'Song';
  let artist = 'Artist';
  if (titleMatch) {
    const raw = decodeHtmlEntities(titleMatch[1]);
    if (raw.toLowerCase().includes('chords by')) {
      const parts = raw.split(/chords by/i);
      title = parts[0].trim();
      artist = parts[1].trim();
    } else {
      title = raw.trim();
    }
  }

  const descMatch = html.match(/<meta\s+name="description"\s+content="(.*?)"/i);
  const metaDesc = descMatch ? decodeHtmlEntities(descMatch[1]) : '';

  let capo = 'No Capo';
  const capoMatch = metaDesc.match(/capo\s*(\d+)/i) || html.match(/capo\s*(\d+)/i);
  if (capoMatch) capo = `Capo ${capoMatch[1]}th Fret`;

  let key = 'Standard Key';
  const keyMatch = html.match(/Key:\s*([A-G][b#]?(?:\s*m|\s*maj|\s*minor)?)/i);
  if (keyMatch) key = keyMatch[1];

  const blockRegex = /data-chord="([^"]+)"[^>]*>.*?<div>(.*?)<\/div>/gis;
  const blocks = [...html.matchAll(blockRegex)];

  const cleanLines: Array<{
    lyrics: string;
    chords: Array<{ chord: string; position: number }>;
  }> = [];

  let pendingChords: string[] = [];
  const allChordsSet = new Set<string>();

  for (const match of blocks) {
    const chord = match[1].trim();
    if (chord) allChordsSet.add(chord);

    let text = match[2].replace(/<[^>]+>/g, '').trim();
    text = text.replace(/\s+/g, ' ');
    text = decodeHtmlEntities(text);

    if (!text || isChordToken(text)) {
      if (chord) pendingChords.push(chord);
      if (text && isChordToken(text) && text !== chord) pendingChords.push(text);

      if (pendingChords.length >= 4) {
        cleanLines.push({
          lyrics: '',
          chords: pendingChords.map((c, idx) => ({ chord: c, position: idx * 4 })),
        });
        pendingChords = [];
      }
    } else {
      if (pendingChords.length > 0) {
        cleanLines.push({
          lyrics: '',
          chords: pendingChords.map((c, idx) => ({ chord: c, position: idx * 4 })),
        });
        pendingChords = [];
      }
      cleanLines.push({
        lyrics: text,
        chords: chord ? [{ chord, position: 0 }] : [],
      });
    }
  }

  if (pendingChords.length > 0) {
    cleanLines.push({
      lyrics: '',
      chords: pendingChords.map((c, idx) => ({ chord: c, position: idx * 4 })),
    });
  }

  const sections: SongChordSection[] = [];
  const chunkSize = 8;
  for (let i = 0; i < cleanLines.length; i += chunkSize) {
    const chunk = cleanLines.slice(i, i + chunkSize);
    const secNum = Math.floor(i / chunkSize) + 1;
    const sectionName =
      secNum === 1
        ? 'Intro / Verse 1'
        : secNum === 2
        ? 'Chorus'
        : secNum === 3
        ? 'Verse 2'
        : secNum === 4
        ? 'Chorus 2'
        : secNum === 5
        ? 'Bridge'
        : `Measure Section ${secNum}`;

    sections.push({
      sectionTitle: sectionName,
      lines: chunk,
    });
  }

  return {
    id: songUrl,
    title,
    artist,
    key,
    capo,
    tuning: 'Standard (E A D G B E)',
    difficulty: 'Easy',
    allChords: Array.from(allChordsSet),
    sections,
  };
}

export function guitarTunaScraperPlugin(): Plugin {
  return {
    name: 'guitartuna-scraper-plugin',
    configureServer(server) {
      const searchCache = new Map<string, { timestamp: number; data: any }>();
      const songCache = new Map<string, { timestamp: number; data: any }>();

      server.middlewares.use('/api/search', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const query = urlObj.searchParams.get('q') || '';

          if (!query.trim()) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ songs: [] }));
            return;
          }

          const cacheKey = query.trim().toLowerCase();
          const cached = searchCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ songs: cached.data }));
            return;
          }

          const ugResults = await searchUltimateGuitar(query);
          let combined = ugResults;
          if (combined.length === 0) {
            combined = await searchGuitarTuna(query);
          }

          searchCache.set(cacheKey, { timestamp: Date.now(), data: combined });
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ songs: combined }));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Search failed';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: msg }));
        }
      });

      server.middlewares.use('/api/song', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const songUrl = urlObj.searchParams.get('url') || '';

          if (!songUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing song URL' }));
            return;
          }

          const cached = songCache.get(songUrl);
          if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24 * 7) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(cached.data));
            return;
          }

          let songData;
          if (songUrl.includes('ultimate-guitar.com')) {
            songData = await parseUltimateGuitarTab(songUrl);
          } else {
            songData = await parseGuitarTunaSong(songUrl);
          }

          if (songData) {
            songCache.set(songUrl, { timestamp: Date.now(), data: songData });
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(songData));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch song';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: msg }));
        }
      });

      server.middlewares.use('/api/version', async (_req: IncomingMessage, res: ServerResponse) => {
        try {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            latest_version_code: 53,
            latest_version_name: '1.0.53',
            download_url: 'https://github.com/aman078/AG-Acoustics/releases/latest/download/AGSoft-Acoustics.apk',
            release_notes: 'Interactive Luthier Blueprint Vector Headstock Tuner: animated open-gear mechanical cogs, authentic gauge strings, contextual tighten/loosen guidance, integrated drone mode, and clean single-view layout.',
            force_update: false,
          }));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Version check failed';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: msg }));
        }
      });
    },
  };
}

export {
  searchUltimateGuitar,
  searchGuitarTuna,
  parseUltimateGuitarTab,
  parseGuitarTunaSong,
  isRelevantMatch,
};
