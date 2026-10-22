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

/**
 * Parses full human-verified chord tab from an Ultimate Guitar tab page
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

  const sections: SongChordSection[] = [];
  let currentSection: SongChordSection = {
    sectionTitle: 'Chords',
    lines: [],
  };

  const allChordsSet = new Set<string>();

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].replace(/\r$/, '');
    if (!rawLine.trim()) continue;

    // Check for section header: [Verse 1], [Chorus], [Intro], [Bridge], [Outro]
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
 * Parses GuitarTuna song as fallback
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

const SONG_CACHE = new Map<string, { timestamp: number; data: any }>();
const SONG_CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days edge cache

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const songUrl = (req.query?.url || '') as string;
    if (!songUrl) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Missing song URL' });
    }

    const cached = SONG_CACHE.get(songUrl);
    if (cached && Date.now() - cached.timestamp < SONG_CACHE_TTL) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
      return res.status(200).json(cached.data);
    }

    let songData;
    if (songUrl.includes('ultimate-guitar.com')) {
      songData = await parseUltimateGuitarTab(songUrl);
    } else {
      songData = await parseGuitarTunaSong(songUrl);
    }

    if (songData) {
      SONG_CACHE.set(songUrl, { timestamp: Date.now(), data: songData });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    return res.status(200).json(songData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch song';
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: msg });
  }
}
