import {
  CURRENT_POLICY_VERSION,
  formatAcceptedAt,
  isCurrentPolicy,
  isValidPolicyTimestamp,
} from '@/lib/policy';

describe('isCurrentPolicy', () => {
  it('accepts only the exact current version', () => {
    expect(
      isCurrentPolicy({
        version: CURRENT_POLICY_VERSION,
        acceptedAt: '2026-08-09T00:00:00.000Z',
      })
    ).toBe(true);
  });

  // Onboarding drafts persist across builds. A draft written before the
  // consent gate existed has no acceptance at all, and one written against an
  // older policy must not satisfy the gate — either would let a profile go
  // live without agreement to the shipped terms.
  it('rejects a missing, empty, or stale acceptance', () => {
    expect(isCurrentPolicy(null)).toBe(false);
    expect(isCurrentPolicy(undefined)).toBe(false);
    expect(
      isCurrentPolicy({ version: '', acceptedAt: '2026-08-09T00:00:00.000Z' })
    ).toBe(false);
    expect(
      isCurrentPolicy({
        version: '2020-01-01',
        acceptedAt: '2020-01-01T00:00:00.000Z',
      })
    ).toBe(false);
  });

  // The version string and the timestamp are separate fields in a record that
  // round-trips through device storage as JSON. A record naming the shipped
  // version but dated before that version existed cannot be evidence of
  // consent to it, so the version alone must not satisfy the gate.
  it('rejects a current-version record dated before the policy took effect', () => {
    expect(
      isCurrentPolicy({
        version: CURRENT_POLICY_VERSION,
        acceptedAt: '1999-01-01T00:00:00.000Z',
      })
    ).toBe(false);
  });

  it('rejects a current-version record with an unusable timestamp', () => {
    expect(
      isCurrentPolicy({ version: CURRENT_POLICY_VERSION, acceptedAt: '' })
    ).toBe(false);
    expect(
      isCurrentPolicy({ version: CURRENT_POLICY_VERSION, acceptedAt: '0' })
    ).toBe(false);
    expect(
      isCurrentPolicy({
        version: CURRENT_POLICY_VERSION,
      } as unknown as Parameters<typeof isCurrentPolicy>[0])
    ).toBe(false);
  });

  // "2026-08-09" parses to UTC midnight, which is exactly the effective-date
  // floor, so a bare date would otherwise clear the gate while recording
  // consent at a precision no writer in the app produces.
  it('rejects a date-only or non-canonical acceptance timestamp', () => {
    expect(
      isCurrentPolicy({
        version: CURRENT_POLICY_VERSION,
        acceptedAt: CURRENT_POLICY_VERSION,
      })
    ).toBe(false);
    expect(
      isCurrentPolicy({
        version: CURRENT_POLICY_VERSION,
        acceptedAt: '2026-08-09T12:00:00Z',
      })
    ).toBe(false);
    expect(
      isCurrentPolicy({
        version: CURRENT_POLICY_VERSION,
        acceptedAt: '1786000000000',
      })
    ).toBe(false);
  });

  // Every consent writer in the app records new Date().toISOString().
  it('accepts the canonical form the app actually writes', () => {
    expect(
      isCurrentPolicy({
        version: CURRENT_POLICY_VERSION,
        acceptedAt: new Date().toISOString(),
      })
    ).toBe(true);
  });

  // A device clock set forward would otherwise mint an acceptance that no
  // member ever made.
  it('rejects a future-dated acceptance', () => {
    expect(
      isCurrentPolicy({
        version: CURRENT_POLICY_VERSION,
        acceptedAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
    ).toBe(false);
  });
});

describe('isValidPolicyTimestamp', () => {
  it('accepts a real past timestamp and rejects pre-epoch values', () => {
    expect(isValidPolicyTimestamp('2026-08-09T12:00:00.000Z')).toBe(true);
    expect(isValidPolicyTimestamp('1969-01-01T00:00:00.000Z')).toBe(false);
    expect(isValidPolicyTimestamp('not-a-date')).toBe(false);
  });

  it('applies the caller-supplied floor', () => {
    const floor = Date.parse('2026-08-09T00:00:00Z');
    expect(isValidPolicyTimestamp('2026-08-09T00:00:00.000Z', floor)).toBe(
      true
    );
    expect(isValidPolicyTimestamp('2026-08-08T23:59:59.999Z', floor)).toBe(
      false
    );
  });
});

describe('formatAcceptedAt', () => {
  it('renders a valid timestamp', () => {
    expect(formatAcceptedAt('2026-08-09T12:00:00.000Z')).toEqual(
      expect.stringContaining('2026')
    );
  });

  // The record round-trips through SecureStore as JSON, so a truncated or
  // hand-edited value reaches this function. Returning null lets the caller
  // fall back to prose instead of rendering "Invalid Date" to the member.
  it('returns null for an unparseable timestamp', () => {
    expect(formatAcceptedAt('')).toBeNull();
    expect(formatAcceptedAt('not-a-date')).toBeNull();
  });
});
