// Finish — success screen after the profile is created.
// "Start Discovering" drops the user into the main app.

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {
        // Haptics are optional — ignore failures on unsupported devices.
      }
    );
  }, []);

  return (
    <OnboardingScreen
      step={11}
      title="You're ready!"
      subtitle="Your profile is live."
      showBack={false}
      primaryLabel="Start Discovering"
      onPrimaryPress={() => router.replace('/(tabs)/discover')}
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
          People nearby can now find you. OpenDating only shares your general
          area, keeps your likes private, and encrypts every conversation.
        </Text>
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        Your identity and profile live on your device and the relay — you can
        delete your account anytime from Settings.
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
