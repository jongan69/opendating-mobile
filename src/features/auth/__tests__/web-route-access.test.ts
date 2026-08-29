import {
  getOnboardingRouteRedirect,
  requiresWebIdentity,
} from '@/features/auth/web-route-access';

it('locks reloaded onboarding drafts while leaving the flow locally navigable', () => {
  expect(requiresWebIdentity('/review')).toBe(false);
  expect(requiresWebIdentity('/basics')).toBe(false);
  expect(requiresWebIdentity('/welcome')).toBe(false);
  expect(requiresWebIdentity('/create-account')).toBe(false);
  expect(requiresWebIdentity('/settings/privacy')).toBe(false);
  expect(getOnboardingRouteRedirect('/review', 'locked')).toBe('/unlock');
  expect(getOnboardingRouteRedirect('/review', 'missing')).toBe('/welcome');
  expect(getOnboardingRouteRedirect('/review', 'ready')).toBeNull();
  expect(getOnboardingRouteRedirect('/create-account', 'missing')).toBeNull();
});
