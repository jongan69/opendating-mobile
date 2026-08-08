// Themed button, plain React Native.
//
// Replaces @expo/ui's Button. On Android that is a Jetpack Compose view which
// must be a *direct* child of <Host>; every screen here wrapped the whole
// screen in Host and then nested a ScrollView or View before the button,
// which breaks the Compose composition boundary and throws
// MissingHostException at render. Keeping buttons in React Native removes an
// entire class of layout-order landmines from screens that are otherwise
// ordinary forms.
//
// Drop-in for the previous usage: `style` still accepts a backgroundColor and
// borderRadius, and children are rendered as the label.

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface AppButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function AppButton({
  onPress,
  children,
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        style,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
