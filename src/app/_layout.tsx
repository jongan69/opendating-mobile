// Root layout — theme provider + navigation shell
// Polyfill crypto.getRandomValues before anything else (required by @noble/curves for key generation)
import 'react-native-get-random-values';
import { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@/state/theme-context';
import { RevenueCatProvider } from '@/state/revenuecat-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { StatusBar } from 'expo-status-bar';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { requiresWebIdentity } from '@/features/auth/web-route-access';

export default function RootLayout() {
  return (
    // GestureHandlerRootView must remain the outermost full-screen view for
    // navigation and any gesture-driven controls used elsewhere in the app.
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <RevenueCatProvider>
          <ThemeProvider>
            <ThemedRoot />
          </ThemeProvider>
        </RevenueCatProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function ThemedRoot() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
  }, [colors.background]);

  return (
    <SafeAreaProvider
      style={[
        styles.app,
        Platform.OS === 'web' && styles.webApp,
        Platform.OS === 'web' && { backgroundColor: colors.background },
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const [webRouteReady, setWebRouteReady] = useState(false);
  const isPublicWebRoute =
    Platform.OS !== 'web' || !requiresWebIdentity(pathname);

  useEffect(() => {
    if (isPublicWebRoute) return;

    let active = true;
    const client = getOpenDatingClient();
    void client
      .getIdentityState()
      .then((identityState) => {
        if (!active) return;
        if (identityState !== 'ready') {
          router.replace(identityState === 'locked' ? '/unlock' : '/');
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
  }, [isPublicWebRoute, pathname, router]);

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
