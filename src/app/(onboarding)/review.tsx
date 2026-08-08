// Review — everything collected across onboarding, one last look.
// "Create Profile" connects to OpenDating, creates the profile, then pushes
// the collected discovery preferences and coarse location to the server.

import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import {
  GENDER_OPTIONS,
  INTENT_OPTIONS,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding-draft';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import {
  PROFILE_CONTENT_VERSION,
  PhotoUploadError,
  publishProfile,
} from '@/features/profile/profile-content';
import { storage } from '@/lib/storage';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

function labelFor(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export default function ReviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft } = useOnboardingDraft();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const client = getOpenDatingClient();

      // Identity must exist before we can connect and publish.
      const identity = await client.loadIdentity();
      if (!identity) {
        throw new Error('No account yet — go back and create one first.');
      }

      // Mirror the bootstrap sequence: connect → capabilities → profile.
      await client.connect();
      await client.fetchCapabilities();
      await client.createProfile();

      // Publish what the user actually filled in. Without this the profile
      // record exists but carries no name, bio, or photos, so nobody would
      // ever see anything on the card.
      //
      // A photo upload failure is deliberately not fatal here: the account and
      // text profile are live, and blocking the last step of onboarding over
      // it would strand the member with no way forward. Photos can be added
      // again from Edit Profile.
      const publishResult = await publishProfile({
        display_name: draft.displayName,
        age: draft.age ?? undefined,
        gender: draft.gender ?? undefined,
        bio: draft.bio,
        interests: draft.interests,
        relationship_intent: draft.intent ?? undefined,
        prompts: draft.prompts,
        photos: draft.photos.map((uri, index) => ({
          id: `${index}`,
          url: uri,
          order: index,
        })),
        v: PROFILE_CONTENT_VERSION,
      }).catch((err) => {
        if (err instanceof PhotoUploadError) return err;
        throw err;
      });

      // Push the collected preferences; best-effort after the profile exists.
      if (draft.geohashPrefix) {
        try {
          await client.updateLocation(
            draft.geohashPrefix,
            draft.countryCode ?? undefined
          );
        } catch {
          // Location sync is non-critical; the profile is already live.
        }
      }
      await client.updateDiscoveryPreferences({
        min_age: draft.ageRangeMin,
        max_age: draft.ageRangeMax,
        intent: draft.intent ?? undefined,
        genders: draft.genderPreferences,
      });

      await storage.setOnboardingComplete();
      // The draft has served its purpose; keeping it would repopulate a stale
      // profile if the member ever re-entered onboarding.
      await storage.clearOnboardingDraft().catch(() => {});

      if (publishResult instanceof PhotoUploadError) {
        Alert.alert(
          'Profile created, photos pending',
          `${publishResult.message} You can add them from Edit Profile.`,
          [{ text: 'Continue', onPress: () => router.replace('/(onboarding)/finish') }]
        );
        return;
      }

      router.replace('/(onboarding)/finish');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your profile. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // pubkey is set by create-account / import-account, but if the draft was
  // lost mid-onboarding (e.g. the app was killed), load it from secure storage
  // so the Create Profile button is never dead with no explanation.
  const [resolvedPubkey, setResolvedPubkey] = useState<string | null>(draft.pubkey);
  useEffect(() => {
    if (draft.pubkey) return;
    let active = true;
    getOpenDatingClient()
      .getPubkey()
      .then((pk) => {
        if (active && pk) setResolvedPubkey(pk);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [draft.pubkey]);

  const canSubmit = resolvedPubkey !== null && draft.displayName.length > 0;
  // A dead button with no explanation is the worst possible last step.
  const blockedReason = !canSubmit
    ? draft.displayName.length === 0
      ? 'Go back to "About you" and add a display name to finish.'
      : 'Still setting up your account — go back and create one first.'
    : null;

  return (
    <OnboardingScreen
      step={10}
      title="Review your profile"
      subtitle="This is how others will see you. Make it count."
      primaryLabel="Create Profile"
      onPrimaryPress={handleSubmit}
      primaryLoading={submitting}
      primaryDisabled={!canSubmit}
    >
      {error ? <ErrorBanner message={error} /> : null}
      {!error && blockedReason ? <ErrorBanner message={blockedReason} /> : null}

      {/* Basics */}
      <View style={styles.card}>
        <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
          About you
        </Text>
        <View style={styles.cardBody}>
          <ReviewRow label="Name" value={draft.displayName} />
          <ReviewRow
            label="Age"
            value={draft.age !== null ? `${draft.age}` : '—'}
          />
          <ReviewRow
            label="Gender"
            value={draft.gender ? labelFor(GENDER_OPTIONS, draft.gender) : '—'}
          />
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.card}>
        <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
          Looking for
        </Text>
        <View style={styles.cardBody}>
          <ReviewRow
            label="Genders"
            value={
              draft.genderPreferences.length > 0
                ? draft.genderPreferences
                    .map((g) => labelFor(GENDER_OPTIONS, g))
                    .join(', ')
                : 'Everyone'
            }
          />
          <ReviewRow
            label="Ages"
            value={`${draft.ageRangeMin} – ${draft.ageRangeMax}`}
          />
          <ReviewRow
            label="Intent"
            value={draft.intent ? labelFor(INTENT_OPTIONS, draft.intent) : '—'}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
          More about you
        </Text>
        <View style={styles.cardBody}>
          <ReviewRow
            label="Bio"
            value={draft.bio.length > 0 ? draft.bio : '—'}
          />
          <ReviewRow
            label="Interests"
            value={
              draft.interests.length > 0 ? draft.interests.join(', ') : '—'
            }
          />
          {draft.prompts.map((prompt) => (
            <ReviewRow
              key={prompt.question}
              label={prompt.question}
              value={prompt.answer}
            />
          ))}
        </View>
      </View>

      {/* Photos */}
      <View style={styles.card}>
        <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
          Photos
        </Text>
        <View style={styles.cardBody}>
          {draft.photos.length > 0 ? (
            <View style={styles.photoRow}>
              {draft.photos.map((uri, index) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={styles.photoThumb}
                  contentFit="cover"
                  transition={100}
                  accessibilityLabel={`Photo ${index + 1}`}
                />
              ))}
            </View>
          ) : (
            <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>
              No photos added
            </Text>
          )}
        </View>
      </View>

      {/* Location */}
      <View style={styles.card}>
        <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
          Location
        </Text>
        <View style={styles.cardBody}>
          <ReviewRow
            label="Your area"
            value={
              draft.geohashPrefix
                ? draft.countryCode
                  ? `${draft.countryCode} · area “${draft.geohashPrefix}”`
                  : `Area “${draft.geohashPrefix}”`
                : 'Not shared'
            }
          />
        </View>
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        Your profile is live on OpenDating. You can edit or delete it anytime
        from Settings.
      </Text>
    </OnboardingScreen>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={rowStyles.row}>
      <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[typography.bodyMedium, { color: colors.text, flex: 1, textAlign: 'right' }]}
      >
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
});

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    cardBody: {
      marginTop: spacing.sm,
    },
    photoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    photoThumb: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSheet,
    },
  });
}
