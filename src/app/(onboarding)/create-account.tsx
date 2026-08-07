// Create account — generates a fresh identity key on this device.
// The key is stored in the phone's secure storage and never leaves the device.

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { update } = useOnboardingDraft();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const client = getOpenDatingClient();
      const { pubkey } = await client.createIdentity();
      update('pubkey', pubkey);
      router.push('/(onboarding)/privacy');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your account. Please try again.'
      );
    } finally {
      setCreating(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <OnboardingScreen
      step={2}
      title="Create your account"
      subtitle="It takes seconds, and you stay in control."
      primaryLabel="Create My Account"
      onPrimaryPress={handleCreate}
      primaryLoading={creating}
    >
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.infoCard}>
        <Text style={[typography.titleSmall, { color: colors.text }]}>
          Your key stays on this device
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, marginTop: spacing.sm },
          ]}
        >
          We generate a private key right on your phone. It's stored in your
          device's secure storage — not on our servers — and it never leaves
          your phone.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={[typography.titleSmall, { color: colors.text }]}>
          What happens next
        </Text>
        <View style={styles.steps}>
          {[
            'Tell us about yourself',
            'Add a few photos',
            'Share your general area',
            'Start discovering',
          ].map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View
                style={[
                  styles.stepBadge,
                  { backgroundColor: colors.accentLight },
                ]}
              >
                <Text style={[typography.labelSmall, { color: colors.accent }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        Your private key is the only way to access your account. There is no
        password reset — keep it safe.
      </Text>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    infoCard: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    steps: {
      gap: spacing.md,
      marginTop: spacing.md,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    stepBadge: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
