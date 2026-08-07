// Cross-conversation last-message log.
//
// The per-conversation messaging hook owns each conversation's full state;
// this module keeps only the most recent message per peer plus an unread
// count, so the matches screen can render previews and badges without
// holding every conversation open.
//
// Deliberately in-memory: decrypted message text is never written to disk
// (see docs/PRIVACY.md). The log refills from the relay each session via the
// client's inbox subscription.

import { useSyncExternalStore } from 'react';
import type { ODMessage } from '@/types/opendating';

export interface ConversationEntry {
  pubkey: string;
  lastText: string;
  lastAt: number;
  /** True when we sent the most recent message. */
  lastOutgoing: boolean;
  unread: number;
}

const log = new Map<string, ConversationEntry>();
const listeners = new Set<() => void>();

/**
 * Immutable view handed to React. Rebuilt on every change so
 * useSyncExternalStore can compare snapshots by identity — returning a fresh
 * Map from getSnapshot instead would loop forever.
 */
let snapshot: ReadonlyMap<string, ConversationEntry> = new Map();

function notify(): void {
  snapshot = new Map(log);
  for (const fn of listeners) fn();
}

/**
 * Record a message against a peer. Only a newer message replaces the
 * preview, so out-of-order relay delivery cannot rewind a conversation.
 */
export function recordConversationEntry(pubkey: string, message: ODMessage): void {
  if (!pubkey) return;

  const existing = log.get(pubkey);
  const isNewer = !existing || message.created_at > existing.lastAt;
  // An incoming message always bumps unread, even when an out-of-order
  // delivery leaves the preview alone.
  const unread =
    (existing?.unread ?? 0) + (message.outgoing || message.pending ? 0 : 1);

  if (!isNewer && unread === existing?.unread) return;

  log.set(pubkey, {
    pubkey,
    lastText: isNewer ? message.text : (existing?.lastText ?? message.text),
    lastAt: isNewer ? message.created_at : (existing?.lastAt ?? message.created_at),
    lastOutgoing: isNewer ? message.outgoing : (existing?.lastOutgoing ?? false),
    unread,
  });
  notify();
}

/** Clear the unread badge for a peer — called when its chat is opened. */
export function markConversationRead(pubkey: string): void {
  const existing = log.get(pubkey);
  if (!existing || existing.unread === 0) return;
  log.set(pubkey, { ...existing, unread: 0 });
  notify();
}

export function getConversationEntry(pubkey: string): ConversationEntry | undefined {
  return log.get(pubkey);
}

/** Total unread across every conversation, for the tab badge. */
export function getTotalUnread(): number {
  let total = 0;
  for (const entry of log.values()) total += entry.unread;
  return total;
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/** Reactive snapshot of the log: { peerPubkey → last entry }. */
export function useConversationLog(): ReadonlyMap<string, ConversationEntry> {
  return useSyncExternalStore(subscribe, () => snapshot);
}

/** Reactive total unread count. */
export function useTotalUnread(): number {
  return useSyncExternalStore(subscribe, getTotalUnread);
}

/** Test/reset hook — clears all conversation state. */
export function resetConversationLog(): void {
  log.clear();
  notify();
}
