<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./BrandAssetPack/preview/lockup-dark.png">
    <img alt="OpenDating" src="./BrandAssetPack/preview/lockup-coral.png" width="520">
  </picture>
</p>

<p align="center">
  <strong>Deliberate private introductions on an open protocol.</strong><br>
  An Expo React Native reference client for the OpenDating protocol.
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

> **Release status:** 0.1.1 is a proposed launch candidate; approval is not effective until `release/manifest.json` records the reviewed source SHA, artifact IDs, and checksums. See [Release Status](docs/RELEASE-STATUS.md) for verified capabilities, and the [1.0 Execution Roadmap](docs/ROADMAP-1.0.md) for the path through GA.

## What is OpenDating?

**OpenDating** is an intentional-introduction client built around user-owned identity, data minimization, coarse location, private decisions, and end-to-end encrypted direct messages. Instead of an endless swipe feed, it presents one person with an explanation and privacy receipt. It currently connects to services operated by OpenDating on Cloudflare; federation and independent providers are post-GA work.

Under the hood, OpenDating uses **Nostr** as a protocol building block. The
current discovery, matching, moderation, media, and delivery services are
first-party OpenDating services; interchangeable independent providers are
post-GA work.

> **OpenDating Mobile** is the first reference client for the [OpenDating protocol](https://github.com/jongan69/OpenDating) (v0.1).

<br>

## Why OpenDating?

| Traditional Dating Apps | OpenDating |
|---|---|
| Your data lives on their servers | Your identity is a key you own |
| They track your exact location | Only ~5 km coarse area shared |
| They can read your messages | End-to-end encrypted (NIP-44) |
| Profile portability varies by provider | An open profile format and export are planned for post-GA federation; they are not available in this release |
| Advertising and data monetization may be part of the model | No advertising or tracking-based monetization in the current build |
| Account portability varies | Portable identity is a protocol design goal; interoperable provider transfer is planned post-GA and is not available today |

<br>

## Features

<table>
<tr>
<td width="50%">

### Introductions
- **One person with context** — Each introduction explains the visible compatibility facts that led to it
- **Privacy receipt** — The app says what is shared now, withheld, and unlocked only after mutual interest
- **Explicit private choices** — Skip or express interest without public engagement counts or gesture ambiguity
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

### Privacy Passport
- **Live account boundary** — Shows the member-owned account identifier and backup path
- **Visibility control** — Pause or resume introductions from the passport
- **Plain-language boundaries** — Explains location, decision, and conversation privacy in one place

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
│               App Screens                    │  ← Expo Router
├──────────────────────────────────────────────┤
│              Feature Hooks                   │  ← Domain logic
├──────────────────────────────────────────────┤
│           OpenDatingClient                   │  ← Protocol facade
├──────────────────┬───────────────────────────┤
│ opendating-proto │   NDK core                │  ← Infrastructure
│ (crypto, types)  │   (relay, events, auth)   │
├──────────────────┴───────────────────────────┤
│                  Nostr                       │
├──────────────────────────────────────────────┤
│    OpenDating Relay v0.1 (Cloudflare)        │
└──────────────────────────────────────────────┘
```

**The mobile app does not depend on backend implementation code.** Integration uses the published `opendating-protocol@0.1.0` registry artifact (installed through the `^0.1.0` range), advertised service capabilities, and the OpenDating protocol specification. Protocol `0.1` is experimental; package `0.1.1` is pending registry publication and verification.

<br>

## Quick Start

```bash
# Clone
git clone https://github.com/jongan69/opendating-mobile.git
cd opendating-mobile

# Install
cp .env.example .env
npm ci

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
| [HANDOFF](docs/HANDOFF.md) | Repository boundary, access inventory, quality gates, and continuation order |
| [RELEASE-STATUS](docs/RELEASE-STATUS.md) | Verified release behavior and current production blockers |
| [ROADMAP-1.0](docs/ROADMAP-1.0.md) | Gated path from release containment through GA and federation |
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
| **Nostr Client** | @nostr-dev-kit/ndk | ^2.15 |
| **Protocol** | opendating-protocol | ^0.1.0 (registry: 0.1.0; 0.1.1 pending) |
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
