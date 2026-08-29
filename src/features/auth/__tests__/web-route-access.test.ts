import { requiresWebIdentity } from '@/features/auth/web-route-access';

it('locks onboarding drafts while leaving account entry routes public', () => {
  expect(requiresWebIdentity('/review')).toBe(true);
  expect(requiresWebIdentity('/basics')).toBe(true);
  expect(requiresWebIdentity('/welcome')).toBe(false);
  expect(requiresWebIdentity('/create-account')).toBe(false);
  expect(requiresWebIdentity('/settings/privacy')).toBe(false);
});
