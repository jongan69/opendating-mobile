# OpenDating Store Listing

**Last updated:** 2026-08-09

> **Submission status: held.** This metadata is not approved for upload. The iOS build 4 submission must be withdrawn and Android build 3 must remain draft. Production scripts are blocked by `release/manifest.json`.

This is the canonical copy deck for the first App Store Connect and Google Play
Console records.

## App Identity

| Field | Value |
|---|---|
| App Store name | OpenDating Mobile |
| Google Play name | OpenDating |
| Subtitle / short description | Private dating, pre-release |
| iOS bundle ID | `com.jongan69.opendating` |
| Android package | `com.jongan69.opendating` |
| SKU | `com.jongan69.opendating` |
| Primary locale | `en-US` |
| Price | Free |
| Primary category | Social Networking |
| Secondary category | Lifestyle |
| Privacy policy URL | `https://jongan69.github.io/opendating-mobile/privacy/` |
| Support URL | `https://jongan69.github.io/opendating-mobile/safety/` |
| Marketing URL | `https://jongan69.github.io/opendating-mobile/` |

## Store Description

OpenDating is pre-release dating software built around coarse location and
end-to-end encrypted direct messages. Current services are operated by
OpenDating while the project completes native key protection, durable
messaging, verification, moderation, legal, and reliability gates.

No current binary is approved for public distribution. This copy must be
rewritten and legally reviewed before a future store submission.

## Keywords

`singles,match,chat,nearby,secure,photos,profile,ethical,local,relationships,privacy`

## Release Notes

Release held. Version 0.1.1 repairs discovery gestures and request routing,
adds authenticated inbound-envelope checks, and keeps production distribution
blocked pending the documented release gates.

## Reviewer Notes

No demo account is required. Reviewers can create a local account directly in
the app, complete onboarding, and allow location/photo permissions when prompted.

Use these notes in App Store Connect and Play Console:

```text
OpenDating creates a self-owned account on-device; there is no email/password
login or external account required for review. Please create an account in the
app, complete onboarding, and allow approximate location when prompted. The app
uses a live OpenDating relay at
wss://opendating-relay.jonathang132298.workers.dev. Exact location never leaves
the device; the app sends only a coarse geohash area for discovery.
Messages between matches are end-to-end encrypted. Blocks and reports are
available from match/profile safety controls.
```

## Privacy Declarations

Use this as the review checklist for Apple privacy labels and Google Play Data
Safety. Confirm the final console answers before submitting for review.

| Data type | Purpose | Linked to user | Tracking |
|---|---|---:|---:|
| Profile information and photos | App functionality | Yes | No |
| Approximate location | Nearby discovery | Yes | No |
| Messages and user-generated content | Messaging and safety | Yes | No |
| Public account ID | Account functionality | Yes | No |
| Reports and block actions | Safety and moderation | Yes | No |

The app does not use third-party advertising SDKs and does not sell personal
data. iOS export compliance is configured as standard encryption with no France
availability for this release, so App Store Connect does not require an export
compliance document or compliance code.

## Age And Content Rating

Use a 17+ / Mature teen posture for the first release:

- Dating and relationship context
- User-generated profile text, photos, and messages
- Possible mild profanity or suggestive content from users
- No gambling, contests, medical information, or realistic violence
- No unrestricted in-app web browser

## Screenshots

Prepared screenshots are in `screenshots/app-store/`:

- `6.7-{01-welcome,02-create-account,12-discover,13-matches,14-profile}.png` at 1290 x 2796
- `6.1-{01-welcome,02-create-account,12-discover,13-matches,14-profile}.png` at 1179 x 2556
- `ipad-13-{01-welcome,02-create-account,12-discover,13-matches,14-profile}.png` at 2048 x 2732 for `APP_IPAD_PRO_129` and `APP_IPAD_PRO_3GEN_129`

The selected flow is welcome, account creation, discovery, matches, and profile.
Google Play phone screenshots are in `screenshots/play-store/phone-*.png` at
1080 x 1920 for the same five screens.

## Built Binaries

| Platform | Build | Artifact |
|---|---|---|
| iOS | `79e9b81e-6f66-4dcc-b46f-4ae53da4ae67` | Stale App Store IPA, v0.1.0 build 4 — withdraw |
| Android | `f5b79c72-91ee-4dd3-96e7-0343911e2ca2` | Stale Play Store AAB, v0.1.0 version code 3 — keep draft |

## Submission Commands

Only after `release/manifest.json` is approved from the exact release commit:

```bash
export ASC_API_KEY_PATH="<approved secret path>"
export ASC_API_KEY_ISSUER_ID="<approved issuer ID>"

npm run store:ios:lookup-asc-app-id
npm run store:ios:lookup-asc-app-id -- --write-eas-json

npm run submit:ios
npm run store:metadata:push -- --non-interactive
```

After the Play Console app exists and the first AAB has been uploaded manually:

```bash
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="<approved secret path>"

npm run submit:android
```
