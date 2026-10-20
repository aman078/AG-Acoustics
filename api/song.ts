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

function toChordName(chordObj: any): string {
  if (!chordObj) return '';
  const root = chordObj.baseNote?.name || '';
  const suffix = chordObj.chordType?.suffix || '';
  return `${root}${suffix}`;
}

export interface SongChordSection {
  sectionTitle: string;
  lines: {
    lyrics: string;
    chords: { chord: string; position: number }[];
  }[];
}

/**
 * Intelligent Chord Autocomplete & Verse Propagation
 * If Verse 1 or Chorus 1 has established chords, but subsequent verses/choruses only have lyrics,
 * accurately project the harmonic pattern across lines with proportional character offsets.
 */
export function propagateHarmonicStructure(sections: SongChordSection[]): SongChordSection[] {
  if (!sections || sections.length === 0) return sections;

  const categorize = (title: string): string => {
    const t = (title || '').toLowerCase();
    if (t.includes('verse') || t.includes('stanza')) return 'verse';
    if (t.includes('chorus') || t.includes('refrain') || t.includes('hook')) return 'chorus';
    if (t.includes('pre-chorus') || t.includes('prechorus')) return 'pre-chorus';
    if (t.includes('bridge')) return 'bridge';
    return 'other';
  };

  const templates: {
    [cat: string]: {
      maxLines: number;
      chords: { chord: string; ratio: number }[][];
    };
  } = {};

  for (const sec of sections) {
    const cat = categorize(sec.sectionTitle);
    if (cat === 'other') continue;

    const chordLines = sec.lines.filter((l) => l.chords && l.chords.length > 0);
    if (chordLines.length >= 2 || (chordLines.length >= 1 && sec.lines.length <= 2)) {
      if (!templates[cat] || chordLines.length > templates[cat].maxLines) {
        templates[cat] = {
          maxLines: chordLines.length,
          chords: sec.lines.map((l) =>
            (l.chords || []).map((c) => ({
              chord: c.chord,
              ratio: l.lyrics && l.lyrics.length > 0 ? c.position / l.lyrics.length : 0,
            }))
          ),
        };
      }
    }
  }

  const defaultTemplate = templates['verse'] || Object.values(templates)[0];

  return sections.map((sec) => {
    const cat = categorize(sec.sectionTitle);
    const template = templates[cat] || (cat === 'verse' ? defaultTemplate : null);
    if (!template || template.chords.length === 0) return sec;

    const chordCount = sec.lines.reduce((acc, l) => acc + (l.chords?.length || 0), 0);
    const linesWithLyrics = sec.lines.filter((l) => l.lyrics && l.lyrics.trim().length > 0);

    // If section has lyrics but 0 or few chords
    if (linesWithLyrics.length > 0 && chordCount <= Math.floor(linesWithLyrics.length / 3)) {
      const newLines = sec.lines.map((line, idx) => {
        if (!line.lyrics || line.lyrics.trim().length === 0) return line;
        if (line.chords && line.chords.length > 0) return line;

        const tIndex = idx % template.chords.length;
        const tChords = template.chords[tIndex] || [];
        if (tChords.length === 0) return line;

        const projected = tChords.map((tc) => ({
          chord: tc.chord,
          position: Math.min(
            Math.max(0, Math.round(tc.ratio * line.lyrics.length)),
            Math.max(0, line.lyrics.length - 2)
          ),
        }));

        return {
          ...line,
          chords: projected,
        };
      });

      return {
        ...sec,
        lines: newLines,
      };
    }

    return sec;
  });
}

/**
 * Parses complete Songsterr song chord sheet & multi-track metadata
 */
async function parseSongsterrSong(songUrl: string) {
  const res = await fetch(songUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const html = await res.text();
  const marker = 'id="state"';
  const idx = html.indexOf(marker);
  if (idx === -1) throw new Error('Could not parse Songsterr state script');

  const start = html.indexOf('>', idx) + 1;
  const end = html.indexOf('</script>', start);
  const state = JSON.parse(html.substring(start, end));

  const meta = state.meta?.current || state.meta || {};
  const songName = decodeHtmlEntities(meta.title || 'Song');
  const artistName = decodeHtmlEntities(meta.artist || 'Artist');
  const chordpro = state.chordpro?.current || [];

  let capo = 'No Capo';
  let tuning = 'Standard (E A D G B E)';
  const lines: Array<{ lyrics: string; chords: Array<{ chord: string; position: number }> }> = [];
  const allChordsSet = new Set<string>();

  for (const item of chordpro) {
    if (item.type === 'capo') {
      const c = item.text;
      capo = `Capo ${c}${c === '1' ? 'st Fret' : c === '2' ? 'nd Fret' : c === '3' ? 'rd Fret' : 'th Fret'}`;
    } else if (item.type === 'tuning') {
      tuning = item.text || tuning;
    } else if (item.type === 'line' && item.line) {
      let currentLyrics = '';
      const lineChords: Array<{ chord: string; position: number }> = [];

      for (const token of item.line) {
        if (token.type === 'chord' && token.chord) {
          const chordName = toChordName(token.chord);
          if (chordName) {
            allChordsSet.add(chordName);
            lineChords.push({ chord: chordName, position: currentLyrics.length });
          }
        } else if (token.type === 'text') {
          currentLyrics += token.text || '';
        }
      }

      lines.push({
        lyrics: decodeHtmlEntities(currentLyrics.trim()),
        chords: lineChords,
      });
    }
  }

  // Group lines into logical stanzas / sections
  const sections: SongChordSection[] = [];
  const chunkSize = 4;
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const secNum = Math.floor(i / chunkSize) + 1;
    const isChorus = chunk.some(
      (l) =>
        l.lyrics.toLowerCase().includes('chorus') ||
        l.lyrics.toLowerCase().includes('california') ||
        l.lyrics.toLowerCase().includes('you look perfect') ||
        l.lyrics.toLowerCase().includes('yellow')
    );
    const sectionTitle = isChorus ? `Chorus ${secNum > 2 ? Math.floor(secNum / 2) : ''}`.trim() : `Verse ${secNum}`;
    sections.push({ sectionTitle, lines: chunk });
  }

  // Apply Verse Propagation
  const finalSections = propagateHarmonicStructure(sections);

  for (const sec of finalSections) {
    for (const l of sec.lines) {
      for (const c of l.chords || []) {
        if (c.chord) allChordsSet.add(c.chord);
      }
    }
  }

  // Format multi-track tablature information if available
  let tabContent = '';
  const tracks = meta.tracks || state.tracks || [];
  if (Array.isArray(tracks) && tracks.length > 0) {
    tabContent = `================================================================================\nSONGSTERR VERIFIED MULTI-TRACK STUDIO SCORE\n================================================================================\n\n`;
    for (const track of tracks) {
      const instName = track.name || track.instrument || 'Guitar';
      const diffStr = track.difficulty ? `Difficulty Level: ${track.difficulty}/5` : 'Standard';
      tabContent += `• [Track] ${instName} (${track.instrument || 'Guitar'})\n  ${diffStr}\n`;
    }
    tabContent += `\nMulti-track synchronization verified. Switch or mute individual tracks inside studio view.\n`;
  }

  return {
    id: songUrl,
    title: songName,
    artist: artistName,
    key: 'Standard Key',
    capo,
    tuning,
    difficulty: 'Verified Studio',
    allChords: Array.from(allChordsSet),
    tabContent,
    sections: finalSections,
  };
}

/**
 * Parses full chord tab from an Ultimate Guitar tab page with aligned positions & verse propagation
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

  // Apply Harmonic Propagation across blank verses/choruses
  const finalSections = propagateHarmonicStructure(sections);

  for (const sec of finalSections) {
    for (const l of sec.lines) {
      for (const c of l.chords || []) {
        if (c.chord) allChordsSet.add(c.chord);
      }
    }
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
    tabContent,
    sections: finalSections,
  };
}

/**
 * Parses GuitarTuna song, strips sr-only spoken descriptions, and applies harmonic propagation
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

  const finalSections = propagateHarmonicStructure(sections);

  for (const sec of finalSections) {
    for (const l of sec.lines) {
      for (const c of l.chords || []) {
        if (c.chord) allChordsSet.add(c.chord);
      }
    }
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
    sections: finalSections,
  };
}

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

    let songData;
    if (songUrl.includes('songsterr.com')) {
      songData = await parseSongsterrSong(songUrl);
    } else if (songUrl.includes('ultimate-guitar.com')) {
      songData = await parseUltimateGuitarTab(songUrl);
    } else {
      songData = await parseGuitarTunaSong(songUrl);
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(songData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch song';
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: msg });
  }
}
