// Import account — restore an existing identity from a private key.
// Accepts a 64-character hex key or a bech32 nsec… key. The key is
// validated locally, converted to hex, and stored in secure storage.
// It never leaves the device.

import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  FieldLabel,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { normalizeRecoveryKey } from '@/lib/opendating/recovery-key';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function ImportAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { update } = useOnboardingDraft();

  const [keyText, setKeyText] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const styles = makeStyles(colors);

  const handleImport = async () => {
    if (importing) return;
    setImporting(true);
    setError(null);
    try {
      const privkeyHex = normalizeRecoveryKey(keyText);
      if (Platform.OS === 'web') {
        if (passphrase.length < 12) {
          throw new Error('Use at least 12 characters for your browser-lock passphrase.');
        }
        if (passphrase !== confirmation) {
          throw new Error('The browser-lock passphrases do not match.');
        }
      }
      const client = getOpenDatingClient();
      const { pubkey } = await client.importIdentity(privkeyHex, {
        vaultPassphrase: Platform.OS === 'web' ? passphrase : undefined,
      });
      update('pubkey', pubkey);
      router.push('/(onboarding)/privacy');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to import your account. Please try again.'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <OnboardingScreen
      step={2}
      title="Import your account"
      subtitle="Restore an existing OpenDating account with your recovery key."
      primaryLabel="Import Account"
      onPrimaryPress={handleImport}
      primaryLoading={importing}
    >
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.fieldGroup}>
        <FieldLabel>Your recovery key</FieldLabel>
        <TextInput
          value={keyText}
          onChangeText={setKeyText}
          placeholder="Paste your recovery key"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!showKey}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleImport}
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable
          onPress={() => setShowKey((v) => !v)}
          hitSlop={spacing.sm}
          style={styles.showKey}
        >
          <Text style={[typography.labelMedium, { color: colors.accent }]}>
            {showKey ? 'Hide key' : 'Show key'}
          </Text>
        </Pressable>
      </View>

      {Platform.OS === 'web' ? (
        <View style={styles.fieldGroup}>
          <FieldLabel>Protect this browser copy</FieldLabel>
          <Text style={[typography.bodySmall, styles.browserCopy, { color: colors.textSecondary }]}>
            This passphrase encrypts the browser copy of your recovery key. It is not an OpenDating account password.
          </Text>
          <TextInput
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            placeholder="At least 12 characters"
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
            style={[styles.input, { color: colors.text, marginTop: spacing.sm }]}
          />
        </View>
      ) : null}

      {/* Security warning */}
      <View style={styles.warningBox}>
        <Text style={[typography.labelMedium, { color: colors.warning }]}>
          Keep this key secret
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, marginTop: spacing.sm },
          ]}
        >
          {Platform.OS === 'web'
            ? 'Anyone with this key controls the account. This browser encrypts its copy with your browser-lock passphrase and never sends the key to our servers. Do not share or screenshot it.'
            : "Anyone with this key controls the account. It's stored only in your device's secure storage and never sent anywhere — but don't share it, screenshot it, or paste it where others can see."}
        </Text>
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        OpenDating can&apos;t recover a lost key — there is no password reset. Keep
        a backup somewhere safe.
      </Text>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fieldGroup: {
      marginBottom: spacing.xl,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: (typography.bodyLarge.fontSize as number) ?? 17,
    },
    showKey: {
      alignSelf: 'flex-end',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    browserCopy: {
      marginBottom: spacing.sm,
    },
    warningBox: {
      borderRadius: radius.md,
      backgroundColor: colors.warningLight,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
  });
}
