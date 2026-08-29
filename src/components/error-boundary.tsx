// Error Boundary — catches render-time exceptions and shows a friendly
// recovery screen instead of a white-screen crash.
//
// Wraps the root layout so any uncaught render error anywhere in the tree
// is contained here.

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { randomUUID } from 'expo-crypto';
import { buildCrashDiagnostic, type SafeBuildContext } from '@/lib/feedback';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { colors } from '@/theme/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error.message, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

// Separate component so it can read the system color scheme directly.
// We avoid useTheme() here because the ThemeProvider may be the thing that
// crashed — we fall back to the system appearance.
function ErrorScreen({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = isDark ? colors.dark : colors.light;
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const context = useMemo<SafeBuildContext>(() => ({
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    build: String(Platform.OS === 'ios' ? Constants.expoConfig?.ios?.buildNumber ?? 'unknown' : Constants.expoConfig?.android?.versionCode ?? 'web'),
    platform: Platform.OS,
    osVersion: String(Platform.Version),
  }), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>😔</Text>
        <Text style={[styles.title, { color: c.text }]}>
          Something went wrong
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          The app encountered an unexpected error. This is likely temporary —
          tapping below will restart the app.
        </Text>
        {__DEV__ && error?.message ? (
          <Text style={[styles.errorDetail, { color: c.textSecondary }]}>
            {error.message}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
        {!diagnostic ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setDiagnostic(buildCrashDiagnostic(context, randomUUID()))}
            style={styles.linkButton}
          >
            <Text style={[typography.labelMedium, { color: c.accent }]}>Preview diagnostic report</Text>
          </Pressable>
        ) : (
          <View style={styles.diagnosticGroup}>
            <Text style={[typography.caption, styles.diagnosticCopy, { color: c.textSecondary }]}>
              This contains only version, build, platform, timestamp, and a generic error ID. It does not include the error, logs, routes, location, messages, files, or account data.
            </Text>
            <Text selectable style={[typography.caption, styles.diagnostic, { color: c.text, backgroundColor: c.surface }]}>{diagnostic}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void Clipboard.setStringAsync(diagnostic).then(() => setCopied(true))}
              style={[styles.diagnosticButton, { borderColor: c.border }]}
            >
              <Text style={[typography.labelMedium, { color: c.accent }]}>{copied ? 'Copied' : 'Copy diagnostic report'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headlineMedium,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorDetail: {
    ...typography.caption,
    textAlign: 'center',
    fontFamily: 'monospace',
    paddingHorizontal: spacing.md,
  },
  button: {
    marginTop: spacing.xl,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  linkButton: {
    padding: spacing.sm,
  },
  diagnosticGroup: {
    width: '100%',
    maxWidth: 520,
    gap: spacing.sm,
  },
  diagnosticCopy: {
    textAlign: 'center',
  },
  diagnostic: {
    padding: spacing.md,
    borderRadius: radius.md,
  },
  diagnosticButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
