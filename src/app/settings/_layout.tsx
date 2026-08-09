// Settings stack — native headers with back button, themed for dark mode.

import { Stack } from 'expo-router';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.accent,
        headerTitleStyle: {
          color: colors.text,
          ...typography.titleMedium,
        },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="account" options={{ title: 'Account' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="terms" options={{ title: 'Draft Beta Terms' }} />
      <Stack.Screen name="advanced" options={{ title: 'Advanced' }} />
    </Stack>
  );
}
