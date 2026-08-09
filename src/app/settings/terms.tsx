import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const TERMS = [
  {
    title: 'Eligibility',
    body: 'You must be at least 18 and legally able to enter an agreement where you live. Do not create an account for another person or return after a ban without written permission.',
  },
  {
    title: 'Your account',
    body: 'You are responsible for protecting your recovery key and for activity signed by your account. The current pre-release recovery flow is self-custodied; OpenDating cannot restore a lost key.',
  },
  {
    title: 'Acceptable use',
    body: 'Be truthful, respectful, and lawful. Harassment, threats, scams, impersonation, sexual exploitation, content involving minors, non-consensual intimate content, hate, spam, scraping, and attempts to bypass safety controls are prohibited.',
  },
  {
    title: 'Your content',
    body: 'You keep ownership of content you submit and give OpenDating a limited license to host, process, and show it only as needed to operate, secure, and improve the service. Only upload content you have the right to use.',
  },
  {
    title: 'Safety and availability',
    body: 'OpenDating does not guarantee another member’s identity, intentions, conduct, compatibility, or availability. Use good judgment, meet in public, tell someone your plans, and contact local emergency services when necessary.',
  },
  {
    title: 'Enforcement and deletion',
    body: 'OpenDating may limit or remove accounts and content to enforce these terms and the Community Standards. You may request deletion in Settings. Some safety records may be retained when legally required or necessary to prevent repeat abuse.',
  },
  {
    title: 'Pre-release service',
    body: 'This is beta software and may change, be unavailable, or lose data. Production distribution remains blocked until the release gates are complete. Additional jurisdiction-specific terms will be added before public launch.',
  },
];

export default function TermsScreen() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>DRAFT — AUGUST 9, 2026</Text>
        <Text style={[typography.bodyMedium, styles.intro, { color: colors.textSecondary }]}>These draft Beta Terms describe the intended rules for invited testing. They are not approved for public launch and require legal review and a versioned acceptance flow before they become the production agreement.</Text>
        {TERMS.map((term) => (
          <View
            key={term.title}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[typography.titleSmall, { color: colors.text }]}>{term.title}</Text>
            <Text style={[typography.bodyMedium, styles.body, { color: colors.textSecondary }]}>{term.body}</Text>
          </View>
        ))}
        <Text style={[typography.caption, styles.contact, { color: colors.textTertiary }]}>Questions or abuse reports: jonny2298@live.com</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  intro: { lineHeight: 22, marginBottom: spacing.sm },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, gap: spacing.sm },
  body: { lineHeight: 22 },
  contact: { textAlign: 'center', marginTop: spacing.md },
});
