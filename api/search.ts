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

  const majorTokens = tokens.filter((t) => t.length >= 3);

  if (majorTokens.length > 0) {
    const hasMajorMatch = majorTokens.some((token) => {
      const regex = new RegExp(`(^|\\b)${token}`, 'i');
      return regex.test(textClean);
    });
    if (!hasMajorMatch) return false;
  }

  const shortTokens = tokens.filter((t) => t.length < 3);
  for (const short of shortTokens) {
    if (majorTokens.length === 0) {
      const regex = new RegExp(`\\b${short}\\b`, 'i');
      if (!regex.test(textClean)) return false;
    }
  }

  return true;
}

async function searchUltimateGuitar(query: string) {
  const stripped = query.replace(/\b(from|song|movie|chords|tabs|lyrics)\b/gi, '').trim();
  const words = query.trim().split(/\s+/);
  const firstTwoWords = words.slice(0, 2).join(' ');
  const normalizedNaa = query.replace(/\bna\b/gi, 'naa');

  const variants = Array.from(new Set([query, normalizedNaa, stripped, firstTwoWords])).filter(Boolean);

  for (const qVar of variants) {
    // Try both general value search and title search
    const urls = [
      `https://www.ultimate-guitar.com/search.php?value=${encodeURIComponent(qVar)}`,
      `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(qVar)}`
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
        }

        const relevant = (results as UGRawItem[])
          .filter((r) => r.tab_url && (r.type === 'Chords' || r.type === 'Tab'))
          .filter((r) => isRelevantMatch(qVar, r.song_name, r.artist_name) || isRelevantMatch(query, r.song_name, r.artist_name))
          .sort((a, b) => {
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
            difficulty: r.votes && r.votes > 50 ? `${r.rating?.toFixed(1)}★ (${r.votes})` : 'Verified',
          }));

        if (relevant.length > 0) {
          return relevant;
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

    const [ugResults, gtResults] = await Promise.all([
      searchUltimateGuitar(query),
      searchGuitarTuna(query),
    ]);

    const combined = [...ugResults, ...gtResults];

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ songs: combined });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: msg });
  }
}
