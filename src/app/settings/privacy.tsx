// Privacy — explains how location, messages, and reports are handled,
// with a collapsed technical section showing the public account ID.

import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';

import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { shortPubkey } from '@/lib/format';
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

  const [publicId, setPublicId] = useState('');
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const client = getOpenDatingClient();
    client
      .getPubkey()
      .then((pubkey) => {
        if (pubkey) setPublicId(pubkey);
      })
      .catch(() => {
        // Identity unavailable — technical section will show a placeholder.
      });
  }, []);

  const copyPublicId = useCallback(async () => {
    if (!publicId) return;
    await Clipboard.setStringAsync(publicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [publicId]);

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
            body="Your exact location is never shared. OpenDating only stores a coarse area covering a few miles, which is used to show nearby profiles and estimate distances. Location is never shown on your profile."
          />
          <Section
            title="Messages"
            body="Messages are end-to-end encrypted and readable only by you and the person you're chatting with. OpenDating can't read your conversations, and messages can't be recovered once deleted."
          />
          <Section
            title="Profile Safety Screening"
            body="Before your display name and bio go live, they are automatically screened for harmful content. That screening runs on our service provider, Cloudflare, and is the only place your profile text is processed by an automated system. Your photos are not sent to it, and your messages are never screened — they stay end-to-end encrypted."
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
                label="Your public account ID"
              >
                <View style={[styles.technicalBody, { borderTopColor: colors.divider }]}>
                  <Text
                    style={[typography.bodySmall, { color: colors.textSecondary }]}
                  >
                    This public ID helps OpenDating route your profile and
                    messages without exposing your recovery key. Your recovery
                    key never leaves this device.
                  </Text>
                  <Pressable
                    onPress={copyPublicId}
                    disabled={!publicId}
                    style={({ pressed }) => [
                      styles.publicIdRow,
                      { backgroundColor: colors.surfaceSheet, opacity: pressed ? 0.7 : 1 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Copy public account ID"
                  >
                    <Text
                      style={[
                        typography.caption,
                        styles.mono,
                        { color: copied ? colors.success : colors.text, flex: 1 },
                      ]}
                      numberOfLines={1}
                    >
                      {publicId ? shortPubkey(publicId, 16, 8) : 'Identity not available'}
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
  publicIdRow: {
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
