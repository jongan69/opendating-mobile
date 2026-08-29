import { bech32, hex } from '@scure/base';

const HEX_PRIVATE_KEY = /^[0-9a-f]{64}$/;

/** Normalize a standard recovery key or 64-character hex key to lowercase hex. */
export function normalizeRecoveryKey(input: string): string {
  const trimmed = input.trim();
  const lowercase = trimmed.toLowerCase();

  if (HEX_PRIVATE_KEY.test(lowercase)) return lowercase;

  if (lowercase.startsWith('nsec1')) {
    try {
      const decoded = bech32.decode(lowercase as `${string}1${string}`);
      const bytes = bech32.fromWords(decoded.words);
      if (decoded.prefix !== 'nsec' || bytes.length !== 32) throw new Error('invalid');
      return hex.encode(bytes);
    } catch {
      throw new Error(
        "That key doesn't look valid — double-check it was copied completely."
      );
    }
  }

  throw new Error(
    'That does not look like a recovery key. Paste the whole thing, including the prefix.'
  );
}

/** Encode a private key in the interoperable recovery-key format. */
export function encodeRecoveryKey(privateKeyHex: string): string {
  const normalized = normalizeRecoveryKey(privateKeyHex);
  return bech32.encode('nsec', bech32.toWords(hex.decode(normalized)), 5_000);
}
