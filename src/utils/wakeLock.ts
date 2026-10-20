/**
 * Screen WakeLock Utility
 * Prevents mobile and browser screens from going into standby / sleep while scrolling or viewing guitar tabs and chords.
 * Releases automatically when the song is closed, user leaves the app, or page is hidden.
 */

let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        return true;
      }
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('Screen WakeLock error:', err);
      return false;
    }
  }
  return false;
}

export async function releaseScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      if (!wakeLockSentinel.released) {
        await wakeLockSentinel.release();
      }
    } catch {}
    wakeLockSentinel = null;
  }
}

export function isScreenWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}
