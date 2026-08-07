# OpenDating Mobile

A sleek, privacy-first mobile dating application built on the [OpenDating](https://github.com/jongan69/OpenDating) protocol.

**Expo SDK 57 · React Native · TypeScript · NDK Mobile · opendating-protocol v0.1**

## About

OpenDating Mobile is a production-quality dating app with a UX competitive with Tinder, Bumble, and Hinge — while preserving OpenDating's privacy, portability, safety, and decentralization architecture.

Nostr is the invisible foundation underneath a mainstream-quality dating experience.

## Getting Started

### Prerequisites

- Node.js 22+
- iOS Simulator (macOS + Xcode) or Android Emulator
- Expo Go app (for quick testing) or Expo development build

### Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start the development server
npm start
```

### Environment

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_OPENDATING_RELAY_URL` | `wss://opendating-relay.jonathang132298.workers.dev` | Relay WebSocket URL |
| `EXPO_PUBLIC_OPENDATING_INFO_URL` | `https://opendating-relay.jonathang132298.workers.dev` | NIP-11 info endpoint |
| `EXPO_PUBLIC_OPENDATING_PROTOCOL_VERSION` | `0.1` | Protocol version |

## Architecture

```
                    Expo UI
                       │
                     Screens
                       │
                    Features
                       │
                 OpenDatingClient
                 /             \
                /               \
      opendating-protocol      NDK Mobile
                \               /
                 \             /
                    Nostr
                      │
                      ▼
          OpenDating Relay v0.1
```

The mobile application does **not** depend on backend implementation code. Everything required for client integration is defined by `opendating-protocol@0.1.0` and public relay behavior.

## Features

- **Account Creation** — Secure Nostr keypair, stored only in OS secure storage
- **Profile** — Multi-step onboarding with photos, bio, interests, preferences
- **Discovery** — Tinder-style swipe deck with photo-first cards
- **Location Privacy** — Only coarse geohash (max 5 chars) sent to backend
- **Matching** — Private likes via encrypted gift wraps to matcher service
- **Chat** — End-to-end encrypted NIP-17 messaging
- **Safety** — Block, unmatch, report with immediate local enforcement
- **Dark Mode** — Full light/dark/system theme support
- **Platform Native** — iOS feels SwiftUI, Android feels Material 3

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Expo SDK 57 |
| Runtime | React Native 0.86 |
| Language | TypeScript 6.0 (strict) |
| Navigation | Expo Router |
| Nostr | @nostr-dev-kit/ndk-mobile |
| Protocol | opendating-protocol@0.1.0 |
| Gestures | react-native-gesture-handler |
| Animation | react-native-reanimated |
| Images | expo-image |
| Storage | expo-secure-store |
| Location | expo-location |
| UI | @expo/ui + React Native primitives |

## License

MIT
