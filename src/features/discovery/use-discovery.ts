// Discovery flow hook
// Manages the candidate stack, cursor pagination, daily quota, and location
// sync. Location is coarse-only: a geohash prefix leaves this module, never
// raw coordinates.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import {
  getCoarseLocation,
  shouldUpdateLocation,
  hasSignificantChange,
} from '@/lib/location';
import type { Candidate } from '@/types/opendating';

const PAGE_SIZE = 20;
// When the visible stack drops to this many, pre-fetch the next page.
const PREFETCH_THRESHOLD = 5;

export interface UseDiscoveryResult {
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  remainingToday: number;
  fetchCandidates: () => Promise<void>;
  like: (pubkey: string, grant: string) => Promise<boolean>;
  pass: (pubkey: string) => void;
  refreshLocation: () => Promise<void>;
  hasMore: boolean;
}

function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export function useDiscovery(): UseDiscoveryResult {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (mountedRef.current) setError(toUserMessage(err));
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Pre-fetch the next page when the visible stack gets low.
  useEffect(() => {
    if (candidates.length <= PREFETCH_THRESHOLD && hasMore) {
      fetchCandidates();
    }
  }, [candidates.length, hasMore, fetchCandidates]);

  /**
   * Like a candidate. Returns true when a match was created.
   * The candidate leaves the stack only on success; on failure the error is
   * surfaced and the card remains so the user can retry.
   */
  const like = useCallback(
    async (pubkey: string, grant: string): Promise<boolean> => {
      try {
        const result = await getOpenDatingClient().like(pubkey, grant);
        removeFromStack(pubkey);
        return result.match_created;
      } catch (err) {
        setError(toUserMessage(err));
        return false;
      }
    },
    [removeFromStack]
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
    remainingToday,
    fetchCandidates,
    like,
    pass,
    refreshLocation,
    hasMore,
  };
}
