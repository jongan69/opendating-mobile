// App entry point — must load the crypto polyfill before ANYTHING else.
// @noble/curves (used by opendating-protocol for key generation) requires
// globalThis.crypto.getRandomValues, which Hermes does not provide.
import 'react-native-get-random-values';

// Delegate to expo-router (which loads src/app/_layout.tsx as root).
import 'expo-router/entry';
