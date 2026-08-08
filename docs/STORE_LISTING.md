# OpenDating Store Listing

**Last updated:** 2026-08-08

This is the canonical copy deck for the first App Store Connect and Google Play
Console records.

## App Identity

| Field | Value |
|---|---|
| App Store name | OpenDating Mobile |
| Google Play name | OpenDating |
| Subtitle / short description | Private dating, no ads |
| iOS bundle ID | `com.jongan69.opendating` |
| Android package | `com.jongan69.opendating` |
| SKU | `com.jongan69.opendating` |
| Primary locale | `en-US` |
| Price | Free |
| Primary category | Social Networking |
| Secondary category | Lifestyle |
| Privacy policy URL | `https://jongan69.github.io/opendating-mobile/privacy/` |
| Support URL | `https://jongan69.github.io/opendating-mobile/privacy/` |
| Marketing URL | `https://jongan69.github.io/opendating-mobile/` |

## Store Description

OpenDating is a privacy-first dating app for meeting people nearby without
turning your love life into an advertising profile.

Create an account in the app, build a profile, discover nearby people, match
when the interest is mutual, and message with end-to-end encryption. Your exact
location never leaves your device. OpenDating uses only a coarse area so
discovery can work without exposing your precise location.

What makes OpenDating different:

- Self-owned account with a recovery key
- Coarse location instead of exact location sharing
- End-to-end encrypted private messages
- Private likes until there is a match
- Local blocks, reports, and unmatch controls
- No ads and no tracking-based business model
- Built on open, portable dating infrastructure

OpenDating is an early production release for people who want a calmer, more
private way to meet. Bring the human part. The app handles the privacy plumbing.

## Keywords

`singles,match,chat,nearby,secure,photos,profile,ethical,local,relationships,privacy`

## Release Notes

Initial 0.1 release: account creation with a recovery key, privacy-first
onboarding, nearby discovery using coarse location, mutual matches, end-to-end
encrypted messages, blocks, reports, and profile controls.

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

- `6.7-01-welcome.png` through `6.7-14-profile.png` at 1290 x 2796
- `6.1-01-welcome.png` through `6.1-14-profile.png` at 1179 x 2556
- `ipad-13-01-welcome.png` through `ipad-13-14-profile.png` at 2048 x 2732 for `APP_IPAD_PRO_3GEN_129`

The selected flow is welcome, account creation, discovery, matches, and profile.

## Built Binaries

| Platform | Build | Artifact |
|---|---|---|
| iOS | `79e9b81e-6f66-4dcc-b46f-4ae53da4ae67` | App Store IPA, v0.1.0 build 4 |
| Android | `f5b79c72-91ee-4dd3-96e7-0343911e2ca2` | Play Store AAB, v0.1.0 version code 3 |

## Submission Commands

After the App Store Connect app record exists:

```bash
export ASC_API_KEY_PATH="$HOME/.appstoreconnect/private_keys/AuthKey_563GUURUSD.p8"
export ASC_API_KEY_ISSUER_ID="<issuer UUID>"

npm run store:ios:lookup-asc-app-id
npm run store:ios:lookup-asc-app-id -- --write-eas-json

npx eas-cli@latest submit --platform ios \
  --id c51e102b-4592-448e-8f42-3127ceead80f \
  --profile production --non-interactive --wait
npm run store:metadata:push -- --non-interactive
```

After the Play Console app exists and the first AAB has been uploaded manually:

```bash
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="$HOME/.google-play/service-account.json"

npx eas-cli@latest submit --platform android \
  --id f5b79c72-91ee-4dd3-96e7-0343911e2ca2 \
  --profile production --non-interactive --wait
```
