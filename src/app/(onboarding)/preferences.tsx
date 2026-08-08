// Preferences — who are you looking for?
// Gender preferences are a multi-select (empty = everyone); the age range is
// set with two sliders that keep min <= max.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Host, Slider } from '@expo/ui';
import { useRouter } from 'expo-router';
import {
  FieldLabel,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import {
  GENDER_OPTIONS,
  MAX_AGE,
  MIN_AGE,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding-draft';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const [genders, setGenders] = useState<string[]>(draft.genderPreferences);
  const [minAge, setMinAge] = useState(draft.ageRangeMin);
  const [maxAge, setMaxAge] = useState(draft.ageRangeMax);

  const styles = makeStyles(colors);

  const toggleGender = (value: string) => {
    setGenders((prev) =>
      prev.includes(value)
        ? prev.filter((g) => g !== value)
        : [...prev, value]
    );
  };

  const handleMinAge = (value: number) => {
    setMinAge(Math.min(value, maxAge - 1));
  };

  const handleMaxAge = (value: number) => {
    setMaxAge(Math.max(value, minAge + 1));
  };

  const handleContinue = () => {
    update('genderPreferences', genders);
    update('ageRangeMin', minAge);
    update('ageRangeMax', maxAge);
    router.push('/(onboarding)/intent');
  };

  return (
    <OnboardingScreen
      step={5}
      title="Who are you looking for?"
      subtitle="Leave genders unselected to see everyone."
      primaryLabel="Continue"
      onPrimaryPress={handleContinue}
    >
      {/* Gender preferences — multi-select chips */}
      <View style={styles.section}>
        <FieldLabel>Genders</FieldLabel>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((option) => {
            const selected = genders.includes(option.value);
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleGender(option.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.accent : colors.surface,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.labelLarge,
                    { color: selected ? colors.textInverse : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {genders.length === 0 ? (
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            No preference — you'll see everyone.
          </Text>
        ) : null}
      </View>

      {/* Age range */}
      <View style={styles.section}>
        <View style={styles.rangeHeader}>
          <FieldLabel>Age range</FieldLabel>
          <Text style={[typography.labelLarge, { color: colors.accent }]}>
            {minAge} – {maxAge}
          </Text>
        </View>

        <View style={styles.sliderGroup}>
          <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
            Minimum: {minAge}
          </Text>
          {/* Slider is a platform view (Jetpack Compose on Android) and must
              be a *direct* child of Host — any wrapper between the two breaks
              the composition boundary and it renders nothing at all.
              matchContents lets Host take its height from the slider instead
              of collapsing to zero. */}
          <Host matchContents={{ vertical: true }} seedColor={colors.accent}>
            <Slider
              value={minAge}
              min={MIN_AGE}
              max={MAX_AGE}
              step={1}
              onValueChange={handleMinAge}
              testID="min-age-slider"
            />
          </Host>
        </View>

        <View style={styles.sliderGroup}>
          <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
            Maximum: {maxAge}
          </Text>
          <Host matchContents={{ vertical: true }} seedColor={colors.accent}>
            <Slider
              value={maxAge}
              min={MIN_AGE}
              max={MAX_AGE}
              step={1}
              onValueChange={handleMaxAge}
              testID="max-age-slider"
            />
          </Host>
        </View>
      </View>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: {
      marginBottom: spacing.xxxl,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    rangeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sliderGroup: {
      marginTop: spacing.xl,
    },
  });
}
