import * as Crypto from 'expo-crypto';

export const OPENDATING_ENTITLEMENT_ID = 'plus';
export const OPENDATING_OFFERING_ID = 'default';
export const OPENDATING_PRODUCT_IDS = new Set([
  'opendating_plus_lifetime',
]);

export function isRevenueCatEnabled(): boolean {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_ENABLED === 'true' &&
    process.env.EXPO_PUBLIC_OPENDATING_PLUS_FEATURES_READY === 'true'
  );
}

export function getRevenueCatApiKey(platform: string): string {
  if (platform === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? '';
  }
  if (platform === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? '';
  }
  return '';
}

export function isRevenueCatKeyValid(apiKey: string, platform: string): boolean {
  if (platform === 'ios') return apiKey.startsWith('appl_');
  if (platform === 'android') return apiKey.startsWith('goog_');
  return false;
}

export function isTrustedRevenueCatVerification(verification: string): boolean {
  return verification === 'VERIFIED' || verification === 'VERIFIED_ON_DEVICE';
}

/**
 * RevenueCat receives a stable, domain-separated digest—not a user's Nostr
 * public key. This keeps the billing identifier opaque across systems.
 */
export async function deriveRevenueCatAppUserId(pubkey: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `opendating:billing:v1:${pubkey}`,
  );
  return `opendating:${digest}`;
}
