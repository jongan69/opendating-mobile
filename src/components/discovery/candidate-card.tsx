// Single candidate card — photo-first with paging dots, gradient overlay, and profile info
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Candidate, CandidatePhoto } from '@/types/opendating';

interface CandidateCardProps {
  candidate: Candidate;
  /** Controlled photo index — changes from outside sync the card's internal pager */
  photoIndex?: number;
  /** Called whenever the pager advances (tap left/right) */
  onPhotoTap?: (index: number) => void;
}

const GRADIENT_COLORS: readonly [string, string] = [
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 0.72)',
];

export function CandidateCard({
  candidate,
  photoIndex = 0,
  onPhotoTap,
}: CandidateCardProps) {
  const { colors, isDark } = useTheme();
  const [index, setIndex] = useState(photoIndex);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const photos = useMemo<CandidatePhoto[]>(
    () =>
      [...(candidate.profile.photos ?? [])]
        .sort((a, b) => a.order - b.order)
        .filter((p) => p.url.length > 0),
    [candidate.profile.photos]
  );

  // Keep internal pager in sync when parent drives photoIndex
  useEffect(() => {
    setIndex((current) => {
      const next = Math.min(photoIndex, Math.max(photos.length - 1, 0));
      return next === current ? current : next;
    });
  }, [photoIndex, photos.length]);

  const activeUrl = photos[index]?.url;
  const hasUsablePhoto =
    photos.length > 0 && activeUrl != null && !failedUrls.has(activeUrl);

  const goTo = useCallback(
    (delta: number) => {
      if (photos.length === 0) return;
      const next = (index + delta + photos.length) % photos.length;
      setIndex(next);
      onPhotoTap?.(next);
    },
    [index, photos.length, onPhotoTap]
  );

  const handleImageError = useCallback((url: string) => {
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const profile = candidate.profile;
  const displayName = profile.display_name?.trim() || 'New Friend';
  const ageLabel = typeof profile.age === 'number' ? `, ${profile.age}` : '';
  const isVerified = (profile.verification_claims ?? []).length > 0;
  const distanceLabel = prettyDistance(candidate.distance_bucket);
  const intent = profile.relationship_intent?.trim();
  const interests = (profile.interests ?? []).filter(Boolean).slice(0, 3);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
        isDark && styles.containerShadowDark,
        !isDark && styles.containerShadowLight,
      ]}
    >
      {hasUsablePhoto ? (
        <>
          <Image
            source={{ uri: activeUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
            recyclingKey={activeUrl}
            cachePolicy="memory-disk"
            accessibilityLabel={`${displayName} photo ${index + 1} of ${photos.length}`}
            onError={() => handleImageError(activeUrl)}
          />
          {/* Tap zones for photo paging — left third goes back, rest goes forward */}
          {photos.length > 1 ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous photo"
                style={[styles.tapZone, styles.tapZoneLeft]}
                onPress={() => goTo(-1)}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next photo"
                style={[styles.tapZone, styles.tapZoneRight]}
                onPress={() => goTo(1)}
              />
            </>
          ) : null}
        </>
      ) : (
        <PhotoPlaceholder />
      )}

      {/* Paging dots */}
      {photos.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((photo, i) => (
            <View
              key={photo.id}
              style={[
                styles.dot,
                i === index
                  ? [styles.dotActive, { backgroundColor: '#FFFFFF' }]
                  : { backgroundColor: 'rgba(255, 255, 255, 0.45)' },
              ]}
            />
          ))}
        </View>
      ) : null}

      {/* Bottom gradient + info */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={[0, 1]}
        pointerEvents="none"
        style={styles.gradient}
      >
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
              {ageLabel}
            </Text>
            {isVerified ? (
              <View
                style={styles.verifiedBadge}
                accessibilityLabel="Verified"
                accessibilityRole="image"
              >
                <Text style={styles.verifiedCheck}>✓</Text>
              </View>
            ) : null}
          </View>

          {distanceLabel ? (
            <Text style={styles.distance} numberOfLines={1}>
              {distanceLabel}
            </Text>
          ) : null}

          {intent ? (
            <View style={styles.intentRow}>
              <Text style={styles.intent} numberOfLines={1}>
                {intent}
              </Text>
            </View>
          ) : null}

          {interests.length > 0 ? (
            <View style={styles.interests}>
              {interests.map((interest) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText} numberOfLines={1}>
                    {interest}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

function PhotoPlaceholder() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.placeholder,
        { backgroundColor: colors.surfaceElevated },
      ]}
      accessibilityLabel="No photo available"
    >
      <View style={[styles.placeholderHead, { borderColor: colors.border }]} />
      <View style={[styles.placeholderBody, { borderColor: colors.border }]} />
      <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
        No photos yet
      </Text>
    </View>
  );
}

function prettyDistance(bucket: string | undefined | null): string {
  if (!bucket) return '';
  const normalized = bucket.trim().toLowerCase();
  if (normalized === 'nearby' || normalized === 'within 5 mi') {
    return 'Nearby';
  }
  return bucket.trim();
}

const iosContinuous = Platform.OS === 'ios'
  ? { borderCurve: 'continuous' as const }
  : {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    ...iosContinuous,
  },
  containerShadowLight: {
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  containerShadowDark: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  photo: {
    ...StyleSheet.absoluteFill,
    width: undefined,
    height: undefined,
  },
  tapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '33%',
    zIndex: 2,
  },
  tapZoneLeft: {
    left: 0,
  },
  tapZoneRight: {
    right: 0,
  },
  dots: {
    position: 'absolute',
    top: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    zIndex: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
  dotActive: {
    width: 16,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    justifyContent: 'flex-end',
  },
  info: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.huge,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.displayMedium,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: 'rgba(232, 115, 90, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  distance: {
    ...typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  intentRow: {
    marginTop: spacing.xs,
  },
  intent: {
    ...typography.labelMedium,
    color: '#FFFFFF',
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  interestChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  interestText: {
    ...typography.labelSmall,
    color: '#FFFFFF',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  placeholderHead: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    borderWidth: 3,
  },
  placeholderBody: {
    width: 112,
    height: 52,
    borderRadius: radius.xxl,
    borderWidth: 3,
    marginTop: -spacing.md,
  },
  placeholderText: {
    ...typography.bodySmall,
  },
});
