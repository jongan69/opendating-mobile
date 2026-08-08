// NIP-17 messaging hook for a single conversation partner.
// Subscribes to incoming gift-wrapped DMs, filters to this conversation,
// dedupes by rumor id, and sends with optimistic local delivery.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { recordConversationEntry } from '@/features/messaging/conversation-log';
import { mergeMessage, sortByCreatedAtAsc } from '@/features/messaging/message-merge';
import type { ODMessage } from '@/types/opendating';

export interface UseMessagingResult {
  messages: ODMessage[];
  sendMessage: (text: string) => Promise<void>;
  /** True while a message is in flight. */
  sending: boolean;
  error: string | null;
}

function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export function useMessaging(targetPubkey: string): UseMessagingResult {
  const [messages, setMessages] = useState<ODMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleIncoming = useCallback(
    (msg: ODMessage) => {
      if (!mountedRef.current) return;
      if (msg.conversation_pubkey !== targetPubkey) return;
      setMessages((prev) => mergeMessage(prev, msg));
    },
    [targetPubkey]
  );

  // Reset when the partner changes. Done during render rather than in an
  // effect so the cleared list is what renders — an effect would paint the
  // previous conversation's messages under the new partner's name first.
  const [renderedTarget, setRenderedTarget] = useState(targetPubkey);
  if (renderedTarget !== targetPubkey) {
    setRenderedTarget(targetPubkey);
    setMessages([]);
    setError(null);
  }

  // The client shares one relay subscription across listeners, so attaching
  // here only registers this hook's callback.
  useEffect(() => {
    return getOpenDatingClient().subscribeToMessages(handleIncoming);
  }, [handleIncoming]);

  /**
   * Send a message to the current partner. It appears immediately as
   * pending; the relay's confirmed copy replaces it, and a failure rolls it
   * back with the error surfaced.
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !mountedRef.current) return;

      const client = getOpenDatingClient();
      const ownPubkey = (await client.getPubkey()) ?? '';
      const localId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const local: ODMessage = {
        id: localId,
        sender_pubkey: ownPubkey,
        recipient_pubkey: targetPubkey,
        conversation_pubkey: targetPubkey,
        text: trimmed,
        created_at: Math.floor(Date.now() / 1000),
        outgoing: true,
        pending: true,
      };

      setMessages((prev) => sortByCreatedAtAsc([...prev, local]));
      setSending(true);
      setError(null);

      try {
        await client.sendMessage(targetPubkey, trimmed);
        recordConversationEntry(targetPubkey, local);
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== localId));
        if (mountedRef.current) setError(toUserMessage(err));
      } finally {
        if (mountedRef.current) setSending(false);
      }
    },
    [targetPubkey]
  );

  const value = useMemo(
    () => ({ messages, sendMessage, sending, error }),
    [messages, sendMessage, sending, error]
  );

  return value;
}
