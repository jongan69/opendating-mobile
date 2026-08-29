import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Redirect } from 'expo-router';

import { AppButton } from '@/components/ui/app-button';
import { useRevenueCat } from '@/state/revenuecat-context';
import { useTheme } from '@/state/theme-context';
import { getThemeColors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PlusScreen() {
  const {
    colors,
    isDark,
    accentPreference,
    setAccentPreference,
  } = useTheme();
  const revenueCat = useRevenueCat();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!revenueCat.enabled) {
    return <Redirect href="/settings" />;
  }

  const buy = async (pkg: PurchasesPackage) => {
    setMessage(null);
    setPurchasing(pkg.identifier);
    const active = await revenueCat.purchase(pkg);
    setMessage(active ? 'OpenDating Plus is active.' : null);
    setPurchasing(null);
  };

  const restore = async () => {
    setMessage(null);
    setRestoring(true);
    const active = await revenueCat.restore();
    setMessage(active ? 'Your Plus purchase was restored.' : 'No active Plus purchase was found.');
    setRestoring(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.hero, { backgroundColor: colors.accentLight }]}>
        <Text style={[typography.labelMedium, { color: colors.accent }]}>OPENDATING PLUS</Text>
        <Text style={[typography.titleLarge, { color: colors.text }]}>
          Pay for convenience, never visibility.
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          Core discovery, reactions, matching, messaging, verification, recovery, filters,
          deletion, and every safety tool remain free. Plus adds customization and reusable
          convenience controls only. The lifetime purchase unlocks custom app accents.
        </Text>
      </View>

      {revenueCat.isPlus ? (
        <Text style={[styles.status, { color: colors.success }]}>Plus is active.</Text>
      ) : null}
      <View style={[styles.feature, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.titleMedium, { color: colors.text }]}>Custom app accents</Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          Choose Coral, Sage, Ocean, or Plum. Your selection stays on this device and never
          changes who sees your profile.
        </Text>
        <View style={styles.accents}>
          {(['coral', 'sage', 'ocean', 'plum'] as const).map((accent) => {
            const swatch = getThemeColors(isDark ? 'dark' : 'light', accent).accent;
            const selected = accentPreference === accent;
            return (
              <Pressable
                key={accent}
                accessibilityRole="button"
                accessibilityLabel={`${accent} accent${selected ? ', selected' : ''}`}
                accessibilityState={{
                  disabled: !revenueCat.isPlus && accent !== 'coral',
                  selected,
                }}
                disabled={!revenueCat.isPlus && accent !== 'coral'}
                onPress={() => setAccentPreference(accent)}
                style={[
                  styles.accentButton,
                  { borderColor: selected ? colors.text : colors.border },
                  !revenueCat.isPlus && accent !== 'coral' && styles.disabled,
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: swatch }]} />
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {accent[0].toUpperCase() + accent.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {revenueCat.packages.map((pkg) => (
        <View
          key={pkg.identifier}
          style={[styles.plan, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.planCopy}>
            <Text style={[typography.titleMedium, { color: colors.text }]}>{pkg.product.title}</Text>
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>{pkg.product.priceString}</Text>
          </View>
          <AppButton
            disabled={!revenueCat.ready || Boolean(purchasing) || restoring || revenueCat.isPlus}
            loading={purchasing === pkg.identifier}
            style={{ backgroundColor: colors.accent }}
            onPress={() => void buy(pkg)}
          >
            <Text style={[typography.labelLarge, { color: colors.textInverse }]}>Choose</Text>
          </AppButton>
        </View>
      ))}

      {revenueCat.ready && revenueCat.packages.length === 0 && !revenueCat.isPlus ? (
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Plus is not available in this build.
        </Text>
      ) : null}
      {revenueCat.error ? (
        <Text accessibilityRole="alert" style={[styles.note, { color: colors.destructive }]}>
          {revenueCat.error}
        </Text>
      ) : null}
      {message ? (
        <Text accessibilityRole="alert" style={[styles.note, { color: colors.success }]}>
          {message}
        </Text>
      ) : null}
      <AppButton
        disabled={!revenueCat.ready || Boolean(purchasing)}
        loading={restoring}
        style={{ backgroundColor: colors.surfaceSheet }}
        onPress={() => void restore()}
      >
        <Text style={[typography.labelLarge, { color: colors.text }]}>Restore purchases</Text>
      </AppButton>
      <Text style={[typography.caption, styles.footnote, { color: colors.textTertiary }]}>
        One-time purchase. No subscription. The store-localized price and terms appear before
        confirmation.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { borderRadius: radius.xl, gap: spacing.sm, padding: spacing.xl },
  status: { ...typography.titleMedium },
  feature: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
  accents: { flexDirection: 'row', gap: spacing.sm },
  accentButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    flex: 1,
    gap: spacing.xs,
    minHeight: 64,
    padding: spacing.sm,
  },
  swatch: { borderRadius: 12, height: 24, width: 24 },
  disabled: { opacity: 0.42 },
  plan: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  planCopy: { flex: 1, gap: spacing.xs },
  note: { ...typography.bodyMedium },
  footnote: { textAlign: 'center' },
});
