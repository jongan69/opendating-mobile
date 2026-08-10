import { useEffect, useState } from 'react';
import { Column, Host, ScrollView, Text } from '@expo/ui';
import { StatusBar } from 'expo-status-bar';

import {
  POLICY_EFFECTIVE_LABEL,
  formatAcceptedAt,
  isCurrentPolicy,
  type StoredPolicyAcceptance,
} from '@/lib/policy';
import { storage } from '@/lib/storage';
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
    title: 'Community Standards',
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

// The acceptance recorded at onboarding, surfaced so a member can see exactly
// which version their account agreed to and when.
function useAcceptanceSummary(): string {
  const [acceptance, setAcceptance] = useState<StoredPolicyAcceptance | null>(
    null
  );

  useEffect(() => {
    let active = true;
    storage
      .getPolicyAcceptance()
      .then((record) => {
        if (active) setAcceptance(record);
      })
      .catch(() => {
        // Unreadable record — fall through to the neutral summary below.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!acceptance) {
    return 'Your acceptance is recorded on this device when you create your profile.';
  }
  if (!isCurrentPolicy(acceptance)) {
    return 'Your account accepted an earlier version of these terms. The version above applies to new profiles.';
  }
  const accepted = formatAcceptedAt(acceptance.acceptedAt);
  return accepted
    ? `You accepted this version on ${accepted}.`
    : 'You accepted this version on this device.';
}

export default function TermsScreen() {
  const { colors, isDark } = useTheme();
  const acceptanceSummary = useAcceptanceSummary();

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
              {`EFFECTIVE ${POLICY_EFFECTIVE_LABEL.toUpperCase()}`}
            </Text>
            <Text
              textStyle={{ ...textStyles.body, color: colors.textSecondary }}
            >
              {`These Terms of Service include the Community Standards below. During onboarding, you must explicitly accept this ${POLICY_EFFECTIVE_LABEL} version before a profile can be created.`}
            </Text>
            <Text
              textStyle={{ ...textStyles.caption, color: colors.textTertiary }}
            >
              {acceptanceSummary}
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
