// Message list — date separators, sender grouping, auto-scroll, loading + empty states
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MessageBubble } from '@/components/chat/message-bubble';
import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { ODMessage } from '@/types/opendating';

interface MessageListProps {
  messages: ODMessage[];
  currentUserPubkey: string;
  /** Show a spinner while an initial fetch is in flight */
  loading?: boolean;
}

type Row =
  | { kind: 'message'; message: ODMessage; grouped: boolean }
  | { kind: 'day'; label: string; timestamp: number };

const DAY_MS = 86_400_000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayLabel(timestamp: number, now: Date = new Date()): string {
  const date = new Date(timestamp);
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(date)) / DAY_MS
  );
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function timeLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildRows(messages: ODMessage[]): Row[] {
  const rows: Row[] = [];
  let lastDay: string | null = null;
  let lastSender: string | null = null;

  for (const message of messages) {
    const day = dayLabel(message.created_at);
    if (day !== lastDay) {
      rows.push({ kind: 'day', label: day, timestamp: message.created_at });
      lastDay = day;
      lastSender = null; // reset grouping across day boundaries
    }
    rows.push({
      kind: 'message',
      message,
      grouped: message.sender_pubkey === lastSender,
    });
    lastSender = message.sender_pubkey;
  }
  return rows;
}

export function MessageList({
  messages,
  currentUserPubkey,
  loading = false,
}: MessageListProps) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<Row>>(null);
  const nearBottomRef = useRef(true);
  const [listHeight, setListHeight] = useState(0);

  const rows = useMemo(() => buildRows(messages), [messages]);

  // Auto-scroll when a new message arrives
  useEffect(() => {
    if (rows.length === 0) return;
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [rows.length]);

  const handleScroll = useCallback(
    ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
      const distanceFromBottom =
        nativeEvent.contentSize.height -
        (nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height);
      nearBottomRef.current = distanceFromBottom < 96;
    },
    []
  );

  const handleContentSizeChange = useCallback(() => {
    if (nearBottomRef.current && listHeight > 0) {
      listRef.current?.scrollToEnd({ animated: false });
    }
  }, [listHeight]);

  if (loading && messages.length === 0) {
    return (
      <View style={styles.center} accessibilityRole="progressbar">
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading messages…
        </Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="💬"
        title="No messages yet"
        subtitle="Say hello to start the conversation."
      />
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={rows}
      keyExtractor={keyForRow}
      renderItem={({ item }) => {
        if (item.kind === 'day') {
          return (
            <View style={styles.dayRow}>
              <Text style={[styles.dayLabel, { color: colors.textTertiary }]}>
                {item.label}
              </Text>
            </View>
          );
        }
        const message = item.message;
        return (
          <View
            style={[
              styles.messageRow,
              item.grouped ? styles.messageGrouped : styles.messageSpaced,
            ]}
          >
            <MessageBubble
              text={message.text}
              isSent={message.sender_pubkey === currentUserPubkey}
              time={timeLabel(message.created_at)}
            />
          </View>
        );
      }}
      contentContainerStyle={styles.content}
      onScroll={handleScroll}
      scrollEventThrottle={32}
      onContentSizeChange={handleContentSizeChange}
      onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
      keyboardShouldPersistTaps="handled"
    />
  );
}

function keyForRow(row: Row): string {
  return row.kind === 'day'
    ? `day-${row.timestamp}`
    : `msg-${row.message.id}-${row.message.created_at}`;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMedium,
  },
  dayRow: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dayLabel: {
    ...typography.labelSmall,
    backgroundColor: 'transparent',
  },
  messageRow: {
    width: '100%',
  },
  messageSpaced: {
    marginTop: spacing.lg,
  },
  messageGrouped: {
    marginTop: spacing.xs,
  },
});
