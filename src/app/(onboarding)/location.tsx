// Location — requests permission and shares only a coarse area.
// getCoarseLocation() converts raw GPS to a ~5 km geohash prefix on-device;
// the exact coordinates never leave the location module.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-draft';
import { getCoarseLocation } from '@/lib/location';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface CoarseArea {
  geohashPrefix: string;
  countryCode?: string;
}

export default function LocationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const [area, setArea] = useState<CoarseArea | null>(
    draft.geohashPrefix
      ? { geohashPrefix: draft.geohashPrefix, countryCode: draft.countryCode ?? undefined }
      : null
  );
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  const shareLocation = async () => {
    if (sharing) return;
    setSharing(true);
    setError(null);
    try {
      const coarse = await getCoarseLocation();
      setArea(coarse);
      update('geohashPrefix', coarse.geohashPrefix);
      update('countryCode', coarse.countryCode ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to determine your area. Please try again.'
      );
    } finally {
      setSharing(false);
    }
  };

  const handleContinue = () => {
    router.push('/(onboarding)/review');
  };

  return (
    <OnboardingScreen
      step={9}
      title="Your area"
      subtitle="Where you are — roughly."
      primaryLabel={area ? 'Update My Area' : 'Share My Area'}
      onPrimaryPress={shareLocation}
      primaryLoading={sharing}
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={handleContinue}
          hitSlop={spacing.sm}
          style={styles.skip}
        >
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            {area ? 'Continue' : 'Not now — skip for later'}
          </Text>
        </Pressable>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}

      {/* Privacy explainer */}
      <View style={styles.explainCard}>
        <Text style={[typography.titleSmall, { color: colors.text }]}>
          Only your general area is shared
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, marginTop: spacing.sm },
          ]}
        >
          Your phone converts your location into a general area of about 5 km —
          right on your device. Only that area is sent to OpenDating, and your
          exact location is never shared or stored.
        </Text>
      </View>

      {/* Shared area card */}
      {area ? (
        <View style={[styles.areaCard, { backgroundColor: colors.successLight }]}>
          <View style={styles.areaHeader}>
            <Text style={[typography.labelLarge, { color: colors.success }]}>
              Your Area — Shared
            </Text>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
          </View>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>
            {area.countryCode ? `${area.countryCode} · ` : ''}area “
            {area.geohashPrefix}”
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Approx. 5 km region. People see this, never your exact spot.
          </Text>
        </View>
      ) : null}

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        You can skip this and enable location later from Settings — without it,
        you'll only see people worldwide.
      </Text>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    explainCard: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    areaCard: {
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    areaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
    },
    skip: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
  });
}
