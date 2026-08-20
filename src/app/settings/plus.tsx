import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Redirect } from 'expo-router';

import { AppButton } from '@/components/ui/app-button';
import { useRevenueCat } from '@/state/revenuecat-context';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PlusScreen() {
  const { colors } = useTheme();
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
          convenience controls only.
        </Text>
      </View>

      {revenueCat.isPlus ? (
        <Text style={[styles.status, { color: colors.success }]}>Plus is active.</Text>
      ) : null}
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
        Subscriptions renew through your store account until canceled there. Store-localized price
        and terms appear before confirmation.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { borderRadius: radius.xl, gap: spacing.sm, padding: spacing.xl },
  status: { ...typography.titleMedium },
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
