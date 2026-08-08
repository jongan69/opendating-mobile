// Shared chrome for onboarding screens.
// Each screen is: themed safe area → back + "Step X of Y" progress header →
// scrollable content → sticky footer with the primary action.
//
// The primary CTA is a themed Pressable rather than @expo/ui Button because
// the universal Button sizes to its intrinsic content (SwiftUI frame modifiers
// cannot stretch full-width), and its tint is the system accent, not the
// OpenDating coral.
//
// On Android, @expo/ui components (Slider, Picker, Button) are Jetpack
// Compose views that require a <Host> ancestor. Without it they render
// nothing at all, silently. Every onboarding screen gets a Host so no
// individual screen has to remember.

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host } from '@expo/ui';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { isScreenshotMode } from '@/constants/env';

export const ONBOARDING_TOTAL_STEPS = 11;

// ---- Shared styles for @expo/ui TextInput boxes (themed border box) ----

export function makeInputStyle(colors: ThemeColors) {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  };
}

export function makeInputTextStyle(colors: ThemeColors) {
  return {
    color: colors.text,
    fontSize: typography.bodyLarge.fontSize as number,
  };
}

// ---- Small building blocks ----

export function FieldLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.errorBanner,
        { backgroundColor: colors.destructiveLight },
      ]}
      accessibilityRole="alert"
    >
      <Text style={[typography.bodySmall, { color: colors.destructive }]}>
        {message}
      </Text>
    </View>
  );
}

// ---- Primary full-width CTA ----

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  // In screenshot mode, never disable — ADB taps need the button to be pressable
  const isDisabled = isScreenshotMode ? false : (disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: isDisabled ? colors.accentMuted : colors.accent,
          opacity: pressed && !isDisabled ? 0.9 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textInverse} />
      ) : (
        <Text style={[typography.button, { color: colors.textInverse }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

// ---- Screen ----

interface OnboardingScreenProps {
  /** 1-based step number shown in the header. */
  step: number;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** Primary CTA label; renders the sticky footer button when provided. */
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Extra content under the primary button (links, hints). */
  footer?: React.ReactNode;
  showBack?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function OnboardingScreen({
  step,
  title,
  subtitle,
  children,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled = false,
  primaryLoading = false,
  footer,
  showBack = true,
  contentContainerStyle,
}: OnboardingScreenProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const hasFooter = Boolean(primaryLabel) || Boolean(footer);
  const progressPct = Math.min(100, Math.round((step / ONBOARDING_TOTAL_STEPS) * 100));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Host colorScheme={isDark ? 'dark' : 'light'} style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        {/* Header: back + step count */}
        <View style={styles.header}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              hitSlop={spacing.lg}
              style={styles.backButton}
            >
              <Text style={[styles.backChevron, { color: colors.text }]}>
                ‹
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>
                Back
              </Text>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
          <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
            Step {step} of {ONBOARDING_TOTAL_STEPS}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.divider }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.accent, width: `${progressPct}%` },
            ]}
          />
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            hasFooter && styles.contentWithFooter,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleBlock}>
            <Text style={[typography.headlineLarge, { color: colors.text }]}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.textSecondary, marginTop: spacing.sm },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          {children}
        </ScrollView>

        {/* Sticky footer */}
        {hasFooter ? (
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            {primaryLabel ? (
              <PrimaryButton
                label={primaryLabel}
                onPress={onPrimaryPress ?? (() => {})}
                loading={primaryLoading}
                disabled={primaryDisabled}
              />
            ) : null}
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
  },
  backChevron: {
    fontSize: 26,
    lineHeight: 28,
    marginRight: spacing.xs,
    marginTop: -2,
  },
  progressTrack: {
    height: 3,
    marginHorizontal: spacing.lg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  contentWithFooter: {
    flexGrow: 1,
  },
  titleBlock: {
    marginBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  primaryButton: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
});
