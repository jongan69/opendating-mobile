// Import account — restore an existing identity from a private key.
// Accepts a 64-character hex key or a bech32 nsec… key. The key is
// validated locally, converted to hex, and stored in secure storage.
// It never leaves the device.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TextInput } from '@expo/ui';
import { bech32, hex } from '@scure/base';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  FieldLabel,
  makeInputStyle,
  makeInputTextStyle,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

/**
 * Normalize a user-supplied private key to lowercase hex.
 * Accepts: 64 hex chars, or an nsec… bech32 key (checksum-validated).
 */
function normalizePrivateKey(input: string): string {
  const trimmed = input.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (trimmed.toLowerCase().startsWith('nsec1')) {
    let decoded;
    try {
      decoded = bech32.decode(trimmed.toLowerCase() as `${string}1${string}`);
    } catch {
      throw new Error(
        "That key doesn&apos;t look valid — double-check it was copied completely."
      );
    }
    if (decoded.prefix !== 'nsec') {
      throw new Error('Expected a private key (nsec…) for importing an account.');
    }
    const bytes = bech32.fromWords(decoded.words);
    if (bytes.length !== 32) {
      throw new Error('Private key must be 32 bytes.');
    }
    return hex.encode(bytes);
  }

  throw new Error(
    'Enter your private key as nsec… or 64 hex characters.'
  );
}

export default function ImportAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { update } = useOnboardingDraft();

  const [keyText, setKeyText] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  const handleImport = async () => {
    if (importing) return;
    setImporting(true);
    setError(null);
    try {
      const privkeyHex = normalizePrivateKey(keyText);
      const client = getOpenDatingClient();
      const { pubkey } = await client.importIdentity(privkeyHex);
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
      subtitle="Restore an existing OpenDating identity with your private key."
      primaryLabel="Import Account"
      onPrimaryPress={handleImport}
      primaryLoading={importing}
    >
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.fieldGroup}>
        <FieldLabel>Private key (nsec… or hex)</FieldLabel>
        <TextInput
          value={undefined}
          defaultValue={keyText}
          onChangeText={setKeyText}
          placeholder="nsec1… or 64-character hex key"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!showKey}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleImport}
          style={makeInputStyle(colors)}
          textStyle={makeInputTextStyle(colors)}
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
          Anyone with this key controls the account. It&apos;s stored only in your
          device's secure storage and never sent anywhere — but don&apos;t share it,
          screenshot it, or paste it where others can see.
        </Text>
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        OpenDating can&apos;t recover a lost key — there is no password reset. Keep
        a backup of your nsec in a safe place.
      </Text>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fieldGroup: {
      marginBottom: spacing.xl,
    },
    showKey: {
      alignSelf: 'flex-end',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    warningBox: {
      borderRadius: radius.md,
      backgroundColor: colors.warningLight,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
  });
}
