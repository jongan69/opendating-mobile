// Matches — new matches carousel on top, conversation list below.

import { useCallback, useEffect, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMatches } from '@/features/matching/use-matches';
import {
  markConversationRead,
  useConversationLog,
} from '@/features/messaging/conversation-log';
import { cacheCandidate } from '@/features/discovery/candidate-cache';
import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/state/theme-context';
import { isScreenshotMode } from '@/constants/env';
import { getScreenshotMatches } from '@/constants/screenshot-demo';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shortPubkey, formatTimestamp } from '@/lib/format';
import type { Match } from '@/types/opendating';

export default function MatchesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { matches, newMatches, loading, error, refresh, markMessaged } = useMatches();
  const conversationLog = useConversationLog();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const screenshotMatches = useMemo(() => getScreenshotMatches(), []);
  const displayMatches = isScreenshotMode ? screenshotMatches : matches;
  const displayNewMatches = isScreenshotMode ? screenshotMatches : newMatches;

  // Feed the chat and candidate screens from match data.
  // These entries carry no candidate grant: a match is already mutual, so
  // there is no new interest decision to send. The empty grant must never
  // reach intent.like because the server rejects it.
  useEffect(() => {
    for (const match of displayMatches) {
      if (!match.profile) continue;
      cacheCandidate({
        pubkey: match.pubkey,
        profile: match.profile,
        distance_bucket: match.distance_bucket ?? '',
        candidate_grant: '',
      });
    }
  }, [displayMatches]);

  const openChat = useCallback(
    (match: Match) => {
      markMessaged(match.match_id);
      markConversationRead(match.pubkey);
      router.push({ pathname: '/chat', params: { pubkey: match.pubkey } });
    },
    [markMessaged, router]
  );

  // Conversations ordered by activity: messaged matches by last-message
  // time, then unmessaged matches newest first.
  const conversations = useMemo(() => {
    const withMessages = displayMatches
      .filter((m) => conversationLog.has(m.pubkey))
      .sort(
        (a, b) =>
          (conversationLog.get(b.pubkey)?.lastAt ?? 0) -
          (conversationLog.get(a.pubkey)?.lastAt ?? 0)
      );
    const withoutMessages = displayMatches.filter((m) => !conversationLog.has(m.pubkey));
    return [...withMessages, ...withoutMessages];
  }, [displayMatches, conversationLog]);

  if (loading && displayMatches.length === 0 && !isScreenshotMode) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.center}>
          <SymbolView
            name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
            size={40}
            tintColor={colors.accent}
            weight="medium"
          />
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            Loading your matches...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && displayMatches.length === 0 && !isScreenshotMode) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <EmptyState
          icon="📡"
          title="Couldn't load matches"
          subtitle={error}
          action={{ label: 'Try again', onPress: () => void refresh() }}
        />
      </SafeAreaView>
    );
  }

  if (displayMatches.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <EmptyState
          illustration={require('../../../assets/brand/empty-state-coffee-800x600.png')}
          title="No matches yet"
          subtitle="Express private interest in an introduction — when they choose you too, you'll meet here."
          action={{ label: 'View introductions', onPress: () => router.navigate('/discover') }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.match_id}
        renderItem={({ item }) => {
          const entry = conversationLog.get(item.pubkey);
          return (
            <ConversationRow
              match={item}
              preview={entry?.lastText}
              previewPrefix={entry?.lastOutgoing ? 'You: ' : ''}
              previewAt={entry?.lastAt ?? item.created_at}
              unread={entry?.unread ?? 0}
              onPress={() => openChat(item)}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          displayNewMatches.length > 0 ? (
            <NewMatchesRow matches={displayNewMatches} onPress={openChat} />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="No messages yet"
            subtitle="Say hello to one of your matches to start a conversation."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
      />
    </SafeAreaView>
  );
}

// ---- New matches carousel ----

interface NewMatchesRowProps {
  matches: Match[];
  onPress: (match: Match) => void;
}

function NewMatchesRow({ matches, onPress }: NewMatchesRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.newMatchesSection}>
      <Text style={[typography.titleMedium, styles.sectionTitle, { color: colors.text }]}>
        New Matches
      </Text>
      <FlatList
        horizontal
        data={matches}
        keyExtractor={(item) => item.match_id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.newMatchesContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPress(item)}
            style={({ pressed }) => [
              styles.newMatch,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Message ${displayNameOf(item)}`}
          >
            <Avatar
              match={item}
              size={76}
              ringColor={colors.accent}
              ring
            />
            <Text
              style={[typography.labelSmall, styles.newMatchName, { color: colors.text }]}
              numberOfLines={1}
            >
              {firstNameOf(item)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

// ---- Conversation row ----

interface ConversationRowProps {
  match: Match;
  preview?: string;
  previewPrefix?: string;
  previewAt: number;
  unread: number;
  onPress: () => void;
}

function ConversationRow({
  match,
  preview,
  previewPrefix = '',
  previewAt,
  unread,
  onPress,
}: ConversationRowProps) {
  const { colors } = useTheme();
  const hasPreview = preview !== undefined;
  const hasUnread = unread > 0;
  const name = displayNameOf(match);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceSheet : colors.surface },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        hasUnread
          ? `Open conversation with ${name}, ${unread} unread message${unread === 1 ? '' : 's'}`
          : `Open conversation with ${name}`
      }
    >
      <Avatar match={match} size={56} />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text
            style={[
              typography.titleSmall,
              styles.rowName,
              { color: colors.text },
              hasUnread && styles.rowNameUnread,
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            style={[
              typography.caption,
              { color: hasUnread ? colors.accent : colors.textTertiary },
            ]}
          >
            {formatTimestamp(previewAt)}
          </Text>
        </View>
        <View style={styles.rowPreviewLine}>
          <Text
            style={[
              typography.bodySmall,
              styles.rowPreview,
              {
                color: hasUnread
                  ? colors.text
                  : hasPreview
                    ? colors.textSecondary
                    : colors.textTertiary,
              },
              hasUnread && styles.rowPreviewUnread,
            ]}
            numberOfLines={1}
          >
            {hasPreview ? `${previewPrefix}${preview}` : 'Say hello!'}
          </Text>
          {hasUnread ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.accent }]}>
              <Text style={[typography.labelSmall, { color: colors.textInverse }]}>
                {unread > 9 ? '9+' : unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ---- Avatar ----

interface AvatarProps {
  match: Match;
  size: number;
  ring?: boolean;
  ringColor?: string;
}

function Avatar({ match, size, ring = false, ringColor }: AvatarProps) {
  const { colors } = useTheme();
  const photoUrl = match.profile?.photos?.find((p) => p.url.length > 0)?.url;

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceElevated,
          borderColor: ring ? ringColor : colors.border,
          borderWidth: ring ? 2.5 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.avatarImage}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`${displayNameOf(match)} photo`}
        />
      ) : (
        <SymbolView
          name={{ ios: 'person.fill', android: 'person', web: 'person' }}
          size={size * 0.45}
          tintColor={colors.textTertiary}
          weight="medium"
        />
      )}
    </View>
  );
}

function displayNameOf(match: Match): string {
  return match.profile?.display_name?.trim() || shortPubkey(match.pubkey, 6, 4);
}

function firstNameOf(match: Match): string {
  const name = displayNameOf(match);
  return name.split(/\s+/)[0];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  newMatchesSection: {
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  newMatchesContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  newMatch: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 84,
  },
  newMatchName: {
    maxWidth: 84,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowName: {
    flexShrink: 1,
  },
  rowNameUnread: {
    fontWeight: '700',
  },
  rowPreviewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowPreview: {
    flex: 1,
  },
  rowPreviewUnread: {
    fontWeight: '600',
  },
  unreadDot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.75,
  },
});
