// Candidate detail — the full profile behind a private introduction.
//
// Reads entirely from the candidate cache. It deliberately does NOT call
// useDiscovery(): that hook's mount effect fetches a page of candidates and
// reads GPS, so calling it here fired a redundant round-trip and a location
// read every single time a profile was opened, into a second copy of the
// discovery stack whose state nothing else could see.
//
// Interest and skip decisions are posted to the existing decision channel and
// applied by the Introductions screen, which owns the live candidate grant.

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { SafetyMenu, type SafetyMenuHandle } from '@/components/safety/safety-menu';
import { useCachedCandidate } from '@/features/discovery/candidate-cache';
import { postIntroductionDecision } from '@/features/discovery/introduction-decisions';
import { distanceLabel, genderLabel, intentLabel } from '@/lib/profile-labels';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function CandidateDetail() {
  const { pubkey } = useLocalSearchParams<{ pubkey: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  // Read at render, not module load: a module-scope Dimensions.get() is
  // captured once at import and never updates, which is wrong on a rotating
  // iPad — and this app ships with supportsTablet.
  const { width: screenWidth } = useWindowDimensions();
  const candidate = useCachedCandidate(pubkey);
  const safetyRef = useRef<SafetyMenuHandle>(null);
  const decidedRef = useRef(false);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(() => new Set());

  const styles = useMemo(() => makeStyles(colors, screenWidth), [colors, screenWidth]);

  const photos = useMemo(
    () =>
      [...(candidate?.profile.photos ?? [])]
        .sort((a, b) => a.order - b.order)
        .filter((p) => p.url.length > 0 && !failedUrls.has(p.url)),
    [candidate?.profile.photos, failedUrls]
  );

  const handleImageError = useCallback((url: string) => {
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const decide = useCallback(
    (direction: 'like' | 'pass') => {
      if (!candidate) return;
      // Navigation unmounts asynchronously; latch before notifying the
      // discovery screen so a double tap cannot reuse the same grant.
      if (decidedRef.current) return;
      decidedRef.current = true;
      if (direction === 'like') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } else {
        Haptics.selectionAsync().catch(() => {});
      }
      postIntroductionDecision({
        pubkey: candidate.pubkey,
        choice: direction === 'like' ? 'interest' : 'skip',
        grant: candidate.candidate_grant,
      });
      router.back();
    },
    [candidate, router]
  );

  if (!candidate) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <DetailHeader onBack={() => router.back()} colors={colors} />
        <View style={styles.center}>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>
            This profile is no longer available
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.backToIntroductions,
              { borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[typography.labelLarge, { color: colors.accent }]}>
              Back to introductions
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { profile } = candidate;
  const displayName = profile.display_name?.trim() || 'New Friend';
  const isVerified = (profile.verification_claims ?? []).length > 0;
  const intent = intentLabel(profile.relationship_intent);
  const gender = genderLabel(profile.gender);
  const distance = distanceLabel(candidate.distance_bucket);
  const prompts = (profile.prompts ?? []).filter(
    (p) => p.question.trim().length > 0 && p.answer.trim().length > 0
  );
  const interests = (profile.interests ?? []).filter(Boolean);
  // Distance and gender are facts about the person; intent gets its own chip
  // below, so repeating it in the subtitle just said the same thing twice.
  const subtitle = [distance, gender].filter(Boolean).join(' · ');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      // 'bottom' matters here: the like/pass bar is pinned to the bottom of the
      // screen, and without the inset it sits underneath the Android
      // navigation bar and the iOS home indicator.
      edges={['top', 'bottom']}
    >
      <DetailHeader
        onBack={() => router.back()}
        onSafety={() => safetyRef.current?.present()}
        colors={colors}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {photos.length > 0 ? (
          <View style={styles.photoScroller}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) =>
                setPhotoIndex(
                  Math.round(event.nativeEvent.contentOffset.x / screenWidth)
                )
              }
            >
              {photos.map((photo, index) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.url }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  recyclingKey={photo.url}
                  accessibilityLabel={`${displayName} photo ${index + 1} of ${photos.length}`}
                  onError={() => handleImageError(photo.url)}
                />
              ))}
            </ScrollView>
            {photos.length > 1 ? (
              <View style={styles.dots} pointerEvents="none">
                {photos.map((photo, index) => (
                  <View
                    key={photo.id}
                    style={[
                      styles.dot,
                      index === photoIndex
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={[typography.displayLarge, { color: colors.textTertiary }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>
              No photos yet
            </Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={[typography.headlineLarge, styles.name, { color: colors.text }]}>
              {displayName}
              {profile.age ? `, ${profile.age}` : ''}
            </Text>
            {isVerified ? (
              <SymbolView
                name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                size={22}
                tintColor={colors.success}
                weight="semibold"
              />
            ) : null}
          </View>

          {subtitle ? (
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}

          {intent ? (
            <View style={[styles.intentChip, { backgroundColor: colors.accentLight }]}>
              <Text style={[typography.labelMedium, { color: colors.accent }]}>
                Looking for: {intent}
              </Text>
            </View>
          ) : null}

          {profile.bio?.trim() ? (
            <Section title="About" colors={colors}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                {profile.bio.trim()}
              </Text>
            </Section>
          ) : null}

          {prompts.length > 0 ? (
            <Section title="Prompts" colors={colors}>
              {prompts.map((prompt) => (
                <View
                  key={`${prompt.question}-${prompt.answer}`}
                  style={[
                    styles.promptCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Text style={[typography.labelMedium, { color: colors.accent }]}>
                    {prompt.question}
                  </Text>
                  <Text style={[typography.bodyMedium, { color: colors.text }]}>
                    {prompt.answer}
                  </Text>
                </View>
              ))}
            </Section>
          ) : null}

          {interests.length > 0 ? (
            <Section title="Interests" colors={colors}>
              <View style={styles.chips}>
                {interests.map((interest) => (
                  <View
                    key={interest}
                    style={[styles.chip, { backgroundColor: colors.accentLight }]}
                  >
                    <Text style={[typography.labelSmall, { color: colors.accent }]}>
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}
        </View>
      </ScrollView>

      {/* Explicit text preserves the deliberate-introduction model on the full
          profile and makes the privacy consequence of each choice clear. */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => decide('pass')}
          accessibilityRole="button"
          accessibilityLabel={`Privately skip ${displayName}`}
          hitSlop={spacing.sm}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[typography.labelLarge, { color: colors.text }]}>Skip privately</Text>
        </Pressable>
        <Pressable
          onPress={() => decide('like')}
          accessibilityRole="button"
          accessibilityLabel={`Express private interest in ${displayName}`}
          hitSlop={spacing.sm}
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonPrimary,
            { backgroundColor: colors.accent },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>Private interest</Text>
        </Pressable>
      </View>

      <SafetyMenu
        ref={safetyRef}
        targetPubkey={candidate.pubkey}
        targetName={displayName}
        onBlock={() => router.back()}
      />
    </SafeAreaView>
  );
}

function DetailHeader({
  onBack,
  onSafety,
  colors,
}: {
  onBack: () => void;
  onSafety?: () => void;
  colors: ThemeColors;
}) {
  return (
    <View style={headerStyles.row}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={spacing.md}
        style={({ pressed }) => [
          headerStyles.button,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && headerStyles.pressed,
        ]}
      >
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          size={20}
          tintColor={colors.text}
          weight="semibold"
        />
      </Pressable>
      {onSafety ? (
        <Pressable
          onPress={onSafety}
          accessibilityRole="button"
          accessibilityLabel="Safety options"
          hitSlop={spacing.md}
          style={({ pressed }) => [
            headerStyles.button,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && headerStyles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
            size={20}
            tintColor={colors.text}
            weight="semibold"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.section}>
      <Text style={[typography.titleSmall, sectionStyles.title, { color: colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

const sectionStyles = StyleSheet.create({
  section: {
    marginTop: spacing.xxl,
  },
  title: {
    marginBottom: spacing.sm,
  },
});

function makeStyles(colors: ThemeColors, screenWidth: number) {
  const photoHeight = screenWidth * 1.25;
  return StyleSheet.create({
    container: { flex: 1 },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.lg,
      padding: spacing.xl,
    },
    backToIntroductions: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.97 }],
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
    },
    photoScroller: {
      height: photoHeight,
    },
    photo: {
      width: screenWidth,
      height: photoHeight,
      backgroundColor: colors.surface,
    },
    photoPlaceholder: {
      width: screenWidth,
      height: photoHeight,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
    },
    dots: {
      position: 'absolute',
      top: spacing.lg,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs + 2,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: radius.full,
    },
    dotActive: {
      width: 16,
      backgroundColor: '#FFFFFF',
    },
    dotInactive: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
    },
    content: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    name: {
      flexShrink: 1,
    },
    intentChip: {
      alignSelf: 'flex-start',
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.md,
    },
    promptCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    actionButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    actionButtonPrimary: {
      borderWidth: 0,
    },
  });
}
