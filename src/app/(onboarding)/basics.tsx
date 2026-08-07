// Basics — display name, age, and gender.
// The first profile data the user shares; Continue is gated on all three.

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Picker, TextInput } from '@expo/ui';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  FieldLabel,
  makeInputStyle,
  makeInputTextStyle,
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

const AGE_VALUES = Array.from(
  { length: MAX_AGE - MIN_AGE + 1 },
  (_, i) => MIN_AGE + i
);

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fieldGroup: {
      marginBottom: spacing.xl,
    },
  });
}

export default function BasicsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const [name, setName] = useState(draft.displayName);
  const [age, setAge] = useState(draft.age ?? 24);
  const [gender, setGender] = useState<string | null>(draft.gender);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  const canContinue = name.trim().length > 0 && gender !== null;

  const handleContinue = () => {
    if (!canContinue) {
      setError('Add a display name and pick a gender to continue.');
      return;
    }
    update('displayName', name.trim());
    update('age', age);
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
          defaultValue={draft.displayName}
          onChangeText={setName}
          placeholder="How should people call you?"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={40}
          style={makeInputStyle(colors)}
          textStyle={makeInputTextStyle(colors)}
        />
      </View>

      <View style={styles.fieldGroup}>
        <FieldLabel>Age</FieldLabel>
        <Picker
          selectedValue={age}
          onValueChange={(value) => setAge(value as number)}
          testID="age-picker"
        >
          {AGE_VALUES.map((value) => (
            <Picker.Item key={value} label={`${value}`} value={value} />
          ))}
        </Picker>
      </View>

      <View style={styles.fieldGroup}>
        <FieldLabel>Gender</FieldLabel>
        <Picker
          selectedValue={gender ?? ''}
          onValueChange={(value) => setGender(value as string)}
          testID="gender-picker"
        >
          <Picker.Item label="Select your gender" value="" />
          {GENDER_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        This is shown on your profile. We use it together with your age range
        and preferences to find matches.
      </Text>
    </OnboardingScreen>
  );
}
