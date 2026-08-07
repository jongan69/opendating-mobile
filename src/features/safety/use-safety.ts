// Safety operations hook
// Block/unblock/report/unmatch. Block state is applied locally first so the
// UI never waits on the network; backend failures roll the local state back.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import type { Block, ReportInput } from '@/types/opendating';

export interface UseSafetyResult {
  blocks: Block[];
  loading: boolean;
  error: string | null;
  blockUser: (pubkey: string) => Promise<void>;
  unblockUser: (pubkey: string) => Promise<void>;
  unmatchUser: (pubkey: string) => Promise<void>;
  reportUser: (report: ReportInput) => Promise<void>;
  isBlocked: (pubkey: string) => boolean;
  fetchBlocks: () => Promise<void>;
}

function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export function useSafety(): UseSafetyResult {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetched = await getOpenDatingClient().getBlocks();
      if (!mountedRef.current) return;
      setBlocks([...fetched].sort((a, b) => b.created_at - a.created_at));
    } catch (err) {
      if (mountedRef.current) setError(toUserMessage(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const isBlocked = useCallback(
    (pubkey: string): boolean => {
      return blocks.some((b) => b.target_pubkey === pubkey);
    },
    [blocks]
  );

  /**
   * Block a user. The block is applied to local state immediately; the
   * backend call happens in the background. If the backend rejects it, the
   * local block is reverted and the error is surfaced.
   */
  const blockUser = useCallback(
    async (pubkey: string) => {
      if (isBlocked(pubkey)) return;

      const block: Block = {
        target_pubkey: pubkey,
        created_at: Math.floor(Date.now() / 1000),
      };
      setBlocks((prev) => [block, ...prev]);
      setError(null);

      try {
        await getOpenDatingClient().createBlock(pubkey);
      } catch (err) {
        // Reconcile: revert the optimistic block.
        setBlocks((prev) => prev.filter((b) => b.target_pubkey !== pubkey));
        setError(toUserMessage(err));
      }
    },
    [isBlocked]
  );

  /**
   * Unblock a user. Local state updates immediately; a backend failure
   * restores the block.
   */
  const unblockUser = useCallback(
    async (pubkey: string) => {
      const removed =
        blocks.find((b) => b.target_pubkey === pubkey) ?? {
          target_pubkey: pubkey,
          created_at: Math.floor(Date.now() / 1000),
        };
      setBlocks((prev) => prev.filter((b) => b.target_pubkey !== pubkey));
      setError(null);

      try {
        await getOpenDatingClient().removeBlock(pubkey);
      } catch (err) {
        setBlocks((prev) =>
          prev.some((b) => b.target_pubkey === pubkey)
            ? prev
            : [removed, ...prev]
        );
        setError(toUserMessage(err));
      }
    },
    [blocks]
  );

  const unmatchUser = useCallback(async (pubkey: string) => {
    setError(null);
    try {
      await getOpenDatingClient().unmatch(pubkey);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }, []);

  const reportUser = useCallback(async (report: ReportInput) => {
    setError(null);
    try {
      await getOpenDatingClient().report(report);
    } catch (err) {
      setError(toUserMessage(err));
    }
  }, []);

  // Initial load.
  useEffect(() => {
    mountedRef.current = true;
    fetchBlocks();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchBlocks]);

  return {
    blocks,
    loading,
    error,
    blockUser,
    unblockUser,
    unmatchUser,
    reportUser,
    isBlocked,
    fetchBlocks,
  };
}
