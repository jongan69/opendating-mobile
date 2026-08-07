// OpenDating Design System
// Warm, minimal, photo-first aesthetic

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSheet: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentLight: string;
  accentMuted: string;
  success: string;
  successLight: string;
  destructive: string;
  destructiveLight: string;
  warning: string;
  warningLight: string;
  border: string;
  borderLight: string;
  divider: string;
  glass: string;
  like: string;
  pass: string;
  superLike: string;
  shadow: string;
  overlay: string;
  skeleton: string;
}

const lightColors: ThemeColors = {
  // Backgrounds
  background: '#FAF9F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSheet: '#F5F4F2',

  // Text
  text: '#1A1A19',
  textSecondary: '#6B6B68',
  textTertiary: '#9B9B98',
  textInverse: '#FFFFFF',

  // Accent
  accent: '#E8735A', // warm coral/rose
  accentLight: '#FDF0ED',
  accentMuted: '#F8D5CD',

  // Semantic
  success: '#2E7D32',
  successLight: '#E8F5E9',
  destructive: '#C62828',
  destructiveLight: '#FFEBEE',
  warning: '#E65100',
  warningLight: '#FFF3E0',

  // Borders & Dividers
  border: '#E8E7E4',
  borderLight: '#F0EFEC',
  divider: '#EEEDEA',

  // Glass (iOS)
  glass: 'rgba(255, 255, 255, 0.72)',

  // Swipe indicators
  like: '#4CAF50',
  pass: '#9E9E9E',
  superLike: '#42A5F5',

  // Misc
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  skeleton: '#E8E7E4',
};

const darkColors: ThemeColors = {
  // Backgrounds
  background: '#141413',
  surface: '#1C1C1B',
  surfaceElevated: '#242423',
  surfaceSheet: '#1C1C1B',

  // Text
  text: '#F5F4F2',
  textSecondary: '#9B9B98',
  textTertiary: '#6B6B68',
  textInverse: '#1A1A19',

  // Accent
  accent: '#F0856E',
  accentLight: '#2D1F1A',
  accentMuted: '#4A2F27',

  // Semantic
  success: '#66BB6A',
  successLight: '#1B2E1B',
  destructive: '#EF5350',
  destructiveLight: '#2E1B1B',
  warning: '#FF9800',
  warningLight: '#2E2416',

  // Borders & Dividers
  border: '#2E2E2C',
  borderLight: '#242423',
  divider: '#2A2A28',

  // Glass (iOS)
  glass: 'rgba(28, 28, 27, 0.72)',

  // Swipe indicators
  like: '#66BB6A',
  pass: '#757575',
  superLike: '#64B5F6',

  // Misc
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#2E2E2C',
};

export const colors = {
  light: lightColors,
  dark: darkColors,
};

export type ColorScheme = 'light' | 'dark';
