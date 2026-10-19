// High-speed IndexedDB offline storage for AGSoft Acoustics
// Caches full song sheets, tablatures, chords & repertoire locally so guitarists can rehearse with zero cellular connection

import { SongData } from '../data/popularSongs';

const DB_NAME = 'agsoft_acoustics_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_song_sheets';

let dbInstance: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('artist', 'artist', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export interface CachedSongRecord {
  id: string;
  song: SongData;
  cachedAt: number;
}

/**
 * Automatically caches a full song sheet offline in IndexedDB
 */
export async function cacheSongOffline(song: SongData): Promise<void> {
  if (!song || !song.id) return;
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: CachedSongRecord = {
        id: song.id,
        song,
        cachedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not cache song in IndexedDB:', err);
  }
}

/**
 * Retrieves a full song sheet from offline IndexedDB cache
 */
export async function getCachedSongOffline(id: string): Promise<SongData | null> {
  if (!id) return null;
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const res = req.result as CachedSongRecord | undefined;
        resolve(res ? res.song : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Checks if a song is available offline
 */
export async function isSongCachedOffline(id: string): Promise<boolean> {
  const song = await getCachedSongOffline(id);
  return song !== null;
}

/**
 * Removes a song from offline cache
 */
export async function removeCachedSongOffline(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(err);
  }
}
