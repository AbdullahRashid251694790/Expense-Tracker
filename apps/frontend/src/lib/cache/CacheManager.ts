/**
 * CacheManager
 * IndexedDB-based cache with localStorage fallback for offline support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStore {
  key: string;
  data: unknown;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private dbName = 'casha-cache';
  private storeName = 'api-cache';
  private db: IDBDatabase | null = null;

  private async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const entry = request.result as CacheStore | undefined;
          if (!entry) {
            resolve(null);
            return;
          }

          // Check if expired
          if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key); // Clean up expired entry
            resolve(null);
            return;
          }

          resolve(entry.data as T);
        };
      });
    } catch {
      // Fallback to localStorage
      return this.getFromLocalStorage<T>(key);
    }
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const entry: CacheStore = {
          key,
          data,
          timestamp: Date.now(),
          ttl,
        };
        const request = store.put(entry);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch {
      // Fallback to localStorage
      this.setToLocalStorage(key, data, ttl);
    }
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch {
      localStorage.removeItem(`cache:${key}`);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   * Pattern examples: "expenses:*" invalidates all expense caches
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();

        request.onerror = () => reject(request.error);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
          if (cursor) {
            if (this.matchPattern(cursor.key as string, pattern)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    } catch {
      // Fallback: clear all localStorage cache items matching pattern
      this.invalidateLocalStorage(pattern);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch {
      // Clear localStorage cache items
      this.clearLocalStorageCache();
    }
  }

  private matchPattern(key: string, pattern: string): boolean {
    if (pattern.endsWith('*')) {
      return key.startsWith(pattern.slice(0, -1));
    }
    return key === pattern;
  }

  // localStorage fallbacks
  private getFromLocalStorage<T>(key: string): T | null {
    const item = localStorage.getItem(`cache:${key}`);
    if (!item) return null;

    try {
      const entry = JSON.parse(item) as CacheEntry<T>;
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  private setToLocalStorage<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch {
      // Storage quota exceeded, try to clear old entries
      this.clearLocalStorageCache();
    }
  }

  private invalidateLocalStorage(pattern: string): void {
    const prefix =
      pattern.endsWith('*') ? `cache:${pattern.slice(0, -1)}` : `cache:${pattern}`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }

  private clearLocalStorageCache(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('cache:')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
