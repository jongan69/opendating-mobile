import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { BrandMark } from '@/components/brand/brand-mark';
import { getOpenDatingClient, resetOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { storage } from '@/lib/storage';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function UnlockScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unlock = useCallback(async () => {
    if (!passphrase || busy) return;
    setBusy(true);
    setError(null);
    try {
      await getOpenDatingClient().unlockIdentity(passphrase);
      setPassphrase('');
      router.replace('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not unlock this browser.');
    } finally {
      setBusy(false);
    }
  }, [busy, passphrase, router]);

  const handleDifferentKey = useCallback(async () => {
    const confirmed =
      Platform.OS !== 'web' ||
      globalThis.confirm(
        'Remove the account copy stored in this browser? This does not delete server data. Make sure you have your recovery key.'
      );
    if (!confirmed) return;
    await getOpenDatingClient().deleteIdentity();
    await storage.clearAll();
    await resetOpenDatingClient();
    router.replace('/(onboarding)/welcome');
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.content}>
        <BrandMark size={72} />
        <View style={styles.copy}>
          <Text style={[typography.headlineMedium, { color: colors.text }]}>Welcome back</Text>
          <Text style={[typography.bodyMedium, styles.centered, { color: colors.textSecondary }]}> 
            Enter the browser-lock passphrase you created here. It encrypts this browser copy; it is not your OpenDating account password.
          </Text>
        </View>
        <View style={styles.form}>
          <TextInput
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            placeholder="Browser-lock passphrase"
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={() => void unlock()}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            accessibilityLabel="Browser-lock passphrase"
          />
          {error ? <Text style={[typography.bodySmall, { color: colors.destructive }]}>{error}</Text> : null}
          <Pressable
            onPress={() => void unlock()}
            disabled={!passphrase || busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.accent, opacity: !passphrase || busy ? 0.5 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[typography.button, { color: colors.textInverse }]}>{busy ? 'Unlocking…' : 'Unlock'}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => void handleDifferentKey()} accessibilityRole="button">
          <Text style={[typography.labelMedium, { color: colors.accent }]}>Use a different recovery key</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxl,
  },
  copy: { alignItems: 'center', gap: spacing.sm, maxWidth: 520 },
  centered: { textAlign: 'center', lineHeight: 22 },
  form: { width: '100%', maxWidth: 440, gap: spacing.md },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    fontSize: 17,
  },
  button: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
