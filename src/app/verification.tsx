// Verification — shows the user's verification claims with human-friendly
// labels, issuer, and date.

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Button, Host } from '@expo/ui';
import { BackHeader } from '@/components/back-header';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { formatTimestamp, shortPubkey } from '@/lib/format';
import type { VerificationClaim } from '@/types/opendating';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const CLAIM_LABELS: Record<string, string> = {
  photo: 'Photo Verified',
  photo_verified: 'Photo Verified',
  human: 'Human Verified',
  human_verified: 'Human Verified',
  age: '18+ Verified',
  age_verified: '18+ Verified',
  age_18_plus: '18+ Verified',
  over_18: '18+ Verified',
  '18+': '18+ Verified',
};

function claimLabel(claimType: string): string {
  const mapped = CLAIM_LABELS[claimType.toLowerCase()];
  if (mapped) return mapped;
  // Fallback: "date_of_birth" → "Date of birth"
  return claimType
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const CLAIM_ICONS: Record<string, string> = {
  photo: 'person.crop.rectangle',
  photo_verified: 'person.crop.rectangle',
  human: 'person.fill.checkmark',
  human_verified: 'person.fill.checkmark',
  age: 'number',
  age_verified: 'number',
  age_18_plus: 'number',
  over_18: 'number',
};

function claimIcon(claimType: string): string {
  return CLAIM_ICONS[claimType.toLowerCase()] ?? 'checkmark.seal.fill';
}

function ClaimBadge({ claimType }: { claimType: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
      {Platform.OS === 'ios' ? (
        <SymbolView
          name={claimIcon(claimType) as never}
          size={20}
          tintColor={colors.accent}
        />
      ) : (
        <Text style={[typography.labelLarge, { color: colors.accent }]}>✓</Text>
      )}
    </View>
  );
}

export default function VerificationScreen() {
  const { colors, isDark } = useTheme();

  const [claims, setClaims] = useState<VerificationClaim[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    setError(null);
    setClaims(null);
    try {
      const result = await getOpenDatingClient().getVerificationClaims();
      setClaims(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load your verification status.'
      );
    }
  }, []);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  const renderContent = () => {
    if (claims === null && !error) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            Loading verification…
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={[typography.bodyMedium, styles.centerText, { color: colors.destructive }]}>
            {error}
          </Text>
          <Button
            variant="filled"
            style={{ backgroundColor: colors.accent, borderRadius: radius.lg }}
            onPress={() => void loadClaims()}
          >
            <Text style={[typography.button, { color: colors.textInverse, textAlign: 'center' }]}>
              Retry
            </Text>
          </Button>
        </View>
      );
    }

    if (claims === null || claims.length === 0) {
      return (
        <View style={styles.center}>
          <View style={[styles.emptyBadge, { backgroundColor: colors.surfaceSheet }]}>
            {Platform.OS === 'ios' ? (
              <SymbolView
                name="checkmark.seal"
                size={30}
                tintColor={colors.textTertiary}
              />
            ) : (
              <Text style={[typography.titleLarge, { color: colors.textTertiary }]}>✓</Text>
            )}
          </View>
          <Text style={[typography.headlineMedium, { color: colors.text }]}>
            No verification badges yet
          </Text>
          <Text style={[typography.bodyMedium, styles.centerText, { color: colors.textSecondary }]}>
            Verification happens automatically when you complete identity
            checks. Once verified, your badges will show up here and on your
            profile.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.bodyMedium, styles.intro, { color: colors.textSecondary }]}>
          Badges confirm information about your account. They're shown on your
          profile and next to your name in chats.
        </Text>

        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {claims.map((claim, index) => (
            <View key={`${claim.claim_type}-${claim.issuer ?? 'self'}-${index}`}>
              {index > 0 ? (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              ) : null}
              <View style={styles.claimRow}>
                <ClaimBadge claimType={claim.claim_type} />
                <View style={styles.claimText}>
                  <Text style={[typography.bodyMedium, { color: colors.text }]}>
                    {claimLabel(claim.claim_type)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textTertiary }]}>
                    {claim.issuer
                      ? `Issued by ${shortPubkey(claim.issuer)} · ${formatTimestamp(claim.verified_at)}`
                      : `Verified ${formatTimestamp(claim.verified_at)}`}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.disclaimer, { backgroundColor: colors.surfaceSheet }]}>
          <Text style={[typography.caption, styles.centerText, { color: colors.textSecondary }]}>
            Verification confirms specific information, like your photo, that
            you're a real person, or your age. It isn't a guarantee of someone's
            behavior — please stay careful and trust your instincts.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Host colorScheme={isDark ? 'dark' : 'light'} style={{ flex: 1 }}>
        <BackHeader title="Verification" />
        {renderContent()}
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
    gap: spacing.lg,
  },
  centerText: {
    textAlign: 'center',
  },
  emptyBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  intro: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: {
    flex: 1,
    gap: 2,
  },
  disclaimer: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
});
