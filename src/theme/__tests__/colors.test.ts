import { colors, getThemeColors } from '@/theme/colors';

describe('Plus accent themes', () => {
  it('keeps the free coral theme and applies paid accents without changing semantic colors', () => {
    expect(getThemeColors('light', 'coral')).toBe(colors.light);

    const ocean = getThemeColors('light', 'ocean');
    expect(ocean.accent).toBe('#3C78A8');
    expect(ocean.success).toBe(colors.light.success);
  });
});
