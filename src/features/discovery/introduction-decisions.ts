// A one-slot channel for an interest/skip choice made on candidate detail.
//
// The candidate detail screen needs to express interest or skip, but discovery
// state lives in a `useDiscovery()` instance owned by Introductions. Calling that
// hook a second time from the detail screen does not share state — it mounts a
// whole separate stack and, through its mount effect, fires another
// `getCandidates()` and another GPS read every time a profile is opened.
//
// So the detail screen posts its choice here and navigates back; Introductions
// consumes it and applies it to the candidate grant it already owns. Same shape as
// candidate-cache: a module singleton with subscribers, no provider to thread
// through the tree.

export type IntroductionChoice = 'interest' | 'skip';

export interface IntroductionDecision {
  pubkey: string;
  choice: IntroductionChoice;
  /** Grant from the candidate that was on screen; interest without it is invalid. */
  grant?: string;
}

let pending: IntroductionDecision | null = null;
const listeners = new Set<(decision: IntroductionDecision) => void>();

/** Record a decision made on the full-profile screen. */
export function postIntroductionDecision(decision: IntroductionDecision): void {
  // Held even when nobody is listening: the detail screen posts and then
  // navigates, so Introductions may not have re-subscribed yet when this runs.
  pending = decision;
  for (const fn of listeners) fn(decision);
}

/**
 * Take the pending decision, if any. Reading clears it, so a decision is
 * applied exactly once and cannot be replayed by a later remount.
 */
export function consumeIntroductionDecision(): IntroductionDecision | null {
  const decision = pending;
  pending = null;
  return decision;
}

export function subscribeIntroductionDecisions(
  listener: (decision: IntroductionDecision) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test seam — drops any queued decision and every subscriber. */
export function resetIntroductionDecisions(): void {
  pending = null;
  listeners.clear();
}
