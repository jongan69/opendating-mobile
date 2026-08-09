// Discovery flow hook
// Manages the candidate stack, cursor pagination, daily quota, and location
// sync. Location is coarse-only: a geohash prefix leaves this module, never
// raw coordinates.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { isServiceUnavailable } from '@/lib/opendating/errors';
import {
  getCoarseLocation,
  shouldUpdateLocation,
  hasSignificantChange,
} from '@/lib/location';
import { isScreenshotMode } from '@/constants/env';
import { subscribeDiscoveryPreferences } from '@/features/discovery/discovery-preferences';
import type { Candidate } from '@/types/opendating';

const PAGE_SIZE = 20;
// When the visible stack drops to this many, pre-fetch the next page.
const PREFETCH_THRESHOLD = 5;

export interface UseDiscoveryResult {
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  /** True when `error` is "this relay doesn't run discovery yet". */
  unavailable: boolean;
  remainingToday: number;
  /** True once the first page has resolved, successfully or not. */
  loaded: boolean;
  fetchCandidates: () => Promise<void>;
  like: (pubkey: string, grant: string) => Promise<boolean>;
  pass: (pubkey: string) => void;
  refreshLocation: () => Promise<void>;
  clearError: () => void;
  hasMore: boolean;
}

function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export function useDiscovery(): UseDiscoveryResult {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  // Starts true: the first page is requested on mount, and starting at false
  // renders an "all caught up" empty state for a frame before the fetch runs.
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [remainingToday, setRemainingToday] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const cursorRef = useRef<string | undefined>(undefined);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  // Geohash prefix we last reported to the server (for significant-move checks).
  const lastSentPrefixRef = useRef<string | null>(null);

  const removeFromStack = useCallback((pubkey: string) => {
    setCandidates((prev) => prev.filter((c) => c.pubkey !== pubkey));
  }, []);

  /**
   * Fetch the next page of candidates and append it to the local stack.
   * Pages are deduped by pubkey in case the server overlaps cursors.
   */
  const fetchCandidates = useCallback(async () => {
    if (isScreenshotMode) {
      setLoading(false);
      setLoaded(true);
      setError(null);
      setUnavailable(false);
      setRemainingToday(99);
      setHasMore(false);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const page = await getOpenDatingClient().getCandidates({
        limit: PAGE_SIZE,
        cursor: cursorRef.current,
      });
      if (!mountedRef.current) return;

      setCandidates((prev) => {
        const known = new Set(prev.map((c) => c.pubkey));
        const fresh = page.candidates.filter((c) => !known.has(c.pubkey));
        return [...prev, ...fresh];
      });

      cursorRef.current = page.cursor;
      setRemainingToday(page.remaining_today);

      // Stop paging on quota exhaustion or when the server is out of results.
      const emptyPage = page.candidates.length === 0;
      setHasMore(!emptyPage && !!page.cursor && page.remaining_today > 0);
    } catch (err) {
      if (mountedRef.current) {
        setError(toUserMessage(err));
        setUnavailable(isServiceUnavailable(err));
        // Stop paging: retrying a service the relay does not run just
        // re-times-out every time the stack drains.
        setHasMore(false);
      }
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setLoaded(true);
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Pre-fetch the next page when the visible stack gets low.
  useEffect(() => {
    if (candidates.length <= PREFETCH_THRESHOLD && hasMore) {
      fetchCandidates();
    }
  }, [candidates.length, hasMore, fetchCandidates]);

  /**
   * Like a candidate. Returns true when a match was created.
   *
   * The card leaves the stack immediately so the deck never stalls waiting
   * on the network. If the server rejects the like, the candidate is put
   * back where it was and the error is surfaced, so a like is never lost
   * silently.
   */
  const like = useCallback(
    async (pubkey: string, grant: string): Promise<boolean> => {
      const index = candidates.findIndex((c) => c.pubkey === pubkey);
      const saved = index === -1 ? null : candidates[index];

      removeFromStack(pubkey);

      try {
        const result = await getOpenDatingClient().like(pubkey, grant);
        // The quota is only refreshed when a page of candidates is fetched,
        // and the like response carries no count, so without this the footer
        // sat at its initial number however many people you liked — and the
        // "that's all your likes for today" state could never be reached from
        // swiping alone. Decremented locally and reconciled on the next page.
        if (mountedRef.current) {
          setRemainingToday((n) => Math.max(0, n - 1));
        }
        return result.match_created;
      } catch (err) {
        if (saved && mountedRef.current) {
          setCandidates((prev) =>
            prev.some((c) => c.pubkey === pubkey)
              ? prev
              : [...prev.slice(0, index), saved, ...prev.slice(index)]
          );
        }
        if (mountedRef.current) setError(toUserMessage(err));
        return false;
      }
    },
    [candidates, removeFromStack]
  );

  /** Local pass — removes the candidate from the stack without a server call. */
  const pass = useCallback(
    (pubkey: string) => {
      removeFromStack(pubkey);
    },
    [removeFromStack]
  );

  /**
   * Push the current coarse location to the server, but only when it has
   * changed meaningfully since we last reported it. The first call in a
   * session always sends, so the server gets an initial location.
   *
   * Note: getCoarseLocation() records the new prefix as "last known" before
   * returning, so the meaningful comparison is against what we last sent.
   */
  const refreshLocation = useCallback(async () => {
    if (isScreenshotMode) return;

    try {
      const loc = await getCoarseLocation();
      const needsUpdate =
        lastSentPrefixRef.current === null ||
        shouldUpdateLocation(loc.geohashPrefix) ||
        hasSignificantChange(lastSentPrefixRef.current, loc.geohashPrefix);

      if (needsUpdate) {
        await getOpenDatingClient().updateLocation(
          loc.geohashPrefix,
          loc.countryCode
        );
        lastSentPrefixRef.current = loc.geohashPrefix;
      }
    } catch {
      // Location failures are non-fatal for browsing.
    }
  }, []);

  // Preference changes invalidate the server-side deck (grants deleted,
  // deck rebuilt per BACKEND-COMPLETE.md). Reset the local stack so the next
  // fetch gets a fresh deck rather than showing stale cards whose grants will
  // be rejected.
  useEffect(() => {
    return subscribeDiscoveryPreferences(() => {
      if (!mountedRef.current) return;
      setCandidates([]);
      cursorRef.current = undefined;
      setHasMore(true);
      fetchCandidates();
    });
  }, [fetchCandidates]);

  // Initial load: first page of candidates, plus a location sync.
  useEffect(() => {
    mountedRef.current = true;
    fetchCandidates();
    refreshLocation();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCandidates, refreshLocation]);

  return {
    candidates,
    loading,
    error,
    unavailable,
    remainingToday,
    loaded,
    fetchCandidates,
    like,
    pass,
    refreshLocation,
    clearError,
    hasMore,
  };
}
