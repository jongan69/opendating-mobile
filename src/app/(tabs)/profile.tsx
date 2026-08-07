// Profile tab — shows the user's own profile with actions
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '@/state/theme-context';
import { useProfileContent } from '@/features/profile/profile-content';
import { isScreenshotMode } from '@/constants/env';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import type { OpenDatingProfile, VerificationClaim } from '@/types/opendating';

const GENDER_LABELS: Record<string, string> = {
  woman: 'Woman',
  man: 'Man',
  nonbinary: 'Non-binary',
  other: 'Other',
};

const DEMO_PROFILE: OpenDatingProfile = {
  member_id: 'demo-member',
  pubkey: 'demo-pubkey-0000000000000000000000000000000000000000000000000000000000000000',
  status: 'active',
  created_at: Math.floor(Date.now() / 1000) - 86400 * 7,
  updated_at: Math.floor(Date.now() / 1000),
};

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<OpenDatingProfile | null>(null);
  const [verifications, setVerifications] = useState<VerificationClaim[]>([]);
  const [loading, setLoading] = useState(!isScreenshotMode);
  const [isPaused, setIsPaused] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const { content, reload: reloadContent } = useProfileContent();

  useEffect(() => {
    let active = true;

    if (isScreenshotMode) {
      setProfile(DEMO_PROFILE);
      setVerifications([]);
      setLoading(false);
      return;
    }

    const client = getOpenDatingClient();
    Promise.all([
      client.getProfile().catch(() => null),
      client.getVerificationClaims().catch(() => []),
    ]).then(([p, v]) => {
      if (!active) return;
      setProfile(p);
      setVerifications(v);
      if (p) setIsPaused(p.status === 'paused');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  // Re-read the cached content whenever this tab regains focus, so an edit
  // made on the edit screen is reflected the moment the user comes back.
  useFocusEffect(
    useCallback(() => {
      void reloadContent();
    }, [reloadContent])
  );

  const togglePause = async () => {
    setToggling(true);
    const client = getOpenDatingClient();
    const next = !isPaused;
    try {
      if (isPaused) {
        await client.resumeProfile();
      } else {
        await client.pauseProfile();
      }
      setIsPaused(next);
    } catch (err) {
      // The switch stays where it was; say why rather than letting it snap
      // back with no explanation.
      Alert.alert(
        next ? "Couldn't pause discovery" : "Couldn't resume discovery",
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setToggling(false);
    }
  };

  const heroPhoto = content?.photos?.find((p) => p.url.length > 0)?.url;
  const heroInitial = content?.display_name?.trim()?.[0]?.toUpperCase() ?? '?';
  const heroTitle = content?.display_name?.trim() || 'Your Profile';
  const heroSubtitle = [
    content?.age ? `${content.age}` : null,
    content?.gender ? GENDER_LABELS[content.gender] ?? content.gender : null,
  ]
    .filter(Boolean)
    .join(' · ');

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ProfileAvatar photoUrl={heroPhoto} initial={heroInitial} />
          <Text style={[typography.headlineLarge, { color: colors.text, marginTop: spacing.lg }]}>
            {heroTitle}
          </Text>
          {heroSubtitle ? (
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
              {heroSubtitle}
            </Text>
          ) : null}
          {content?.bio ? (
            <Text
              style={[
                typography.bodySmall,
                styles.heroBio,
                { color: colors.textSecondary },
              ]}
              numberOfLines={3}
            >
              {content.bio}
            </Text>
          ) : null}
          {isPaused && (
            <Text style={[typography.labelSmall, { color: colors.warning }]}>Paused</Text>
          )}
          {verifications.length > 0 && (
            <View style={styles.badges}>
              {verifications.map((v, i) => (
                <View key={i} style={[styles.badge, { backgroundColor: colors.successLight }]}>
                  <Text style={[typography.labelSmall, { color: colors.success }]}>
                    {v.claim_type === 'photo_verified' ? 'Photo Verified' : v.claim_type === 'human_verified' ? 'Human Verified' : v.claim_type}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceSheet : 'transparent' }]}
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={[typography.bodyMedium, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[typography.bodyMedium, { color: colors.textTertiary }]}>›</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Pressable
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceSheet : 'transparent' }]}
            onPress={() => setPreviewVisible(true)}
          >
            <Text style={[typography.bodyMedium, { color: colors.text }]}>Preview Profile</Text>
            <Text style={[typography.bodyMedium, { color: colors.textTertiary }]}>›</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Pressable
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceSheet : 'transparent' }]}
            onPress={() => router.push('/verification')}
          >
            <Text style={[typography.bodyMedium, { color: colors.text }]}>Verification</Text>
            <Text style={[typography.bodyMedium, { color: colors.textTertiary }]}>›</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>Pause Discovery</Text>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                {isPaused ? 'Your profile is hidden from new discovery' : 'Your profile is visible in discovery'}
              </Text>
            </View>
            <Switch
              value={isPaused}
              onValueChange={togglePause}
              disabled={toggling}
              trackColor={{ false: colors.border, true: colors.accentMuted }}
              thumbColor={isPaused ? colors.accent : colors.textTertiary}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceSheet : 'transparent' }]}
            onPress={() => router.push('/settings')}
          >
            <Text style={[typography.bodyMedium, { color: colors.text }]}>Settings</Text>
            <Text style={[typography.bodyMedium, { color: colors.textTertiary }]}>›</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Pressable
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceSheet : 'transparent' }]}
            onPress={() => router.push('/settings/privacy')}
          >
            <Text style={[typography.bodyMedium, { color: colors.text }]}>Privacy</Text>
            <Text style={[typography.bodyMedium, { color: colors.textTertiary }]}>›</Text>
          </Pressable>
        </View>

        <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xxl }]}>
          {profile
            ? `Member since ${new Date(profile.created_at * 1000).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · OpenDating v0.1`
            : 'OpenDating v0.1'}
        </Text>
      </ScrollView>

      {/* Preview Profile — how others see your profile */}
      <Modal
        visible={previewVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
          <View style={styles.previewHeader}>
            <Text style={[typography.titleMedium, { color: colors.text }]}>Profile Preview</Text>
            <Pressable
              onPress={() => setPreviewVisible(false)}
              hitSlop={spacing.md}
              style={({ pressed }) => [styles.previewClose, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <Text style={[typography.titleMedium, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ProfileAvatar photoUrl={heroPhoto} initial={heroInitial} />
            <Text style={[typography.headlineLarge, { color: colors.text, marginTop: spacing.lg }]}>
              {heroTitle}
            </Text>
            {heroSubtitle ? (
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                {heroSubtitle}
              </Text>
            ) : null}
            {content?.bio ? (
              <Text
                style={[typography.bodySmall, styles.heroBio, { color: colors.textSecondary }]}
              >
                {content.bio}
              </Text>
            ) : null}
            {content?.interests && content.interests.length > 0 ? (
              <View style={styles.badges}>
                {content.interests.slice(0, 6).map((interest) => (
                  <View
                    key={interest}
                    style={[styles.badge, { backgroundColor: colors.surfaceSheet }]}
                  >
                    <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {verifications.length > 0 && (
              <View style={styles.badges}>
                {verifications.map((v, i) => (
                  <View key={i} style={[styles.badge, { backgroundColor: colors.successLight }]}>
                    <Text style={[typography.labelSmall, { color: colors.success }]}>
                      {v.claim_type === 'photo_verified' ? 'Photo Verified' : v.claim_type === 'human_verified' ? 'Human Verified' : v.claim_type}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.xxxl }]}>
            This is how your profile appears to other members.
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** Photo when there is one, otherwise the initial — never a bare "?". */
function ProfileAvatar({ photoUrl, initial }: { photoUrl?: string; initial: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.photoPlaceholder, { backgroundColor: colors.accentLight }]}>
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={styles.photoImage}
          contentFit="cover"
          transition={150}
          accessibilityLabel="Your profile photo"
        />
      ) : (
        <Text style={[typography.displayLarge, { color: colors.accent }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  hero: { alignItems: 'center', paddingVertical: spacing.xxxl },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  heroBio: { textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  section: { borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  divider: { height: 1, marginLeft: spacing.lg },
  previewContainer: { flex: 1, paddingTop: spacing.xxl },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  previewClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  previewCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xxl,
    borderWidth: 1,
  },
  previewPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
});
