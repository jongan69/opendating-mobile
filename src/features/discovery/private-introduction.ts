import { distanceLabel, intentLabel } from '@/lib/profile-labels';
import type { Candidate, ProfileContent } from '@/types/opendating';

const MAX_REASONS = 2;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}
/**
 * Explain an introduction using only facts already present on the two
 * profiles and the service-provided distance bucket. This deliberately does
 * not claim that an opaque recommendation algorithm chose the person.
 */
export function introductionReasons(
  ownProfile: ProfileContent | null | undefined,
  candidate: Candidate
): string[] {
  const reasons: string[] = [];
  const ownInterests = new Map(
    (ownProfile?.interests ?? [])
      .map((interest) => interest.trim())
      .filter(Boolean)
      .map((interest) => [normalized(interest), interest])
  );
  const sharedInterests = (candidate.profile.interests ?? [])
    .map((interest) => interest.trim())
    .filter(Boolean)
    .map((interest) => ownInterests.get(normalized(interest)))
    .filter((interest): interest is string => Boolean(interest));

  if (sharedInterests.length > 0) {
    reasons.push(`You both chose ${sharedInterests[0]}`);
  }

  const ownIntent = ownProfile?.relationship_intent;
  const candidateIntent = candidate.profile.relationship_intent;
  if (ownIntent && ownIntent === candidateIntent) {
    reasons.push(`You both want ${intentLabel(ownIntent).toLocaleLowerCase()}`);
  }

  const distance = distanceLabel(candidate.distance_bucket);
  if (distance && reasons.length < MAX_REASONS) {
    reasons.push(`${distance}, based on approximate area only`);
  }

  if (reasons.length === 0) {
    reasons.push('Introduced without revealing either exact location');
  }

  return reasons.slice(0, MAX_REASONS);
}
