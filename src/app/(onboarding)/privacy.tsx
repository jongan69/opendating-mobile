// Privacy — what OpenDating does and doesn't know, in plain language.
// A trust-building screen before the user shares any profile data.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const PRIVACY_POINTS: { title: string; detail: string }[] = [
  {
    title: 'Your location is coarse',
    detail:
      'Your phone converts your location into a general area — roughly 5 km — and only that area is shared. Your exact address is never sent.',
  },
  {
    title: 'Your likes are private',
    detail:
      'Nobody sees when you like them. A like is only revealed when you both like each other and match.',
  },
  {
    title: 'Your blocks are private',
    detail:
      'When you block someone, they never know. There is no notification and no trace.',
  },
  {
    title: 'Your messages are encrypted',
    detail:
      'Conversations are end-to-end encrypted. Only you and your match can read them — not us, not the relay.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <OnboardingScreen
      step={3}
      title="Your privacy comes first"
      subtitle="OpenDating is designed so less of you is shared — not more."
      primaryLabel="Continue"
      onPrimaryPress={() => router.push('/(onboarding)/basics')}
    >
      <View style={styles.list}>
        {PRIVACY_POINTS.map((point, index) => (
          <View key={point.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
                <Text style={[typography.labelSmall, { color: colors.accent }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[typography.titleSmall, { color: colors.text }]}>
                {point.title}
              </Text>
            </View>
            <Text
              style={[
                typography.bodySmall,
                { color: colors.textSecondary, marginTop: spacing.sm },
              ]}
            >
              {point.detail}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        Your profile is stored on a public relay by design — that's how others
        discover you. Only what you choose to share appears there.
      </Text>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: {
      gap: spacing.lg,
      marginBottom: spacing.xl,
    },
    card: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    badge: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
