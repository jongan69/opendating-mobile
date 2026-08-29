const IDENTITY_FREE_WEB_ROUTES = new Set([
  '/',
  '/unlock',
  '/welcome',
  '/create-account',
  '/import-account',
  '/settings/terms',
  '/settings/privacy',
]);

const ONBOARDING_WEB_ROUTES = new Set([
  '/privacy',
  '/basics',
  '/preferences',
  '/intent',
  '/about',
  '/photos',
  '/location',
  '/review',
  '/finish',
]);

export function requiresWebIdentity(pathname: string): boolean {
  return !IDENTITY_FREE_WEB_ROUTES.has(pathname);
}

export function isOnboardingWebRoute(pathname: string): boolean {
  return ONBOARDING_WEB_ROUTES.has(pathname);
}
