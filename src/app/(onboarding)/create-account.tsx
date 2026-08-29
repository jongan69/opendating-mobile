// Create account — generates a fresh identity key on this device.
// The key is stored in the phone's secure storage and never leaves the device.

import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { isScreenshotMode } from '@/constants/env';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { update } = useOnboardingDraft();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        if (passphrase.length < 12) {
          throw new Error('Use at least 12 characters for your browser-lock passphrase.');
        }
        if (passphrase !== confirmation) {
          throw new Error('The browser-lock passphrases do not match.');
        }
      }
      if (isScreenshotMode) {
        // Skip real key generation — use the demo pubkey from the draft
        update('pubkey', 'demo-pubkey-0000000000000000000000000000000000000000000000000000000000000000');
        router.push('/(onboarding)/privacy');
        return;
      }
      const client = getOpenDatingClient();
      const { pubkey } = await client.createIdentity({
        vaultPassphrase: Platform.OS === 'web' ? passphrase : undefined,
      });
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

      {Platform.OS === 'web' ? (
        <View style={styles.passphraseCard}>
          <Text style={[typography.titleSmall, { color: colors.text }]}>Protect this browser copy</Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            Create a browser-lock passphrase with at least 12 characters. It encrypts your recovery key in this browser and is not an OpenDating account password.
          </Text>
          <TextInput
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            placeholder="Browser-lock passphrase"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
          />
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            placeholder="Confirm passphrase"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
          />
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={[typography.titleSmall, { color: colors.text }]}>
          Your recovery key stays {Platform.OS === 'web' ? 'encrypted in this browser' : 'on this device'}
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, marginTop: spacing.sm },
          ]}
        >
          {Platform.OS === 'web'
            ? 'We generate a recovery key in this browser and encrypt it with your browser-lock passphrase before saving it. It is never sent to our servers.'
            : "We generate a recovery key right on your phone. It's stored in your device's secure storage — not on our servers — and it never leaves your phone."}
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
        Your recovery key is the only way to access your account. There is no
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
    passphraseCard: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      fontSize: 17,
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
