// NIP-59 gift wrap unwrapping.
//
// A gift wrap is three nested layers, and each one is encrypted to a
// different key:
//
//   kind 1059 (wrap)  encrypted to us by a one-time EPHEMERAL key. The
//                     `pubkey` on this event is that throwaway key — it is
//                     never the real sender, so it must not be used for
//                     attribution or for picking a conversation key.
//   kind 13   (seal)  encrypted to us by the REAL sender and signed by them.
//                     This is the only layer that carries sender identity.
//   kind N    (rumor) the unsigned application payload (78 = OpenDating
//                     command envelope, 14 = NIP-17 direct message).
//
// Sender attribution therefore comes from the seal. The rumor is unsigned,
// so its own `pubkey` field proves nothing on its own; we accept a rumor
// only when it agrees with the seal that carried it.

import { nip44Decrypt } from 'opendating-protocol';

/** NIP-59 seal kind. */
const SEAL_KIND = 13;

export interface UnwrappedGiftWrap {
  /** Verified sender, taken from the signed seal. */
  senderPubkey: string;
  /** Application kind of the inner rumor (78 = command, 14 = DM). */
  kind: number;
  /** Raw rumor content — a JSON string for every OpenDating payload. */
  content: string;
  /**
   * Rumor timestamp. This is the real one; the seal and wrap timestamps are
   * deliberately randomised into the past to frustrate timing analysis, so
   * they must never be shown to users or used for ordering.
   */
  createdAt: number;
  /** Deterministic rumor id — stable across relay re-delivery. */
  rumorId: string;
}

/** The subset of a Nostr event this module needs. */
export interface GiftWrapEventLike {
  pubkey: string;
  content: string;
}

interface InnerEvent {
  id?: unknown;
  pubkey?: unknown;
  created_at?: unknown;
  kind?: unknown;
  content?: unknown;
}

function parseEvent(json: string): InnerEvent | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as InnerEvent;
  } catch {
    return null;
  }
}

/**
 * Unwrap a kind-1059 gift wrap addressed to us.
 *
 * Returns null whenever the event is not ours to read or does not carry a
 * well-formed seal/rumor pair — a relay delivers gift wraps addressed to
 * many recipients, so failure here is routine, not exceptional.
 */
export function unwrapGiftWrap(
  event: GiftWrapEventLike,
  recipientPrivkey: string
): UnwrappedGiftWrap | null {
  if (!event?.content || !event.pubkey || !recipientPrivkey) return null;

  // Layer 1: wrap → seal, keyed by the ephemeral pubkey on the wrap itself.
  let sealJson: string;
  try {
    sealJson = nip44Decrypt(event.content, recipientPrivkey, event.pubkey);
  } catch {
    return null; // Not addressed to us.
  }

  const seal = parseEvent(sealJson);
  if (!seal) return null;
  if (seal.kind !== SEAL_KIND) return null;

  const senderPubkey = seal.pubkey;
  if (typeof senderPubkey !== 'string' || senderPubkey.length === 0) return null;
  if (typeof seal.content !== 'string' || seal.content.length === 0) return null;

  // Layer 2: seal → rumor, keyed by the real sender from the seal.
  let rumorJson: string;
  try {
    rumorJson = nip44Decrypt(seal.content, recipientPrivkey, senderPubkey);
  } catch {
    return null;
  }

  const rumor = parseEvent(rumorJson);
  if (!rumor) return null;

  // The rumor is unsigned. Only the seal is signed by the sender, so a rumor
  // claiming a different author than the seal that delivered it is a forgery
  // attempt and is dropped rather than attributed to either party.
  if (typeof rumor.pubkey !== 'string' || rumor.pubkey !== senderPubkey) {
    return null;
  }
  if (typeof rumor.content !== 'string') return null;
  if (typeof rumor.kind !== 'number') return null;

  return {
    senderPubkey,
    kind: rumor.kind,
    content: rumor.content,
    createdAt:
      typeof rumor.created_at === 'number'
        ? rumor.created_at
        : Math.floor(Date.now() / 1000),
    rumorId: typeof rumor.id === 'string' ? rumor.id : '',
  };
}
