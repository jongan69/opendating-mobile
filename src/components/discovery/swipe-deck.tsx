// Tinder-style swipe deck — pan gesture with spring-back, off-screen commit,
// stacked back cards, and UI-thread-only animation via Reanimated.
/* eslint-disable react-hooks/immutability */ // Reanimated shared value .value = is the library API, not React state
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  ReduceMotion,
  clamp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CandidateCard } from '@/components/discovery/candidate-card';
import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Candidate } from '@/types/opendating';

interface SwipeDeckProps {
  candidates: Candidate[];
  onLike: (pubkey: string, grant: string) => void;
  onPass: (pubkey: string) => void;
  /** Fetching the next batch — show skeletons instead of the deck */
  loading?: boolean;
  /** Forced empty state (e.g. no more candidates today) */
  empty?: boolean;
  /** Tap the middle of the top card to open the full profile */
  onPressCard?: (candidate: Candidate) => void;
}

export interface SwipeDeckHandle {
  swipe: (direction: 'left' | 'right') => void;
}

const MAX_ROTATION_DEG = 8;
const FLING_VELOCITY = 1200;
const BACK_CARD_1_SCALE = 0.94;
const BACK_CARD_1_Y = 12;
const BACK_CARD_2_SCALE = 0.88;
const BACK_CARD_2_Y = 24;

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 220,
  mass: 0.85,
  overshootClamping: false,
  reduceMotion: ReduceMotion.System,
} as const;

const COMMIT_CONFIG = {
  duration: 240,
  easing: Easing.out(Easing.quad),
  reduceMotion: ReduceMotion.System,
} as const;

export const SwipeDeck = forwardRef<SwipeDeckHandle, SwipeDeckProps>(function SwipeDeck(
  {
    candidates,
    onLike,
    onPass,
    loading = false,
    empty = false,
    onPressCard,
  }: SwipeDeckProps,
  ref
) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const [topIndex, setTopIndex] = useState(0);

  // Deck-level pose shared values (all animation on the UI thread)
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);
  const busy = useSharedValue(0);

  const swipeThreshold = screenWidth * 0.28;

  // Keep index valid if the candidate list shrinks
  useEffect(() => {
    setTopIndex((i) => (i > candidates.length ? candidates.length : i));
  }, [candidates.length]);

  const visible = useMemo(
    () => candidates.slice(topIndex, topIndex + 3),
    [candidates, topIndex]
  );
  const topCandidate = visible[0];

  const advance = useCallback(() => {
    setTopIndex((i) => Math.min(i + 1, candidates.length));
  }, [candidates.length]);

  const dispatchSwipe = useCallback(
    (dir: 'left' | 'right', pubkey: string | undefined, grant: string | undefined) => {
      if (!pubkey) return;
      if (dir === 'right') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {}
        );
        onLike(pubkey, grant ?? '');
      } else {
        Haptics.selectionAsync().catch(() => {});
        onPass(pubkey);
      }
    },
    [onLike, onPass]
  );

  const springBack = () => {
    'worklet';
    if (busy.value) return;
    tx.value = withSpring(0, SPRING_CONFIG);
    ty.value = withSpring(0, SPRING_CONFIG);
    rot.value = withSpring(0, SPRING_CONFIG);
    scale.value = withSpring(1, SPRING_CONFIG);
    progress.value = withTiming(
      0,
      { duration: reduceMotion ? 0 : 160, easing: Easing.out(Easing.quad) }
    );
  };

  const commit = (dir: 'left' | 'right') => {
    'worklet';
    if (busy.value) return;
    busy.value = 1;

    const isRight = dir === 'right';
    runOnJS(dispatchSwipe)(dir, topCandidate?.pubkey, topCandidate?.candidate_grant);

    const targetX = (isRight ? 1 : -1) * screenWidth * 1.35;
    tx.value = withTiming(targetX, COMMIT_CONFIG, (finished) => {
      'worklet';
      if (!finished) return;
      // Reset pose for the newly promoted top card (back-card pose already
      // interpolated to the full-size pose, so this snap is invisible).
      tx.value = 0;
      ty.value = 0;
      rot.value = 0;
      scale.value = 1;
      progress.value = 0;
      busy.value = 0;
      runOnJS(advance)();
    });
    rot.value = withTiming(
      isRight ? MAX_ROTATION_DEG * 1.5 : -MAX_ROTATION_DEG * 1.5,
      { duration: COMMIT_CONFIG.duration, reduceMotion: ReduceMotion.System }
    );
  };

  // Imperative swipe for the pass/like action buttons — same commit path as
  // a gesture fling, so state (busy guard, advancement) stays consistent.
  useImperativeHandle(
    ref,
    () => ({
      swipe: (direction: 'left' | 'right') => {
        commit(direction);
      },
    }),
    [commit]
  );

  const pan = Gesture.Pan()
    .minDistance(8)
    .onUpdate((e) => {
      if (busy.value) return;
      tx.value = e.translationX;
      ty.value = clamp(e.translationY, -64, 64);
      const p = clamp(Math.abs(tx.value) / swipeThreshold, 0, 1);
      progress.value = p;
      scale.value = 1 - 0.05 * p;
      rot.value = reduceMotion
        ? 0
        : clamp(tx.value / swipeThreshold, -1, 1) * MAX_ROTATION_DEG;
    })
    .onEnd((e) => {
      if (busy.value) return;
      const crossed =
        Math.abs(tx.value) > swipeThreshold || Math.abs(e.velocityX) > FLING_VELOCITY;
      if (!crossed) {
        springBack();
        return;
      }
      const dir =
        tx.value === 0
          ? e.velocityX > 0
            ? 'right'
            : 'left'
          : tx.value > 0
            ? 'right'
            : 'left';
      commit(dir);
    });

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }));

  const backCardStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateY: BACK_CARD_1_Y - BACK_CARD_1_Y * p },
        { scale: BACK_CARD_1_SCALE + (1 - BACK_CARD_1_SCALE) * p },
      ],
    };
  });

  const backCard2Style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateY: BACK_CARD_2_Y - (BACK_CARD_2_Y - BACK_CARD_1_Y) * p },
        { scale: BACK_CARD_2_SCALE + (BACK_CARD_1_SCALE - BACK_CARD_2_SCALE) * p },
      ],
    };
  });

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      tx.value,
      [0, swipeThreshold],
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [{ rotate: '-14deg' }],
  }));

  const passStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      tx.value,
      [-swipeThreshold, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
    transform: [{ rotate: '14deg' }],
  }));

  if (loading) {
    return <SkeletonDeck reduceMotion={reduceMotion} />;
  }

  const isEmpty = empty || visible.length === 0;
  if (isEmpty) {
    return (
      <EmptyState
        icon="🎉"
        title="You're all caught up"
        subtitle="Check back soon — new people nearby are added every day."
      />
    );
  }

  return (
    <View style={styles.container}>
      {visible.map((candidate, offset) => {
        if (offset === 0) {
          return (
            <GestureDetector key={candidate.pubkey} gesture={pan}>
              <Animated.View style={[styles.card, topCardStyle]}>
                <CandidateCard candidate={candidate} />
                {onPressCard ? (
                  <Pressable
                    style={styles.detailTapZone}
                    onPress={() => onPressCard(candidate)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${candidate.profile.display_name ?? 'candidate'} profile`}
                  />
                ) : null}
                <Animated.View
                  pointerEvents="none"
                  style={[styles.stamp, styles.stampLike, likeStampStyle]}
                >
                  <Text
                    style={[styles.stampText, { color: colors.like, borderColor: colors.like }]}
                  >
                    LIKE
                  </Text>
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.stamp, styles.stampPass, passStampStyle]}
                >
                  <Text
                    style={[styles.stampText, { color: colors.pass, borderColor: colors.pass }]}
                  >
                    PASS
                  </Text>
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          );
        }
        if (offset === 1) {
          return (
            <Animated.View key={candidate.pubkey} style={[styles.card, backCardStyle]}>
              <CandidateCard candidate={candidate} />
            </Animated.View>
          );
        }
        return (
          <Animated.View key={candidate.pubkey} style={[styles.card, backCard2Style]}>
            <CandidateCard candidate={candidate} />
          </Animated.View>
        );
      })}
    </View>
  );
});

// ---- Loading skeleton ----

function SkeletonDeck({ reduceMotion }: { reduceMotion: boolean }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0.7;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 850,
        easing: Easing.inOut(Easing.quad),
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      true
    );
  }, [reduceMotion, pulse]);

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View style={styles.container} accessibilityLabel="Loading candidates">
      <Animated.View
        style={[
          styles.card,
          styles.skeletonCard,
          { backgroundColor: colors.skeleton },
          skeletonStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.card,
          styles.skeletonCardBack,
          { backgroundColor: colors.skeleton },
          skeletonStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    ...StyleSheet.absoluteFill,
  },
  stamp: {
    position: 'absolute',
    top: spacing.xxl,
    zIndex: 5,
  },
  stampLike: {
    right: spacing.xl,
  },
  stampPass: {
    left: spacing.xl,
  },
  stampText: {
    ...typography.displayMedium,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
    borderWidth: 4,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  detailTapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33%',
    right: '33%',
    zIndex: 4,
  },
  skeletonCard: {
    borderRadius: radius.xxl,
  },
  skeletonCardBack: {
    transform: [{ translateY: BACK_CARD_1_Y }, { scale: BACK_CARD_1_SCALE }],
  },
});
