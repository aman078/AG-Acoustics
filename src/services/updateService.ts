import { getApiBaseUrl } from './chordService';

export interface AppVersionData {
  versionCode: number;
  versionName: string;
}

export const CURRENT_APP_VERSION: AppVersionData = {
  versionCode: 55,
  versionName: '1.0.55',
};

export interface AppUpdateInfo {
  latestVersionCode: number;
  latestVersionName: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate?: boolean;
  updateAvailable: boolean;
}

/**
 * Checks if a newer version of AGSoft Acoustics is available
 */
export async function checkForAppUpdate(): Promise<AppUpdateInfo> {
  const fallbackUrl = 'https://github.com/aman078/AG-Acoustics/releases/latest/download/AGSoft-Acoustics.apk';

  // 1. Try primary configured API base URL
  try {
    const apiBase = getApiBaseUrl();
    const endpoint = apiBase ? `${apiBase}/api/version` : '/api/version';
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const latestCode = Number(data.latest_version_code) || 38;
      const latestName = String(data.latest_version_name || '1.0.38');
      const downloadUrl = String(data.download_url || fallbackUrl);
      const releaseNotes = String(data.release_notes || 'Latest enhancements and bug fixes.');

      const updateAvailable = latestCode > CURRENT_APP_VERSION.versionCode;

      return {
        latestVersionCode: latestCode,
        latestVersionName: latestName,
        downloadUrl,
        releaseNotes,
        forceUpdate: !!data.force_update,
        updateAvailable,
      };
    }
  } catch (err) {
    console.warn('Primary update check failed, trying production cloud:', err);
  }

  // 2. Try Vercel production cloud endpoint
  try {
    const res = await fetch('https://ag-acoustics.vercel.app/api/version', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const latestCode = Number(data.latest_version_code) || 38;
      const latestName = String(data.latest_version_name || '1.0.38');
      const downloadUrl = String(data.download_url || fallbackUrl);
      const releaseNotes = String(data.release_notes || 'Latest enhancements and bug fixes.');

      const updateAvailable = latestCode > CURRENT_APP_VERSION.versionCode;

      return {
        latestVersionCode: latestCode,
        latestVersionName: latestName,
        downloadUrl,
        releaseNotes,
        forceUpdate: !!data.force_update,
        updateAvailable,
      };
    }
  } catch (err) {
    console.warn('Vercel update check failed, trying GitHub Releases API:', err);
  }

  // 3. Fallback directly to public GitHub Releases API
  try {
    const ghRes = await fetch('https://api.github.com/repos/aman078/AG-Acoustics/releases/latest', {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (ghRes.ok) {
      const data = await ghRes.json();
      const tagName = String(data.tag_name || 'v1.0.38');
      const match = tagName.match(/\d+$/);
      const latestCode = match ? parseInt(match[0], 10) : 38;
      const latestName = tagName.replace(/^v/, '');
      const apkAsset = data.assets?.find((a: any) => a.name?.endsWith('.apk'));
      const downloadUrl = apkAsset?.browser_download_url || fallbackUrl;
      const releaseNotes = String(data.body || 'New features and improvements.');

      const updateAvailable = latestCode > CURRENT_APP_VERSION.versionCode;

      return {
        latestVersionCode: latestCode,
        latestVersionName: latestName,
        downloadUrl,
        releaseNotes,
        forceUpdate: false,
        updateAvailable,
      };
    }
  } catch (err) {
    console.warn('All update check mechanisms unreachable:', err);
  }

  return {
    latestVersionCode: CURRENT_APP_VERSION.versionCode,
    latestVersionName: CURRENT_APP_VERSION.versionName,
    downloadUrl: fallbackUrl,
    releaseNotes: '',
    updateAvailable: false,
  };
}

/**
 * Triggers APK download directly in the browser or mobile download manager
 */
export function triggerApkDownload(downloadUrl: string) {
  if (typeof window === 'undefined') return;

  try {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'AGSoft-Acoustics.apk');
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    window.location.href = downloadUrl;
  }
}
