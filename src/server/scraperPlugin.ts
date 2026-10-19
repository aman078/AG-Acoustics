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

/**
 * Checks if a string is solely a chord name (e.g. "Db", "Fm", "C#m7", "G")
 */
function isChordToken(text: string): boolean {
  if (!text) return false;
  return /^[A-G][b#]?(?:m|maj|min|dim|aug|sus\d?|\d)?$/i.test(text.trim());
}

/**
 * Strict relevance filter:
 * Prevents 2-letter syllables (like "re") from matching inside "Aretha" or "Presley"
 */
function isRelevantMatch(query: string, title: string, artist: string): boolean {
  const qClean = query.toLowerCase().trim();
  const textClean = `${title} ${artist}`.toLowerCase();

  // Exact phrase match
  if (textClean.includes(qClean)) return true;

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'from', 'song', 'chords', 'tabs', 'lyrics', 'movie', 'easy', 'guitar', 'original'
  ]);

  const tokens = qClean
    .split(/[\s\-_\/]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter((t) => t.length > 0 && !stopWords.has(t));

  if (tokens.length === 0) return true;

  const majorTokens = tokens.filter((t) => t.length >= 3);

  // If major tokens exist, at least one MUST match as a whole word or prefix of a word
  if (majorTokens.length > 0) {
    const hasMajorMatch = majorTokens.some((token) => {
      const regex = new RegExp(`(^|\\b)${token}`, 'i');
      return regex.test(textClean);
    });
    if (!hasMajorMatch) return false;
  }

  // Short tokens (length < 3, e.g. "re", "tu") MUST match as an exact whole word boundary only!
  const shortTokens = tokens.filter((t) => t.length < 3);
  for (const short of shortTokens) {
    if (majorTokens.length === 0) {
      const regex = new RegExp(`\\b${short}\\b`, 'i');
      if (!regex.test(textClean)) return false;
    }
  }

  return true;
}

/**
 * Extracts chords with their exact visual character column offset in monospace
 */
function extractChordsWithVisualPosition(str: string): Array<{ chord: string; position: number }> {
  const cleanLine = str.replace(/\[\/?tab\]/g, '');
  const chords: Array<{ chord: string; position: number }> = [];
  let visualOffset = 0;

  // Matches either a [ch]chord[/ch] tag OR plain text
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

/**
 * Searches Ultimate Guitar (1.5M+ worldwide, bollywood, indie, pop, rock songs)
 */
async function searchUltimateGuitar(query: string) {
  const stripped = query.replace(/\b(from|song|movie|chords|tabs|lyrics)\b/gi, '').trim();
  const words = query.trim().split(/\s+/);
  const firstTwoWords = words.slice(0, 2).join(' ');

  const variants = Array.from(new Set([query, stripped, firstTwoWords])).filter(Boolean);

  for (const qVar of variants) {
    const url = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(qVar)}`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const html = await res.text();
      const match = html.match(/class="js-store"\s+data-content="(.*?)"/);
      if (!match) continue;

      const raw = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      const data = JSON.parse(raw);
      const results = data.store?.page?.data?.results || [];

      // Filter and sort by quality
      interface UGRawItem {
        id: number;
        song_name: string;
        artist_name: string;
        tab_url: string;
        type: string;
        rating?: number;
        votes?: number;
      }

      const relevant = (results as UGRawItem[])
        .filter((r) => r.tab_url && (r.type === 'Chords' || r.type === 'Tab'))
        .filter((r) => isRelevantMatch(query, r.song_name, r.artist_name))
        .sort((a, b) => {
          // Sort by votes then rating
          const aVotes = a.votes || 0;
          const bVotes = b.votes || 0;
          if (bVotes !== aVotes) return bVotes - aVotes;
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, 10)
        .map((r) => ({
          id: `ug-${r.id}`,
          title: decodeHtmlEntities(r.song_name),
          artist: decodeHtmlEntities(r.artist_name),
          url: r.tab_url,
          source: 'Ultimate Guitar (Verified Chords & Lyrics)',
          difficulty: r.votes && r.votes > 100 ? `${r.rating?.toFixed(1)}★ (${r.votes})` : 'Verified',
        }));

      if (relevant.length > 0) {
        return relevant;
      }
    } catch (err) {
      console.error('UG Search error for variant', qVar, err);
    }
  }
  return [];
}

/**
 * Parses full chord tab from an Ultimate Guitar tab page with aligned positions
 */
async function parseUltimateGuitarTab(tabUrl: string) {
  const res = await fetch(tabUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const html = await res.text();
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

  const rawLines = tabContent.split('\n');

  const sections: Array<{
    sectionTitle: string;
    lines: Array<{
      lyrics: string;
      chords: Array<{ chord: string; position: number }>;
    }>;
  }> = [];

  let currentSection = {
    sectionTitle: 'Chords',
    lines: [] as Array<{ lyrics: string; chords: Array<{ chord: string; position: number }> }>,
  };

  const allChordsSet = new Set<string>();

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].replace(/\r$/, '');
    if (!rawLine.trim()) continue;

    // Check for section header
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
        i++; // consumed next line as lyrics
      } else {
        // Pure chord line (Intro, Instrumental, Outro, Chord Bar)
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
    sections,
  };
}

/**
 * Searches GuitarTuna
 */
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

        // STRICT RELEVANCE CHECK:
        // Do not return trending/unrelated songs
        if (isRelevantMatch(query, titleFormatted, 'GuitarTuna')) {
          results.push({
            id: slug,
            title: decodeHtmlEntities(titleFormatted),
            artist: 'GuitarTuna',
            url: href,
            source: 'GuitarTuna (Chord Progression)',
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

/**
 * Parses GuitarTuna song, strips sr-only spoken descriptions, and collapses instrumental chords
 */
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

  // Strip all screen-reader spoken chord annotations completely
  html = html.replace(/<span\s+class="sr-only">.*?<\/span>/gis, '');

  // Title & Artist
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

    // Check if the text is empty or just another chord name (like "Db", "Eb", "Fm")
    if (!text || isChordToken(text)) {
      if (chord) pendingChords.push(chord);
      if (text && isChordToken(text) && text !== chord) pendingChords.push(text);

      // Group instrumental chords into bars of 4
      if (pendingChords.length >= 4) {
        cleanLines.push({
          lyrics: '',
          chords: pendingChords.map((c, idx) => ({ chord: c, position: idx * 4 })),
        });
        pendingChords = [];
      }
    } else {
      // Real lyrics line
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

  // Group into sections
  const sections: Array<{ sectionTitle: string; lines: typeof cleanLines }> = [];
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
      // 1. Search Endpoint
      server.middlewares.use('/api/search', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const query = urlObj.searchParams.get('q') || '';

          if (!query.trim()) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ songs: [] }));
            return;
          }

          // Search Ultimate Guitar (ranked #1) AND GuitarTuna
          const [ugResults, gtResults] = await Promise.all([
            searchUltimateGuitar(query),
            searchGuitarTuna(query),
          ]);

          const combined = [...ugResults, ...gtResults];

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

      // 2. Song Details Endpoint
      server.middlewares.use('/api/song', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          const songUrl = urlObj.searchParams.get('url') || '';

          if (!songUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing song URL' }));
            return;
          }

          let songData;
          if (songUrl.includes('ultimate-guitar.com')) {
            songData = await parseUltimateGuitarTab(songUrl);
          } else {
            songData = await parseGuitarTunaSong(songUrl);
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
    },
  };
}

export {
  searchUltimateGuitar,
  searchGuitarTuna,
  parseUltimateGuitarTab,
  parseGuitarTunaSong,
  isRelevantMatch
};
