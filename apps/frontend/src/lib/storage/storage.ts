/**
 * Cross-platform Storage Utility
 * Uses @capacitor/preferences on native platforms, localStorage on web
 * Ensures data persists across app restarts on Android
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

/**
 * Get a value from storage
 */
export async function getItem(key: string): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

/**
 * Set a value in storage
 */
export async function setItem(key: string, value: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

/**
 * Remove a value from storage
 */
export async function removeItem(key: string): Promise<void> {
  if (isNative) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * Clear all storage
 */
export async function clear(): Promise<void> {
  if (isNative) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
}

/**
 * Synchronous getItem for cases where async isn't possible
 * Falls back to localStorage (works on both platforms, but may not persist on Android)
 * Use sparingly - prefer async version
 */
export function getItemSync(key: string): string | null {
  return localStorage.getItem(key);
}

/**
 * Synchronous setItem for cases where async isn't possible
 * Also updates Capacitor Preferences in background on native
 */
export function setItemSync(key: string, value: string): void {
  localStorage.setItem(key, value);
  if (isNative) {
    // Fire and forget - update native storage in background
    Preferences.set({ key, value }).catch(console.error);
  }
}

/**
 * Synchronous removeItem for cases where async isn't possible
 * Also updates Capacitor Preferences in background on native
 */
export function removeItemSync(key: string): void {
  localStorage.removeItem(key);
  if (isNative) {
    // Fire and forget - update native storage in background
    Preferences.remove({ key }).catch(console.error);
  }
}

/**
 * Initialize storage - load native storage into localStorage for sync access
 * Call this at app startup before using sync methods
 */
export async function initializeStorage(): Promise<void> {
  if (!isNative) return;

  // Keys that need to be synced from native to localStorage
  const keysToSync = ['accessToken', 'refreshToken', 'theme', 'currency', 'mutation-queue'];

  for (const key of keysToSync) {
    const { value } = await Preferences.get({ key });
    if (value !== null) {
      localStorage.setItem(key, value);
    }
  }
}

export const Storage = {
  getItem,
  setItem,
  removeItem,
  clear,
  getItemSync,
  setItemSync,
  removeItemSync,
  initializeStorage,
};

export default Storage;
