// Onboarding flow layout — stack navigator for the 11-step flow.
// Wraps every onboarding screen in the in-memory draft provider so screens
// can share the profile data collected along the way.

import { Stack } from 'expo-router';
import { OnboardingDraftProvider } from '@/features/onboarding/onboarding-draft';
import { useTheme } from '@/state/theme-context';

export default function OnboardingLayout() {
  const { colors } = useTheme();

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
