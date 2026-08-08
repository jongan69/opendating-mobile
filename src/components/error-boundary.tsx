// Error Boundary — catches render-time exceptions and shows a friendly
// recovery screen instead of a white-screen crash.
//
// Wraps the root layout so any uncaught render error anywhere in the tree
// is contained here.

import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    // Log for debugging — replace with your crash reporter in production.
    console.error('[ErrorBoundary]', error.message, info.componentStack);
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
        {error?.message ? (
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
});
