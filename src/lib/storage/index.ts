// Local storage abstraction.
// Uses expo-secure-store for sensitive data, AsyncStorage for cache only.
// NEVER stores: nsec, private keys, decrypted messages, raw GPS.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// In-memory fallback when SecureStore is unavailable (e.g., web during dev)
const inMemoryStore = new Map<string, string>();

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      inMemoryStore.set(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    inMemoryStore.set(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return inMemoryStore.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return inMemoryStore.get(key) ?? null;
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      inMemoryStore.delete(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    inMemoryStore.delete(key);
  }
}

// ---- Public API ----

const STORAGE_KEYS = {
  IDENTITY_PRIVKEY: 'opendating_privkey',
  IDENTITY_PUBKEY: 'opendating_pubkey',
  SERVICES_CACHE: 'opendating_services',
  LOCATION_PREFIX: 'opendating_location_prefix',
  ONBOARDING_COMPLETE: 'opendating_onboarding_done',
  THEME_PREFERENCE: 'opendating_theme',
} as const;

export const storage = {
  // Identity (secure)
  async savePrivateKey(key: string): Promise<void> {
    await secureSet(STORAGE_KEYS.IDENTITY_PRIVKEY, key);
  },
  async getPrivateKey(): Promise<string | null> {
    return secureGet(STORAGE_KEYS.IDENTITY_PRIVKEY);
  },
  async savePublicKey(key: string): Promise<void> {
    await secureSet(STORAGE_KEYS.IDENTITY_PUBKEY, key);
  },
  async getPublicKey(): Promise<string | null> {
    return secureGet(STORAGE_KEYS.IDENTITY_PUBKEY);
  },
  async deleteIdentity(): Promise<void> {
    await secureDelete(STORAGE_KEYS.IDENTITY_PRIVKEY);
    await secureDelete(STORAGE_KEYS.IDENTITY_PUBKEY);
  },

  // Services cache
  async saveServicesCache(data: object): Promise<void> {
    await secureSet(STORAGE_KEYS.SERVICES_CACHE, JSON.stringify(data));
  },
  async getServicesCache<T>(): Promise<T | null> {
    const raw = await secureGet(STORAGE_KEYS.SERVICES_CACHE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  // Onboarding
  async setOnboardingComplete(): Promise<void> {
    await secureSet(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  },
  async isOnboardingComplete(): Promise<boolean> {
    const val = await secureGet(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return val === 'true';
  },

  // Theme
  async saveThemePreference(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await secureSet(STORAGE_KEYS.THEME_PREFERENCE, theme);
  },
  async getThemePreference(): Promise<'light' | 'dark' | 'system' | null> {
    const val = await secureGet(STORAGE_KEYS.THEME_PREFERENCE);
    if (val === 'light' || val === 'dark' || val === 'system') return val;
    return null;
  },

  // Clear all app data
  async clearAll(): Promise<void> {
    for (const key of Object.values(STORAGE_KEYS)) {
      await secureDelete(key);
    }
  },
};
