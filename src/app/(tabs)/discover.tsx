// Discover — the main card deck. Minimal chrome: brand header with a
// filter entry point, the swipe deck, and pass/like controls.

import { useCallback, useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { SwipeDeck, type SwipeDeckHandle } from '@/components/discovery/swipe-deck';
import { EmptyState } from '@/components/ui/empty-state';
import { useDiscovery } from '@/features/discovery/use-discovery';
import { cacheCandidates, getCachedCandidate } from '@/features/discovery/candidate-cache';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Candidate } from '@/types/opendating';

export default function DiscoverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { candidates, loading, error, like, pass, fetchCandidates } = useDiscovery();
  const deckRef = useRef<SwipeDeckHandle>(null);

  // Feed the detail screens from whatever the deck has shown.
  useEffect(() => {
    cacheCandidates(candidates);
  }, [candidates]);

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

  const showErrorState =
    !!error && candidates.length === 0 && !loading;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Brand header + filters */}
      <View style={styles.header}>
        <Text style={[typography.titleLarge, { color: colors.text }]}>
          OpenDating
        </Text>
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

      {/* Deck / states */}
      <View style={styles.deckArea}>
        {showErrorState ? (
          <EmptyState
            icon="📡"
            title="Couldn't load candidates"
            subtitle={error}
            action={{ label: 'Try again', onPress: () => void fetchCandidates() }}
          />
        ) : (
          <SwipeDeck
            ref={deckRef}
            candidates={candidates}
            onLike={(pubkey, grant) => void handleLike(pubkey, grant)}
            onPass={handlePass}
            onPressCard={handleOpenCandidate}
            loading={loading && candidates.length === 0}
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
});
