// Root layout — theme provider + navigation shell
// Polyfill crypto.getRandomValues before anything else (required by @noble/curves for key generation)
import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/state/theme-context';
import { RevenueCatProvider } from '@/state/revenuecat-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { colors } from '@/theme/colors';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    // GestureHandlerRootView must remain the outermost full-screen view for
    // navigation and any gesture-driven controls used elsewhere in the app.
    <GestureHandlerRootView
      style={[
        styles.root,
        Platform.OS === 'web' && {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
        },
      ]}
    >
      {/* Provides the insets that useSafeAreaInsets reads. Also absent, which
          left the chat composer measuring a zero bottom inset and sitting
          under the home indicator. */}
      <SafeAreaProvider
        style={[
          styles.app,
          Platform.OS === 'web' && styles.webApp,
          Platform.OS === 'web' && {
            backgroundColor: isDark ? colors.dark.background : colors.light.background,
          },
        ]}
      >
        <ErrorBoundary>
          <ThemeProvider>
            <RevenueCatProvider>
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="unlock" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="candidate" />
                <Stack.Screen name="chat" />
                <Stack.Screen name="filters" options={{ presentation: 'modal' }} />
              </Stack>
            </RevenueCatProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  app: {
    flex: 1,
  },
  webApp: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
});
