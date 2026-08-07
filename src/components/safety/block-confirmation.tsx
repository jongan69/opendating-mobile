// Block confirmation dialog — explains consequences, destructive confirm
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface BlockConfirmationProps {
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
}

export function BlockConfirmation({
  targetName,
  onConfirm,
  onCancel,
  visible,
}: BlockConfirmationProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
        accessibilityLabel="Dismiss"
      />
      <View style={styles.backdropOverlay} pointerEvents="box-none">
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Block {targetName}?
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            You won&apos;t see each other in discovery anymore, and{" "}
            {targetName} won&apos;t be able to message you or match with you.
          </Text>
          <Text style={[styles.notice, { color: colors.textSecondary }]}>
            They won&apos;t be notified.
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.buttonLabel, { color: colors.text }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Block ${targetName}`}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.destructive },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.buttonLabel, { color: '#FFFFFF' }]}>
                Block
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.headlineMedium,
  },
  body: {
    ...typography.bodyMedium,
  },
  notice: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    ...typography.labelLarge,
  },
});
