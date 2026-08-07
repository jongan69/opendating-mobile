// Theme context — provides colors, spacing, etc. based on color scheme

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, type ThemeColors } from '@/theme/colors';

export type { ThemeColors };

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: colors.light,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const themeColors: ThemeColors = isDark ? colors.dark : colors.light;

  const value = useMemo(() => ({ colors: themeColors, isDark }), [isDark, themeColors]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
