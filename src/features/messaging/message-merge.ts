// Merging incoming messages into a conversation.
//
// Kept separate from the hook so the ordering and de-duplication rules can
// be tested directly — they are subtle enough to be worth pinning down.

import type { ODMessage } from '@/types/opendating';

/**
 * How far apart an optimistic message and its relay-confirmed twin may be
 * and still count as the same message. The relay round-trip is well inside
 * this; anything slower is better shown twice than merged wrongly.
 */
export const ECHO_WINDOW_SEC = 120;

export function sortByCreatedAtAsc(messages: ODMessage[]): ODMessage[] {
  return [...messages].sort((a, b) => a.created_at - b.created_at);
}

/**
 * Merge a message into the list, collapsing an optimistic entry into its
 * confirmed twin.
 *
 * A sent message comes back from the relay as a self-addressed copy whose
 * rumor id differs from the local placeholder's, so identity alone cannot
 * dedupe it and the sender would see every message they sent twice.
 */
export function mergeMessage(prev: ODMessage[], incoming: ODMessage): ODMessage[] {
  // Already have the confirmed message — relays re-deliver freely.
  if (prev.some((m) => m.id === incoming.id && !m.pending)) return prev;

  if (incoming.outgoing) {
    const pendingIndex = prev.findIndex(
      (m) =>
        m.pending &&
        m.outgoing &&
        m.text === incoming.text &&
        Math.abs(m.created_at - incoming.created_at) <= ECHO_WINDOW_SEC
    );
    if (pendingIndex !== -1) {
      const next = [...prev];
      next[pendingIndex] = incoming;
      return sortByCreatedAtAsc(next);
    }
  }

  return sortByCreatedAtAsc([...prev, incoming]);
}
