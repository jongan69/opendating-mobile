import { isCurrentPolicy, type PolicyAcceptance } from '@/lib/policy';

interface ResumeDraft {
  policyAcceptance?: PolicyAcceptance | null;
  displayName?: string;
  age?: number | null;
  gender?: string | null;
  intent?: string | null;
}

export function getOnboardingResumePath(
  saved: ResumeDraft | null
): '/(onboarding)/privacy' | '/(onboarding)/basics' | '/(onboarding)/preferences' | '/(onboarding)/review' {
  if (!isCurrentPolicy(saved?.policyAcceptance ?? null)) {
    return '/(onboarding)/privacy';
  }
  if (!saved?.displayName || saved.age == null || !saved.gender) {
    return '/(onboarding)/basics';
  }
  return saved.intent ? '/(onboarding)/review' : '/(onboarding)/preferences';
}
