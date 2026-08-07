// Privacy-critical location conversion.
// Raw GPS must NEVER leave this module.
// Only geohash_prefix (max 5 chars) may be sent to the backend.

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode latitude/longitude to a geohash string.
 * This is a minimal, dependency-free implementation.
 */
export function encode(lat: number, lng: number, precision: number = 9): string {
  let hash = '';
  let minLat = -90;
  let maxLat = 90;
  let minLng = -180;
  let maxLng = 180;
  let isEven = true;
  let bit = 0;
  let charIndex = 0;

  while (hash.length < precision) {
    if (isEven) {
      const midLng = (minLng + maxLng) / 2;
      if (lng >= midLng) {
        charIndex = (charIndex << 1) | 1;
        minLng = midLng;
      } else {
        charIndex = charIndex << 1;
        maxLng = midLng;
      }
    } else {
      const midLat = (minLat + maxLat) / 2;
      if (lat >= midLat) {
        charIndex = (charIndex << 1) | 1;
        minLat = midLat;
      } else {
        charIndex = charIndex << 1;
        maxLat = midLat;
      }
    }

    bit++;
    if (bit === 5) {
      hash += BASE32[charIndex];
      bit = 0;
      charIndex = 0;
    }
    isEven = !isEven;
  }

  return hash;
}

/**
 * Convert raw GPS to coarse geohash prefix for OpenDating.
 * MAX 5 characters — approximately ~5 km precision.
 * Raw coordinates are consumed and should not be retained.
 */
export function toCoarseGeohash(lat: number, lng: number): string {
  const fullHash = encode(lat, lng, 9);
  return fullHash.substring(0, 5);
}

/**
 * Check if geohash prefix has changed enough to warrant an update.
 */
export function hasSignificantChange(
  oldPrefix: string,
  newPrefix: string,
  minCharDiff: number = 3
): boolean {
  if (!oldPrefix) return true;
  if (oldPrefix === newPrefix) return false;

  // Count matching prefix characters
  let matchLen = 0;
  for (let i = 0; i < Math.min(oldPrefix.length, newPrefix.length); i++) {
    if (oldPrefix[i] === newPrefix[i]) {
      matchLen++;
    } else {
      break;
    }
  }

  // If fewer than minCharDiff characters match, it's a significant change
  const maxLen = Math.max(oldPrefix.length, newPrefix.length);
  const diffChars = maxLen - matchLen;
  return diffChars >= minCharDiff;
}
