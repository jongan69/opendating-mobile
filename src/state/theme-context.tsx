// Theme context — provides colors, spacing, etc. based on color scheme

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/lib/storage';
import { colors, type ThemeColors } from '@/theme/colors';

export type { ThemeColors };
export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: colors.light,
  isDark: false,
  themePreference: 'system',
  setThemePreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setPreference] = useState<ThemePreference>('system');
  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');
  const themeColors: ThemeColors = isDark ? colors.dark : colors.light;

  useEffect(() => {
    let active = true;
    void storage.getThemePreference().then((saved) => {
      if (active && saved) setPreference(saved);
    });
    return () => {
      active = false;
    };
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setPreference(preference);
    void storage.saveThemePreference(preference);
  }, []);

  const value = useMemo(
    () => ({ colors: themeColors, isDark, themePreference, setThemePreference }),
    [isDark, setThemePreference, themeColors, themePreference]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
