// Settings — grouped menu with account, discovery, about, and danger sections.

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { useTheme } from '@/state/theme-context';
import { useRevenueCat } from '@/state/revenuecat-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ChevronRight } from '@/components/chevron';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { POLICY_EFFECTIVE_LABEL } from '@/lib/policy';

interface MenuRowProps {
  label: string;
  supportingText?: string;
  onPress?: () => void;
  destructive?: boolean;
  trailing?: React.ReactNode;
  disabled?: boolean;
}

function MenuRow({
  label,
  supportingText,
  onPress,
  destructive,
  trailing,
  disabled,
}: MenuRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceSheet : colors.surface },
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.rowText}>
        <Text
          style={[
            typography.bodyMedium,
            { color: destructive ? colors.destructive : colors.text },
          ]}
        >
          {label}
        </Text>
        {supportingText ? (
          <Text
            style={[typography.caption, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {supportingText}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress ? <ChevronRight color={colors.textTertiary} /> : null)}
    </Pressable>
  );
}

function SectionHeader({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.labelMedium, styles.sectionHeader, { color: colors.textTertiary }]}>
      {children.toUpperCase()}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, themePreference, setThemePreference } = useTheme();
  const revenueCat = useRevenueCat();

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visibility, setVisibility] = useState('visible');
  const [pausing, setPausing] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const client = getOpenDatingClient();
      const profile = await client.getProfile();
      setPaused(profile.status === 'paused');
      setVisibility(profile.visibility ?? 'visible');
    } catch {
      // Not connected or no profile yet — keep defaults.
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const togglePause = useCallback(
    async (next: boolean) => {
      if (pausing) return;
      setPausing(true);
      const previous = paused;
      setPaused(next);
      try {
        const client = getOpenDatingClient();
        if (next) {
          await client.pauseProfile();
        } else {
          await client.resumeProfile();
        }
      } catch (err) {
        setPaused(previous);
        Alert.alert(
          'Could not update discovery',
          err instanceof Error ? err.message : 'Please try again.'
        );
      } finally {
        setPausing(false);
      }
    },
    [paused, pausing]
  );

  const updateVisibility = useCallback(
    async (next: string) => {
      const previous = visibility;
      setVisibility(next);
      try {
        await getOpenDatingClient().updateVisibility(next);
      } catch (err) {
        setVisibility(previous);
        Alert.alert(
          'Could not update visibility',
          err instanceof Error ? err.message : 'Please try again.'
        );
      }
    },
    [visibility]
  );

  const changeVisibility = useCallback(() => {
    if (Platform.OS === 'web') {
      const next = visibility === 'hidden' ? 'visible' : 'hidden';
      setPendingVisibility(next);
      return;
    }
    Alert.alert(
      'Visibility',
      'Choose who can see your profile in discovery.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Visible',
          onPress: () => void updateVisibility('visible'),
        },
        {
          text: 'Hidden',
          onPress: () => void updateVisibility('hidden'),
        },
      ]
    );
  }, [updateVisibility, visibility]);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const cycleTheme = useCallback(() => {
    setThemePreference(
      themePreference === 'system'
        ? 'light'
        : themePreference === 'light'
          ? 'dark'
          : 'system'
    );
  }, [setThemePreference, themePreference]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Account */}
          <SectionHeader>Account</SectionHeader>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuRow
              label="Edit Profile"
              supportingText="Name, photos, bio, and more"
              onPress={() => router.push('/edit-profile')}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <MenuRow
              label="Backup Account"
              supportingText="Export your key for safekeeping"
              onPress={() => router.push('/settings/advanced')}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <MenuRow
              label="Privacy"
              supportingText="Location, messages, and safety"
              onPress={() => router.push('/settings/privacy')}
            />
          </View>

          {revenueCat.enabled ? (
            <>
              <SectionHeader>Plus</SectionHeader>
              <View
                style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <MenuRow
                  label={revenueCat.isPlus ? 'OpenDating Plus · Active' : 'OpenDating Plus'}
                  supportingText="Customization and convenience, never ranking"
                  onPress={() => router.push('/settings/plus' as Href)}
                />
              </View>
            </>
          ) : null}

          {/* Discovery */}
          <SectionHeader>Discovery</SectionHeader>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[typography.bodyMedium, { color: colors.text }]}>
                  Pause Discovery
                </Text>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  Stop appearing in others' matches
                </Text>
              </View>
              {!profileLoaded ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <Switch
                  value={paused}
                  onValueChange={(value) => void togglePause(value)}
                  disabled={pausing}
                />
              )}
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <MenuRow
              label="Visibility"
              supportingText={visibility === 'hidden' ? 'Hidden' : 'Visible'}
              onPress={changeVisibility}
            />
          </View>

          {/* About */}
          <SectionHeader>About</SectionHeader>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuRow
              label="Theme"
              supportingText={`${themePreference.charAt(0).toUpperCase()}${themePreference.slice(1)} · Tap to change`}
              onPress={cycleTheme}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <MenuRow
              label="Privacy Policy"
              onPress={() => router.push('/settings/privacy')}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <MenuRow
              label="Terms of Service"
              supportingText={`Effective ${POLICY_EFFECTIVE_LABEL}`}
              onPress={() => router.push('/settings/terms')}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <MenuRow
              label="Report a Problem"
              supportingText="Preview a privacy-safe report"
              onPress={() => router.push('/settings/report-problem')}
            />
          </View>

          {/* Danger */}
          <SectionHeader>Danger Zone</SectionHeader>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuRow
              label="Delete Account"
              destructive
              supportingText="Permanently removes your profile and data"
              onPress={() => router.push('/settings/account')}
            />
          </View>

          {/* Version */}
          <Text style={[typography.caption, styles.version, { color: colors.textTertiary }]}>
            OpenDating v{appVersion}
          </Text>
        </ScrollView>
      <ConfirmationDialog
        visible={pendingVisibility !== null}
        title="Change profile visibility?"
        message={`Make your profile ${pendingVisibility ?? 'visible'} in discovery?`}
        confirmLabel={pendingVisibility === 'hidden' ? 'Hide profile' : 'Make visible'}
        destructive={pendingVisibility === 'hidden'}
        onCancel={() => setPendingVisibility(null)}
        onConfirm={() => {
          const next = pendingVisibility;
          setPendingVisibility(null);
          if (next) void updateVisibility(next);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
