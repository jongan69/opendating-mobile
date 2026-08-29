import { derivePublicKey, generateKeypair } from 'opendating-protocol';

import { encodeRecoveryKey, normalizeRecoveryKey } from '../recovery-key';

describe('recovery keys', () => {
  it('round-trips standard and hex keys without changing the identity', () => {
    const pair = generateKeypair();
    const encoded = encodeRecoveryKey(pair.privateKey);

    expect(encoded).toMatch(/^nsec1/);
    expect(normalizeRecoveryKey(encoded)).toBe(pair.privateKey);
    expect(derivePublicKey(normalizeRecoveryKey(encoded))).toBe(pair.publicKey);
    expect(() => normalizeRecoveryKey('nsec1broken')).toThrow(/valid/);
  });
});
