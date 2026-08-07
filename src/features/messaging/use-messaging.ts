// NIP-17 messaging hook for a single conversation partner.
// Subscribes to incoming gift-wrapped DMs, filters for targetPubkey,
// dedupes by event id, and sends with optimistic local delivery.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import type { ODMessage } from '@/types/opendating';

export interface UseMessagingResult {
  messages: ODMessage[];
  sendMessage: (text: string) => Promise<void>;
  /** True while a message is being sent. */
  loading: boolean;
  error: string | null;
}

function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

function sortByCreatedAtAsc(messages: ODMessage[]): ODMessage[] {
  return [...messages].sort((a, b) => a.created_at - b.created_at);
}

export function useMessaging(targetPubkey: string): UseMessagingResult {
  const [messages, setMessages] = useState<ODMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event ids already delivered — guards against duplicate events from the
  // relay and re-delivered pushes.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const handleIncoming = useCallback(
    (msg: ODMessage) => {
      if (!mountedRef.current) return;
      // Only messages from this conversation partner.
      if (msg.sender_pubkey !== targetPubkey) return;
      if (seenIdsRef.current.has(msg.id)) return;
      seenIdsRef.current.add(msg.id);

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return sortByCreatedAtAsc([...prev, msg]);
      });
    },
    [targetPubkey]
  );

  // Subscribe to incoming messages; the client shares one NDK subscription
  // across listeners, so unmounting only detaches this hook's callback.
  useEffect(() => {
    const unsubscribe = getOpenDatingClient().subscribeToMessages(handleIncoming);
    return unsubscribe;
  }, [handleIncoming]);

  // Reset conversation state when the partner changes.
  useEffect(() => {
    mountedRef.current = true;
    seenIdsRef.current = new Set();
    setMessages([]);
    setError(null);
    return () => {
      mountedRef.current = false;
    };
  }, [targetPubkey]);

  /**
   * Send a message to the current partner.
   * The message appears locally immediately; if the send fails it is rolled
   * back and the error is surfaced.
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !mountedRef.current) return;

      const client = getOpenDatingClient();
      const ownPubkey = await client.getPubkey();

      const local: ODMessage = {
        id: `local-${Date.now()}`,
        sender_pubkey: ownPubkey ?? '',
        recipient_pubkey: targetPubkey,
        text: trimmed,
        created_at: Math.floor(Date.now() / 1000),
      };

      seenIdsRef.current.add(local.id);
      setMessages((prev) => sortByCreatedAtAsc([...prev, local]));
      setLoading(true);
      setError(null);

      try {
        await client.sendMessage(targetPubkey, trimmed);
      } catch (err) {
        // Roll back the optimistic message.
        seenIdsRef.current.delete(local.id);
        setMessages((prev) => prev.filter((m) => m.id !== local.id));
        if (mountedRef.current) setError(toUserMessage(err));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [targetPubkey]
  );

  return { messages, sendMessage, loading, error };
}
