import {
  consumeIntroductionDecision,
  postIntroductionDecision,
  resetIntroductionDecisions,
  subscribeIntroductionDecisions,
} from '@/features/discovery/introduction-decisions';

beforeEach(() => {
  resetIntroductionDecisions();
});

describe('introduction decisions', () => {
  // The detail screen posts and immediately navigates back, so Introductions is
  // often not subscribed at the moment the decision is made.
  it('holds a decision posted while nobody is listening', () => {
    postIntroductionDecision({ pubkey: 'abc', choice: 'interest', grant: 'g1' });

    expect(consumeIntroductionDecision()).toEqual({
      pubkey: 'abc',
      choice: 'interest',
      grant: 'g1',
    });
  });

  // Interest applied twice would spend two of the member's daily choices and, on
  // the second call, be rejected with a grant the server already consumed.
  it('yields a decision only once', () => {
    postIntroductionDecision({ pubkey: 'abc', choice: 'interest', grant: 'g1' });

    expect(consumeIntroductionDecision()).not.toBeNull();
    expect(consumeIntroductionDecision()).toBeNull();
  });

  it('returns null when nothing is queued', () => {
    expect(consumeIntroductionDecision()).toBeNull();
  });

  it('notifies live subscribers', () => {
    const seen: string[] = [];
    const unsubscribe = subscribeIntroductionDecisions((d) => seen.push(d.pubkey));

    postIntroductionDecision({ pubkey: 'first', choice: 'skip' });
    postIntroductionDecision({ pubkey: 'second', choice: 'skip' });

    expect(seen).toEqual(['first', 'second']);
    unsubscribe();
  });

  // Introductions consumes from inside its subscriber, so the decision must be
  // available before listeners run.
  it('queues the decision before it notifies subscribers', () => {
    let queuedDuringNotify: string | null = null;
    const unsubscribe = subscribeIntroductionDecisions(() => {
      queuedDuringNotify = consumeIntroductionDecision()?.pubkey ?? null;
    });

    postIntroductionDecision({ pubkey: 'abc', choice: 'skip' });

    expect(queuedDuringNotify).toBe('abc');
    expect(consumeIntroductionDecision()).toBeNull();
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const seen: string[] = [];
    subscribeIntroductionDecisions((d) => seen.push(d.pubkey))();

    postIntroductionDecision({ pubkey: 'ignored', choice: 'skip' });

    expect(seen).toEqual([]);
  });

  it('keeps only the most recent decision', () => {
    postIntroductionDecision({ pubkey: 'stale', choice: 'skip' });
    postIntroductionDecision({ pubkey: 'fresh', choice: 'interest', grant: 'g' });

    expect(consumeIntroductionDecision()?.pubkey).toBe('fresh');
    expect(consumeIntroductionDecision()).toBeNull();
  });

  // Introductions issues a grant per viewer/candidate pair; interest without
  // one is rejected server-side, so the consumer downgrades it to a skip.
  it('preserves interest posted without a grant', () => {
    postIntroductionDecision({ pubkey: 'abc', choice: 'interest' });

    const decision = consumeIntroductionDecision();
    expect(decision?.choice).toBe('interest');
    expect(decision?.grant).toBeUndefined();
  });
});
