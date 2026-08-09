import {
  buildGiftWrap,
  generateKeypair,
  nip44Encrypt,
  signEvent,
} from 'opendating-protocol';
import { unwrapGiftWrap } from '../gift-wrap';

const alice = generateKeypair(); // sender / service
const bob = generateKeypair(); // recipient / us
const mallory = generateKeypair(); // unrelated third party

describe('unwrapGiftWrap', () => {
  it('round-trips an OpenDating command envelope', async () => {
    const envelope = JSON.stringify({
      protocol: 'opendating',
      version: '0.1',
      type: 'profile.get.result',
      request_id: 'req-1',
      payload: { status: 'active' },
    });

    const { giftWrap } = await buildGiftWrap(
      78,
      envelope,
      alice.privateKey,
      alice.publicKey,
      bob.publicKey
    );

    const unwrapped = unwrapGiftWrap(giftWrap, bob.privateKey);

    expect(unwrapped).not.toBeNull();
    expect(unwrapped!.kind).toBe(78);
    expect(unwrapped!.content).toBe(envelope);
    // Attribution must be the real sender, never the ephemeral wrap key.
    expect(unwrapped!.senderPubkey).toBe(alice.publicKey);
    expect(unwrapped!.senderPubkey).not.toBe(giftWrap.pubkey);
  });

  it('round-trips a NIP-17 direct message', async () => {
    const body = JSON.stringify({ text: 'hey there', created_at: 1700000000 });
    const { giftWrap } = await buildGiftWrap(
      14,
      body,
      alice.privateKey,
      alice.publicKey,
      bob.publicKey
    );

    const unwrapped = unwrapGiftWrap(giftWrap, bob.privateKey);
    expect(unwrapped!.kind).toBe(14);
    expect(JSON.parse(unwrapped!.content).text).toBe('hey there');
  });

  it('reports the rumor timestamp, not the backdated wrap timestamp', async () => {
    const now = Math.floor(Date.now() / 1000);
    const { giftWrap } = await buildGiftWrap(
      14,
      JSON.stringify({ text: 'hi' }),
      alice.privateKey,
      alice.publicKey,
      bob.publicKey
    );

    const unwrapped = unwrapGiftWrap(giftWrap, bob.privateKey);
    // NIP-59 randomises the wrap up to two days into the past; the rumor
    // keeps real time, and that is what the UI must order and display by.
    expect(Math.abs(unwrapped!.createdAt - now)).toBeLessThanOrEqual(5);
  });

  it('returns a stable rumor id across re-wrapping of the same message', async () => {
    // Same logical message wrapped twice yields two different outer events,
    // but one rumor id — which is what dedupes relay re-delivery.
    //
    // The clock is frozen because the rumor's id covers its created_at, which
    // buildGiftWrap stamps from the current second. Unfrozen, this passes only
    // when both wraps happen to land in the same second, and fails whenever
    // the run is slow enough to straddle a boundary — which is exactly when
    // CI is loaded.
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    try {
      const content = JSON.stringify({ text: 'same', created_at: 1700000000 });
      const first = await buildGiftWrap(14, content, alice.privateKey, alice.publicKey, bob.publicKey);
      const second = await buildGiftWrap(14, content, alice.privateKey, alice.publicKey, bob.publicKey);

      const a = unwrapGiftWrap(first.giftWrap, bob.privateKey);
      const b = unwrapGiftWrap(second.giftWrap, bob.privateKey);

      // Different ephemeral wrap keys, so the outer ids must differ.
      expect(first.giftWrap.id).not.toBe(second.giftWrap.id);
      expect(a!.rumorId).toBe(b!.rumorId);
      expect(a!.rumorId).toHaveLength(64);
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns null for a wrap addressed to someone else', async () => {
    const { giftWrap } = await buildGiftWrap(
      78,
      '{}',
      alice.privateKey,
      alice.publicKey,
      mallory.publicKey
    );

    expect(unwrapGiftWrap(giftWrap, bob.privateKey)).toBeNull();
  });

  it('rejects a rumor whose author disagrees with the signed seal', async () => {
    // Mallory seals a rumor that claims to be from Alice. Only the seal is
    // signed, so trusting the rumor's own pubkey would let anyone impersonate
    // any user in the chat list.
    const forgedRumor = {
      id: 'f'.repeat(64),
      pubkey: alice.publicKey, // lie
      created_at: 1700000000,
      kind: 14,
      tags: [],
      content: JSON.stringify({ text: 'send me money' }),
      sig: '',
    };

    const sealUnsigned = {
      pubkey: mallory.publicKey,
      created_at: 1700000000,
      kind: 13,
      tags: [] as string[][],
      content: nip44Encrypt(
        JSON.stringify(forgedRumor),
        mallory.privateKey,
        bob.publicKey
      ),
    };
    const sealSig = signEvent(sealUnsigned, mallory.privateKey);
    const seal = { ...sealUnsigned, ...sealSig };

    const ephemeral = generateKeypair();
    const wrap = {
      pubkey: ephemeral.publicKey,
      content: nip44Encrypt(
        JSON.stringify(seal),
        ephemeral.privateKey,
        bob.publicKey
      ),
    };

    expect(unwrapGiftWrap(wrap, bob.privateKey)).toBeNull();
  });

  it('rejects an inner event that is not a seal', async () => {
    const notASeal = {
      pubkey: alice.publicKey,
      created_at: 1700000000,
      kind: 1, // a plain note, not a kind-13 seal
      tags: [] as string[][],
      content: 'hello',
    };
    const ephemeral = generateKeypair();
    const wrap = {
      pubkey: ephemeral.publicKey,
      content: nip44Encrypt(
        JSON.stringify(notASeal),
        ephemeral.privateKey,
        bob.publicKey
      ),
    };

    expect(unwrapGiftWrap(wrap, bob.privateKey)).toBeNull();
  });

  it('returns null on malformed input instead of throwing', () => {
    const ephemeral = generateKeypair();
    expect(unwrapGiftWrap({ pubkey: '', content: '' }, bob.privateKey)).toBeNull();
    expect(
      unwrapGiftWrap({ pubkey: ephemeral.publicKey, content: 'not-base64' }, bob.privateKey)
    ).toBeNull();
    expect(
      unwrapGiftWrap(
        {
          pubkey: ephemeral.publicKey,
          content: nip44Encrypt('not json', ephemeral.privateKey, bob.publicKey),
        },
        bob.privateKey
      )
    ).toBeNull();
  });

  it('returns null when no private key is available', async () => {
    const { giftWrap } = await buildGiftWrap(
      78,
      '{}',
      alice.privateKey,
      alice.publicKey,
      bob.publicKey
    );
    expect(unwrapGiftWrap(giftWrap, '')).toBeNull();
  });
});
