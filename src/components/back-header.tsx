// In-screen header with a back button, used by screens outside the
// settings stack (edit profile, report, verification).

import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface BackHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function BackHeader({ title, onBack, right }: BackHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      // Deep-linked with no back stack — land somewhere sensible.
      router.replace('/settings');
    }
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.divider }]}>
      <Pressable
        onPress={handleBack}
        hitSlop={spacing.md}
        style={({ pressed }) => [
          styles.backButton,
          { opacity: pressed ? 0.5 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        {Platform.OS === 'ios' ? (
          <SymbolView
            name="chevron.left"
            size={22}
            tintColor={colors.accent}
            weight="semibold"
          />
        ) : (
          <Text style={[styles.backGlyph, { color: colors.accent }]}>‹</Text>
        )}
      </Pressable>
      <Text
        style={[typography.titleMedium, styles.title, { color: colors.text }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  right: {
    width: 36,
    alignItems: 'flex-end',
  },
});
