// Module-level candidate cache.
// Detail screens (candidate, chat) look up profile data that was already
// shown in the discovery deck or the match list, without a re-fetch. The
// cache is populated by the screens that own that data (discover, matches).

import { useSyncExternalStore } from 'react';
import type { Candidate } from '@/types/opendating';

const cache = new Map<string, Candidate>();
const listeners = new Set<() => void>();
let version = 0;

function notify(): void {
  version += 1;
  for (const fn of listeners) fn();
}

/** Add a candidate to the cache. */
export function cacheCandidate(candidate: Candidate): void {
  if (cache.get(candidate.pubkey) === candidate) return;
  cache.set(candidate.pubkey, candidate);
  notify();
}

/** Add a batch of candidates to the cache. */
export function cacheCandidates(candidates: Candidate[]): void {
  let changed = false;
  for (const candidate of candidates) {
    if (cache.get(candidate.pubkey) !== candidate) {
      cache.set(candidate.pubkey, candidate);
      changed = true;
    }
  }
  if (changed) notify();
}

/** Non-reactive lookup for imperative code paths. */
export function getCachedCandidate(pubkey: string): Candidate | undefined {
  return cache.get(pubkey);
}

/**
 * Reactive lookup — re-renders the caller when the cached profile for
 * `pubkey` appears or changes.
 */
export function useCachedCandidate(pubkey: string): Candidate | undefined {
  useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => version
  );
  return cache.get(pubkey);
}
