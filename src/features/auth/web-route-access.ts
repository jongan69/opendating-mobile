const IDENTITY_FREE_WEB_ROUTES = new Set([
  '/',
  '/unlock',
  '/welcome',
  '/create-account',
  '/import-account',
  '/privacy',
  '/basics',
  '/preferences',
  '/intent',
  '/about',
  '/photos',
  '/location',
  '/review',
  '/finish',
  '/settings/terms',
  '/settings/privacy',
]);

const ONBOARDING_ENTRY_ROUTES = new Set([
  '/welcome',
  '/create-account',
  '/import-account',
]);

export function requiresWebIdentity(pathname: string): boolean {
  return !IDENTITY_FREE_WEB_ROUTES.has(pathname);
}

export function getOnboardingRouteRedirect(
  pathname: string,
  identityState: 'missing' | 'locked' | 'ready'
): '/welcome' | '/unlock' | null {
  if (ONBOARDING_ENTRY_ROUTES.has(pathname) || identityState === 'ready') {
    return null;
  }
  return identityState === 'locked' ? '/unlock' : '/welcome';
}
