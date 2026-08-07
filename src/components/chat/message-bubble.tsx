// Chat message bubble — sent/received with minimal, native-feeling rounding
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface MessageBubbleProps {
  text: string;
  isSent: boolean;
  /** Pre-formatted timestamp label, e.g. "2:34 PM" */
  time: string;
  /** Sent optimistically, not yet confirmed by the relay. */
  pending?: boolean;
}

const BUBBLE_MAX_WIDTH_PCT = '82%';

export function MessageBubble({ text, isSent, time, pending = false }: MessageBubbleProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        isSent ? styles.rowSent : styles.rowReceived,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isSent ? colors.accent : colors.surfaceElevated,
            borderColor: isSent ? colors.accent : colors.border,
          },
          isSent ? styles.bubbleSent : styles.bubbleReceived,
          // Unconfirmed messages read as "in flight" rather than delivered.
          pending && styles.bubblePending,
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isSent ? colors.textInverse : colors.text },
          ]}
        >
          {text}
        </Text>
      </View>
      <Text
        style={[
          styles.time,
          { color: colors.textTertiary },
          isSent ? styles.timeSent : styles.timeReceived,
        ]}
      >
        {time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: BUBBLE_MAX_WIDTH_PCT,
    flexShrink: 1,
  },
  rowSent: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  rowReceived: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleSent: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.sm,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  bubbleReceived: {
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  bubblePending: {
    opacity: 0.62,
  },
  text: {
    ...typography.bodyMedium,
  },
  time: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  timeSent: {
    marginRight: spacing.xs,
  },
  timeReceived: {
    marginLeft: spacing.xs,
  },
});
