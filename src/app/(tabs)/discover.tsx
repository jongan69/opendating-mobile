// Introductions — one deliberate, private introduction at a time.
//
// Unlike a swipe deck, this screen explains why two profiles were introduced
// and what remains withheld. Decisions use the same protocol grants and local
// privacy guarantees as before; only the member-facing interaction changes.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';

import { CandidateCard } from '@/components/discovery/candidate-card';
import { EmptyState } from '@/components/ui/empty-state';
import { BrandMark } from '@/components/brand/brand-mark';
import { useDiscovery } from '@/features/discovery/use-discovery';
import { cacheCandidates, getCachedCandidate } from '@/features/discovery/candidate-cache';
import { introductionReasons } from '@/features/discovery/private-introduction';
import {
  consumeIntroductionDecision,
  subscribeIntroductionDecisions,
  type IntroductionDecision,
} from '@/features/discovery/introduction-decisions';
import { useProfileContent } from '@/features/profile/profile-content';
import { useTheme } from '@/state/theme-context';
import { isScreenshotMode } from '@/constants/env';
import {
  getScreenshotCandidates,
  getScreenshotProfileContent,
} from '@/constants/screenshot-demo';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { Candidate } from '@/types/opendating';

export default function IntroductionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { content: ownProfile } = useProfileContent();
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
  const interestPendingRef = useRef(false);
  const [interestPending, setInterestPending] = useState(false);

  const screenshotCandidates = useMemo(() => getScreenshotCandidates(), []);
  const screenshotProfile = useMemo(() => getScreenshotProfileContent(), []);
  const displayCandidates = useMemo(
    () => (isScreenshotMode ? screenshotCandidates : candidates),
    [candidates, screenshotCandidates]
  );
  const currentCandidate = displayCandidates[0];
  const reasons = useMemo(
    () =>
      currentCandidate
        ? introductionReasons(
            isScreenshotMode ? screenshotProfile : ownProfile,
            currentCandidate
          )
        : [],
    [currentCandidate, ownProfile, screenshotProfile]
  );

  useEffect(() => {
    cacheCandidates(displayCandidates);
  }, [displayCandidates]);

  const presentMatch = useCallback(
    (pubkey: string) => {
      const candidate = getCachedCandidate(pubkey);
      const name = candidate?.profile.display_name?.trim() || 'your introduction';
      Alert.alert('Mutual interest', `You and ${name} chose each other. Your private chat is now open.`, [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Say hello',
          onPress: () => router.push({ pathname: '/chat', params: { pubkey } }),
        },
      ]);
    },
    [router]
  );

  const handleInterest = useCallback(
    async (pubkey: string, grant: string) => {
      if (interestPendingRef.current) return;
      interestPendingRef.current = true;
      setInterestPending(true);
      try {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
        const matched = await like(pubkey, grant);
        if (matched) presentMatch(pubkey);
      } finally {
        interestPendingRef.current = false;
        setInterestPending(false);
      }
    },
    [like, presentMatch]
  );

  const handleSkip = useCallback(
    (pubkey: string) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
      pass(pubkey);
    },
    [pass]
  );

  const handleOpenCandidate = useCallback(
    (candidate: Candidate) =>
      router.push({ pathname: '/candidate', params: { pubkey: candidate.pubkey } }),
    [router]
  );

  useEffect(() => {
    const apply = (decision: IntroductionDecision) => {
      if (decision.choice === 'interest' && decision.grant) {
        void handleInterest(decision.pubkey, decision.grant);
      } else {
        handleSkip(decision.pubkey);
      }
    };
    const queued = consumeIntroductionDecision();
    if (queued) apply(queued);
    return subscribeIntroductionDecisions((decision) => {
      consumeIntroductionDecision();
      apply(decision);
    });
  }, [handleInterest, handleSkip]);

  const showErrorState =
    !isScreenshotMode && !!error && candidates.length === 0 && !loading;
  const showErrorBanner =
    !isScreenshotMode && !!error && candidates.length > 0;
  const outOfInterests = loaded && !unavailable && remainingToday === 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <BrandMark size={28} />
          <View>
            <Text style={[typography.titleLarge, { color: colors.text }]}>Introductions</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>One person, with context</Text>
          </View>
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
          accessibilityLabel="Introduction preferences"
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
          <Text style={[typography.bodySmall, { color: colors.destructive, flex: 1 }]}>{error}</Text>
          <Text style={[typography.labelMedium, { color: colors.destructive }]}>✕</Text>
        </Pressable>
      ) : null}

      {showErrorState ? (
        <View style={styles.emptyArea}>
          <EmptyState
            icon={unavailable ? '🌱' : '📡'}
            title={unavailable ? 'Introductions are coming online' : "Couldn't load introductions"}
            subtitle={error}
            action={{ label: 'Check again', onPress: () => void fetchCandidates() }}
          />
        </View>
      ) : currentCandidate ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.whyCard, { backgroundColor: colors.accentLight, borderColor: colors.accentMuted }]}>
            <View style={styles.cardTitleRow}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={19}
                tintColor={colors.accent}
              />
              <Text style={[typography.titleSmall, { color: colors.text }]}>Why this introduction</Text>
            </View>
            {reasons.map((reason) => (
              <View key={reason} style={styles.reasonRow}>
                <View style={[styles.reasonDot, { backgroundColor: colors.accent }]} />
                <Text style={[typography.bodySmall, { color: colors.textSecondary, flex: 1 }]}>{reason}</Text>
              </View>
            ))}
          </View>

          <View style={styles.profileCard}>
            <CandidateCard
              candidate={currentCandidate}
              onOpenProfile={() => handleOpenCandidate(currentCandidate)}
            />
          </View>

          <View style={[styles.receipt, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardTitleRow}>
              <SymbolView
                name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
                size={20}
                tintColor={colors.success}
              />
              <Text style={[typography.titleSmall, { color: colors.text }]}>Privacy receipt</Text>
            </View>
            <ReceiptRow label="Shared now" value="Public profile · approximate area" />
            <ReceiptRow label="Withheld" value="Exact location · your decision" />
            <ReceiptRow label="After mutual interest" value="End-to-end encrypted chat" />
          </View>

          <View style={styles.actions}>
            <IntroductionButton
              label="Skip privately"
              disabled={interestPending}
              accessibilityLabel={`Privately skip ${currentCandidate.profile.display_name ?? 'this introduction'}`}
              onPress={() => handleSkip(currentCandidate.pubkey)}
            />
            <IntroductionButton
              label="Express private interest"
              primary
              disabled={!currentCandidate.candidate_grant || outOfInterests || interestPending}
              accessibilityLabel={`Express private interest in ${currentCandidate.profile.display_name ?? 'this introduction'}`}
              onPress={() => void handleInterest(currentCandidate.pubkey, currentCandidate.candidate_grant)}
            />
          </View>

          {!isScreenshotMode && loaded && !unavailable ? (
            <Text style={[typography.caption, styles.quota, { color: outOfInterests ? colors.warning : colors.textTertiary }]}>
              {outOfInterests
                ? 'Private interests refresh tomorrow'
                : `${remainingToday} private interest${remainingToday === 1 ? '' : 's'} available today`}
            </Text>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.emptyArea}>
          <EmptyState
            illustration={require('../../../assets/brand/empty-state-coffee-800x600.png')}
            title={loading ? 'Preparing an introduction' : "You're all caught up"}
            subtitle={loading ? 'Comparing only the preferences you chose.' : 'Check back soon for another private introduction.'}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.receiptRow}>
      <Text style={[typography.labelMedium, { color: colors.text }]}>{label}</Text>
      <Text style={[typography.bodySmall, styles.receiptValue, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

function IntroductionButton({
  label,
  accessibilityLabel,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.actionButton,
        primary
          ? { backgroundColor: colors.accent, borderColor: colors.accent }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[typography.labelLarge, { color: primary ? '#FFFFFF' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg },
  whyCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reasonDot: { width: 6, height: 6, borderRadius: radius.full },
  profileCard: { height: 480, minHeight: 420 },
  receipt: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  receiptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  receiptValue: { flex: 1, textAlign: 'right' },
  actions: { gap: spacing.md },
  actionButton: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  quota: { textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  emptyArea: { flex: 1 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
});
