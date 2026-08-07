// Reusable empty state — icon, title, subtitle, optional action
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  /** Short glyph or emoji shown above the title */
  icon: string;
  title: string;
  subtitle: string;
  /** Optional call-to-action button */
  action?: EmptyStateAction;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.accent },
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={[styles.actionLabel, { color: colors.textInverse }]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 30,
  },
  title: {
    ...typography.headlineMedium,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    ...typography.labelLarge,
  },
});
