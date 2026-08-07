# Changelog

## [0.1.0] — Initial Release

### Features
- **Account creation** — Secure Nostr keypair generation, stored in OS secure storage
- **Account import** — Restore existing identity from nsec/hex private key
- **13-step onboarding** — Privacy explanation, basics, preferences, intent, about, photos, location
- **Photo-first discovery** — Tinder-style swipe deck with Reanimated gestures
- **Location privacy** — Coarse geohash (max 5 chars, ~5 km precision), raw GPS never leaves device
- **Private likes** — Encrypted via NIP-59 gift wraps to matcher service
- **Match celebration** — Tasteful match screen with haptic feedback
- **NIP-17 messaging** — End-to-end encrypted text chat
- **Safety controls** — Block (local-first), unmatch, encrypted reporting with evidence selection
- **Profile management** — Edit profile, pause/resume discovery, visibility controls
- **Verification display** — Server-issued verification claims
- **Account deletion** — Full account removal with state cleanup
- **Dark mode** — Full light/dark/system theme support
- **Platform-native** — iOS feels SwiftUI, Android feels Material 3
- **Settings** — Privacy info, advanced Nostr details (npub, relay, services), backup export
- **Discovery filters** — Age range, distance, gender, relationship intent

### Protocol
- OpenDating v0.1 protocol
- NIP-11 service discovery
- NIP-42 AUTH authentication
- NIP-44 encryption
- NIP-59 gift wraps
- NIP-17 direct messages

### Tech Stack
- Expo SDK 57 / React Native 0.86
- TypeScript 6.0 strict mode
- Expo Router (file-based routing)
- @expo/ui native components
- react-native-reanimated + react-native-gesture-handler (swipe engine)
- @nostr-dev-kit/ndk-mobile (Nostr client)
- opendating-protocol@0.1.0 (protocol + crypto)
- expo-secure-store, expo-location, expo-image, expo-image-picker, expo-haptics
