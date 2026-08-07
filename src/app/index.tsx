// App bootstrap — routes based on identity/profile state
import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBootstrap } from '@/features/auth/use-bootstrap';
import { useTheme } from '@/state/theme-context';
import { BrandMark } from '@/components/brand/brand-mark';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { StatusBar } from 'expo-status-bar';

export default function BootstrapScreen() {
  const router = useRouter();
  const { state, error, retry } = useBootstrap();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    switch (state) {
      case 'no_identity':
        router.replace('/(onboarding)/welcome');
        break;
      case 'no_profile':
        router.replace('/(onboarding)/basics');
        break;
      case 'ready':
        router.replace('/(tabs)/discover');
        break;
      // loading, connecting, authenticating, etc. — show loading UI
      // error — show error UI
    }
  }, [state, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.center}>
        <BrandMark size={80} />

        {state === 'error' ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error ?? 'Something went wrong'}
            </Text>
            <Text
              style={[styles.retryText, { color: colors.accent }]}
              onPress={retry}
            >
              Tap to retry
            </Text>
          </View>
        ) : (
          <>
            <ActivityIndicator
              size="large"
              color={colors.accent}
              style={styles.spinner}
            />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {state === 'loading'
                ? 'Loading...'
                : state === 'connecting'
                  ? 'Connecting to OpenDating...'
                  : state === 'authenticating'
                    ? 'Signing in...'
                    : state === 'fetching_capabilities'
                      ? 'Checking services...'
                      : state === 'checking_profile'
                        ? 'Loading your profile...'
                        : 'Preparing...'}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.xxl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    ...typography.headlineLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  spinner: {
    marginTop: spacing.lg,
  },
  statusText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodyLarge,
    textAlign: 'center',
  },
  retryText: {
    ...typography.labelLarge,
    marginTop: spacing.sm,
  },
});
