import { Link } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BrandMark } from '@/components/brand/brand-mark';
import { useTheme } from '@/state/theme-context';

const PRINCIPLES = [
  {
    number: '01',
    title: 'Nearby, never exact',
    body: 'Your location becomes a broad area on your device. Exact coordinates are never published.',
  },
  {
    number: '02',
    title: 'Private by default',
    body: 'Likes stay private, direct messages are end-to-end encrypted, and blocks take effect immediately.',
  },
  {
    number: '03',
    title: 'Connection over pressure',
    body: 'Safety tools stay free. Paid ranking and manipulative boosts are not part of the product.',
  },
] as const;

export default function WebHome() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 760;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.nav, compact && styles.navCompact]}>
        <View style={styles.brand}>
          <BrandMark size={34} />
          <Text style={[styles.brandName, { color: colors.text }]}>OpenDating</Text>
        </View>
        <View style={styles.navLinks}>
          {!compact ? (
            <>
              <ExternalTextLink href="https://opendating.org/privacy/" label="Privacy" />
              <ExternalTextLink href="https://opendating.org/safety/" label="Safety" />
            </>
          ) : null}
          <ExternalButton
            href="https://github.com/jongan69/opendating-mobile"
            label="View source"
            compact={compact}
          />
        </View>
      </View>

      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View
          style={[
            styles.heroCopy,
            compact && styles.heroCopyCompact,
          ]}
        >
          <View
            style={[
              styles.eyebrow,
              { backgroundColor: colors.accentLight, borderColor: colors.accentMuted },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.eyebrowText, { color: colors.accent }]}>WEB PREVIEW</Text>
          </View>

          <Text
            accessibilityRole="header"
            style={[
              styles.heroTitle,
              compact && styles.heroTitleCompact,
              { color: colors.text },
            ]}
          >
            Dating that keeps your private life private.
          </Text>
          <Text style={[styles.heroBody, compact && styles.heroBodyCompact, { color: colors.textSecondary }]}> 
            OpenDating is a calmer kind of dating app—built around coarse location,
            encrypted conversations, and an identity that belongs to you.
          </Text>

          <View style={styles.actions}>
            <ExternalButton
              href="https://github.com/jongan69/opendating-mobile"
              label="Explore the project"
              primary
            />
            <ExternalButton
              href="https://opendating.org/blog/how-decentralized-dating-works/"
              label="How it works"
            />
          </View>

          <Text style={[styles.releaseNote, { color: colors.textTertiary }]}> 
            Native release in progress · Open source under MIT
          </Text>
        </View>

        <View
          style={[
            styles.preview,
            compact && styles.previewCompact,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: isDark ? '#000000' : '#70483E',
            },
          ]}
        >
          <View style={[styles.glow, { backgroundColor: colors.accentLight }]} />
          <View style={styles.previewTop}>
            <View style={[styles.miniMark, { backgroundColor: colors.accentLight }]}> 
              <BrandMark size={28} />
            </View>
            <View style={styles.previewHeading}>
              <Text style={[styles.previewLabel, { color: colors.textTertiary }]}>PRIVACY RECEIPT</Text>
              <Text style={[styles.previewTitle, { color: colors.text }]}>Shared by you</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.successLight }]}> 
              <Text style={[styles.statusText, { color: colors.success }]}>Protected</Text>
            </View>
          </View>

          <View style={[styles.receipt, { borderColor: colors.borderLight }]}> 
            <ReceiptRow label="Location" value="General area" colors={colors} />
            <ReceiptRow label="Messages" value="Encrypted" colors={colors} />
            <ReceiptRow label="Likes" value="Private" colors={colors} />
            <ReceiptRow label="Safety tools" value="Always free" colors={colors} last />
          </View>

          <View style={[styles.promise, { backgroundColor: colors.accentLight }]}> 
            <Text style={[styles.promiseQuote, { color: colors.text }]}> 
              “Enough information to help people meet. Nothing extra to profile them.”
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.principlesSection,
          compact && styles.principlesSectionCompact,
          { borderColor: colors.border },
        ]}
      >
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionKicker, { color: colors.accent }]}>A BETTER DEFAULT</Text>
          <Text
            accessibilityRole="header"
            style={[
              styles.sectionTitle,
              compact && styles.sectionTitleCompact,
              { color: colors.text },
            ]}
          > 
            Designed for trust before growth.
          </Text>
        </View>

        <View style={[styles.principles, compact && styles.principlesCompact]}>
          {PRINCIPLES.map((principle) => (
            <View
              key={principle.number}
              style={[styles.principle, { borderColor: colors.border }]}
            >
              <Text style={[styles.principleNumber, { color: colors.accent }]}>
                {principle.number}
              </Text>
              <Text style={[styles.principleTitle, { color: colors.text }]}> 
                {principle.title}
              </Text>
              <Text style={[styles.principleBody, { color: colors.textSecondary }]}> 
                {principle.body}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View
        style={[styles.footer, compact && styles.footerCompact, { borderColor: colors.border }]}
      > 
        <View style={styles.brand}>
          <BrandMark size={24} />
          <Text style={[styles.footerBrand, { color: colors.text }]}>OpenDating</Text>
        </View>
        <Text style={[styles.footerCopy, { color: colors.textTertiary }]}> 
          Privacy, portability, and genuine human connection.
        </Text>
      </View>
    </ScrollView>
  );
}

function ReceiptRow({
  label,
  value,
  colors,
  last = false,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  last?: boolean;
}) {
  return (
    <View style={[styles.receiptRow, !last && { borderBottomColor: colors.borderLight, borderBottomWidth: 1 }]}> 
      <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.receiptValueWrap}>
        <View style={[styles.check, { backgroundColor: colors.success }]} />
        <Text style={[styles.receiptValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function ExternalTextLink({ href, label }: { href: string; label: string }) {
  const { colors } = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={styles.textLinkHitArea}>
        <Text style={[styles.textLink, { color: colors.textSecondary }]}>{label}</Text>
      </Pressable>
    </Link>
  );
}

function ExternalButton({
  href,
  label,
  primary = false,
  compact = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={StyleSheet.flatten([
          styles.button,
          compact && styles.buttonCompact,
          {
            backgroundColor: primary ? colors.accent : colors.surface,
            borderColor: primary ? colors.accent : colors.border,
          },
        ])}
      >
        <Text style={[styles.buttonText, { color: primary ? '#FFFFFF' : colors.text }]}> 
          {label}
        </Text>
        {!compact ? (
          <Text style={[styles.arrow, { color: primary ? '#FFFFFF' : colors.accent }]}>↗</Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
  },
  nav: {
    maxWidth: 1180,
    alignSelf: 'stretch',
    marginHorizontal: 'auto',
    paddingHorizontal: 32,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navCompact: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.45,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textLinkHitArea: {
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLink: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  hero: {
    maxWidth: 1180,
    alignSelf: 'stretch',
    marginHorizontal: 'auto',
    paddingHorizontal: 32,
    paddingTop: 72,
    paddingBottom: 108,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 72,
  },
  heroCompact: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 72,
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    gap: 48,
  },
  heroCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 520,
  },
  heroCopyCompact: {
    alignSelf: 'stretch',
    minWidth: 0,
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
  },
  eyebrow: {
    alignSelf: 'flex-start',
    minHeight: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 26,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrowText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.35,
  },
  heroTitle: {
    maxWidth: 680,
    fontSize: 66,
    lineHeight: 70,
    fontWeight: '700',
    letterSpacing: -3.5,
  },
  heroTitleCompact: {
    fontSize: 43,
    lineHeight: 47,
    letterSpacing: -2,
  },
  heroBody: {
    maxWidth: 610,
    marginTop: 24,
    fontSize: 20,
    lineHeight: 31,
    letterSpacing: -0.2,
  },
  heroBodyCompact: {
    fontSize: 17,
    lineHeight: 27,
  },
  actions: {
    marginTop: 34,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    minHeight: 50,
    paddingHorizontal: 19,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonCompact: {
    minHeight: 42,
    paddingHorizontal: 15,
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  releaseNote: {
    marginTop: 20,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  preview: {
    minWidth: 310,
    maxWidth: 430,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 390,
    padding: 26,
    borderRadius: 30,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.16,
    shadowRadius: 50,
    overflow: 'hidden',
  },
  previewCompact: {
    minWidth: 0,
    alignSelf: 'stretch',
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    padding: 20,
    borderRadius: 24,
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    right: -100,
    top: -120,
    opacity: 0.8,
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHeading: {
    flex: 1,
    marginLeft: 12,
  },
  previewLabel: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.15,
  },
  previewTitle: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  receipt: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  receiptRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  receiptLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  receiptValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  check: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  receiptValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  promise: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
  },
  promiseQuote: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  principlesSection: {
    maxWidth: 1180,
    alignSelf: 'stretch',
    marginHorizontal: 'auto',
    paddingHorizontal: 32,
    paddingVertical: 88,
    borderTopWidth: 1,
  },
  principlesSectionCompact: {
    paddingHorizontal: 20,
    paddingVertical: 64,
  },
  sectionHeading: {
    maxWidth: 640,
    marginBottom: 42,
  },
  sectionKicker: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '700',
    letterSpacing: -1.6,
  },
  sectionTitleCompact: {
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -1.1,
  },
  principles: {
    flexDirection: 'row',
    gap: 18,
  },
  principlesCompact: {
    flexDirection: 'column',
  },
  principle: {
    flex: 1,
    minHeight: 210,
    padding: 24,
    borderWidth: 1,
    borderRadius: 20,
  },
  principleNumber: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  principleTitle: {
    marginTop: 28,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  principleBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    maxWidth: 1180,
    alignSelf: 'stretch',
    marginHorizontal: 'auto',
    paddingHorizontal: 32,
    paddingVertical: 30,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  footerCompact: {
    paddingHorizontal: 20,
  },
  footerBrand: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  footerCopy: {
    fontSize: 12,
    lineHeight: 18,
  },
});
