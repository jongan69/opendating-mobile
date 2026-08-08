// Privacy — explains how location, messages, and reports are handled,
// with a collapsed technical section showing the user's npub.

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';

import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { hexToNpub, shortPubkey } from '@/lib/format';
import { AppCollapsible } from '@/components/ui/app-collapsible';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface SectionProps {
  title: string;
  body: string;
}

function Section({ title, body }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[typography.titleSmall, styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      <View
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, lineHeight: 22 }]}>
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function PrivacyScreen() {
  const { colors, isDark } = useTheme();

  const [npub, setNpub] = useState<string | null>(null);
  const [npubHex, setNpubHex] = useState('');
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const client = getOpenDatingClient();
    client
      .getPubkey()
      .then((pubkey) => {
        if (pubkey) {
          setNpubHex(pubkey);
          setNpub(hexToNpub(pubkey));
        }
      })
      .catch(() => {
        // Identity unavailable — technical section will show a placeholder.
      });
  }, []);

  const copyNpub = useCallback(async () => {
    const value = npub ?? npubHex;
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [npub, npubHex]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Section
            title="Your Location"
            body="Your exact location is never shared. OpenDating only stores a coarse location area (a geohash covering a few miles), which is used to show nearby profiles and estimate distances. Location is never shown on your profile."
          />
          <Section
            title="Messages"
            body="Messages are end-to-end encrypted and readable only by you and the person you're chatting with. OpenDating's relay infrastructure can't read your conversations, and messages can't be recovered once deleted."
          />
          <Section
            title="Blocking & Reporting"
            body="Blocks and reports are private. When you report someone, they never learn who filed the report. Reports are encrypted and reviewed only by moderation services, never published publicly."
          />
          <Section
            title="Screenshots"
            body="Like any messaging app, we can't prevent screenshots of conversations or profiles. Please keep conversations private — don't share or distribute screenshots of other people without their consent."
          />

          {/* Technical section — collapsed by default */}
          <View style={styles.section}>
            <Text style={[typography.titleSmall, styles.sectionTitle, { color: colors.text }]}>
              Technical
            </Text>
            <View
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <AppCollapsible
                isOpen={technicalOpen}
                onOpenChange={setTechnicalOpen}
                label="Your npub (Nostr identity)"
              >
                <View style={[styles.technicalBody, { borderTopColor: colors.divider }]}>
                  <Text
                    style={[typography.bodySmall, { color: colors.textSecondary }]}
                  >
                    This is your public Nostr identity. It's safe to share — it
                    identifies you on the network without exposing your private
                    key. Your private key never leaves this device.
                  </Text>
                  <Pressable
                    onPress={copyNpub}
                    disabled={!npub && !npubHex}
                    style={({ pressed }) => [
                      styles.npubRow,
                      { backgroundColor: colors.surfaceSheet, opacity: pressed ? 0.7 : 1 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Copy npub"
                  >
                    <Text
                      style={[
                        typography.caption,
                        styles.mono,
                        { color: copied ? colors.success : colors.text, flex: 1 },
                      ]}
                      numberOfLines={1}
                    >
                      {npub
                        ? npub
                        : npubHex
                          ? shortPubkey(npubHex, 16, 8)
                          : 'Identity not available'}
                    </Text>
                    <Text style={[typography.labelMedium, { color: colors.accent }]}>
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </Pressable>
                </View>
              </AppCollapsible>
            </View>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  technicalBody: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  npubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
