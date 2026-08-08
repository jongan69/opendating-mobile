// Basics — display name, age, and gender.
// The first profile data the user shares; Continue is gated on all three.

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { OptionSelector } from '@/components/ui/option-selector';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
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

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fieldGroup: {
      marginBottom: spacing.xl,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: (typography.bodyLarge.fontSize as number) ?? 17,
    },
    ageInput: {
      width: 96,
    },
  });
}

export default function BasicsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const [name, setName] = useState(draft.displayName);
  const [age, setAge] = useState(draft.age != null ? String(draft.age) : '');
  const [gender, setGender] = useState<string | null>(draft.gender);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  const ageNumber = Number(age);
  const ageValid =
    age.length > 0 && Number.isInteger(ageNumber) &&
    ageNumber >= MIN_AGE && ageNumber <= MAX_AGE;
  const canContinue = name.trim().length > 0 && ageValid && gender !== null;

  const handleContinue = () => {
    if (name.trim().length === 0) {
      setError('Add a display name to continue.');
      return;
    }
    // Stated separately from the generic message: an 18+ service must be
    // explicit about why an age was rejected.
    if (!ageValid) {
      setError(`Enter an age between ${MIN_AGE} and ${MAX_AGE}.`);
      return;
    }
    if (gender === null) {
      setError('Pick a gender to continue.');
      return;
    }
    update('displayName', name.trim());
    update('age', ageNumber);
    update('gender', gender);
    router.push('/(onboarding)/preferences');
  };

  return (
    <OnboardingScreen
      step={4}
      title="About you"
      subtitle="The basics — you can change these anytime."
      primaryLabel="Continue"
      onPrimaryPress={handleContinue}
      primaryDisabled={!canContinue}
    >
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.fieldGroup}>
        <FieldLabel>Display name</FieldLabel>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="How should people call you?"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
          style={[styles.input, { color: colors.text }]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <FieldLabel>Age</FieldLabel>
        <TextInput
          value={age}
          onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
          placeholder={`${MIN_AGE}+`}
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          maxLength={2}
          testID="age-input"
          style={[styles.input, styles.ageInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.fieldGroup}>
        <FieldLabel>Gender</FieldLabel>
        <OptionSelector
          label="Gender"
          options={GENDER_OPTIONS}
          value={gender}
          onChange={setGender}
        />
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        This is shown on your profile. We use it together with your age range
        and preferences to find matches.
      </Text>
    </OnboardingScreen>
  );
}
