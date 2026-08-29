// Root layout — theme provider + navigation shell
// Polyfill crypto.getRandomValues before anything else (required by @noble/curves for key generation)
import 'react-native-get-random-values';
import { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/state/theme-context';
import { RevenueCatProvider } from '@/state/revenuecat-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { colors } from '@/theme/colors';
import { StatusBar } from 'expo-status-bar';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';

const PUBLIC_WEB_ROUTES = new Set([
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
              <AppNavigator />
            </RevenueCatProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const [webRouteReady, setWebRouteReady] = useState(false);
  const isPublicWebRoute = Platform.OS !== 'web' || PUBLIC_WEB_ROUTES.has(pathname);

  useEffect(() => {
    if (isPublicWebRoute) return;

    let active = true;
    const client = getOpenDatingClient();
    void client
      .getIdentityState()
      .then((identityState) => {
        if (!active) return;
        if (identityState !== 'ready' || !client.getCapabilities()) {
          router.replace('/');
          return;
        }
        setWebRouteReady(true);
      })
      .catch(() => {
        if (active) router.replace('/');
      });

    return () => {
      active = false;
    };
  }, [isPublicWebRoute, router]);

  if (!isPublicWebRoute && !webRouteReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="unlock" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="candidate" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="filters" options={{ presentation: 'modal' }} />
    </Stack>
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
