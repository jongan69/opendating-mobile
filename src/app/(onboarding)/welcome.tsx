// Welcome — brand, value props, and the two entry points:
// create a fresh account or import an existing one.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const FEATURES: { title: string; detail: string }[] = [
  {
    title: 'Coarse location only',
    detail: 'People see your general area — never your exact spot.',
  },
  {
    title: 'Private likes',
    detail: 'Your likes are never revealed unless you match.',
  },
  {
    title: 'Encrypted messages',
    detail: 'Conversations are end-to-end encrypted, just for you two.',
  },
  {
    title: 'Private blocks',
    detail: 'Blocking is invisible and immediate.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <OnboardingScreen
      step={1}
      title="OpenDating"
      subtitle="Dating that puts your privacy first."
      showBack={false}
      primaryLabel="Create Account"
      onPrimaryPress={() => router.push('/(onboarding)/create-account')}
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(onboarding)/import-account')}
          hitSlop={spacing.sm}
          style={styles.linkButton}
        >
          <Text style={[typography.bodyMedium, { color: colors.accent }]}>
            I already have an account
          </Text>
        </Pressable>
      }
    >
      {/* Brand mark */}
      <View style={styles.brandBlock}>
        <View style={[styles.logo, { backgroundColor: colors.accent }]}>
          <Text style={styles.logoText}>OD</Text>
        </View>
        <Text
          style={[
            typography.bodyLarge,
            { color: colors.textSecondary, textAlign: 'center' },
          ]}
        >
          Meet people nearby without handing over your identity, your photos,
          or your exact location.
        </Text>
      </View>

      {/* Value props */}
      <View style={styles.featureList}>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <View
              style={[styles.featureDot, { backgroundColor: colors.accentMuted }]}
            >
              <View
                style={[styles.featureDotInner, { backgroundColor: colors.accent }]}
              />
            </View>
            <View style={styles.featureText}>
              <Text style={[typography.labelLarge, { color: colors.text }]}>
                {feature.title}
              </Text>
              <Text
                style={[
                  typography.bodySmall,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
              >
                {feature.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  brandBlock: {
    alignItems: 'center',
    gap: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...typography.headlineLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  featureList: {
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  featureDot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureDotInner: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  featureText: {
    flex: 1,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
