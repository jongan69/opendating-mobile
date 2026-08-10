# OpenDating Mobile — Claude Code Reference

## Project Identity

OpenDating Mobile is the first reference client for the [OpenDating](https://github.com/jongan69/OpenDating) protocol. It is an Expo React Native app under active security and reliability work, approved for iOS and Android launch. Production builds and submissions read their gate state from `release/manifest.json`.

## Critical Rules

1. **Never import backend implementation code.** The mobile app is an independently developed client. All integration goes through the published `opendating-protocol@0.1.0` registry artifact and the public relay at `wss://opendating-relay.jonathang132298.workers.dev`. Package `0.1.1` is not the baseline until its registry artifact is published and verified.

2. **Nostr is invisible to users.** Never use terms like "npub", "nsec", "relay", "NIP-42", "gift wrap", "event kind" in user-facing UI. Normal language: "Create Account", not "Generate Nostr Keypair".

3. **Privacy is non-negotiable.** Raw GPS never leaves the device (only a 5-character geohash). Never log or transmit a private key. The v0.1 JavaScript/SecureStore signer and advanced clipboard recovery are known pre-GA limitations tracked in `docs/RELEASE-STATUS.md`. DMs are end-to-end encrypted. Blocks must take effect locally before network confirmation.

4. **Use @expo/ui for conventional UI.** Escape to React Native + Reanimated only for the swipe deck and complex gestures. No alternative UI frameworks (NativeWind, Tamagui, etc.).

5. **Platform-native feel.** iOS should feel SwiftUI. Android should feel Material 3. One brand, native on each platform.

## Architecture

```
Screens (app/) → Features (hooks) → OpenDatingClient → NDK + opendating-protocol → Relay
```

Screens never construct Nostr events, gift wraps, or envelopes. That belongs below the UI layer.

## Key Files

| File | Purpose |
|---|---|
| `src/lib/opendating/open-dating-client.ts` | Domain facade — the single entry point for all protocol operations |
| `src/lib/opendating/errors.ts` | Wire errors → user-facing messages |
| `src/lib/location/` | GPS → geohash (max 5 chars, raw GPS never leaves) |
| `src/lib/storage/` | SecureStore wrapper (nsec, services cache) |
| `src/features/` | Custom hooks per domain (discovery, matching, messaging, safety) |
| `src/theme/` | Colors (light+dark), spacing, radius, typography |
| `src/state/theme-context.tsx` | Theme provider |
| `docs/` | Architecture, design, security, privacy, protocol integration docs |

## Commands

```bash
npm run typecheck   # tsc --noEmit (must pass in strict mode)
npm run lint        # ESLint (0 errors required)
npm test            # Jest tests
npm start           # Expo dev server
```

## Service Discovery

Service pubkeys come from the relay's NIP-11 document. Never hardcode them.

```
GET https://opendating-relay.jonathang132298.workers.dev
Accept: application/nostr+json
```

## Before Committing

- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 errors)
- [ ] No backend imports or references
- [ ] No raw GPS in logs, storage, or payloads
- [ ] No hardcoded service pubkeys
- [ ] User-facing text uses plain language, not Nostr terminology
