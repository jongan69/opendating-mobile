// Root layout — theme provider + navigation shell
// Polyfill crypto.getRandomValues before anything else (required by @noble/curves for key generation)
import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@/state/theme-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="candidate/[pubkey]" />
          <Stack.Screen name="chat/[pubkey]" />
          <Stack.Screen name="filters" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
