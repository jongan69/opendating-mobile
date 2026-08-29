// Account — delete account with confirmation, local cleanup, and redirect.

import { useCallback, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppButton } from '@/components/ui/app-button';
import {
  getOpenDatingClient,
  resetOpenDatingClient,
} from '@/lib/opendating/open-dating-client';
import { storage } from '@/lib/storage';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const DELETE_CONSEQUENCES =
  'This permanently removes your profile, matches, and account data. This action cannot be undone.';

export default function AccountScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const deleteAccount = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);

    try {
      const client = getOpenDatingClient();

      // Remove the profile first so the account has nothing left to hold.
      try {
        await client.deleteProfile();
      } catch {
        // Profile may not exist yet — the account deletion below is what matters.
      }

      await client.deleteAccount();

      // Clear all local state and reset the client singleton. Awaited so the
      // relay subscription is torn down before we route away — otherwise it
      // could still deliver into the freshly-cleared session.
      await client.deleteIdentity();
      await storage.clearAll();
      await resetOpenDatingClient();

      router.replace('/(onboarding)/welcome');
    } catch (err) {
      setDeleting(false);
      Alert.alert(
        'Could not delete your account',
        err instanceof Error ? err.message : 'Please try again.'
      );
    }
  }, [deleting, router]);

  const confirmDelete = useCallback(() => {
    if (Platform.OS === 'web') {
      setConfirming(true);
      return;
    }
    Alert.alert('Delete Account?', DELETE_CONSEQUENCES, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void deleteAccount(),
      },
    ]);
  }, [deleteAccount]);

  const confirmWebDelete = useCallback(() => {
    setConfirming(false);
    void deleteAccount();
  }, [deleteAccount]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.titleSmall, { color: colors.text }]}>
              Delete Account
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                styles.cardBody,
                { color: colors.textSecondary, lineHeight: 22 },
              ]}
            >
              {DELETE_CONSEQUENCES}
            </Text>
            <Text
              style={[
                typography.bodySmall,
                { color: colors.textTertiary },
              ]}
            >
              Your profile, matches, messages, and verification status will be
              removed from OpenDating. If you have exported your recovery key,
              you can use it to start fresh later.
            </Text>
          </View>

          <AppButton
            disabled={deleting}
            style={{ backgroundColor: colors.destructive, borderRadius: radius.lg }}
            onPress={confirmDelete}
          >
            <Text
              style={[
                typography.button,
                { color: '#FFFFFF', textAlign: 'center' },
              ]}
            >
              {deleting ? 'Deleting…' : 'Delete Account'}
            </Text>
          </AppButton>

          <Text
            style={[typography.caption, styles.note, { color: colors.textTertiary }]}
          >
            Deleting is permanent and can't be undone. There's no grace period —
            make sure you want to go before you confirm.
          </Text>
        </ScrollView>

      {Platform.OS === 'web' ? (
        <Modal
          visible={confirming}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirming(false)}
        >
          <Pressable
            style={styles.confirmBackdrop}
            onPress={() => setConfirming(false)}
            accessibilityLabel="Cancel account deletion"
          />
          <View style={styles.confirmOverlay} pointerEvents="box-none">
            <View
              style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityViewIsModal
              accessibilityRole="alert"
            >
              <Text style={[typography.headlineMedium, { color: colors.text }]}>Delete Account?</Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                {DELETE_CONSEQUENCES}
              </Text>
              <View style={styles.confirmActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirming(false)}
                  style={[styles.confirmButton, { borderColor: colors.border }]}
                >
                  <Text style={[typography.labelLarge, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={confirmWebDelete}
                  style={[styles.confirmButton, { backgroundColor: colors.destructive, borderColor: colors.destructive }]}
                >
                  <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>Delete permanently</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardBody: {
    marginTop: spacing.xs,
  },
  note: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  confirmOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: spacing.xxl,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
});
