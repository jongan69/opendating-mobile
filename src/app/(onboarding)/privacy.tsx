// Privacy — what OpenDating does and doesn't know, in plain language.
// A trust-building screen before the user shares any profile data.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import {
  CURRENT_POLICY_VERSION,
  POLICY_EFFECTIVE_LABEL,
  isCurrentPolicy,
} from '@/lib/policy';
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
    title: 'Your profile text is safety-checked',
    detail:
      'Your display name and bio are automatically screened for harmful content before they go live. That check runs on our service provider, Cloudflare. Your photos are not sent to it.',
  },
  {
    title: 'Your messages are encrypted',
    detail:
      'Conversations are end-to-end encrypted. Only you and your match can read them — not us, and not whoever carries the message. Messages are never screened.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();
  const styles = makeStyles(colors);
  const hasAcceptedPolicies = isCurrentPolicy(draft.policyAcceptance);

  const togglePolicyAcceptance = () => {
    update(
      'policyAcceptance',
      hasAcceptedPolicies
        ? null
        : {
            version: CURRENT_POLICY_VERSION,
            acceptedAt: new Date().toISOString(),
          }
    );
  };

  return (
    <OnboardingScreen
      step={3}
      title="Your privacy comes first"
      subtitle="OpenDating is designed so less of you is shared — not more."
      primaryLabel="Continue"
      onPrimaryPress={() => router.push('/(onboarding)/basics')}
      primaryDisabled={!hasAcceptedPolicies}
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

      <Text
        style={[typography.caption, { color: colors.textTertiary }]}
      >
        Other OpenDating members can discover the profile details you choose to
        share. Your exact location and private likes stay hidden.
      </Text>

      <View style={styles.consentCard}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Accept the Terms of Service and Community Standards"
          accessibilityState={{ checked: hasAcceptedPolicies }}
          onPress={togglePolicyAcceptance}
          style={({ pressed }) => [
            styles.consentRow,
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: hasAcceptedPolicies
                  ? colors.accent
                  : colors.surface,
                borderColor: hasAcceptedPolicies ? colors.accent : colors.border,
              },
            ]}
          >
            {hasAcceptedPolicies ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : null}
          </View>
          <Text
            style={[
              typography.bodyMedium,
              styles.consentText,
              { color: colors.text },
            ]}
          >
            I agree to the Terms of Service and Community Standards.
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/settings/terms')}
          hitSlop={spacing.sm}
          style={({ pressed }) => [styles.policyLink, pressed && styles.pressed]}
        >
          <Text
            style={[typography.labelMedium, { color: colors.accent }]}
          >
            Read the Terms and Community Standards
          </Text>
        </Pressable>
        <Text
          style={[typography.caption, { color: colors.textTertiary }]}
        >
          Effective {POLICY_EFFECTIVE_LABEL}. You must accept before creating a
          profile.
        </Text>
      </View>
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
    consentCard: {
      gap: spacing.md,
      marginTop: spacing.xl,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    consentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 20,
    },
    consentText: {
      flex: 1,
    },
    policyLink: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
