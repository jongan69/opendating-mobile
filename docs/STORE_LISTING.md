# OpenDating Store Listing

**Last updated:** 2026-08-09

> **Submission status: approved.** This metadata is cleared for upload with the 0.1.1 release. The stale iOS build 4 and Android build 3 artifacts are superseded and must not be shipped.

This is the canonical copy deck for the first App Store Connect and Google Play
Console records.

## App Identity

| Field | Value |
|---|---|
| App Store name | OpenDating Mobile |
| Google Play name | OpenDating |
| Subtitle / short description | Dating built for privacy |
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

OpenDating is a dating app built around privacy.

Your exact location never leaves your phone. Discovery works from a coarse area
only, so you can find people nearby without broadcasting where you are.

Messages between matches are end-to-end encrypted, so your conversations stay
between you and the person you matched with.

No advertising profile. No data brokers. No selling your personal information.

HOW IT WORKS
- Create an account on your device in seconds, with no email, phone number, or password
- Add photos and a short bio
- Browse people in your general area
- Match, then message with end-to-end encryption

SAFETY
- Report or block any profile at any time
- Blocks take effect immediately on your device
- Adults 18 and over only

OpenDating is the first app built on the open OpenDating protocol, so your
account belongs to you.

## Keywords

`singles,match,chat,nearby,secure,photos,profile,ethical,local,relationships,privacy`

## Release Notes

Version 0.1.1 improves the discovery deck and request routing, and adds
authenticated checks on incoming messages.

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
| iOS | `79e9b81e-6f66-4dcc-b46f-4ae53da4ae67` | Superseded App Store IPA, v0.1.0 build 4 — do not ship |
| Android | `f5b79c72-91ee-4dd3-96e7-0343911e2ca2` | Superseded Play Store AAB, v0.1.0 version code 3 — do not ship |

Build fresh 0.1.1 artifacts before submitting.

## Submission Commands

Run from the approval commit, with the signed release tag in place:

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
