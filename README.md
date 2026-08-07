<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./BrandAssetPack/preview/lockup-dark.png">
    <img alt="OpenDating" src="./BrandAssetPack/preview/lockup-coral.png" width="520">
  </picture>
</p>

<p align="center">
  <strong>The privacy-first, decentralized dating app.</strong><br>
  A production-grade Expo React Native reference client for the OpenDating protocol.
</p>

<p align="center">
  <a href="https://github.com/jongan69/opendating-mobile/blob/main/LICENSE"><img alt="License MIT" src="https://img.shields.io/badge/license-MIT-coral"></a>
  <a href="https://docs.expo.dev/versions/v57.0.0/"><img alt="Expo SDK 57" src="https://img.shields.io/badge/expo--sdk-57-blue?logo=expo"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript strict" src="https://img.shields.io/badge/typescript-strict-3178c6?logo=typescript"></a>
  <a href="https://reactnative.dev/"><img alt="React Native 0.86" src="https://img.shields.io/badge/react--native-0.86-61dafb?logo=react"></a>
  <a href="../../actions/workflows/ci.yml"><img alt="CI status" src="https://img.shields.io/badge/CI-passing-brightgreen"></a>
  <img alt="Platforms iOS Android" src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey">
</p>

<br>

## What is OpenDating?

**OpenDating** is a dating application that feels as polished as Tinder, Bumble, or Hinge — but built on a decentralized, privacy-first architecture. Your identity belongs to you. Your exact location never leaves your device. Your likes, blocks, and reports are private. Your messages are end-to-end encrypted.

Under the hood, OpenDating runs on **Nostr** — a decentralized protocol for censorship-resistant communication. But normal users never need to know that. They just create an account, build a profile, and start discovering people nearby.

> **OpenDating Mobile** is the first reference client for the [OpenDating protocol](https://github.com/jongan69/OpenDating) (v0.1).

<br>

## Why OpenDating?

| Traditional Dating Apps | OpenDating |
|---|---|
| Your data lives on their servers | Your identity is a key you own |
| They track your exact location | Only ~5 km coarse area shared |
| They can read your messages | End-to-end encrypted (NIP-44) |
| They own your profile | Portable across any OpenDating client |
| They monetize your data | No ads, no surveillance business model |
| You can't leave | Export your key, move to any client |

<br>

## Features

<table>
<tr>
<td width="50%">

### Discovery
- **Photo-first swipe deck** — Tinder-style cards with Reanimated gestures
- **Privacy-first location** — Only a 5-character geohash (~5 km) ever leaves your device
- **Customizable filters** — Age range, distance, gender, relationship intent
- **Daily quotas** — Prevents profile scraping and enumeration

### Messaging
- **End-to-end encrypted** — NIP-17 direct messages via NIP-44 encryption
- **Match-only** — The relay enforces that only matched users can message each other
- **No read receipts** — No typing indicators, no online status

</td>
<td width="50%">

### Safety
- **Block** — Takes effect locally immediately, enforced server-side, never notified
- **Unmatch** — Removes the match without explanation
- **Report** — Encrypted to moderation service, with optional message evidence
- **Private by default** — Likes, blocks, and reports are never public

### Platform
- **iOS** — Feels like a native SwiftUI app (SF Symbols, native sheets, continuous corners)
- **Android** — Feels like a native Material 3 app (Material Symbols, tonal surfaces)
- **Dark mode** — Full light/dark/system theme support
- **Accessibility** — VoiceOver, TalkBack, Dynamic Type, Reduce Motion

</td>
</tr>
</table>

<br>

## Architecture

```
┌──────────────────────────────────────────────┐
│                  Expo UI                     │  ← Native components
├──────────────────────────────────────────────┤
│               30 App Screens                 │  ← Expo Router
├──────────────────────────────────────────────┤
│             11 Feature Hooks                 │  ← Domain logic
├──────────────────────────────────────────────┤
│           OpenDatingClient                   │  ← Protocol facade
├──────────────────┬───────────────────────────┤
│ opendating-proto │   NDK Mobile              │  ← Infrastructure
│ (crypto, types)  │   (relay, events, auth)   │
├──────────────────┴───────────────────────────┤
│                  Nostr                       │
├──────────────────────────────────────────────┤
│    OpenDating Relay v0.1 (Cloudflare)        │
└──────────────────────────────────────────────┘
```

**The mobile app does not depend on backend implementation code.** Everything required for client integration is defined by the `opendating-protocol@0.1.0` package, the public relay API, and the OpenDating protocol specification.

<br>

## Quick Start

```bash
# Clone
git clone https://github.com/jongan69/opendating-mobile.git
cd opendating-mobile

# Install
cp .env.example .env
npm install --legacy-peer-deps

# Run
npm start                # Expo dev server
npm run ios              # iOS simulator
npm run android          # Android emulator
```

### Quality Commands

```bash
npm run typecheck        # TypeScript strict — must pass with 0 errors
npm run lint             # ESLint — must pass with 0 errors
npm test                 # Jest test suite
```

<br>

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Layer diagram, data flow, design decisions |
| [DESIGN](docs/DESIGN.md) | Visual principles, color system, typography, motion |
| [SECURITY](docs/SECURITY.md) | Key storage, encryption, auth, trust model |
| [PRIVACY](docs/PRIVACY.md) | What's shared, what's not, limitations, controls |
| [PROTOCOL-INTEGRATION](docs/PROTOCOL-INTEGRATION.md) | All 20+ protocol operations, request lifecycle, error handling |
| [MOBILE-V0.1-COMPLETE](docs/MOBILE-V0.1-COMPLETE.md) | Release report with full feature inventory |
| [CONTRIBUTING](CONTRIBUTING.md) | Development workflow, code style, privacy rules |
| [CHANGELOG](CHANGELOG.md) | Version history |

<br>

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | Expo | SDK 57 |
| **Runtime** | React Native | 0.86 |
| **Language** | TypeScript (strict) | 6.0 |
| **Navigation** | Expo Router | ~57 |
| **UI Components** | @expo/ui | ~57 |
| **Nostr Client** | @nostr-dev-kit/ndk-mobile | ^0.8 |
| **Protocol** | opendating-protocol | 0.1.0 |
| **Gestures** | react-native-gesture-handler | ~2.32 |
| **Animation** | react-native-reanimated | ^4.5 |
| **Images** | expo-image | ~57 |
| **Secure Storage** | expo-secure-store | ^57 |
| **Location** | expo-location | ^57 |
| **Photos** | expo-image-picker | ^57 |
| **Haptics** | expo-haptics | ^57 |
| **SVG** | react-native-svg | latest |

<br>

## Contributing

OpenDating Mobile is open source and welcomes contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, code style guide, and privacy rules.

Before submitting a PR:
- `npm run typecheck` must pass (0 errors)
- `npm run lint` must pass (0 errors)
- No backend implementation imports
- No hardcoded service pubkeys
- No raw GPS, nsec, or decrypted message plaintext in new code

<br>

## Related Projects

- [**OpenDating**](https://github.com/jongan69/OpenDating) — The protocol specification, backend relay, and `opendating-protocol` npm package
- [**Nostr**](https://github.com/nostr-protocol/nostr) — The decentralized protocol OpenDating is built on

<br>

## License

MIT © [OpenDating](https://github.com/jongan69)

---

<p align="center">
  <sub>Built with ❤️ for privacy, portability, and genuine human connection.</sub>
</p>
