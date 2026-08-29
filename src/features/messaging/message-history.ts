import type { ODMessage } from '@/types/opendating';

export function rememberMessage(
  history: ODMessage[],
  message: ODMessage,
  limit = 500
): void {
  history.push(message);
  if (history.length > limit) history.splice(0, history.length - limit);
}
