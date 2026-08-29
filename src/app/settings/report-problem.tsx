import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';

import { buildProblemReport, type ProblemReportInput, type SafeBuildContext } from '@/lib/feedback';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const EMAIL = 'jonny2298@live.com';
const FREQUENCIES = ['Once', 'Sometimes', 'Every time'];

export default function ReportProblemScreen() {
  const { colors, isDark } = useTheme();
  const [input, setInput] = useState<ProblemReportInput>({ trying: '', happened: '', expected: '', frequency: 'Once' });
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const context = useMemo<SafeBuildContext>(() => ({
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    build: String(Platform.OS === 'ios' ? Constants.expoConfig?.ios?.buildNumber ?? 'unknown' : Constants.expoConfig?.android?.versionCode ?? 'web'),
    platform: Platform.OS,
    osVersion: String(Platform.Version),
  }), []);
  const complete = input.trying.trim() && input.happened.trim() && input.expected.trim();

  const update = (key: keyof ProblemReportInput, value: string) => {
    setInput((current) => ({ ...current, [key]: value }));
    setPreview(null);
  };

  const email = async () => {
    const report = preview ?? buildProblemReport(input, context);
    await Linking.openURL(`mailto:${EMAIL}?subject=${encodeURIComponent('OpenDating problem report')}&body=${encodeURIComponent(report)}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          Tell us what went wrong. OpenDating does not automatically attach screenshots, logs, routes, location, messages, account IDs, or recovery keys.
        </Text>
        {([
          ['trying', 'What were you trying to do?'],
          ['happened', 'What happened?'],
          ['expected', 'What did you expect?'],
        ] as const).map(([key, label]) => (
          <View key={key} style={styles.field}>
            <Text style={[typography.labelMedium, { color: colors.text }]}>{label}</Text>
            <TextInput
              value={input[key]}
              onChangeText={(value) => update(key, value)}
              multiline
              textAlignVertical="top"
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              accessibilityLabel={label}
            />
          </View>
        ))}
        <View style={styles.field}>
          <Text style={[typography.labelMedium, { color: colors.text }]}>How often does it happen?</Text>
          <View style={styles.options}>
            {FREQUENCIES.map((frequency) => (
              <Pressable
                key={frequency}
                onPress={() => update('frequency', frequency)}
                accessibilityRole="radio"
                accessibilityState={{ checked: input.frequency === frequency }}
                style={[
                  styles.option,
                  { borderColor: input.frequency === frequency ? colors.accent : colors.border, backgroundColor: colors.surface },
                ]}
              >
                <Text style={[typography.labelMedium, { color: input.frequency === frequency ? colors.accent : colors.text }]}>{frequency}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {!preview ? (
          <Pressable
            disabled={!complete}
            onPress={() => setPreview(buildProblemReport(input, context))}
            style={[styles.primary, { backgroundColor: colors.accent, opacity: complete ? 1 : 0.5 }]}
            accessibilityRole="button"
          >
            <Text style={[typography.button, { color: colors.textInverse }]}>Preview report</Text>
          </Pressable>
        ) : (
          <View style={styles.previewGroup}>
            <Text style={[typography.labelMedium, { color: colors.text }]}>Review before sharing</Text>
            <Text selectable style={[typography.caption, styles.preview, { color: colors.text, backgroundColor: colors.surfaceSheet }]}>{preview}</Text>
            <Pressable onPress={() => void email()} style={[styles.primary, { backgroundColor: colors.accent }]} accessibilityRole="button">
              <Text style={[typography.button, { color: colors.textInverse }]}>Open email</Text>
            </Pressable>
            <Pressable
              onPress={() => void Clipboard.setStringAsync(preview).then(() => setCopied(true))}
              style={[styles.secondary, { borderColor: colors.border }]}
              accessibilityRole="button"
            >
              <Text style={[typography.button, { color: colors.accent }]}>{copied ? 'Copied' : 'Copy instead'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  field: { gap: spacing.sm },
  input: { minHeight: 92, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: 16 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.lg },
  primary: { minHeight: 50, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  secondary: { minHeight: 50, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  previewGroup: { gap: spacing.md },
  preview: { padding: spacing.md, borderRadius: radius.md, lineHeight: 18 },
});
