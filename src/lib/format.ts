// Formatting helpers for pubkeys, timestamps, and connection states.

import { NDKUser } from '@nostr-dev-kit/ndk';
import type { ConnectionState } from '@/types/opendating';

/**
 * Encode a hex pubkey as a bech32 `npub` (NIP-19).
 * Falls back to the hex string if encoding fails for any reason.
 */
export function hexToNpub(hex: string): string {
  if (!hex) return '';
  try {
    return new NDKUser({ hexpubkey: hex }).npub;
  } catch {
    return hex;
  }
}

/** "a1b2c3…wxyz" — short form for on-screen display of a pubkey. */
export function shortPubkey(pubkey: string, prefixLength = 8, suffixLength = 6): string {
  if (!pubkey) return '';
  if (pubkey.length <= prefixLength + suffixLength + 1) return pubkey;
  return `${pubkey.slice(0, prefixLength)}…${pubkey.slice(-suffixLength)}`;
}

/** Format a protocol timestamp (unix seconds or ms) as a human date. */
export function formatTimestamp(ts?: number): string {
  if (!ts || ts <= 0) return '—';
  const ms = ts < 1_000_000_000_000 ? ts * 1000 : ts;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const CONNECTION_STATE_LABELS: Record<ConnectionState, string> = {
  starting: 'Starting',
  connecting: 'Connecting',
  authenticating: 'Authenticating',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
  relay_unavailable: 'OpenDating unavailable',
  protocol_incompatible: 'Protocol incompatible',
  fetching_capabilities: 'Checking services',
  account_unavailable: 'Account unavailable',
};

export function connectionStateLabel(state: ConnectionState): string {
  return CONNECTION_STATE_LABELS[state] ?? state;
}
