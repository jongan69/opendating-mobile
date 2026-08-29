import {
  deriveRevenueCatAppUserId,
  getRevenueCatApiKey,
  isRevenueCatEnabled,
  isRevenueCatKeyValid,
  isTrustedRevenueCatVerification,
  OPENDATING_PRODUCT_IDS,
} from '@/lib/revenuecat-config';
import * as Crypto from 'expo-crypto';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: jest.fn(),
}));

describe('RevenueCat release gates', () => {
  const originalIosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  const originalAndroidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  const originalRevenueCatEnabled = process.env.EXPO_PUBLIC_REVENUECAT_ENABLED;
  const originalFeaturesReady = process.env.EXPO_PUBLIC_OPENDATING_PLUS_FEATURES_READY;

  afterEach(() => {
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = originalIosKey;
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = originalAndroidKey;
    process.env.EXPO_PUBLIC_REVENUECAT_ENABLED = originalRevenueCatEnabled;
    process.env.EXPO_PUBLIC_OPENDATING_PLUS_FEATURES_READY = originalFeaturesReady;
    jest.clearAllMocks();
  });

  it('requires both release gates', () => {
    process.env.EXPO_PUBLIC_REVENUECAT_ENABLED = 'true';
    process.env.EXPO_PUBLIC_OPENDATING_PLUS_FEATURES_READY = 'false';
    expect(isRevenueCatEnabled()).toBe(false);

    process.env.EXPO_PUBLIC_OPENDATING_PLUS_FEATURES_READY = 'true';
    expect(isRevenueCatEnabled()).toBe(true);
  });

  it('accepts only platform-matching public SDK keys', () => {
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = ' appl_public ';
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY = ' goog_public ';

    expect(getRevenueCatApiKey('ios')).toBe('appl_public');
    expect(getRevenueCatApiKey('android')).toBe('goog_public');
    expect(isRevenueCatKeyValid('appl_public', 'ios')).toBe(true);
    expect(isRevenueCatKeyValid('goog_public', 'android')).toBe(true);
    expect(isRevenueCatKeyValid('goog_public', 'ios')).toBe(false);
    expect(isRevenueCatKeyValid('appl_public', 'android')).toBe(false);
    expect(isRevenueCatKeyValid('appl_public', 'web')).toBe(false);
  });

  it('allows only the documented OpenDating products', () => {
    expect([...OPENDATING_PRODUCT_IDS]).toEqual([
      'opendating_plus_lifetime',
    ]);
  });

  it('grants Plus only for verified entitlements', () => {
    expect(isTrustedRevenueCatVerification('VERIFIED')).toBe(true);
    expect(isTrustedRevenueCatVerification('VERIFIED_ON_DEVICE')).toBe(true);
    expect(isTrustedRevenueCatVerification('NOT_REQUESTED')).toBe(false);
    expect(isTrustedRevenueCatVerification('FAILED')).toBe(false);
  });

  it('derives an opaque billing identifier', async () => {
    jest.mocked(Crypto.digestStringAsync).mockResolvedValue('digest');

    await expect(deriveRevenueCatAppUserId('raw-pubkey')).resolves.toBe('opendating:digest');
    expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'opendating:billing:v1:raw-pubkey',
    );
  });
});
