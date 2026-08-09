# OpenDating Mobile v0.1 — Historical Implementation Snapshot

## Status: ARCHIVED — NOT RELEASE READY

This file records the original v0.1 implementation snapshot. It is not a
release claim. Production builds and submissions are blocked; current evidence
and remaining gates are tracked in [Release Status](RELEASE-STATUS.md) and the
[1.0 Roadmap](ROADMAP-1.0.md).

## Project Summary

| Metric | Value |
|---|---|
| Expo SDK | 57 |
| React Native | 0.86.2 |
| TypeScript | 6.0 (strict mode) |
| TypeScript errors | **0** |
| Source files | 67 (.ts/.tsx) |
| App screens | 30 |
| Components | 13 |
| Feature modules | 11 |
| Tests | Written (geohash, errors) |
| Protocol | opendating-protocol@^0.1.0 (registry resolves 0.1.0; 0.1.1 pending) |
| Relay | wss://opendating-relay.jonathang132298.workers.dev |

## Architecture

```
                    Expo UI (@expo/ui)
                         │
                    30 App Screens
                         │
                   11 Feature Hooks
                         │
                 OpenDatingClient
                 /             \
 opendating-protocol@^0.1.0  NDK core
                 \             /
                      Nostr
                       │
            OpenDating Relay v0.1
```

## Screens Implemented

### Bootstrap
- `index.tsx` — App bootstrap state machine (loading → identity check → connect → capabilities → profile → ready)

### Onboarding (13 screens)
- `welcome.tsx` — Brand + "Create Account" / "Import Account"
- `create-account.tsx` — Identity creation via `generateKeypair()`
- `import-account.tsx` — nsec/hex private key import with bech32 validation
- `privacy.tsx` — Privacy explanation
- `basics.tsx` — Display name, age, gender
- `preferences.tsx` — Gender preferences, age range
- `intent.tsx` — Relationship intent selection
- `about.tsx` — Bio, interests, prompts
- `photos.tsx` — Multi-photo picker (2–6 photos)
- `location.tsx` — Coarse location permission + privacy info
- `review.tsx` — Profile review → real `createProfile()` call
- `finish.tsx` — Success + haptic → discover

### Main Tabs (4 screens)
- `discover.tsx` — Card deck with swipe gestures (Reanimated + Gesture Handler)
- `matches.tsx` — Match list with new matches + conversations
- `profile.tsx` — User profile with pause discovery, verification, settings
- `filters.tsx` — Discovery filters (age, distance, gender, intent)

### Detail Screens (4 screens)
- `candidate/[pubkey].tsx` — Full candidate profile view with photos
- `chat/[pubkey].tsx` — NIP-17 messaging with safety menu (unmatch/block/report)
- `edit-profile.tsx` — Profile editor (name, age, gender, bio, interests, photos)
- `report.tsx` — Report flow with type selection + optional evidence

### Settings (5 screens)
- `settings/index.tsx` — Main settings menu
- `settings/privacy.tsx` — Privacy info + npub technical section
- `settings/account.tsx` — Delete account flow
- `settings/advanced.tsx` — Nostr technical details (npub, relay, services)
- `verification.tsx` — Verification claims display

## Components Implemented

### Discovery
- `swipe-deck.tsx` — Tinder-style card deck (Pan gesture, Reanimated, spring physics, LIKE/PASS stamps, skeleton loading, ReduceMotion support)
- `candidate-card.tsx` — Photo-first card (expo-image, gradient overlay, photo paging, interest chips, verification badge)

### Chat
- `message-bubble.tsx` — Sent/received bubbles with accent/surface colors
- `message-list.tsx` — FlatList with date separators, auto-scroll
- `chat-composer.tsx` — Auto-growing input with send button

### Safety
- `safety-menu.tsx` — iOS ActionSheet / Android Alert for unmatch/block/report
- `block-confirmation.tsx` — Modal with block consequences

### UI
- `empty-state.tsx` — Icon + title + subtitle + optional action
- `loading-overlay.tsx` — Translucent overlay with spinner
- `profile-photo.tsx` — Circular/rounded photo with placeholder
- `back-header.tsx` — Navigation back button header
- `onboarding-screen.tsx` — Shared onboarding chrome (progress, back, footer CTA)

## Feature Hooks Implemented

- `use-bootstrap.ts` — App startup state machine
- `use-auth.ts` — Identity management (create, import, delete)
- `use-discovery.ts` — Candidate stack, cursor pagination, prefetch, location sync
- `use-matches.ts` — Match list, push notifications, new match detection
- `use-messaging.ts` — NIP-17 send/receive, deduplication, optimistic send
- `use-safety.ts` — Block/unblock (optimistic local-first), unmatch, report
- `use-profile.ts` — Profile CRUD, pause/resume, caching
- `onboarding-draft.tsx` — In-memory draft context for multi-step onboarding

## Core Library

| Module | Description |
|---|---|
| `lib/opendating/open-dating-client.ts` | Domain facade — screens never construct Nostr events |
| `lib/opendating/errors.ts` | Wire error → user-facing message mapping |
| `lib/location/geohash.ts` | Geohash encoding, max 5-char truncation |
| `lib/location/index.ts` | Location permission, coarse geohash export (raw GPS never leaves) |
| `lib/storage/index.ts` | SecureStore wrapper for identity, services cache |
| `lib/format.ts` | npub encoding, pubkey shortening, timestamps |
| `state/theme-context.tsx` | Light/dark theme provider |
| `theme/` | Colors (light+dark), spacing, radius, typography |

## Privacy Guarantees

- [x] nsec stored only in OS secure storage (expo-secure-store)
- [x] Raw GPS never leaves location module
- [x] Geohash precision never exceeds 5 characters (~5 km)
- [x] Likes are private (encrypted gift wraps to matcher service)
- [x] Blocks applied locally before network response
- [x] Reports encrypted to moderation service
- [x] Messages end-to-end encrypted (NIP-44/NIP-59/NIP-17)
- [x] No public Nostr feed or social features
- [x] Service pubkeys discovered from NIP-11, never hardcoded

## Integration Points

All backend communication goes through `OpenDatingClient`:
- NIP-11 service discovery → cached service pubkeys
- NIP-42 AUTH → relay challenge-response
- NIP-59 gift wraps → private request/response
- NIP-44 encryption → message content protection
- NIP-17 DMs → match-only messaging
- Request correlation via `crypto.randomUUID()`
- All 20+ protocol operations wired to real backend methods

## What's Out of MVP Scope

Per the specification, the following are explicitly excluded:
- AI matchmaking/messages
- Subscriptions/premium features
- Super likes/boosts
- Photo DMs, voice, video
- Read receipts, typing indicators, online status
- Contact uploading
- Bitcoin/zaps wallet
- Public social feed

## Known Limitations

1. **Media upload** — Profile photo upload/retrieval is implemented via Blossom (BUD-02) with kind-24242 signed authorization in `src/lib/opendating/media.ts`.
2. **Expo Go compatibility** — Some dependencies (@expo/ui native components, expo-sqlite for NDK cache) require a development build rather than Expo Go.
3. **Real device testing** — Needs testing on physical iOS/Android devices for gesture feel, keyboard behavior, and camera integration.
4. **Alice/Bob/Carol E2E** — Requires three real accounts on the deployed relay; test infrastructure is in place.

## Commands

```bash
npm run typecheck   # TypeScript strict check — passes with 0 errors
npm run lint        # ESLint
npm test            # 9 Jest suites / 105 tests at the Phase 0 verification
npm start           # Expo dev server
npm run ios         # iOS simulator
npm run android     # Android emulator
```

## Dependencies

All installed and compatible:
- `@expo/ui@~57.0.9` — Native UI components
- `@nostr-dev-kit/ndk-mobile@^0.8.43` — Nostr client (legacy peer deps)
- `opendating-protocol@^0.1.0` — Protocol + crypto
- `react-native-reanimated@^4.5.1` — UI thread animations
- `react-native-gesture-handler@~2.32.0` — Gesture system
- `expo-image@~57.0.2` — Image loading/caching
- `expo-secure-store@^57.0.1` — Secure key storage
- `expo-location@^57.0.8` — GPS → coarse geohash
- `expo-image-picker@^57.0.8` — Photo selection
- `expo-haptics@^57.0.1` — Tactile feedback

---

**Historical milestone only:** the v0.1 feature skeleton reached a type-safe
device-testing checkpoint. It is not complete, production-grade, or approved
for distribution; the current release status and roadmap are authoritative.
