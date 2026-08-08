// Single-select control for short option lists.
//
// Deliberately plain React Native rather than @expo/ui's Picker. On Android
// that Picker is a Jetpack Compose view which must be a *direct* child of
// <Host> — any intervening <View> breaks the composition boundary and it
// renders nothing at all, silently. Form layouts nest a View per field group
// almost by definition, so every picker was one wrapper away from vanishing.
// That cost us a hard-blocked onboarding step: "Age" and "Gender" rendered as
// bare labels and Continue could never be enabled.
//
// For the option counts this app actually has (4 genders, 5 intents, 6
// prompts) an inline selector is also better UX than a dropdown: every choice
// is visible, and selecting takes one tap instead of three.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export interface SelectableOption {
  value: string;
  label: string;
}

interface OptionSelectorProps {
  options: SelectableOption[];
  value: string | null;
  onChange: (value: string) => void;
  /**
   * `chips` wraps short labels into rows; `list` stacks full-width rows and
   * suits long labels like prompt questions.
   */
  layout?: 'chips' | 'list';
  /** Accessible name for the group, e.g. "Gender". */
  label?: string;
}

export function OptionSelector({
  options,
  value,
  onChange,
  layout = 'chips',
  label,
}: OptionSelectorProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View
      style={layout === 'chips' ? styles.chipGroup : styles.listGroup}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            // Comfortably above the 44pt minimum touch target.
            hitSlop={spacing.xs}
            style={({ pressed }) => [
              layout === 'chips' ? styles.chip : styles.listRow,
              {
                backgroundColor: selected ? colors.accentLight : colors.surface,
                borderColor: selected ? colors.accent : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                typography.bodyMedium,
                { color: selected ? colors.accent : colors.text },
                selected && styles.selectedLabel,
              ]}
              numberOfLines={layout === 'chips' ? 1 : 2}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    chipGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    listGroup: {
      gap: spacing.sm,
    },
    chip: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1.5,
    },
    listRow: {
      minHeight: 52,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
    },
    selectedLabel: {
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.7,
    },
    // Referenced by callers that need a matching field container.
    unused: { display: 'none' },
  });
}
