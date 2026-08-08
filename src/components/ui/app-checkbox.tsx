// Checkbox, plain React Native.
//
// Replaces @expo/ui's Checkbox for the same reason as the other primitives
// here: on Android it is a Jetpack Compose view that must be a direct child of
// <Host>, and it sat several ScrollViews deep inside a form.

import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

interface AppCheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

export function AppCheckbox({
  value,
  onValueChange,
  accessibilityLabel,
}: AppCheckboxProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={spacing.md}
      style={({ pressed }) => [
        styles.box,
        {
          backgroundColor: value ? colors.accent : 'transparent',
          borderColor: value ? colors.accent : colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      {value ? (
        // Drawn rather than a glyph so it renders identically on both
        // platforms and needs no icon font.
        <View style={[styles.check, { borderColor: colors.textInverse }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 7,
    height: 12,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  pressed: {
    opacity: 0.7,
  },
});
