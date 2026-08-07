// Discovery filter preferences.
// Module-level store for the filters screen. Apply is persisted to the
// server (best-effort) so subsequent discovery fetches are filtered.

import type { DiscoveryPreferences } from '@/types/opendating';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';

const KM_PER_MILE = 1.609344;

export const DEFAULT_DISCOVERY_PREFERENCES: DiscoveryPreferences = {
  min_age: 18,
  max_age: 99,
  max_distance_km: 80, // ~50 mi
  genders: undefined,
  relationship_intents: undefined,
};

let current: DiscoveryPreferences = { ...DEFAULT_DISCOVERY_PREFERENCES };
const listeners = new Set<() => void>();

export function getDiscoveryPreferences(): DiscoveryPreferences {
  return current;
}

export function kmToMiles(km: number): number {
  return Math.round(km / KM_PER_MILE);
}

export function milesToKm(mi: number): number {
  return Math.round(mi * KM_PER_MILE);
}

/**
 * Apply new preferences: updates local state immediately, then syncs to the
 * server. Server persistence is best-effort — an offline failure keeps the
 * local filters applied to the next fetch.
 */
export async function applyDiscoveryPreferences(
  next: DiscoveryPreferences
): Promise<void> {
  current = { ...next };
  for (const fn of listeners) fn();

  try {
    await getOpenDatingClient().updateDiscoveryPreferences(current);
  } catch {
    // Best-effort persistence; local state still applies to future queries.
  }
}

export function resetDiscoveryPreferences(): Promise<void> {
  return applyDiscoveryPreferences({ ...DEFAULT_DISCOVERY_PREFERENCES });
}

export function subscribeDiscoveryPreferences(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
