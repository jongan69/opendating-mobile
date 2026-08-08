// Report — report a member with a reason, optional details, and optional
// message evidence when coming from a chat.

import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';

import { AppButton } from '@/components/ui/app-button';
import { AppCheckbox } from '@/components/ui/app-checkbox';
import { BackHeader } from '@/components/back-header';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { shortPubkey } from '@/lib/format';
import type { ReportType } from '@/types/opendating';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const REPORT_OPTIONS: { label: string; value: ReportType }[] = [
  { label: 'Harassment or threats', value: 'harassment' },
  { label: 'Scam or fraud', value: 'scam' },
  { label: 'Fake / impersonating', value: 'catfish' },
  { label: 'Underage concern', value: 'underage' },
  { label: 'Inappropriate content', value: 'inappropriate_content' },
  { label: 'Something else', value: 'other' },
];

export default function ReportScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const params = useLocalSearchParams<{
    pubkey?: string;
    name?: string;
    evidence_event_ids?: string;
  }>();

  const subjectPubkey = params.pubkey ?? '';
  const subjectName = params.name?.trim() || (subjectPubkey ? shortPubkey(subjectPubkey) : '');

  const evidenceIds = useMemo(
    () =>
      (params.evidence_event_ids ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    [params.evidence_event_ids]
  );

  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [description, setDescription] = useState('');

  const toggleEvidence = useCallback((id: string) => {
    setSelectedEvidence((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }, []);

  const submit = useCallback(async () => {
    if (!reportType || submitting) return;

    const client = getOpenDatingClient();
    const trimmed = description.trim();
    setSubmitting(true);
    setError(null);
    try {
      await client.report({
        subject_pubkey: subjectPubkey,
        report_type: reportType,
        description_encrypted: trimmed.length > 0 ? trimmed : undefined,
        evidence_event_ids:
          selectedEvidence.length > 0 ? selectedEvidence : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not submit your report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [reportType, submitting, description, subjectPubkey, selectedEvidence]);

  const renderCheck = (selected: boolean) => {
    if (Platform.OS === 'ios') {
      return (
        <SymbolView
          name={selected ? 'checkmark.circle.fill' : 'circle'}
          size={22}
          tintColor={selected ? colors.accent : colors.border}
        />
      );
    }
    return (
      <Text
        style={[
          styles.checkGlyph,
          { color: selected ? colors.accent : colors.border },
        ]}
      >
        {selected ? '●' : '○'}
      </Text>
    );
  };

  // Incomplete link — no subject.
  if (!subjectPubkey) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <BackHeader title="Report" />
        <View style={styles.center}>
          <Text style={[typography.titleMedium, { color: colors.text }]}>
            This report link is incomplete
          </Text>
          <Text style={[typography.bodyMedium, styles.centerBody, { color: colors.textSecondary }]}>
            Please open Report from the profile you'd like to report.
          </Text>
          <AppButton
            style={{ backgroundColor: colors.accent, borderRadius: radius.lg }}
            onPress={() => router.back()}
          >
            <Text style={[typography.button, { color: colors.textInverse, textAlign: 'center' }]}>
              Go Back
            </Text>
          </AppButton>
        </View>
      </SafeAreaView>
    );
  }

  // Success state.
  if (submitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.center}>
          <View style={[styles.successBadge, { backgroundColor: colors.successLight }]}>
            {Platform.OS === 'ios' ? (
              <SymbolView
                name="checkmark"
                size={28}
                tintColor={colors.success}
                weight="bold"
              />
            ) : (
              <Text style={[styles.successGlyph, { color: colors.success }]}>✓</Text>
            )}
          </View>
          <Text style={[typography.headlineMedium, { color: colors.text }]}>
            Report submitted
          </Text>
          <Text style={[typography.bodyMedium, styles.centerBody, { color: colors.textSecondary }]}>
            Thanks for keeping OpenDating safe. Our moderation team reviews every
            report, and the person you reported won't know you filed it.
          </Text>
          <AppButton
            style={{ backgroundColor: colors.accent, borderRadius: radius.lg }}
            onPress={() => router.back()}
          >
            <Text style={[typography.button, { color: colors.textInverse, textAlign: 'center' }]}>
              Done
            </Text>
          </AppButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
        <BackHeader title="Report" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.headlineMedium, styles.headline, { color: colors.text }]}>
            Why are you reporting {subjectName}?
          </Text>

          {/* Report type */}
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {REPORT_OPTIONS.map((option, index) => (
              <View key={option.value}>
                {index > 0 ? (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                ) : null}
                <Pressable
                  onPress={() => setReportType(option.value)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    { backgroundColor: pressed ? colors.surfaceSheet : colors.surface },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: reportType === option.value }}
                >
                  <Text
                    style={[
                      typography.bodyMedium,
                      { color: colors.text, flex: 1 },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {renderCheck(reportType === option.value)}
                </Pressable>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={[typography.titleSmall, styles.subheading, { color: colors.text }]}>
            Tell us more (optional)
          </Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.descriptionWrap}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add any details that might help our review"
                multiline
                maxLength={2000}
                style={[styles.descriptionInput, { ...typography.bodyMedium, color: colors.text }]}
              />
            </View>
          </View>

          {/* Evidence */}
          {evidenceIds.length > 0 ? (
            <>
              <Text style={[typography.titleSmall, styles.subheading, { color: colors.text }]}>
                Include messages as evidence (optional)
              </Text>
              <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {evidenceIds.map((id, index) => (
                  <View key={id}>
                    {index > 0 ? (
                      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                    ) : null}
                    <View style={styles.optionRow}>
                      <View style={styles.evidenceText}>
                        <Text style={[typography.bodyMedium, { color: colors.text }]}>
                          Message {index + 1}
                        </Text>
                        <Text
                          style={[typography.caption, styles.mono, { color: colors.textTertiary }]}
                          numberOfLines={1}
                        >
                          {id}
                        </Text>
                      </View>
                      <AppCheckbox
                        value={selectedEvidence.includes(id)}
                        onValueChange={() => toggleEvidence(id)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight }]}>
              <Text style={[typography.bodySmall, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <AppButton
            disabled={!reportType || submitting}
            style={{
              backgroundColor: !reportType || submitting ? colors.accentMuted : colors.accent,
              borderRadius: radius.lg,
            }}
            onPress={submit}
          >
            <Text style={[typography.button, { color: colors.textInverse, textAlign: 'center' }]}>
              {submitting ? 'Submitting…' : 'Submit Report'}
            </Text>
          </AppButton>

          <Text style={[typography.caption, styles.privacyNote, { color: colors.textTertiary }]}>
            Reports are private and encrypted. The person you report will not
            know who filed it.
          </Text>
        </ScrollView>
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
  centerBody: {
    textAlign: 'center',
  },
  successBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  successGlyph: {
    fontSize: 28,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headline: {
    marginBottom: spacing.lg,
  },
  subheading: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  evidenceText: {
    flex: 1,
    gap: 2,
  },
  descriptionWrap: {
    minHeight: 110,
    padding: spacing.lg,
  },
  descriptionInput: {
    width: '100%',
  },
  checkGlyph: {
    fontSize: 18,
  },
  errorBanner: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  privacyNote: {
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
