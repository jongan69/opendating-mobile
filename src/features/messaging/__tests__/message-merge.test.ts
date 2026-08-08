import { ECHO_WINDOW_SEC, mergeMessage, sortByCreatedAtAsc } from '../message-merge';
import type { ODMessage } from '@/types/opendating';

const PEER = 'peer'.repeat(16);
const ME = 'me'.repeat(32);

function msg(over: Partial<ODMessage> = {}): ODMessage {
  return {
    id: 'id-1',
    sender_pubkey: PEER,
    recipient_pubkey: ME,
    conversation_pubkey: PEER,
    text: 'hello',
    created_at: 1_700_000_000,
    outgoing: false,
    ...over,
  };
}

describe('mergeMessage', () => {
  it('appends a new message in timestamp order', () => {
    const a = msg({ id: 'a', created_at: 200 });
    const b = msg({ id: 'b', created_at: 100 });

    const list = mergeMessage(mergeMessage([], a), b);
    expect(list.map((m) => m.id)).toEqual(['b', 'a']);
  });

  it('ignores a re-delivered confirmed message', () => {
    const a = msg({ id: 'a' });
    const once = mergeMessage([], a);
    const twice = mergeMessage(once, a);

    expect(twice).toBe(once); // same reference — no re-render
    expect(twice).toHaveLength(1);
  });

  // Our own sent messages return as self-addressed copies with a different
  // id than the local placeholder, so they must be matched by content.
  it('replaces a pending message with its confirmed twin', () => {
    const pending = msg({
      id: 'pending-123',
      text: 'on my way',
      outgoing: true,
      pending: true,
      sender_pubkey: ME,
      created_at: 1000,
    });
    const confirmed = msg({
      id: 'rumor-abc',
      text: 'on my way',
      outgoing: true,
      sender_pubkey: ME,
      created_at: 1002,
    });

    const list = mergeMessage([pending], confirmed);

    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('rumor-abc');
    expect(list[0].pending).toBeUndefined();
  });

  it('does not merge an unrelated outgoing message with the same text', () => {
    const pending = msg({
      id: 'pending-1',
      text: 'hey',
      outgoing: true,
      pending: true,
      created_at: 1000,
    });
    // The same text sent again much later is a second message, not an echo.
    const later = msg({
      id: 'rumor-2',
      text: 'hey',
      outgoing: true,
      created_at: 1000 + ECHO_WINDOW_SEC + 1,
    });

    expect(mergeMessage([pending], later)).toHaveLength(2);
  });

  it('never merges an incoming message into a pending outgoing one', () => {
    const pending = msg({
      id: 'pending-1',
      text: 'same words',
      outgoing: true,
      pending: true,
      created_at: 1000,
    });
    const received = msg({
      id: 'rumor-x',
      text: 'same words',
      outgoing: false,
      created_at: 1001,
    });

    const list = mergeMessage([pending], received);
    expect(list).toHaveLength(2);
    expect(list.some((m) => m.pending)).toBe(true);
  });

  it('keeps only one entry when the same send is confirmed twice', () => {
    const pending = msg({
      id: 'pending-1',
      text: 'yo',
      outgoing: true,
      pending: true,
      created_at: 1000,
    });
    const confirmed = msg({ id: 'rumor-1', text: 'yo', outgoing: true, created_at: 1001 });

    const once = mergeMessage([pending], confirmed);
    const twice = mergeMessage(once, confirmed);

    expect(twice).toHaveLength(1);
  });
});

describe('sortByCreatedAtAsc', () => {
  it('does not mutate its input', () => {
    const input = [msg({ id: 'b', created_at: 2 }), msg({ id: 'a', created_at: 1 })];
    const sorted = sortByCreatedAtAsc(input);

    expect(sorted.map((m) => m.id)).toEqual(['a', 'b']);
    expect(input.map((m) => m.id)).toEqual(['b', 'a']);
  });
});
