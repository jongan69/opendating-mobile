import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/state/theme-context';
import { useDiscovery } from '@/features/discovery/use-discovery';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const { width: screenWidth } = Dimensions.get('window');

export default function CandidateDetail() {
  const { pubkey } = useLocalSearchParams<{ pubkey: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { candidates } = useDiscovery();
  const candidate = useMemo(() => candidates.find((c) => c.pubkey === pubkey), [candidates, pubkey]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const isVerified = (candidate?.profile.verification_claims ?? []).length > 0;
  const prompts = (candidate?.profile.prompts ?? []).filter(
    (p) => p.question.trim().length > 0 && p.answer.trim().length > 0
  );

  if (!candidate) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={[typography.bodyMedium, { color: colors.accent }]}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.center}>
          <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>Profile not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { profile } = candidate;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {profile.photos && profile.photos.length > 0 ? (
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
              {profile.photos.map((photo, index) => (
                <Image key={photo.id ?? index} source={{ uri: photo.url }} style={styles.photo} contentFit="cover" transition={200} />
              ))}
            </ScrollView>
            {profile.photos.length > 1 ? (
              <View style={styles.dots} pointerEvents="none">
                {profile.photos.map((photo, index) => (
                  <View
                    key={photo.id ?? index}
                    style={[
                      styles.dot,
                      index === photoIndex
                        ? { backgroundColor: '#FFFFFF', width: 16 }
                        : { backgroundColor: 'rgba(255, 255, 255, 0.45)' },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface }]}>
            <Text style={[typography.displayLarge, { color: colors.textTertiary }]}>{profile.display_name?.[0] ?? '?'}</Text>
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={[typography.headlineLarge, { color: colors.text }]}>
              {profile.display_name ?? 'Unknown'}{profile.age ? `, ${profile.age}` : ''}
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
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            {candidate.distance_bucket}{profile.relationship_intent ? ` · ${profile.relationship_intent.replace('_', ' ')}` : ''}
          </Text>
          {profile.relationship_intent ? (
            <View style={[styles.intentChip, { backgroundColor: colors.accentLight }]}>
              <Text style={[typography.labelMedium, { color: colors.accent }]}>
                Looking for: {profile.relationship_intent.replace('_', ' ')}
              </Text>
            </View>
          ) : null}
          {prompts.length > 0 ? (
            <View style={styles.section}>
              <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.sm }]}>Prompts</Text>
              {prompts.map((prompt) => (
                <View key={prompt.question} style={[styles.promptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[typography.labelMedium, { color: colors.accent }]}>{prompt.question}</Text>
                  <Text style={[typography.bodyMedium, { color: colors.text }]}>{prompt.answer}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {profile.bio ? (
            <View style={styles.section}>
              <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.sm }]}>About</Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>{profile.bio}</Text>
            </View>
          ) : null}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.sm }]}>Interests</Text>
              <View style={styles.chips}>
                {profile.interests.map((interest: string, i: number) => (
                  <View key={i} style={[styles.chip, { backgroundColor: colors.accentLight }]}>
                    <Text style={[typography.labelSmall, { color: colors.accent }]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={styles.section}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/report',
                  params: {
                    pubkey,
                    name: profile.display_name?.trim() || pubkey,
                  },
                })
              }
              style={({ pressed }) => [styles.reportBtn, { backgroundColor: pressed ? colors.destructiveLight : 'transparent', borderColor: colors.destructive }]}
            >
              <Text style={[typography.labelMedium, { color: colors.destructive }]}>Report</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  photoScroller: { height: screenWidth * 1.25 },
  photo: { width: screenWidth, height: screenWidth * 1.25 },
  dots: {
    position: 'absolute',
    top: spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: { width: 7, height: 7, borderRadius: radius.full },
  intentChip: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  promptCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  photoPlaceholder: { width: screenWidth, height: screenWidth * 1.25, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  section: { marginTop: spacing.xxl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  reportBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1 },
});
