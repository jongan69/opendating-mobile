// Metro configuration.
//
// The only customisation here exists to keep exactly one copy of the React and
// React Native runtimes in the bundle.
//
// `expo-nip55` (pulled in transitively by @nostr-dev-kit/ndk-mobile) declares
// `react-native: "0.79.2"` and `react: "19.0.0"` as hard dependencies rather
// than peers, so npm is obliged to install a second, nested copy even though a
// root `overrides` entry asks for the app's versions. Two copies of React
// Native in one bundle means the second initialises TurboModuleRegistry
// against a native registry that only ever registered the first, and the app
// dies at startup with:
//
//   Invariant Violation: TurboModuleRegistry.getEnforcing(...):
//   'PlatformConstants' could not be found.
//
// Nothing in this app imports expo-nip55 — it is an Android external-signer
// integration, and OpenDating manages its own keys in SecureStore. Hiding the
// nested copies from Metro makes every import resolve to the hoisted root
// version. Remove this block if ndk-mobile ever drops the dependency or
// expo-nip55 moves React Native to peerDependencies.

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const DUPLICATE_RUNTIME_COPIES = [
  /node_modules[\\/]expo-nip55[\\/]node_modules[\\/]react-native[\\/].*/,
  /node_modules[\\/]expo-nip55[\\/]node_modules[\\/]react[\\/].*/,
  /node_modules[\\/]expo-nip55[\\/]node_modules[\\/]@react-native[\\/].*/,
  /node_modules[\\/]expo-nip55[\\/]node_modules[\\/]scheduler[\\/].*/,
];

config.resolver.blockList = Array.isArray(config.resolver.blockList)
  ? [...config.resolver.blockList, ...DUPLICATE_RUNTIME_COPIES]
  : config.resolver.blockList
    ? [config.resolver.blockList, ...DUPLICATE_RUNTIME_COPIES]
    : DUPLICATE_RUNTIME_COPIES;

module.exports = config;
