import { mapRelayError, mapServiceError, getUserMessage } from '../errors';

describe('error mapping', () => {
  describe('mapRelayError', () => {
    it('maps not-matched error', () => {
      const result = mapRelayError('restricted: od:not-matched');
      expect(result).toBeDefined();
      expect(result!.code).toBe('NOT_MATCHED');
      expect(result!.domain).toBe('messaging');
      expect(result!.userMessage).toBe('This conversation is no longer available.');
    });

    it('maps blocked error', () => {
      const result = mapRelayError('restricted: od:blocked');
      expect(result).toBeDefined();
      expect(result!.code).toBe('BLOCKED');
      expect(result!.domain).toBe('messaging');
    });

    it('maps unsupported version error', () => {
      const result = mapRelayError('invalid: od:unsupported-version');
      expect(result).toBeDefined();
      expect(result!.code).toBe('UNSUPPORTED_VERSION');
      expect(result!.retryable).toBe(false);
    });

    it('maps discovery rate limit', () => {
      const result = mapRelayError('rate-limited: od:discovery');
      expect(result).toBeDefined();
      expect(result!.code).toBe('DISCOVERY_RATE_LIMITED');
      expect(result!.domain).toBe('discovery');
    });

    it('maps like rate limit', () => {
      const result = mapRelayError('rate-limited: od:likes');
      expect(result).toBeDefined();
      expect(result!.code).toBe('LIKES_RATE_LIMITED');
      expect(result!.domain).toBe('matching');
    });

    it('maps auth required error', () => {
      const result = mapRelayError('auth-required: please authenticate');
      expect(result).toBeDefined();
      expect(result!.code).toBe('AUTH_REQUIRED');
      expect(result!.retryable).toBe(true);
    });

    it('maps membership required error', () => {
      const result = mapRelayError('restricted: od:membership-required');
      expect(result).toBeDefined();
      expect(result!.code).toBe('MEMBERSHIP_REQUIRED');
    });

    it('maps verification required error', () => {
      const result = mapRelayError('restricted: od:verification-required');
      expect(result).toBeDefined();
      expect(result!.code).toBe('VERIFICATION_REQUIRED');
    });

    it('maps profile schema error', () => {
      const result = mapRelayError('invalid: od:profile-schema');
      expect(result).toBeDefined();
      expect(result!.code).toBe('PROFILE_SCHEMA');
      expect(result!.domain).toBe('profile');
    });

    it('maps expired request error', () => {
      const result = mapRelayError('invalid: od:expired-request');
      expect(result).toBeDefined();
      expect(result!.code).toBe('EXPIRED_REQUEST');
      expect(result!.retryable).toBe(true);
    });

    it('maps generic rate limit', () => {
      const result = mapRelayError('rate-limited: too many requests');
      expect(result).toBeDefined();
      expect(result!.code).toBe('RATE_LIMITED');
    });

    it('maps generic invalid', () => {
      const result = mapRelayError('invalid: bad request format');
      expect(result).toBeDefined();
      expect(result!.code).toBe('INVALID');
    });

    it('maps generic blocked', () => {
      const result = mapRelayError('blocked: policy violation');
      expect(result).toBeDefined();
      expect(result!.code).toBe('BLOCKED');
    });

    it('returns null for unknown notice', () => {
      const result = mapRelayError('some random notice');
      expect(result).toBeNull();
    });
  });

  describe('mapServiceError', () => {
    it('maps profile_not_found', () => {
      const result = mapServiceError('profile_not_found');
      expect(result.code).toBe('PROFILE_NOT_FOUND');
      expect(result.domain).toBe('profile');
    });

    it('maps profile_already_exists', () => {
      const result = mapServiceError('profile_already_exists');
      expect(result.code).toBe('PROFILE_EXISTS');
      expect(result.retryable).toBe(false);
    });

    it('maps invalid_candidate_grant', () => {
      const result = mapServiceError('invalid_candidate_grant');
      expect(result.code).toBe('INVALID_GRANT');
      expect(result.domain).toBe('discovery');
      expect(result.retryable).toBe(false);
    });

    it('maps match_not_found', () => {
      const result = mapServiceError('match_not_found');
      expect(result.code).toBe('MATCH_NOT_FOUND');
    });

    it('maps already_matched', () => {
      const result = mapServiceError('already_matched');
      expect(result.code).toBe('ALREADY_MATCHED');
    });

    it('maps discovery_quota_exhausted', () => {
      const result = mapServiceError('discovery_quota_exhausted');
      expect(result.code).toBe('QUOTA_EXHAUSTED');
      expect(result.retryable).toBe(true);
    });

    it('maps invalid_location', () => {
      const result = mapServiceError('invalid_location');
      expect(result.code).toBe('INVALID_LOCATION');
      expect(result.domain).toBe('discovery');
    });

    it('maps blocked error', () => {
      const result = mapServiceError('blocked');
      expect(result.code).toBe('IS_BLOCKED');
      expect(result.domain).toBe('safety');
    });

    it('returns unknown for unmapped code', () => {
      const result = mapServiceError('some_unknown_code');
      expect(result.code).toBe('UNKNOWN');
      expect(result.userMessage).toBe('Something went wrong. Please try again later.');
    });
  });

  describe('getUserMessage', () => {
    it('returns user-friendly messages for known errors', () => {
      expect(getUserMessage('restricted: od:not-matched')).toBe(
        'This conversation is no longer available.'
      );
    });

    it('returns generic message for unknown errors', () => {
      expect(getUserMessage('something weird happened')).toBe(
        'Something went wrong. Please try again.'
      );
    });

    it('handles auth-required in message', () => {
      expect(getUserMessage('auth-required: re-auth needed')).toBe(
        'Please sign in again to continue.'
      );
    });

    it('handles restricted prefix', () => {
      expect(getUserMessage('restricted: some policy')).toBe(
        'This action is not available right now.'
      );
    });

    it('handles rate-limited prefix', () => {
      expect(getUserMessage('rate-limited: wait please')).toBe(
        'You are doing that too often. Please wait a moment.'
      );
    });
  });
});
