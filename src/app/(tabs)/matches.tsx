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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMatches } from '@/features/matching/use-matches';
import { useConversationLog } from '@/features/messaging/conversation-log';
import { cacheCandidate } from '@/features/discovery/candidate-cache';
import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/state/theme-context';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shortPubkey, formatTimestamp } from '@/lib/format';
import type { Match } from '@/types/opendating';

export default function MatchesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { matches, newMatches, loading, error, refresh, markMessaged } = useMatches();
  const conversationLog = useConversationLog();

  // Feed the chat and candidate screens from match data.
  useEffect(() => {
    for (const match of matches) {
      cacheCandidate({
        pubkey: match.pubkey,
        profile: match.profile,
        distance_bucket: match.distance_bucket ?? '',
        candidate_grant: '',
      });
    }
  }, [matches]);

  const openChat = useCallback(
    (match: Match) => {
      markMessaged(match.match_id);
      router.push(`/chat/${match.pubkey}`);
    },
    [markMessaged, router]
  );

  // Conversations ordered by activity: messaged matches by last-message
  // time, then unmessaged matches newest first.
  const conversations = useMemo(() => {
    const withMessages = matches
      .filter((m) => conversationLog.has(m.pubkey))
      .sort(
        (a, b) =>
          (conversationLog.get(b.pubkey)?.lastAt ?? 0) -
          (conversationLog.get(a.pubkey)?.lastAt ?? 0)
      );
    const withoutMessages = matches.filter((m) => !conversationLog.has(m.pubkey));
    return [...withMessages, ...withoutMessages];
  }, [matches, conversationLog]);

  if (loading && matches.length === 0) {
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

  if (error && matches.length === 0) {
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

  if (matches.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <EmptyState
          illustration={require('../../../assets/brand/empty-state-coffee-800x600.png')}
          title="No matches yet"
          subtitle="Swipe right on profiles you like — when they like you back, you'll see them here."
          action={{ label: 'Start discovering', onPress: () => router.navigate('/discover') }}
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
        renderItem={({ item }) => (
          <ConversationRow
            match={item}
            preview={conversationLog.get(item.pubkey)?.lastText}
            previewAt={
              conversationLog.get(item.pubkey)?.lastAt ?? item.created_at
            }
            onPress={() => openChat(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          newMatches.length > 0 ? (
            <NewMatchesRow matches={newMatches} onPress={openChat} />
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
  previewAt: number;
  onPress: () => void;
}

function ConversationRow({ match, preview, previewAt, onPress }: ConversationRowProps) {
  const { colors } = useTheme();
  const hasPreview = preview !== undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceSheet : colors.surface },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${displayNameOf(match)}`}
    >
      <Avatar match={match} size={56} />
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={[typography.titleSmall, styles.rowName, { color: colors.text }]} numberOfLines={1}>
            {displayNameOf(match)}
          </Text>
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            {formatTimestamp(previewAt)}
          </Text>
        </View>
        <Text
          style={[
            typography.bodySmall,
            styles.rowPreview,
            { color: hasPreview ? colors.textSecondary : colors.textTertiary },
          ]}
          numberOfLines={1}
        >
          {hasPreview ? preview : 'Say hello!'}
        </Text>
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
  const photoUrl = match.profile.photos?.find((p) => p.url.length > 0)?.url;

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
  return match.profile.display_name?.trim() || shortPubkey(match.pubkey, 6, 4);
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
  rowPreview: {
    paddingRight: spacing.sm,
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
