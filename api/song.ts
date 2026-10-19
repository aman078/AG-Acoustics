import { parseUltimateGuitarTab, parseGuitarTunaSong } from '../src/server/scraperPlugin';

export default async function handler(req: any, res: any) {
  try {
    const songUrl = (req.query?.url || '') as string;
    if (!songUrl) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ error: 'Missing song URL' });
    }

    let songData;
    if (songUrl.includes('ultimate-guitar.com')) {
      songData = await parseUltimateGuitarTab(songUrl);
    } else {
      songData = await parseGuitarTunaSong(songUrl);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(songData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch song';
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: msg });
  }
}
