// Matches hook
// Owns the match list, surfaces new (unmessaged) matches, and reacts to
// server-pushed match.created events and app foreground events.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import type { Match } from '@/types/opendating';

export interface UseMatchesResult {
  matches: Match[];
  /** Matches that have not been messaged yet this session (newest first). */
  newMatches: Match[];
  loading: boolean;
  error: string | null;
  fetchMatches: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Move a match out of newMatches once the user opens/messages it. */
  markMessaged: (matchId: string) => void;
}

function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

function sortByCreatedAtDesc(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => b.created_at - a.created_at);
}

export function useMatches(): UseMatchesResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [newMatchIds, setNewMatchIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match ids already known this session — used to detect truly new matches.
  const seenRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const mergeMatch = useCallback((match: Match) => {
    setMatches((prev) => {
      if (prev.some((m) => m.match_id === match.match_id)) return prev;
      return sortByCreatedAtDesc([...prev, match]);
    });
  }, []);

  const markMessaged = useCallback((matchId: string) => {
    setNewMatchIds((prev) => {
      if (!prev.has(matchId)) return prev;
      const next = new Set(prev);
      next.delete(matchId);
      return next;
    });
  }, []);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetched = await getOpenDatingClient().getMatches();
      if (!mountedRef.current) return;

      const sorted = sortByCreatedAtDesc(fetched);

      // Flag matches we haven't seen this session as new.
      const freshIds = sorted
        .filter((m) => !seenRef.current.has(m.match_id))
        .map((m) => m.match_id);
      if (freshIds.length > 0) {
        setNewMatchIds((prev) => {
          const next = new Set(prev);
          for (const id of freshIds) next.add(id);
          return next;
        });
      }
      for (const m of sorted) seenRef.current.add(m.match_id);

      setMatches((prev) => {
        const byId = new Map(prev.map((m) => [m.match_id, m]));
        for (const m of sorted) byId.set(m.match_id, m);
        return sortByCreatedAtDesc([...byId.values()]);
      });
    } catch (err) {
      if (mountedRef.current) setError(toUserMessage(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchMatches();
  }, [fetchMatches]);

  const handleIncomingMatch = useCallback(
    (match: Match) => {
      if (!mountedRef.current) return;
      if (!seenRef.current.has(match.match_id)) {
        seenRef.current.add(match.match_id);
        setNewMatchIds((prev) => {
          const next = new Set(prev);
          next.add(match.match_id);
          return next;
        });
      }
      mergeMatch(match);
    },
    [mergeMatch]
  );

  // Initial load + lifecycle.
  useEffect(() => {
    mountedRef.current = true;
    fetchMatches();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMatches]);

  // Push updates: match.created envelopes pushed by the server.
  useEffect(() => {
    const unsubscribe = getOpenDatingClient().subscribeToMatches(
      handleIncomingMatch
    );
    return unsubscribe;
  }, [handleIncomingMatch]);

  // Refresh when the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && mountedRef.current) {
        fetchMatches();
      }
    });
    return () => sub.remove();
  }, [fetchMatches]);

  const newMatches = matches.filter((m) => newMatchIds.has(m.match_id));

  return {
    matches,
    newMatches,
    loading,
    error,
    fetchMatches,
    refresh,
    markMessaged,
  };
}
