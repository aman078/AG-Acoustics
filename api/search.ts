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

function toSlug(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
 * Searches Songsterr for verified multi-track tablature and complete ChordPro sheets
 */
async function searchSongsterr(query: string) {
  try {
    const res = await fetch(`https://www.songsterr.com/api/songs?pattern=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return [];
    const songs = await res.json();
    if (!Array.isArray(songs)) return [];

    return songs
      .filter((s: any) => !s.isJunk && s.artist && s.title)
      .filter((s: any) => isRelevantMatch(query, s.title, s.artist))
      .slice(0, 8)
      .map((s: any) => {
        const slug = `${toSlug(s.artist)}-${toSlug(s.title)}`;
        const hasChords = !!s.hasChords;
        const pageType = hasChords ? 'chords' : 'tab';
        return {
          id: `songsterr-${s.songId}`,
          title: decodeHtmlEntities(s.title),
          artist: decodeHtmlEntities(s.artist),
          url: `https://www.songsterr.com/a/wsa/${slug}-${pageType}-s${s.songId}`,
          source: hasChords ? 'Songsterr (Verified Chords)' : 'Songsterr (Multi-Track Tab)',
          difficulty: hasChords ? 'Verified Studio' : 'Multi-Track Tab',
          hasChords,
        };
      });
  } catch (err) {
    console.error('Songsterr search error:', err);
    return [];
  }
}

/**
 * Searches Ultimate Guitar with Best-Rated Version Prioritization (>4.5 stars, highest votes)
 */
async function searchUltimateGuitar(query: string) {
  const variants = generateSearchVariants(query);

  for (const qVar of variants) {
    const urls = [
      `https://www.ultimate-guitar.com/search.php?value=${encodeURIComponent(qVar)}`,
      `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(qVar)}`,
    ];

    for (const url of urls) {
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

        // Group by normalized song name + artist to select the #1 best version per song
        const versionGroups = new Map<string, UGRawItem[]>();
        for (const item of validResults) {
          const key = `${item.song_name.toLowerCase().trim()}:::${item.artist_name.toLowerCase().trim()}:::${item.type.toLowerCase()}`;
          const list = versionGroups.get(key) || [];
          list.push(item);
          versionGroups.set(key, list);
        }

        // For each group, prioritize rating >= 4.5 and sort by votes descending
        const championList: UGRawItem[] = [];
        for (const group of versionGroups.values()) {
          group.sort((a, b) => {
            const aRating = a.rating || 0;
            const bRating = b.rating || 0;
            const aVotes = a.votes || 0;
            const bVotes = b.votes || 0;

            const aIsHighRated = aRating >= 4.5 ? 1 : 0;
            const bIsHighRated = bRating >= 4.5 ? 1 : 0;

            if (aIsHighRated !== bIsHighRated) return bIsHighRated - aIsHighRated;
            if (bVotes !== aVotes) return bVotes - aVotes;
            return bRating - aRating;
          });

          // Pick the champion version
          championList.push(group[0]);
        }

        // Sort overall champions by popularity
        championList.sort((a, b) => {
          const aVotes = a.votes || 0;
          const bVotes = b.votes || 0;
          if (bVotes !== aVotes) return bVotes - aVotes;
          return (b.rating || 0) - (a.rating || 0);
        });

        const formatted = championList.slice(0, 10).map((r) => {
          const ratingVal = r.rating || 0;
          const votesVal = r.votes || 0;
          const isTopRated = ratingVal >= 4.5;
          const votesDisplay = votesVal >= 1000 ? `${(votesVal / 1000).toFixed(1)}k` : `${votesVal}`;
          const diffLabel = votesVal > 0 ? `${ratingVal.toFixed(1)}★ (${votesDisplay} votes)` : 'Verified';

          return {
            id: `ug-${r.id}`,
            title: decodeHtmlEntities(r.song_name),
            artist: decodeHtmlEntities(r.artist_name),
            url: r.tab_url,
            source: isTopRated
              ? `Ultimate Guitar (Best-Rated ★ ${ratingVal.toFixed(1)})`
              : 'Ultimate Guitar (Verified Chords & Lyrics)',
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

    // Parallel multi-source fetch: Songsterr, Ultimate Guitar (Best-Rated), GuitarTuna
    const [songsterrResults, ugResults, gtResults] = await Promise.all([
      searchSongsterr(query),
      searchUltimateGuitar(query),
      searchGuitarTuna(query),
    ]);

    // Deduplicate and combine (Songsterr verified & UG Best-Rated first)
    const combined: Array<{ id: string; title: string; artist: string; url: string; source: string; difficulty: string }> = [];
    const seenTitles = new Set<string>();

    // 1. Add Songsterr results
    for (const item of songsterrResults) {
      const key = `${item.title.toLowerCase().trim()}:::${item.artist.toLowerCase().trim()}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        combined.push(item);
      }
    }

    // 2. Add Ultimate Guitar Best-Rated results
    for (const item of ugResults) {
      const key = `${item.title.toLowerCase().trim()}:::${item.artist.toLowerCase().trim()}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        combined.push(item);
      }
    }

    // 3. Add GuitarTuna fallback results
    for (const item of gtResults) {
      const key = `${item.title.toLowerCase().trim()}:::${item.artist.toLowerCase().trim()}`;
      if (!seenTitles.has(key)) {
        seenTitles.add(key);
        combined.push(item);
      }
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ songs: combined });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: msg });
  }
}
