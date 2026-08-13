import { introductionReasons } from '@/features/discovery/private-introduction';
import type { Candidate, ProfileContent } from '@/types/opendating';

const ownProfile: ProfileContent = {
  display_name: 'Alex',
  interests: ['Coffee', 'Hiking'],
  relationship_intent: 'long_term',
  v: '0.1',
};

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    pubkey: 'candidate',
    candidate_grant: 'grant',
    distance_bucket: 'within 5 mi',
    profile: {
      display_name: 'Jordan',
      interests: ['coffee', 'art'],
      relationship_intent: 'long_term',
    },
    ...overrides,
  };
}

describe('introductionReasons', () => {
  it('uses only visible shared profile facts and caps the explanation', () => {
    expect(introductionReasons(ownProfile, candidate())).toEqual([
      'You both chose Coffee',
      'You both want long-term relationship',
    ]);
  });

  it('uses the service distance bucket without exposing precise location', () => {
    expect(
      introductionReasons(
        { ...ownProfile, interests: [], relationship_intent: undefined },
        candidate({ profile: { display_name: 'Jordan' } })
      )
    ).toEqual(['Nearby, based on approximate area only']);
  });

  it('falls back to a truthful privacy explanation', () => {
    expect(
      introductionReasons(
        null,
        candidate({ distance_bucket: 'unknown', profile: { display_name: 'Jordan' } })
      )
    ).toEqual(['Introduced without revealing either exact location']);
  });
});
