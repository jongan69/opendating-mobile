import AsyncStorage from '@react-native-async-storage/async-storage';

import { isValidPolicyTimestamp, type StoredPolicyAcceptance } from '@/lib/policy';

const STORAGE_KEYS = {
  SERVICES_CACHE: 'opendating_services',
  LOCATION_PREFIX: 'opendating_location_prefix',
  ONBOARDING_COMPLETE: 'opendating_onboarding_done',
  THEME_PREFERENCE: 'opendating_theme',
  PROFILE_CONTENT: 'opendating_profile_content',
  ONBOARDING_DRAFT: 'opendating_onboarding_draft',
  POLICY_ACCEPTANCE: 'opendating_policy_acceptance',
  DISCOVERY_PREFERENCES: 'opendating_discovery_preferences',
} as const;

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const storage = {
  async saveServicesCache(data: object): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SERVICES_CACHE, JSON.stringify(data));
  },
  async getServicesCache<T>(): Promise<T | null> {
    return readJson<T>(STORAGE_KEYS.SERVICES_CACHE);
  },

  async saveProfileContent(content: object): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_CONTENT, JSON.stringify(content));
  },
  async getProfileContent<T>(): Promise<T | null> {
    return readJson<T>(STORAGE_KEYS.PROFILE_CONTENT);
  },

  async saveOnboardingDraft(draft: object): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DRAFT, JSON.stringify(draft));
  },
  async getOnboardingDraft<T>(): Promise<T | null> {
    return readJson<T>(STORAGE_KEYS.ONBOARDING_DRAFT);
  },
  async clearOnboardingDraft(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_DRAFT);
  },

  async savePolicyAcceptance(acceptance: StoredPolicyAcceptance): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.POLICY_ACCEPTANCE,
      JSON.stringify(acceptance)
    );
  },
  async getPolicyAcceptance(): Promise<StoredPolicyAcceptance | null> {
    const parsed = await readJson<StoredPolicyAcceptance>(
      STORAGE_KEYS.POLICY_ACCEPTANCE
    );
    if (
      !parsed ||
      typeof parsed.version !== 'string' ||
      typeof parsed.acceptedAt !== 'string' ||
      typeof parsed.pubkey !== 'string' ||
      !isValidPolicyTimestamp(parsed.acceptedAt)
    ) {
      return null;
    }
    return parsed;
  },
  async deletePolicyAcceptance(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.POLICY_ACCEPTANCE);
  },

  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  },
  async isOnboardingComplete(): Promise<boolean> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE)) === 'true';
  },

  async saveThemePreference(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
  },
  async getThemePreference(): Promise<'light' | 'dark' | 'system' | null> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
    return value === 'light' || value === 'dark' || value === 'system' ? value : null;
  },

  async saveDiscoveryPreferences(preferences: object): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.DISCOVERY_PREFERENCES,
      JSON.stringify(preferences)
    );
  },
  async getDiscoveryPreferences<T>(): Promise<T | null> {
    return readJson<T>(STORAGE_KEYS.DISCOVERY_PREFERENCES);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  },
};
