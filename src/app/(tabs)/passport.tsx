// Privacy Passport — the member's live account-control surface.
// Conventional layout uses @expo/ui so it maps to SwiftUI on iOS and
// Material 3 on Android.

import { useCallback, useEffect, useState } from 'react';
import { Button, Column, Host, Row, ScrollView, Text } from '@expo/ui';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useProfile } from '@/features/profile/use-profile';
import { isScreenshotMode } from '@/constants/env';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { shortPubkey } from '@/lib/format';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function PassportScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { profile, pauseProfile, resumeProfile, isPaused } = useProfile();
  const [publicId, setPublicId] = useState('');
  const [changingVisibility, setChangingVisibility] = useState(false);
  const [visibilityError, setVisibilityError] = useState('');

  useEffect(() => {
    let active = true;
    getOpenDatingClient()
      .getPubkey()
      .then((value) => {
        if (active && value) setPublicId(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const toggleDiscovery = useCallback(async () => {
    if (changingVisibility) return;
    setVisibilityError('');
    setChangingVisibility(true);
    try {
      if (isPaused) await resumeProfile();
      else await pauseProfile();
    } catch (err) {
      setVisibilityError(
        err instanceof Error
          ? `Could not change visibility: ${err.message}`
          : 'Could not change visibility. Please try again.'
      );
    } finally {
      setChangingVisibility(false);
    }
  }, [changingVisibility, isPaused, pauseProfile, resumeProfile]);

  const passportPublicId = isScreenshotMode ? 'demo-public-account-id' : publicId || profile?.pubkey;
  const identityState = passportPublicId ? 'Ready to restore' : 'Loading account';
  const identityDetail = passportPublicId
    ? `Public ID ${shortPubkey(passportPublicId)}`
    : 'Reading the account stored on this device';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Host
        colorScheme={isDark ? 'dark' : 'light'}
        seedColor={colors.accent}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView showsIndicators={false}>
          <Column
            spacing={spacing.lg}
            style={{ padding: spacing.lg, paddingBottom: spacing.huge }}
          >
            <Column spacing={spacing.sm}>
              <Text textStyle={{ ...textStyles.eyebrow, color: colors.accent }}>
                LIVE PRIVACY PASSPORT
              </Text>
              <Text textStyle={{ ...textStyles.hero, color: colors.text }}>
                Your account is built around what OpenDating does not collect.
              </Text>
              <Text textStyle={{ ...textStyles.body, color: colors.textSecondary }}>
                Inspect the boundaries below, then change visibility or back up your account without asking the service for permission.
              </Text>
            </Column>

            <PassportCard
              title="Self-owned account"
              state={identityState}
              detail={`${identityDetail}. No email, phone number, password, or social login is attached.`}
              color={colors.success}
              background={colors.successLight}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />

            <PassportCard
              title="Location boundary"
              state="Approximate area only"
              detail="Exact GPS is reduced on this device before introductions. Profiles receive a broad distance label, never your coordinates."
              color={colors.success}
              background={colors.successLight}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />

            <PassportCard
              title="Private decisions"
              state="Withheld until mutual"
              detail="Skipping is local. Interest is not shown to the other person unless they independently choose you too."
              color={colors.success}
              background={colors.successLight}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />

            <PassportCard
              title="Conversation boundary"
              state="End-to-end encrypted"
              detail="A chat opens only after mutual interest. Message content is encrypted for the two members and is not available to the service."
              color={colors.success}
              background={colors.successLight}
              textColor={colors.text}
              secondaryColor={colors.textSecondary}
            />

            <Column
              spacing={spacing.md}
              style={{
                padding: spacing.lg,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Row alignment="center" spacing={spacing.sm}>
                <Text textStyle={{ ...textStyles.title, color: colors.text }}>
                  Introduction visibility
                </Text>
                <Text
                  textStyle={{
                    ...textStyles.state,
                    color: isPaused ? colors.warning : colors.success,
                  }}
                >
                  {isPaused ? 'PAUSED' : 'VISIBLE'}
                </Text>
              </Row>
              <Text textStyle={{ ...textStyles.body, color: colors.textSecondary }}>
                {isPaused
                  ? 'Your profile is withheld from new introductions. Existing matches remain available.'
                  : 'Your public profile and approximate area can be considered for new introductions.'}
              </Text>
              {visibilityError ? (
                <Text textStyle={{ ...textStyles.body, color: colors.destructive }}>
                  {visibilityError}
                </Text>
              ) : null}
              <Button
                label={isPaused ? 'Resume introductions' : 'Pause introductions'}
                variant={isPaused ? 'filled' : 'outlined'}
                onPress={() => void toggleDiscovery()}
                disabled={changingVisibility}
              />
            </Column>

            <Column spacing={spacing.md}>
              <Button
                label="Set or update my approximate area"
                variant="outlined"
                onPress={() => router.push('/(onboarding)/location?mode=update')}
              />
              <Button
                label="Back up or restore my account"
                variant="filled"
                onPress={() => router.push('/settings/advanced')}
              />
              <Button
                label="Read every privacy boundary"
                variant="outlined"
                onPress={() => router.push('/settings/privacy')}
              />
              <Button
                label="Delete my account and data"
                variant="text"
                onPress={() => router.push('/settings/account')}
              />
            </Column>

            <Text textStyle={{ ...textStyles.caption, color: colors.textTertiary, textAlign: 'center' }}>
              The Passport reflects the behavior of this installed OpenDating client. It is not a verification of another member's identity.
            </Text>
          </Column>
        </ScrollView>
      </Host>
    </SafeAreaView>
  );
}

function PassportCard({
  title,
  state,
  detail,
  color,
  background,
  textColor,
  secondaryColor,
}: {
  title: string;
  state: string;
  detail: string;
  color: string;
  background: string;
  textColor: string;
  secondaryColor: string;
}) {
  return (
    <Column
      spacing={spacing.sm}
      style={{
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: background,
        backgroundColor: background,
      }}
    >
      <Row alignment="center" spacing={spacing.sm}>
        <Text textStyle={{ ...textStyles.title, color: textColor }}>{title}</Text>
        <Text textStyle={{ ...textStyles.state, color }}>{state.toLocaleUpperCase()}</Text>
      </Row>
      <Text textStyle={{ ...textStyles.body, color: secondaryColor }}>{detail}</Text>
    </Column>
  );
}

const textStyles = {
  eyebrow: { fontSize: 12, fontWeight: '700', lineHeight: 16, letterSpacing: 1.2 },
  hero: { fontSize: 26, fontWeight: '700', lineHeight: 32, letterSpacing: 0 },
  title: { fontSize: 16, fontWeight: '600', lineHeight: 22, letterSpacing: 0.1 },
  state: { fontSize: 11, fontWeight: '700', lineHeight: 16, letterSpacing: 0.7 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 21, letterSpacing: 0.2 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 17, letterSpacing: 0.3 },
} as const;
