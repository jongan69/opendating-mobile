// Discover — the main card deck. Minimal chrome: brand header with a
// filter entry point, the swipe deck, and pass/like controls.

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { SwipeDeck, type SwipeDeckHandle } from '@/components/discovery/swipe-deck';
import { EmptyState } from '@/components/ui/empty-state';
import { BrandMark } from '@/components/brand/brand-mark';
import { useDiscovery } from '@/features/discovery/use-discovery';
import { cacheCandidates, getCachedCandidate } from '@/features/discovery/candidate-cache';
import { useTheme } from '@/state/theme-context';
import { isScreenshotMode } from '@/constants/env';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { Candidate } from '@/types/opendating';

const DEMO_CANDIDATES: Candidate[] = [
  {
    pubkey: 'demo-candidate-1',
    candidate_grant: 'demo-grant-1',
    distance_bucket: 'nearby',
    profile: {
      display_name: 'Emma',
      age: 25,
      gender: 'woman',
      bio: 'Dog mom 🐕 | Yoga teacher | Always looking for the best brunch spots',
      photos: [],
      interests: ['yoga', 'dogs', 'brunch', 'travel'],
      relationship_intent: 'long_term',
      prompts: [{ question: 'My simple pleasures', answer: 'Morning coffee, rainy Sundays, and fresh sourdough.' }],
    },
  },
  {
    pubkey: 'demo-candidate-2',
    candidate_grant: 'demo-grant-2',
    distance_bucket: 'within 5 mi',
    profile: {
      display_name: 'Marcus',
      age: 31,
      gender: 'man',
      bio: 'Software engineer by day, rock climber by weekend. Looking for a partner in crime.',
      photos: [],
      interests: ['climbing', 'music', 'road trips', 'tacos'],
      relationship_intent: 'long_term',
      prompts: [{ question: "I'm weirdly good at…", answer: 'Parallel parking and remembering useless movie quotes.' }],
    },
  },
  {
    pubkey: 'demo-candidate-3',
    candidate_grant: 'demo-grant-3',
    distance_bucket: 'nearby',
    profile: {
      display_name: 'Jordan',
      age: 27,
      gender: 'nonbinary',
      bio: 'Art curator 🎨 | Vinyl collector | Cat person',
      photos: [],
      interests: ['art', 'vinyl', 'cats', 'coffee'],
      relationship_intent: 'figuring_out',
      prompts: [{ question: 'A fun fact about me', answer: 'I once got lost in the Louvre for 6 hours and loved every minute.' }],
    },
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    candidates,
    loading,
    error,
    unavailable,
    remainingToday,
    loaded,
    like,
    pass,
    fetchCandidates,
    clearError,
  } = useDiscovery();
  const deckRef = useRef<SwipeDeckHandle>(null);

  // In screenshot mode, use demo candidates to show a populated deck
  const displayCandidates = useMemo(
    () => (isScreenshotMode ? DEMO_CANDIDATES : candidates),
    [candidates]
  );

  // Feed the detail screens from whatever the deck has shown.
  useEffect(() => {
    cacheCandidates(displayCandidates);
  }, [displayCandidates]);

  const presentMatch = useCallback(
    (pubkey: string) => {
      const candidate = getCachedCandidate(pubkey);
      const name = candidate?.profile.display_name?.trim() || 'your match';
      Alert.alert("It's a match!", `You and ${name} liked each other.`, [
        { text: 'Keep swiping', style: 'cancel' },
        {
          text: 'Say hello',
          onPress: () => router.push(`/chat/${pubkey}`),
        },
      ]);
    },
    [router]
  );

  const handleLike = useCallback(
    async (pubkey: string, grant: string) => {
      try {
        const matched = await like(pubkey, grant);
        if (matched) presentMatch(pubkey);
      } catch (err) {
        // like() surfaces errors via hook state; this is a safety net.
        if (err instanceof Error && err.message) {
          Alert.alert('Could not like', err.message);
        }
      }
    },
    [like, presentMatch]
  );

  const handlePass = useCallback(
    (pubkey: string) => {
      pass(pubkey);
    },
    [pass]
  );

  const handleOpenCandidate = useCallback(
    (candidate: Candidate) => {
      router.push(`/candidate/${candidate.pubkey}`);
    },
    [router]
  );

  const swipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      Haptics.selectionAsync().catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    deckRef.current?.swipe(direction);
  }, []);

  // A blocking state only when there is nothing to show. With cards on
  // screen an error becomes a dismissible banner instead, so a single failed
  // like never wipes out the deck.
  const showErrorState =
    !isScreenshotMode && !!error && candidates.length === 0 && !loading;
  const showErrorBanner =
    !isScreenshotMode && !!error && candidates.length > 0;
  const outOfLikes = loaded && !unavailable && remainingToday === 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Brand header + filters */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <BrandMark size={28} />
          <Text style={[typography.titleLarge, { color: colors.text }]}>
            OpenDating
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/filters')}
          hitSlop={spacing.md}
          style={({ pressed }) => [
            styles.filterButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Discovery filters"
        >
          <SymbolView
            name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
            size={20}
            tintColor={colors.text}
            weight="medium"
          />
        </Pressable>
      </View>

      {showErrorBanner ? (
        <Pressable
          onPress={clearError}
          accessibilityRole="button"
          accessibilityLabel={`${error}. Tap to dismiss.`}
          style={[styles.errorBanner, { backgroundColor: colors.destructiveLight }]}
        >
          <Text style={[typography.bodySmall, { color: colors.destructive, flex: 1 }]}>
            {error}
          </Text>
          <Text style={[typography.labelMedium, { color: colors.destructive }]}>✕</Text>
        </Pressable>
      ) : null}

      {/* Deck / states */}
      <View style={styles.deckArea}>
        {showErrorState ? (
          unavailable ? (
            <EmptyState
              icon="🌱"
              title="Discovery is coming online"
              subtitle={error}
              action={{ label: 'Check again', onPress: () => void fetchCandidates() }}
            />
          ) : (
            <EmptyState
              icon="📡"
              title="Couldn't load candidates"
              subtitle={error}
              action={{ label: 'Try again', onPress: () => void fetchCandidates() }}
            />
          )
        ) : (
          <SwipeDeck
            ref={deckRef}
            candidates={displayCandidates}
            onLike={(pubkey, grant) => void handleLike(pubkey, grant)}
            onPass={handlePass}
            onPressCard={handleOpenCandidate}
            loading={loading && displayCandidates.length === 0 && !isScreenshotMode}
          />
        )}
      </View>

      {/* Pass / Like controls */}
      <View style={styles.actions}>
        <ActionButton
          label="Pass"
          onPress={() => swipe('left')}
          accessibilityLabel="Pass on this profile"
        >
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={30}
            tintColor={colors.text}
            weight="semibold"
          />
        </ActionButton>
        <ActionButton
          label="Like"
          primary
          onPress={() => swipe('right')}
          accessibilityLabel="Like this profile"
        >
          <SymbolView
            name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
            size={32}
            tintColor="#FFFFFF"
            weight="semibold"
          />
        </ActionButton>
      </View>

      {/* Daily quota — fetched all along but never shown, so users hit the
          limit with no warning. */}
      {!isScreenshotMode && loaded && !unavailable && displayCandidates.length > 0 ? (
        <Text
          style={[
            typography.caption,
            styles.quota,
            { color: outOfLikes ? colors.warning : colors.textTertiary },
          ]}
        >
          {outOfLikes
            ? "That's all your likes for today — more tomorrow"
            : `${remainingToday} like${remainingToday === 1 ? '' : 's'} left today`}
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  primary?: boolean;
  children: React.ReactNode;
}

function ActionButton({
  label,
  onPress,
  accessibilityLabel,
  primary = false,
  children,
}: ActionButtonProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.actionColumn}>
      <Pressable
        onPress={onPress}
        hitSlop={spacing.md}
        style={({ pressed }) => [
          styles.actionButton,
          primary
            ? { backgroundColor: colors.accent }
            : {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: StyleSheet.hairlineWidth,
              },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
      <Text style={[typography.labelSmall, styles.actionLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  deckArea: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxxl,
    paddingVertical: spacing.lg,
  },
  actionColumn: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quota: {
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});
