import { Column, Host, ScrollView, Text } from '@expo/ui';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const TERMS = [
  {
    title: 'Eligibility',
    body: 'You must be at least 18 and legally able to enter an agreement where you live. Do not create an account for another person or return after a ban without written permission.',
  },
  {
    title: 'Your account',
    body: 'You are responsible for protecting your recovery key and for activity signed by your account. Recovery is self-custodied; OpenDating cannot restore a lost key.',
  },
  {
    title: 'Acceptable use',
    body: 'Be truthful, respectful, and lawful. Harassment, threats, scams, impersonation, sexual exploitation, content involving minors, non-consensual intimate content, hate, spam, scraping, and attempts to bypass safety controls are prohibited.',
  },
  {
    title: 'Your content',
    body: 'You keep ownership of profile content you submit and give OpenDating a limited license to host, process, and display that profile content only as needed to operate, secure, and improve the service. Direct-message content is excluded: messages may be processed only for encrypted transmission, delivery, and security operations. Only upload content you have the right to use.',
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
    title: 'Service changes',
    body: 'OpenDating is actively developed. Features may change or be temporarily unavailable, and we will give notice of material changes to these terms where required.',
  },
];

export default function TermsScreen() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Host
        colorScheme={isDark ? 'dark' : 'light'}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView>
          <Column
            spacing={spacing.md}
            style={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
          >
            <Text
              textStyle={{ ...textStyles.caption, color: colors.textTertiary }}
            >
              EFFECTIVE AUGUST 9, 2026
            </Text>
            <Text
              textStyle={{ ...textStyles.body, color: colors.textSecondary }}
            >
              These terms describe the rules for using OpenDating. By creating an account you agree to them and to the Community Standards.
            </Text>
            {TERMS.map((term) => (
              <Column
                key={term.title}
                spacing={spacing.sm}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  padding: spacing.lg,
                }}
              >
                <Text textStyle={{ ...textStyles.title, color: colors.text }}>
                  {term.title}
                </Text>
                <Text textStyle={{ ...textStyles.body, color: colors.textSecondary }}>
                  {term.body}
                </Text>
              </Column>
            ))}
            <Text
              textStyle={{
                ...textStyles.caption,
                color: colors.textTertiary,
                textAlign: 'center',
              }}
            >
              Questions or abuse reports: jonny2298@live.com
            </Text>
          </Column>
        </ScrollView>
      </Host>
    </>
  );
}

const textStyles = {
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, letterSpacing: 0.25 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16, letterSpacing: 0.4 },
  title: { fontSize: 15, fontWeight: '500', lineHeight: 20, letterSpacing: 0.1 },
} as const;
