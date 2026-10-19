import { searchUltimateGuitar, searchGuitarTuna } from '../src/server/scraperPlugin';

export default async function handler(req: any, res: any) {
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

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ songs: combined });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: msg });
  }
}
