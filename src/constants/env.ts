// Environment flags — build-time constants from EXPO_PUBLIC_* env vars.
// These are baked into the JS bundle and cannot change at runtime.

/** True when building for App Store screenshot capture. */
export const isScreenshotMode =
  process.env.EXPO_PUBLIC_SCREENSHOT_MODE === 'true';
