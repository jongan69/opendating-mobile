// Intent — what are you looking for? Single-select radio list.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import {
  INTENT_OPTIONS,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding-draft';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function IntentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const [intent, setIntent] = useState<string | null>(draft.intent);

  const styles = makeStyles(colors);

  const handleContinue = () => {
    if (!intent) return;
    update('intent', intent);
    router.push('/(onboarding)/about');
  };

  return (
    <OnboardingScreen
      step={6}
      title="What are you looking for?"
      subtitle="Pick the one that fits best — you can change it later."
      primaryLabel="Continue"
      onPrimaryPress={handleContinue}
      primaryDisabled={intent === null}
    >
      {intent === null ? (
        <ErrorBanner message="Select an option to continue." />
      ) : null}

      <View style={styles.list}>
        {INTENT_OPTIONS.map((option) => {
          const selected = intent === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setIntent(option.value)}
              style={[
                styles.row,
                {
                  backgroundColor: selected ? colors.accentLight : colors.surface,
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}
              >
                {selected ? (
                  <View
                    style={[styles.radioDot, { backgroundColor: colors.accent }]}
                  />
                ) : null}
              </View>
              <Text style={[typography.bodyLarge, { color: colors.text }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: {
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: radius.full,
    },
  });
}
