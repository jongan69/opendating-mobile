// Maps wire errors → domain errors → user-facing copy
// Never show raw Nostr/relay error codes to normal users.

type ErrorDomain = 'auth' | 'profile' | 'discovery' | 'matching' | 'messaging' | 'safety' | 'general';

export interface DomainError {
  code: string;
  domain: ErrorDomain;
  userMessage: string;
  technicalMessage: string;
  retryable: boolean;
}

const relayPrefixErrors: Record<string, DomainError> = {
  'auth-required:': {
    code: 'AUTH_REQUIRED',
    domain: 'auth',
    userMessage: 'Please sign in again to continue.',
    technicalMessage: 'NIP-42 authentication required',
    retryable: true,
  },
  'restricted: od:not-matched': {
    code: 'NOT_MATCHED',
    domain: 'messaging',
    userMessage: 'This conversation is no longer available.',
    technicalMessage: 'Sender is not matched with recipient',
    retryable: false,
  },
  'restricted: od:blocked': {
    code: 'BLOCKED',
    domain: 'messaging',
    userMessage: 'This conversation is no longer available.',
    technicalMessage: 'Sender is blocked by recipient',
    retryable: false,
  },
  'restricted: od:membership-required': {
    code: 'MEMBERSHIP_REQUIRED',
    domain: 'general',
    userMessage: 'A profile is required to use this feature.',
    technicalMessage: 'Membership/profile required',
    retryable: true,
  },
  'restricted: od:verification-required': {
    code: 'VERIFICATION_REQUIRED',
    domain: 'general',
    userMessage: 'Verification is required for this action.',
    technicalMessage: 'Verification required by relay policy',
    retryable: true,
  },
  'invalid: od:profile-schema': {
    code: 'PROFILE_SCHEMA',
    domain: 'profile',
    userMessage: 'Unable to save your profile. Please check your information and try again.',
    technicalMessage: 'Profile schema validation failed',
    retryable: true,
  },
  'invalid: od:expired-request': {
    code: 'EXPIRED_REQUEST',
    domain: 'general',
    userMessage: 'This request has expired. Please try again.',
    technicalMessage: 'Request timestamp too old',
    retryable: true,
  },
  'invalid: od:unsupported-version': {
    code: 'UNSUPPORTED_VERSION',
    domain: 'general',
    userMessage: 'This version of OpenDating needs an update. Please update the app.',
    technicalMessage: 'Protocol version not supported by relay',
    retryable: false,
  },
  'rate-limited: od:discovery': {
    code: 'DISCOVERY_RATE_LIMITED',
    domain: 'discovery',
    userMessage: "You're caught up for today. Check back later!",
    technicalMessage: 'Discovery rate limit reached',
    retryable: true,
  },
  'rate-limited: od:likes': {
    code: 'LIKES_RATE_LIMITED',
    domain: 'matching',
    userMessage: "You've reached your daily like limit. Come back tomorrow!",
    technicalMessage: 'Like rate limit reached',
    retryable: true,
  },
  'rate-limited:': {
    code: 'RATE_LIMITED',
    domain: 'general',
    userMessage: 'You are doing that too often. Please wait a moment.',
    technicalMessage: 'Generic rate limit',
    retryable: true,
  },
  'invalid:': {
    code: 'INVALID',
    domain: 'general',
    userMessage: 'Something went wrong. Please try again.',
    technicalMessage: 'Generic invalid request',
    retryable: true,
  },
  'blocked:': {
    code: 'BLOCKED',
    domain: 'safety',
    userMessage: 'This action is not available.',
    technicalMessage: 'Operation blocked by relay policy',
    retryable: false,
  },
};

const serviceErrorMap: Record<string, DomainError> = {
  profile_not_found: {
    code: 'PROFILE_NOT_FOUND',
    domain: 'profile',
    userMessage: 'Please create your profile first.',
    technicalMessage: 'Profile not found on server',
    retryable: true,
  },
  profile_already_exists: {
    code: 'PROFILE_EXISTS',
    domain: 'profile',
    userMessage: 'You already have a profile.',
    technicalMessage: 'Profile already exists',
    retryable: false,
  },
  invalid_candidate_grant: {
    code: 'INVALID_GRANT',
    domain: 'discovery',
    userMessage: 'This profile is no longer available.',
    technicalMessage: 'Candidate grant invalid or expired',
    retryable: false,
  },
  match_not_found: {
    code: 'MATCH_NOT_FOUND',
    domain: 'matching',
    userMessage: 'This match is no longer available.',
    technicalMessage: 'Match not found',
    retryable: false,
  },
  already_matched: {
    code: 'ALREADY_MATCHED',
    domain: 'matching',
    userMessage: "You've already matched with this person!",
    technicalMessage: 'Match already exists',
    retryable: false,
  },
  discovery_quota_exhausted: {
    code: 'QUOTA_EXHAUSTED',
    domain: 'discovery',
    userMessage: "You're all caught up for today. Check back tomorrow.",
    technicalMessage: 'Daily discovery quota exhausted',
    retryable: true,
  },
  invalid_location: {
    code: 'INVALID_LOCATION',
    domain: 'discovery',
    userMessage: 'Unable to determine your area. Please check your location settings.',
    technicalMessage: 'Location data invalid',
    retryable: true,
  },
  blocked: {
    code: 'IS_BLOCKED',
    domain: 'safety',
    userMessage: 'This action is not available.',
    technicalMessage: 'Action blocked by block state',
    retryable: false,
  },
};

export function mapRelayError(notice: string): DomainError | null {
  // Check for relay-prefixed errors
  for (const [prefix, error] of Object.entries(relayPrefixErrors)) {
    if (notice.startsWith(prefix) || notice.includes(prefix)) {
      return error;
    }
  }
  return null;
}

export function mapServiceError(code: string): DomainError {
  return (
    serviceErrorMap[code] ?? {
      code: 'UNKNOWN',
      domain: 'general',
      userMessage: 'Something went wrong. Please try again later.',
      technicalMessage: `Unknown service error: ${code}`,
      retryable: true,
    }
  );
}

export function getUserMessage(notice: string): string {
  const mapped = mapRelayError(notice);
  if (mapped) return mapped.userMessage;

  // Generic fallbacks
  if (notice.includes('auth-required')) {
    return 'Please sign in again to continue.';
  }
  if (notice.includes('restricted')) {
    return 'This action is not available right now.';
  }
  if (notice.includes('rate-limited')) {
    return 'Please wait a moment before trying again.';
  }

  return 'Something went wrong. Please try again.';
}

export { relayPrefixErrors, serviceErrorMap };
export type { ErrorDomain };
