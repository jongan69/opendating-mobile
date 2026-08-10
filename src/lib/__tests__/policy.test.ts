import {
  CURRENT_POLICY_VERSION,
  formatAcceptedAt,
  isCurrentPolicy,
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
