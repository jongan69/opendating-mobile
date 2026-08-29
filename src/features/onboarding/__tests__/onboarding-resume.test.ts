import { getOnboardingResumePath } from '@/features/onboarding/onboarding-resume';
import { CURRENT_POLICY_VERSION } from '@/lib/policy';

it('resumes a complete unpublished draft at review', () => {
  expect(
    getOnboardingResumePath({
      displayName: 'QA Alice',
      age: 29,
      gender: 'woman',
      intent: 'long_term',
      policyAcceptance: {
        version: CURRENT_POLICY_VERSION,
        acceptedAt: '2026-08-29T12:00:00.000Z',
      },
    })
  ).toBe('/(onboarding)/review');
});
