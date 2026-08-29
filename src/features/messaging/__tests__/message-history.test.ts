import { rememberMessage } from '@/features/messaging/message-history';
import type { ODMessage } from '@/types/opendating';

function message(id: string): ODMessage {
  return {
    id,
    sender_pubkey: 'a'.repeat(64),
    recipient_pubkey: 'b'.repeat(64),
    conversation_pubkey: 'a'.repeat(64),
    text: id,
    created_at: 1,
    outgoing: false,
  };
}

it('keeps the newest bounded in-memory message history', () => {
  const history = [message('first')];
  rememberMessage(history, message('second'), 2);
  rememberMessage(history, message('third'), 2);
  expect(history.map(({ id }) => id)).toEqual(['second', 'third']);
});
