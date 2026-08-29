const IDENTITY_FREE_WEB_ROUTES = new Set([
  '/',
  '/unlock',
  '/welcome',
  '/create-account',
  '/import-account',
  '/settings/terms',
  '/settings/privacy',
]);

export function requiresWebIdentity(pathname: string): boolean {
  return !IDENTITY_FREE_WEB_ROUTES.has(pathname);
}
