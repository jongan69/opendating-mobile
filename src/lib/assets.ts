// Brand asset references — use require() for local images so Metro bundles them
// and expo-image can render them efficiently.

export const BrandAssets = {
  /** 800×600 PNG — warm line-art coffee cup illustration for empty states */
  emptyStateCoffee: require('../../assets/brand/empty-state-coffee-800x600.png'),
} as const;
