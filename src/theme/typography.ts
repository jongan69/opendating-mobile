import { Platform, TextStyle } from 'react-native';

const systemFont = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  android: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
});

export const typography = {
  // Display
  displayLarge: {
    fontFamily: systemFont.bold,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
    letterSpacing: 0.25,
  } as TextStyle,

  displayMedium: {
    fontFamily: systemFont.bold,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0,
  } as TextStyle,

  // Headline
  headlineLarge: {
    fontFamily: systemFont.semibold,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    letterSpacing: 0,
  } as TextStyle,

  headlineMedium: {
    fontFamily: systemFont.semibold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: 0.15,
  } as TextStyle,

  // Title
  titleLarge: {
    fontFamily: systemFont.medium,
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 28,
    letterSpacing: 0,
  } as TextStyle,

  titleMedium: {
    fontFamily: systemFont.medium,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.15,
  } as TextStyle,

  titleSmall: {
    fontFamily: systemFont.medium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontFamily: systemFont.regular,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.25,
  } as TextStyle,

  bodyMedium: {
    fontFamily: systemFont.regular,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0.25,
  } as TextStyle,

  bodySmall: {
    fontFamily: systemFont.regular,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: 0.4,
  } as TextStyle,

  // Label
  labelLarge: {
    fontFamily: systemFont.medium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: 0.1,
  } as TextStyle,

  labelMedium: {
    fontFamily: systemFont.medium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.5,
  } as TextStyle,

  labelSmall: {
    fontFamily: systemFont.medium,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  } as TextStyle,

  // Caption
  caption: {
    fontFamily: systemFont.regular,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  // Button
  button: {
    fontFamily: systemFont.semibold,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.25,
  } as TextStyle,
} as const;
