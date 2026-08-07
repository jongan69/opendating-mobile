// Location module — privacy-first GPS handling.
// Raw latitude/longitude MUST NEVER cross this module boundary.

import * as Location from 'expo-location';
import { toCoarseGeohash, hasSignificantChange } from './geohash';

export { toCoarseGeohash, hasSignificantChange };

let lastKnownCoarseGeohash: string | null = null;

/**
 * Request location permission and return a coarse geohash prefix.
 * Raw coordinates are consumed internally; only the geohash prefix escapes.
 */
export async function getCoarseLocation(): Promise<{
  geohashPrefix: string;
  countryCode?: string;
}> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = pos.coords;

  // Immediately convert to coarse geohash — don't store raw coords
  const geohashPrefix = toCoarseGeohash(latitude, longitude);

  // Try to get country code from reverse geocode
  let countryCode: string | undefined;
  try {
    const geocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    if (geocode.length > 0 && geocode[0].isoCountryCode) {
      countryCode = geocode[0].isoCountryCode;
    }
  } catch {
    // Non-critical — country code is optional
  }

  // Update last known
  lastKnownCoarseGeohash = geohashPrefix;

  // Raw lat/lng are now out of scope — they won't be stored or returned
  return { geohashPrefix, countryCode };
}

/**
 * Get the last known coarse geohash (from memory only).
 */
export function getLastKnownGeohash(): string | null {
  return lastKnownCoarseGeohash;
}

/**
 * Check if location has changed enough to warrant a server update.
 */
export function shouldUpdateLocation(newPrefix: string): boolean {
  return hasSignificantChange(lastKnownCoarseGeohash ?? '', newPrefix);
}
