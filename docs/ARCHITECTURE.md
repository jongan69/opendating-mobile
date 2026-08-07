# Architecture

## Overview

OpenDating Mobile is built as a layered application where each layer has strict boundaries.

```
                    Expo UI (@expo/ui)
                         │
                       Screens (app/)
                         │
                      Features (src/features/)
                         │
                   OpenDatingClient (src/lib/opendating/)
                   /                           \
                  /                             \
    opendating-protocol                   NDK Mobile
    (crypto, envelopes,               (relay, subscriptions,
     gift wraps, types)                events, signer)
                  \                             /
                   \                           /
                        Nostr Protocol
                            │
                            ▼
                OpenDating Relay v0.1
```

## Dependency Rules

1. **Screens** may import from Features, Components, Theme, and OpenDatingClient
2. **Features** may import from OpenDatingClient, Location, Storage, Theme, Types
3. **OpenDatingClient** may import from opendating-protocol, NDK Mobile, Storage
4. **Screens must NOT** construct Nostr events, gift wraps, or envelopes directly
5. **No layer** may import from backend implementation code

## Layer Details

### Screens (`src/app/`)

Expo Router file-based routing. Each screen:
- Uses hooks for data and actions
- Composes UI components
- Handles navigation
- Does NOT contain protocol logic

### Features (`src/features/`)

Custom hooks that encapsulate domain logic:
- `use-discovery` — candidate fetching, swipe actions, location updates
- `use-matches` — match list, new match notification
- `use-messaging` — NIP-17 send/receive, subscription management
- `use-safety` — block/unblock, unmatch, report
- `use-profile` — profile CRUD, pause/resume
- `use-auth` — identity management
- `use-bootstrap` — app startup state machine

### OpenDatingClient (`src/lib/opendating/`)

The facade that screens talk to. Domain-oriented API:
- `createProfile()`, `getProfile()`, `updateProfile()`
- `getCandidates()`, `like()`, `pass()`
- `sendMessage()`, `subscribeToMessages()`
- `createBlock()`, `unmatch()`, `report()`
- `getCapabilities()`, `ping()`

### NDK Mobile

Handles all Nostr infrastructure:
- Relay connection and reconnection
- NIP-42 AUTH
- Event publication and subscription
- Local event caching

### OpenDating Protocol Package

Pure protocol + crypto:
- `createEnvelope()`, `buildGiftWrap()`
- `nip44Encrypt()`, `nip44Decrypt()`
- `generateKeypair()`, `signEvent()`

## Data Flow

### Request/Response

```
Feature Hook
  → OpenDatingClient.sendRequest(type, payload)
    → createEnvelope(type, requestId, payload)
    → buildGiftWrap(rumor, senderKey, serviceKey)
    → NDK.publish(giftWrap)
    → Wait for response on kind 1059 subscription
    → Decrypt gift wrap
    → Match request_id
    → Return domain result
```

### Bootstrap

```
App Start
  → Load SecureStore identity
    → No identity? → Onboarding
    → Yes? → Initialize NDK
      → Connect relay
      → NIP-42 Auth
      → Fetch NIP-11 capabilities
        → Incompatible? → Error screen
        → Compatible? → Get profile
          → No profile? → Profile onboarding
          → Yes? → Main app
```

## Key Design Decisions

1. **Single NDK instance** — one shared client, screens never independently instantiate NDK
2. **Request correlation** — every request has a unique `request_id`, responses matched via map
3. **Service discovery** — service pubkeys from NIP-11, never hardcoded
4. **Location privacy** — raw GPS consumed in location module, only geohash_prefix emitted
5. **Local-first safety** — blocks applied locally before network confirmation
6. **No backend imports** — client works against deployed relay only
