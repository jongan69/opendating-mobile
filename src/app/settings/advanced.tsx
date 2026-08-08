// Advanced — account diagnostics and recovery controls.
// Deliberately out of the normal flow.

import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';

import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { connectionStateLabel, shortPubkey } from '@/lib/format';
import type { ConnectionState, OpenDatingCapabilities } from '@/types/opendating';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface CopyRowProps {
  label: string;
  value: string;
  monospace?: boolean;
  copied?: boolean;
  onCopy: () => void;
}

function CopyRow({ label, value, monospace, copied, onCopy }: CopyRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onCopy}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceSheet : colors.surface },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label}`}
    >
      <Text style={[typography.labelMedium, { color: colors.textTertiary, width: 110 }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.caption,
          monospace ? styles.mono : null,
          { color: copied ? colors.success : colors.text, flex: 1 },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={[typography.labelMedium, { color: copied ? colors.success : colors.accent }]}>
        {copied ? 'Copied' : 'Copy'}
      </Text>
    </Pressable>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[typography.titleSmall, styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function AdvancedScreen() {
  const { colors, isDark } = useTheme();

  const [pubkey, setPubkey] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<OpenDatingCapabilities | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('starting');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const client = getOpenDatingClient();

    setConnectionState(client.getState());
    const unsubscribe = client.onStateChange(setConnectionState);

    client
      .getPubkey()
      .then(setPubkey)
      .catch(() => {});

    // Prefer cached capabilities; refresh from the relay if we don't have them.
    const cached = client.getCapabilities();
    if (cached) {
      setCapabilities(cached);
    } else {
      client
        .fetchCapabilities()
        .then(setCapabilities)
        .catch(() => {
          // Offline — show whatever the client has cached.
          setCapabilities(client.getCapabilities());
        });
    }

    return unsubscribe;
  }, []);

  const copyValue = useCallback(async (key: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const doExportPrivateKey = useCallback(async () => {
    try {
      const identity = await getOpenDatingClient().loadIdentity();
      if (!identity) {
        Alert.alert('No identity found', 'There is no account on this device to export.');
        return;
      }
      await copyValue('recovery-key', identity.privkey);
      Alert.alert(
        'Recovery key copied',
        'Your recovery key is now on your clipboard. Store it somewhere safe, then clear your clipboard.'
      );
    } catch (err) {
      Alert.alert(
        'Could not export',
        err instanceof Error ? err.message : 'Please try again.'
      );
    }
  }, [copyValue]);

  const exportPrivateKey = useCallback(async () => {
    Alert.alert(
      'Export Recovery Key',
      'Your recovery key unlocks full access to your account. Anyone who has it can impersonate you and take over your account. Only export it to a place you fully trust.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', style: 'destructive', onPress: () => void doExportPrivateKey() },
      ]
    );
  }, [doExportPrivateKey]);

  const networkUrl = getOpenDatingClient().getRelayUrl();
  const infoUrl = getOpenDatingClient().getInfoUrl();
  const protocolVersion = getOpenDatingClient().getProtocolVersion();
  const supportedVersions = capabilities?.protocol_versions ?? [];
  // This list reflects what is actually deployed rather than a fixed roster.
  const serviceEntries: [string, string][] = Object.entries(
    capabilities?.roles ?? {}
  ).flatMap(([role, entry]) => (entry?.pubkey ? [[role, entry.pubkey]] : []));

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
          <View style={[styles.banner, { backgroundColor: colors.accentLight }]}>
            <Text style={[typography.caption, { color: colors.accent }]}>
              ADVANCED - for account diagnostics. Most people will never need this screen.
            </Text>
          </View>

          <Section title="Identity">
            <CopyRow
              label="Public ID"
              value={pubkey ? shortPubkey(pubkey, 12, 10) : 'Unavailable'}
              monospace
              copied={copiedKey === 'public-id'}
              onCopy={() => {
                if (pubkey) void copyValue('public-id', pubkey);
              }}
            />
          </Section>

          <Section title="Connection">
            <CopyRow
              label="Network"
              value={networkUrl.replace(/^wss?:\/\//, '')}
              monospace
              copied={copiedKey === 'network'}
              onCopy={() => void copyValue('network', networkUrl)}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <CopyRow
              label="Info URL"
              value={infoUrl.replace(/^https?:\/\//, '')}
              monospace
              copied={copiedKey === 'info'}
              onCopy={() => void copyValue('info', infoUrl)}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.row}>
              <Text style={[typography.labelMedium, { color: colors.textTertiary, width: 110 }]}>
                Protocol
              </Text>
              <Text style={[typography.caption, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                v{protocolVersion}
                {supportedVersions.length > 0 ? ` (supports ${supportedVersions.join(', ')})` : ''}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.row}>
              <Text style={[typography.labelMedium, { color: colors.textTertiary, width: 110 }]}>
                Connection
              </Text>
              <Text
                style={[
                  typography.caption,
                  {
                    flex: 1,
                    color:
                      connectionState === 'connected'
                        ? colors.success
                        : colors.textSecondary,
                  },
                ]}
              >
                {connectionStateLabel(connectionState)}
              </Text>
            </View>
          </Section>

          <Section title="Service IDs">
            {serviceEntries.length > 0 ? (
              serviceEntries.map(([role, pubkey], index) => (
                <View key={role}>
                  {index > 0 ? (
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  ) : null}
                  <CopyRow
                    label={role}
                    value={shortPubkey(pubkey)}
                    monospace
                    copied={copiedKey === `service:${role}`}
                    onCopy={() => void copyValue(`service:${role}`, pubkey)}
                  />
                </View>
              ))
            ) : (
              <View style={styles.row}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  Service IDs unavailable - check your connection.
                </Text>
              </View>
            )}
          </Section>

          <Section title="Backup">
            <Pressable
              onPress={() => void exportPrivateKey()}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? colors.surfaceSheet : colors.surface },
              ]}
              accessibilityRole="button"
            >
              <Text style={[typography.bodyMedium, { color: colors.text, flex: 1 }]}>
                Export Recovery Key
              </Text>
              <Text style={[typography.caption, { color: colors.textTertiary }]}>
                Warning
              </Text>
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={[styles.row, { paddingVertical: spacing.sm }]}>
              <Text style={[typography.caption, { color: colors.textTertiary, flex: 1 }]}>
                The recovery key is the only way to restore your account on another device.
                OpenDating can't recover it for you.
              </Text>
            </View>
          </Section>
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
  banner: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});
