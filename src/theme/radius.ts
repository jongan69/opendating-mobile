export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
  continuous: undefined as undefined | number, // platform-specific
} as const;

// iOS continuous curves
export const iosRadius = {
  continuous: 9999, // maps to continuous curve on iOS
} as const;
