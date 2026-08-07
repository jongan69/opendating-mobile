// Cross-conversation last-message log.
// The per-conversation messaging hook keeps its own state; this module
// records the most recent message per peer so the matches screen can show
// conversation previews without owning every conversation's full state.

import { useMemo, useSyncExternalStore } from 'react';
import type { ODMessage } from '@/types/opendating';

export interface ConversationEntry {
  pubkey: string;
  lastText: string;
  lastAt: number;
}

const log = new Map<string, ConversationEntry>();
const listeners = new Set<() => void>();
let version = 0;

function notify(): void {
  version += 1;
  for (const fn of listeners) fn();
}

/** Record a message; only newer messages replace the entry for a peer. */
export function recordConversationEntry(pubkey: string, message: ODMessage): void {
  const existing = log.get(pubkey);
  if (existing && existing.lastAt >= message.created_at) return;
  log.set(pubkey, {
    pubkey,
    lastText: message.text,
    lastAt: message.created_at,
  });
  notify();
}

export function getConversationEntry(pubkey: string): ConversationEntry | undefined {
  return log.get(pubkey);
}

/** Reactive snapshot of the log: { peerPubkey → last entry }. */
export function useConversationLog(): ReadonlyMap<string, ConversationEntry> {
  const versionSnapshot = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => version
  );
  void versionSnapshot;
  return useMemo(() => new Map(log), [versionSnapshot]);
}
