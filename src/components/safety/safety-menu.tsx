// Safety action sheet — Unmatch / Block / Report with confirmations
// iOS uses the native action sheet + alerts; Android/Web use a themed bottom sheet.
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export interface SafetyMenuHandle {
  present: () => void;
}

interface SafetyMenuProps {
  targetPubkey: string;
  targetName: string;
  onUnmatch?: () => void;
  onBlock?: () => void;
  evidenceEventIds?: string;
  /** Extra hook invoked after navigating to /report */
  onReport?: () => void;
}

type SafetyAction = 'unmatch' | 'block' | 'report';

export const SafetyMenu = forwardRef<SafetyMenuHandle, SafetyMenuProps>(
  function SafetyMenu(
    { targetPubkey, targetName, onUnmatch, onBlock, evidenceEventIds, onReport },
    ref
  ) {
    const router = useRouter();
    const { colors } = useTheme();
    const [sheetVisible, setSheetVisible] = useState(false);
    const [confirmation, setConfirmation] = useState<Exclude<SafetyAction, 'report'> | null>(null);

    const handleReport = useCallback(() => {
      // Navigate to the report flow with the target's pubkey
      router.push({
        pathname: '/report',
        params: {
          pubkey: targetPubkey,
          name: targetName,
          ...(evidenceEventIds ? { evidence_event_ids: evidenceEventIds } : {}),
        },
      });
      onReport?.();
    }, [router, targetName, targetPubkey, evidenceEventIds, onReport]);

    const confirmUnmatch = useCallback(() => {
      if (Platform.OS === 'web') {
        setConfirmation('unmatch');
        return;
      }
      Alert.alert(
        'Unmatch',
        `Unmatch ${targetName}? You won't be able to message each other anymore.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unmatch',
            style: 'destructive',
            onPress: () => onUnmatch?.(),
          },
        ]
      );
    }, [targetName, onUnmatch]);

    const confirmBlock = useCallback(() => {
      if (Platform.OS === 'web') {
        setConfirmation('block');
        return;
      }
      Alert.alert(
        'Block',
        `Block ${targetName}? You won't see each other in discovery or be able to message or match. They won't be notified.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: () => onBlock?.() },
        ]
      );
    }, [targetName, onBlock]);

    const choose = useCallback(
      (action: SafetyAction) => {
        setSheetVisible(false);
        switch (action) {
          case 'unmatch':
            confirmUnmatch();
            break;
          case 'block':
            confirmBlock();
            break;
          case 'report':
            handleReport();
            break;
        }
      },
      [confirmUnmatch, confirmBlock, handleReport]
    );

    const present = useCallback(() => {
      if (Platform.OS === 'ios') {
        const actions = [
          ...(onUnmatch ? [{ label: 'Unmatch', run: confirmUnmatch }] : []),
          ...(onBlock ? [{ label: 'Block', run: confirmBlock }] : []),
          { label: 'Report', run: handleReport },
        ];
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: targetName,
            message: 'Choose an action',
            options: [...actions.map((action) => action.label), 'Cancel'],
            cancelButtonIndex: actions.length,
            destructiveButtonIndex: actions
              .map((action, index) => (action.label === 'Report' ? -1 : index))
              .filter((index) => index >= 0),
          },
          (index) => {
            actions[index]?.run();
          }
        );
      } else {
        // Android / Web — themed bottom sheet
        setSheetVisible(true);
      }
    }, [targetName, onUnmatch, onBlock, confirmUnmatch, confirmBlock, handleReport]);

    useImperativeHandle(ref, () => ({ present }), [present]);

    return (
      <>
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setSheetVisible(false)}
          accessibilityLabel="Dismiss menu"
        />
        <View style={styles.sheetContainer} pointerEvents="box-none">
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            accessibilityViewIsModal
          >
            <Text style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.text }]}>
              {targetName}
            </Text>

            {onUnmatch ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => choose('unmatch')}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                >
                  <Text style={[styles.optionLabel, { color: colors.destructive }]}>Unmatch</Text>
                </Pressable>
                <View style={[styles.separator, { backgroundColor: colors.divider }]} />
              </>
            ) : null}
            {onBlock ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => choose('block')}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                >
                  <Text style={[styles.optionLabel, { color: colors.destructive }]}>Block</Text>
                </Pressable>
                <View style={[styles.separator, { backgroundColor: colors.divider }]} />
              </>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => choose('report')}
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                Report
              </Text>
            </Pressable>
            <View style={[styles.separator, { backgroundColor: colors.divider }]} />
            <Pressable
              accessibilityRole="button"
              onPress={() => setSheetVisible(false)}
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ConfirmationDialog
        visible={confirmation !== null}
        title={`${confirmation === 'block' ? 'Block' : 'Unmatch'} ${targetName}?`}
        message={
          confirmation === 'block'
            ? "You won't see each other in discovery or be able to message or match. They won't be notified."
            : "You won't be able to message each other anymore."
        }
        confirmLabel={confirmation === 'block' ? 'Block' : 'Unmatch'}
        destructive
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          const action = confirmation;
          setConfirmation(null);
          if (action === 'block') onBlock?.();
          else if (action === 'unmatch') onUnmatch?.();
        }}
      />
      </>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.titleMedium,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.md,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionLabel: {
    ...typography.labelLarge,
  },
  cancelLabel: {
    ...typography.labelLarge,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
});
