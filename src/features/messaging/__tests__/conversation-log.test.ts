import {
  getConversationEntry,
  getTotalUnread,
  markConversationRead,
  recordConversationEntry,
  resetConversationLog,
} from '../conversation-log';
import type { ODMessage } from '@/types/opendating';

const ALICE = 'alice'.repeat(12);
const BOB = 'bob'.repeat(20);

function msg(over: Partial<ODMessage> = {}): ODMessage {
  return {
    id: `id-${Math.random()}`,
    sender_pubkey: ALICE,
    recipient_pubkey: 'me',
    conversation_pubkey: ALICE,
    text: 'hello',
    created_at: 1_700_000_000,
    outgoing: false,
    ...over,
  };
}

beforeEach(() => resetConversationLog());

describe('recordConversationEntry', () => {
  it('records a preview and raises unread for an incoming message', () => {
    recordConversationEntry(ALICE, msg({ text: 'hi there' }));

    const entry = getConversationEntry(ALICE);
    expect(entry?.lastText).toBe('hi there');
    expect(entry?.unread).toBe(1);
    expect(entry?.lastOutgoing).toBe(false);
  });

  it('does not raise unread for our own messages', () => {
    recordConversationEntry(ALICE, msg({ text: 'my reply', outgoing: true }));

    const entry = getConversationEntry(ALICE);
    expect(entry?.unread).toBe(0);
    expect(entry?.lastOutgoing).toBe(true);
  });

  it('does not raise unread for an optimistic pending message', () => {
    recordConversationEntry(
      ALICE,
      msg({ text: 'sending', outgoing: true, pending: true })
    );
    expect(getConversationEntry(ALICE)?.unread).toBe(0);
  });

  // Relays deliver out of order; an older message must not rewind the preview.
  it('keeps the newest message as the preview', () => {
    recordConversationEntry(ALICE, msg({ text: 'newer', created_at: 2000 }));
    recordConversationEntry(ALICE, msg({ text: 'older', created_at: 1000 }));

    expect(getConversationEntry(ALICE)?.lastText).toBe('newer');
    expect(getConversationEntry(ALICE)?.lastAt).toBe(2000);
  });

  it('still counts an out-of-order message as unread', () => {
    recordConversationEntry(ALICE, msg({ text: 'newer', created_at: 2000 }));
    recordConversationEntry(ALICE, msg({ text: 'older', created_at: 1000 }));

    expect(getConversationEntry(ALICE)?.unread).toBe(2);
  });

  it('ignores an empty peer key rather than creating a phantom thread', () => {
    recordConversationEntry('', msg());
    expect(getTotalUnread()).toBe(0);
  });
});

describe('markConversationRead', () => {
  it('clears unread for one peer only', () => {
    recordConversationEntry(ALICE, msg({ conversation_pubkey: ALICE }));
    recordConversationEntry(BOB, msg({ conversation_pubkey: BOB }));
    expect(getTotalUnread()).toBe(2);

    markConversationRead(ALICE);

    expect(getConversationEntry(ALICE)?.unread).toBe(0);
    expect(getConversationEntry(BOB)?.unread).toBe(1);
    expect(getTotalUnread()).toBe(1);
  });

  it('leaves the preview intact when clearing unread', () => {
    recordConversationEntry(ALICE, msg({ text: 'keep me' }));
    markConversationRead(ALICE);
    expect(getConversationEntry(ALICE)?.lastText).toBe('keep me');
  });

  it('is a no-op for an unknown or already-read peer', () => {
    expect(() => markConversationRead('nobody')).not.toThrow();
    recordConversationEntry(ALICE, msg());
    markConversationRead(ALICE);
    markConversationRead(ALICE);
    expect(getConversationEntry(ALICE)?.unread).toBe(0);
  });
});

describe('getTotalUnread', () => {
  it('sums across conversations', () => {
    recordConversationEntry(ALICE, msg({ created_at: 1 }));
    recordConversationEntry(ALICE, msg({ created_at: 2 }));
    recordConversationEntry(BOB, msg({ created_at: 3 }));
    expect(getTotalUnread()).toBe(3);
  });

  it('is zero on a fresh log', () => {
    expect(getTotalUnread()).toBe(0);
  });
});
