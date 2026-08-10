// Terms of Service + Community Standards versioning.
//
// The version lives here rather than in the onboarding context so that any
// screen can check acceptance without pulling in onboarding state. Bump
// CURRENT_POLICY_VERSION and POLICY_EFFECTIVE_LABEL together whenever the
// policy text in src/app/settings/terms.tsx changes materially.

export const CURRENT_POLICY_VERSION = '2026-08-09';
export const POLICY_EFFECTIVE_LABEL = 'August 9, 2026';

/** What the member accepted, as captured in the onboarding draft. */
export interface PolicyAcceptance {
  version: string;
  acceptedAt: string;
}

/**
 * The durable acceptance record. Unlike the draft copy, this survives the
 * onboarding-draft cleanup and is bound to the account that accepted.
 */
export interface StoredPolicyAcceptance extends PolicyAcceptance {
  pubkey: string;
}

/**
 * The instant the shipped policy took effect. A record cannot have accepted
 * this version before it existed, so this is the floor for its timestamp.
 */
const POLICY_EFFECTIVE_AT = Date.parse(`${CURRENT_POLICY_VERSION}T00:00:00Z`);

/**
 * The single definition of "this member accepted the shipped terms". A type
 * guard so callers that go on to persist the record cannot forget the check.
 *
 * Checks the whole record, not just the version: a record naming the current
 * version but carrying a missing, malformed, or pre-effective-date timestamp
 * is not evidence of consent to the shipped terms.
 */
export function isCurrentPolicy(
  acceptance: PolicyAcceptance | null | undefined
): acceptance is PolicyAcceptance {
  if (acceptance?.version !== CURRENT_POLICY_VERSION) return false;
  if (typeof acceptance.acceptedAt !== 'string') return false;
  if (!isCanonicalUtcTimestamp(acceptance.acceptedAt)) return false;
  return isValidPolicyTimestamp(acceptance.acceptedAt, POLICY_EFFECTIVE_AT);
}

/**
 * True only for the exact form `new Date().toISOString()` produces, which is
 * what every consent writer in the app records.
 *
 * Consent must name a complete instant. A date-only string like "2026-08-09"
 * parses to UTC midnight — precisely the effective-date floor — so without
 * this check a bare date would satisfy the current-policy gate while claiming
 * a precision no writer in this app produces.
 */
function isCanonicalUtcTimestamp(iso: string): boolean {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString() === iso;
}

/**
 * Returns true when `iso` is a real calendar timestamp (parsed
 * successfully by the runtime) within a reasonable past window. Used at
 * read time so a malformed string like `"0"` never displays as valid.
 *
 * `minEpochMs` raises the floor for callers that know when the accepted
 * version took effect; the default only rejects pre-epoch values.
 */
export function isValidPolicyTimestamp(iso: string, minEpochMs = 0): boolean {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return false;
  // Must be in the past and not before the Unix epoch; any policy
  // version older than 1970 is clearly a bug or a forged record.
  const now = Date.now();
  return (
    parsed.getTime() > 0 &&
    parsed.getTime() >= minEpochMs &&
    parsed.getTime() <= now
  );
}

/** Renders an acceptance timestamp for display, or null if it is unusable. */
export function formatAcceptedAt(iso: string): string | null {
  if (!isValidPolicyTimestamp(iso)) return null;
  const parsed = new Date(iso);
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
