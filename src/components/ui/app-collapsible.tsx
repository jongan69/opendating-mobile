// Disclosure row, plain React Native.
//
// Replaces @expo/ui's Collapsible, which is a Jetpack Compose view on Android
// and must be a direct child of <Host>; it was nested inside a card inside a
// ScrollView, so it threw MissingHostException rather than rendering.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface AppCollapsibleProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  children: React.ReactNode;
}

export function AppCollapsible({
  isOpen,
  onOpenChange,
  label,
  children,
}: AppCollapsibleProps) {
  const { colors } = useTheme();

  return (
    <View>
      <Pressable
        onPress={() => onOpenChange(!isOpen)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.header,
          pressed && { backgroundColor: colors.surfaceSheet },
        ]}
      >
        <Text style={[typography.bodyMedium, styles.label, { color: colors.text }]}>
          {label}
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textTertiary }]}>
          {isOpen ? '⌄' : '›'}
        </Text>
      </Pressable>
      {isOpen ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  label: {
    flex: 1,
  },
});
