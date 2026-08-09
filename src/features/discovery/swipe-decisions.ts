// A one-slot channel for a like/pass made outside the deck.
//
// The candidate detail screen needs to like or pass, but discovery state lives
// in a `useDiscovery()` instance owned by the Discover screen. Calling that
// hook a second time from the detail screen does not share state — it mounts a
// whole separate stack and, through its mount effect, fires another
// `getCandidates()` and another GPS read every time a profile is opened.
//
// So the detail screen posts its decision here and navigates back; Discover
// consumes it and applies it to the stack it already owns. Same shape as
// candidate-cache: a module singleton with subscribers, no provider to thread
// through the tree.

export type SwipeDirection = 'like' | 'pass';

export interface SwipeDecision {
  pubkey: string;
  direction: SwipeDirection;
  /** Grant from the candidate that was on screen; a like without it is invalid. */
  grant?: string;
}

let pending: SwipeDecision | null = null;
const listeners = new Set<(decision: SwipeDecision) => void>();

/** Record a decision made away from the deck. */
export function postSwipeDecision(decision: SwipeDecision): void {
  // Held even when nobody is listening: the detail screen posts and then
  // navigates, so Discover may not have re-subscribed yet when this runs.
  pending = decision;
  for (const fn of listeners) fn(decision);
}

/**
 * Take the pending decision, if any. Reading clears it, so a decision is
 * applied exactly once and cannot be replayed by a later remount.
 */
export function consumeSwipeDecision(): SwipeDecision | null {
  const decision = pending;
  pending = null;
  return decision;
}

export function subscribeSwipeDecisions(
  listener: (decision: SwipeDecision) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test seam — drops any queued decision and every subscriber. */
export function resetSwipeDecisions(): void {
  pending = null;
  listeners.clear();
}
