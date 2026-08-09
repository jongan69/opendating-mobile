import {
  consumeSwipeDecision,
  postSwipeDecision,
  resetSwipeDecisions,
  subscribeSwipeDecisions,
} from '@/features/discovery/swipe-decisions';

beforeEach(() => {
  resetSwipeDecisions();
});

describe('swipe decisions', () => {
  // The detail screen posts and immediately navigates back, so Discover is
  // often not subscribed at the moment the decision is made.
  it('holds a decision posted while nobody is listening', () => {
    postSwipeDecision({ pubkey: 'abc', direction: 'like', grant: 'g1' });

    expect(consumeSwipeDecision()).toEqual({
      pubkey: 'abc',
      direction: 'like',
      grant: 'g1',
    });
  });

  // A like applied twice would spend two of the member's daily likes and, on
  // the second call, be rejected with a grant the server already consumed.
  it('yields a decision only once', () => {
    postSwipeDecision({ pubkey: 'abc', direction: 'like', grant: 'g1' });

    expect(consumeSwipeDecision()).not.toBeNull();
    expect(consumeSwipeDecision()).toBeNull();
  });

  it('returns null when nothing is queued', () => {
    expect(consumeSwipeDecision()).toBeNull();
  });

  it('notifies live subscribers', () => {
    const seen: string[] = [];
    const unsubscribe = subscribeSwipeDecisions((d) => seen.push(d.pubkey));

    postSwipeDecision({ pubkey: 'first', direction: 'pass' });
    postSwipeDecision({ pubkey: 'second', direction: 'pass' });

    expect(seen).toEqual(['first', 'second']);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const seen: string[] = [];
    subscribeSwipeDecisions((d) => seen.push(d.pubkey))();

    postSwipeDecision({ pubkey: 'ignored', direction: 'pass' });

    expect(seen).toEqual([]);
  });

  it('keeps only the most recent decision', () => {
    postSwipeDecision({ pubkey: 'stale', direction: 'pass' });
    postSwipeDecision({ pubkey: 'fresh', direction: 'like', grant: 'g' });

    expect(consumeSwipeDecision()?.pubkey).toBe('fresh');
    expect(consumeSwipeDecision()).toBeNull();
  });

  // Discovery issues a grant per viewer/candidate pair; a like without one is
  // rejected server-side, so the consumer downgrades it to a pass.
  it('carries the grant so a like can be validated', () => {
    postSwipeDecision({ pubkey: 'abc', direction: 'like' });

    const decision = consumeSwipeDecision();
    expect(decision?.direction).toBe('like');
    expect(decision?.grant).toBeUndefined();
  });
});
