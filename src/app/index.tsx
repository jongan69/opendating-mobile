// App bootstrap — routes based on identity/profile state
import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBootstrap } from '@/features/auth/use-bootstrap';
import { useTheme } from '@/state/theme-context';
import { isScreenshotMode } from '@/constants/env';
import { BrandMark } from '@/components/brand/brand-mark';
import { serviceLabel } from '@/lib/opendating/capabilities';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { StatusBar } from 'expo-status-bar';

const STATUS_COPY: Record<string, string> = {
  loading: 'Loading…',
  connecting: 'Connecting to OpenDating…',
  authenticating: 'Signing in…',
  fetching_capabilities: 'Checking services…',
  checking_profile: 'Loading your profile…',
};

export default function BootstrapScreen() {
  const router = useRouter();
  const { state, error, missingServices, retry } = useBootstrap();
  const { colors, isDark } = useTheme();

  // In screenshot mode, skip the real bootstrap and go straight to onboarding
  const effectiveState = isScreenshotMode ? 'no_identity' : state;

  useEffect(() => {
    switch (effectiveState) {
      case 'no_identity':
        router.replace('/(onboarding)/welcome');
        break;
      case 'no_profile':
        router.replace('/(onboarding)/basics');
        break;
      case 'ready':
        router.replace('/(tabs)/discover');
        break;
      // loading, connecting, services_unavailable, error — handled below
    }
  }, [effectiveState, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.center}>
        <BrandMark size={80} />

        {effectiveState === 'services_unavailable' ? (
          <View style={styles.messageContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Almost ready
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              We reached OpenDating, but {formatServiceList(missingServices)}{' '}
              {missingServices.length === 1 ? 'is' : 'are'} still coming online.
              Nothing is wrong with your account — please check back soon.
            </Text>
            <RetryButton onPress={retry} />
          </View>
        ) : effectiveState === 'error' ? (
          <View style={styles.messageContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Can&apos;t connect
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {error ?? 'Something went wrong.'}
            </Text>
            <RetryButton onPress={retry} />
          </View>
        ) : (
          <>
            <ActivityIndicator
              size="large"
              color={colors.accent}
              style={styles.spinner}
            />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {STATUS_COPY[effectiveState] ?? 'Preparing…'}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Try again"
      style={({ pressed }) => [
        styles.retryButton,
        { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[typography.button, { color: colors.textInverse }]}>
        Try again
      </Text>
    </Pressable>
  );
}

/** "Discovery and Matching" rather than a comma-separated role dump. */
function formatServiceList(roles: string[]): string {
  const labels = roles.map((role) =>
    serviceLabel(role as Parameters<typeof serviceLabel>[0])
  );
  if (labels.length === 0) return 'some features';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
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
  spinner: {
    marginTop: spacing.lg,
  },
  statusText: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.headlineMedium,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.lg,
    height: 48,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
