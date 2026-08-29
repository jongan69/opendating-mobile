// Theme context — provides colors, spacing, etc. based on color scheme

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/lib/storage';
import { useRevenueCat } from '@/state/revenuecat-context';
import {
  colors,
  getThemeColors,
  type AccentPreference,
  type ThemeColors,
} from '@/theme/colors';

export type { ThemeColors };
export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  themePreference: ThemePreference;
  accentPreference: AccentPreference;
  setThemePreference: (preference: ThemePreference) => void;
  setAccentPreference: (preference: AccentPreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: colors.light,
  isDark: false,
  themePreference: 'system',
  accentPreference: 'coral',
  setThemePreference: () => {},
  setAccentPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { isPlus } = useRevenueCat();
  const [themePreference, setPreference] = useState<ThemePreference>('system');
  const [savedAccentPreference, setSavedAccentPreference] =
    useState<AccentPreference>('coral');
  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');
  const accentPreference = isPlus ? savedAccentPreference : 'coral';
  const themeColors = useMemo(
    () => getThemeColors(isDark ? 'dark' : 'light', accentPreference),
    [accentPreference, isDark],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([
      storage.getThemePreference(),
      storage.getAccentPreference(),
    ]).then(([savedTheme, savedAccent]) => {
      if (!active) return;
      if (savedTheme) setPreference(savedTheme);
      if (savedAccent) setSavedAccentPreference(savedAccent);
    });
    return () => {
      active = false;
    };
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setPreference(preference);
    void storage.saveThemePreference(preference);
  }, []);

  const setAccentPreference = useCallback((preference: AccentPreference) => {
    if (preference !== 'coral' && !isPlus) return;
    setSavedAccentPreference(preference);
    void storage.saveAccentPreference(preference);
  }, [isPlus]);

  const value = useMemo(
    () => ({
      colors: themeColors,
      isDark,
      themePreference,
      accentPreference,
      setThemePreference,
      setAccentPreference,
    }),
    [accentPreference, isDark, setAccentPreference, setThemePreference, themeColors, themePreference]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
