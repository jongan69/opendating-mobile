// Local storage abstraction.
// Uses expo-secure-store for sensitive data, AsyncStorage for cache only.
// NEVER stores: nsec, private keys, decrypted messages, raw GPS.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { StoredPolicyAcceptance } from '@/lib/policy';

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
  PROFILE_CONTENT: 'opendating_profile_content',
  ONBOARDING_DRAFT: 'opendating_onboarding_draft',
  POLICY_ACCEPTANCE: 'opendating_policy_acceptance',
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

  // Own profile content.
  // This is the user's own data, not another member's — unlike decrypted
  // messages it is kept locally so the app can render and edit the profile
  // without a round-trip, and so a failed publish is never a lost draft.
  async saveProfileContent(content: object): Promise<void> {
    await secureSet(STORAGE_KEYS.PROFILE_CONTENT, JSON.stringify(content));
  },
  async getProfileContent<T>(): Promise<T | null> {
    const raw = await secureGet(STORAGE_KEYS.PROFILE_CONTENT);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  // In-progress onboarding draft.
  // Persisted so a reload, a backgrounded app, or an OS memory kill does not
  // discard everything the user has typed and strand them on the review step
  // with a permanently disabled button.
  async saveOnboardingDraft(draft: object): Promise<void> {
    await secureSet(STORAGE_KEYS.ONBOARDING_DRAFT, JSON.stringify(draft));
  },
  async getOnboardingDraft<T>(): Promise<T | null> {
    const raw = await secureGet(STORAGE_KEYS.ONBOARDING_DRAFT);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async clearOnboardingDraft(): Promise<void> {
    await secureDelete(STORAGE_KEYS.ONBOARDING_DRAFT);
  },

  // Terms of Service and Community Standards acceptance. This survives the
  // onboarding-draft cleanup so the app retains the exact accepted policy
  // version, timestamp, and account identifier.
  async savePolicyAcceptance(acceptance: StoredPolicyAcceptance): Promise<void> {
    await secureSet(STORAGE_KEYS.POLICY_ACCEPTANCE, JSON.stringify(acceptance));
  },
  async getPolicyAcceptance(): Promise<StoredPolicyAcceptance | null> {
    const raw = await secureGet(STORAGE_KEYS.POLICY_ACCEPTANCE);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      // A consent record is only meaningful if every field survived intact;
      // a partial record must read as "no acceptance on file".
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as StoredPolicyAcceptance).version === 'string' &&
        typeof (parsed as StoredPolicyAcceptance).acceptedAt === 'string' &&
        typeof (parsed as StoredPolicyAcceptance).pubkey === 'string'
      ) {
        return parsed as StoredPolicyAcceptance;
      }
      return null;
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
