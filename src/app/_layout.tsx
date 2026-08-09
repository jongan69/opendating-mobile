// Root layout — theme provider + navigation shell
// Polyfill crypto.getRandomValues before anything else (required by @noble/curves for key generation)
import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/state/theme-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    // GestureHandlerRootView is required for react-native-gesture-handler to
    // recognize anything at all. It was missing, and the failure is nearly
    // invisible: in development GestureDetector throws, but in a release build
    // it renders fine and the gesture is simply never recognized — so the
    // swipe deck looked correct and did not respond to a drag. Every card
    // decision had to go through the Pass/Like buttons.
    //
    // It must be the outermost view and must fill the screen; wrapping only
    // the deck would leave a gesture near a screen edge unrecognized.
    <GestureHandlerRootView style={styles.root}>
      {/* Provides the insets that useSafeAreaInsets reads. Also absent, which
          left the chat composer measuring a zero bottom inset and sitting
          under the home indicator. */}
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
