// Onboarding flow layout — stack navigator for the 11-step flow.
// Wraps every onboarding screen in the in-memory draft provider so screens
// can share the profile data collected along the way.

import { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { OnboardingDraftProvider } from '@/features/onboarding/onboarding-draft';
import { useTheme } from '@/state/theme-context';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { getOnboardingRouteRedirect } from '@/features/auth/web-route-access';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();
  const [initialPathname] = useState(pathname);
  const router = useRouter();
  const [routeReady, setRouteReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let active = true;
    void getOpenDatingClient()
      .getIdentityState()
      .then((identityState) => {
        if (!active) return;
        const redirect = getOnboardingRouteRedirect(initialPathname, identityState);
        if (redirect) {
          router.replace(redirect);
          return;
        }
        setRouteReady(true);
      })
      .catch(() => {
        if (active) router.replace('/');
      });
    return () => {
      active = false;
    };
  }, [initialPathname, router]);

  if (!routeReady) return null;

  return (
    <OnboardingDraftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </OnboardingDraftProvider>
  );
}
