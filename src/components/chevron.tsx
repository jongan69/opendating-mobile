// ChevronRight — native SF Symbol on iOS, text glyph fallback elsewhere.

import { Platform, StyleSheet, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';

interface ChevronRightProps {
  color: string;
  size?: number;
}

export function ChevronRight({ color, size = 16 }: ChevronRightProps) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name="chevron.right"
        size={size}
        tintColor={color}
        weight="semibold"
      />
    );
  }
  return (
    <Text
      style={[styles.glyph, { color, fontSize: size + 2, lineHeight: size + 2 }]}
    >
      ›
    </Text>
  );
}

const styles = StyleSheet.create({
  glyph: {
    fontWeight: '600',
  },
});
