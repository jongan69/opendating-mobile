// Subtle translucent loading overlay with optional message
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const { colors, isDark } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor: isDark
            ? 'rgba(20, 20, 19, 0.55)'
            : 'rgba(250, 249, 247, 0.6)',
        },
      ]}
      pointerEvents="auto"
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
    >
      <View style={[styles.pill, { backgroundColor: colors.surfaceElevated }]}>
        <ActivityIndicator size="small" color={colors.accent} />
        {message ? (
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  message: {
    ...typography.bodySmall,
  },
});
