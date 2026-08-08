// About — bio, interests (tags), and an optional prompt.
// Interests are added one at a time as chips; tap a chip to remove it.
// Uses React Native's built-in TextInput instead of @expo/ui's on Android
// where the native Material wrapper can block touch events and keyboard input.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OptionSelector } from '@/components/ui/option-selector';
import { useRouter } from 'expo-router';
import {
  FieldLabel,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import {
  PROMPT_QUESTIONS,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding-draft';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const MAX_BIO_LENGTH = 300;
const MAX_INTERESTS = 12;
const MAX_INTEREST_LENGTH = 24;
const MAX_PROMPT_ANSWER = 200;

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const [bio, setBio] = useState(draft.bio);
  const [interests, setInterests] = useState<string[]>(draft.interests);
  const [interestText, setInterestText] = useState('');
  const [promptQuestion, setPromptQuestion] = useState(
    draft.prompts[0]?.question ?? PROMPT_QUESTIONS[0]
  );
  const [promptAnswer, setPromptAnswer] = useState(draft.prompts[0]?.answer ?? '');

  const styles = makeStyles(colors);

  const addInterest = () => {
    const tag = interestText.trim();
    if (!tag) return;
    if (interests.length >= MAX_INTERESTS) return;
    if (interests.some((i) => i.toLowerCase() === tag.toLowerCase())) {
      setInterestText('');
      return;
    }
    setInterests((prev) => [...prev, tag.slice(0, MAX_INTEREST_LENGTH)]);
    setInterestText('');
  };

  const removeInterest = (tag: string) => {
    setInterests((prev) => prev.filter((i) => i !== tag));
  };

  const handleContinue = () => {
    const prompts =
      promptAnswer.trim().length > 0
        ? [{ question: promptQuestion, answer: promptAnswer.trim() }]
        : [];
    update('bio', bio.trim());
    update('interests', interests);
    update('prompts', prompts);
    router.push('/(onboarding)/photos');
  };

  return (
    <OnboardingScreen
      step={7}
      title="About you"
      subtitle="A little personality goes a long way."
      primaryLabel="Continue"
      onPrimaryPress={handleContinue}
    >
      {/* Bio */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <FieldLabel>Bio</FieldLabel>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {bio.length}/{MAX_BIO_LENGTH}
          </Text>
        </View>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="A sentence or two about who you are…"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={5}
          maxLength={MAX_BIO_LENGTH}
          textAlignVertical="top"
          style={styles.textInput}
        />
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <FieldLabel>Interests</FieldLabel>
        <View style={styles.interestInputRow}>
          <View style={styles.interestInput}>
            <TextInput
              value={interestText}
              onChangeText={setInterestText}
              placeholder="Hiking, coffee, jazz…"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={MAX_INTEREST_LENGTH}
              returnKeyType="done"
              onSubmitEditing={addInterest}
              style={styles.textInput}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add interest"
            onPress={addInterest}
            disabled={interestText.trim().length === 0}
            style={({ pressed }) => [
              styles.addButton,
              {
                backgroundColor:
                  interestText.trim().length === 0
                    ? colors.accentMuted
                    : colors.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[typography.button, { color: colors.textInverse }]}>
              Add
            </Text>
          </Pressable>
        </View>

        {interests.length > 0 ? (
          <View style={styles.chips}>
            {interests.map((tag) => (
              <Pressable
                key={tag}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${tag}`}
                onPress={() => removeInterest(tag)}
                style={[
                  styles.chip,
                  { backgroundColor: colors.accentLight, borderColor: colors.accentMuted },
                ]}
              >
                <Text style={[typography.labelMedium, { color: colors.accent }]}>
                  {tag}
                </Text>
                <Text style={[styles.chipX, { color: colors.accent }]}> ×</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          Tap a chip to remove it. Up to {MAX_INTERESTS} interests.
        </Text>
      </View>

      {/* Optional prompt */}
      <View style={styles.section}>
        <FieldLabel>Prompt (optional)</FieldLabel>
        <View style={styles.promptQuestion}>
          <OptionSelector
            label="Prompt"
            layout="list"
            options={PROMPT_QUESTIONS.map((q) => ({ value: q, label: q }))}
            value={promptQuestion}
            onChange={setPromptQuestion}
          />
        </View>
        <TextInput
          value={promptAnswer}
          onChangeText={setPromptAnswer}
          placeholder="Your answer…"
          placeholderTextColor={colors.textTertiary}
          maxLength={MAX_PROMPT_ANSWER}
          style={styles.textInput}
        />
        <Text style={[typography.caption, { color: colors.textTertiary }]}>
          Leave it empty to skip the prompt.
        </Text>
      </View>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    section: {
      marginBottom: spacing.xxxl,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      color: colors.text,
      fontSize: (typography.bodyLarge.fontSize as number) ?? 17,
    },
    interestInputRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    interestInput: {
      flex: 1,
    },
    addButton: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    chipX: {
      fontSize: 14,
      lineHeight: 16,
    },
    promptQuestion: {
      marginBottom: spacing.md,
    },
  });
}
