// Finish — success screen after the profile is created.
// The first destination is the member's Privacy Passport so account control
// is the organizing experience, not a setting hidden behind the dating flow.

import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function FinishScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {
        // Haptics are optional — ignore failures on unsupported devices.
      }
    );
  }, []);

  return (
    <OnboardingScreen
      step={11}
      title="Your passport is ready"
      subtitle="Your profile is live, and its privacy controls belong to you."
      showBack={false}
      primaryLabel="View My Privacy Passport"
      onPrimaryPress={() => router.replace('/(tabs)/passport')}
    >
      <View style={styles.center}>
        <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
          <Text style={styles.checkMark}>✓</Text>
        </View>

        <Text
          style={[
            typography.bodyLarge,
            { color: colors.textSecondary, textAlign: 'center' },
          ]}
        >
          OpenDating now has only what it needs to introduce you: a public
          profile and an approximate area. Your exact location and private
          interest remain withheld.
        </Text>
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        Your recovery key can restore this account on another device. Open
        your Passport anytime to inspect or change what the app can do.
      </Text>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: {
      alignItems: 'center',
      gap: spacing.xl,
      marginBottom: spacing.xxxl,
    },
    checkCircle: {
      width: 88,
      height: 88,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMark: {
      color: '#FFFFFF',
      fontSize: 44,
      lineHeight: 48,
      fontWeight: '600',
      marginTop: -4,
    },
  });
}
