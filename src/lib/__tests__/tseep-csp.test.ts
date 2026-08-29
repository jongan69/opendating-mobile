import { EventEmitter } from 'tseep';

describe('CSP-safe Nostr events', () => {
  it('supports multiple listeners when eval is blocked', () => {
    const originalEval = globalThis.eval;
    globalThis.eval = (() => {
      throw new EvalError('blocked by Content Security Policy');
    }) as typeof eval;

    try {
      const emitter = new EventEmitter<{ connect: (url: string) => void }>();
      const calls: string[] = [];

      emitter.on('connect', (url) => calls.push(`first:${url}`));
      emitter.on('connect', (url) => calls.push(`second:${url}`));
      emitter.emit('connect', 'wss://relay.example');

      expect(calls).toEqual([
        'first:wss://relay.example',
        'second:wss://relay.example',
      ]);
    } finally {
      globalThis.eval = originalEval;
    }
  });
});
