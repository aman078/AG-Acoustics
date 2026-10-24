export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let latestTagName = 'v1.0.57';
    let apkDownloadUrl = 'https://github.com/aman078/AG-Acoustics/releases/latest/download/AGSoft-Acoustics.apk';
    let releaseNotes = 'Acoustic Miraj Tanpura Droid Javari physical sound model, full 12-fret neck scale visualizer, and Sacred Lotus icon.';

    try {
      const ghRes = await fetch('https://api.github.com/repos/aman078/AG-Acoustics/releases/latest', {
        headers: {
          'User-Agent': 'AGSoft-Acoustics-Updater'
        }
      });
      if (ghRes.ok) {
        const ghData = (await ghRes.json()) as any;
        if (ghData.tag_name) {
          latestTagName = ghData.tag_name;
        }
        if (ghData.body) {
          releaseNotes = ghData.body;
        }
        const apkAsset = ghData.assets?.find((a: any) => a.name?.endsWith('.apk'));
        if (apkAsset?.browser_download_url) {
          apkDownloadUrl = apkAsset.browser_download_url;
        }
      }
    } catch {
      // Use defaults if GitHub API rate-limited
    }

    const match = latestTagName.match(/\d+$/);
    const versionCode = match ? parseInt(match[0], 10) : 57;
    const versionName = latestTagName.replace(/^v/, '');

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      latest_version_code: versionCode,
      latest_version_name: versionName,
      download_url: apkDownloadUrl,
      release_notes: releaseNotes,
      force_update: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Version check failed';
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: msg });
  }
}
