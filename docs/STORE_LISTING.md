# OpenDating Store Listing

**Last updated:** 2026-08-13

> **Submission status: blocked.** Apple rejected iOS 0.1.0 (1) under Guideline
> 4.3(b) on August 13, 2026. This copy belongs to the materially revised 0.1.1
> candidate and must not be attached to the rejected binary as though it
> described that build.

This is the canonical copy deck for the first App Store Connect and Google Play
Console records.

## App Identity

| Field | Value |
|---|---|
| App Store name | OpenDating Mobile |
| Google Play name | OpenDating |
| Subtitle / short description | Private introductions, your way |
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

OpenDating is for adults who want to meet without handing an app their phone
number, exact location, or readable conversations.

A DIFFERENT KIND OF INTRODUCTION
OpenDating presents one deliberate introduction at a time. Each introduction
explains the visible profile signals you share and includes a privacy receipt
showing what was shared, what remains withheld, and what unlocks only after
mutual interest. There is no public like count and no visible rejection.

YOUR PRIVACY PASSPORT
The Passport is a live account-control surface, not a marketing promise. See
whether your profile is visible, pause new introductions, inspect the app's
location and conversation boundaries, back up your self-owned account, or
permanently delete it.

BUILT AROUND DATA MINIMIZATION
- Create a self-owned account without email, phone number, password, or social login
- Reduce location to an approximate area on your device before it is shared
- Keep interest private unless both people independently choose each other
- Open an end-to-end encrypted conversation only after mutual interest
- Block locally and report privately
- Use the app without ads, tracking, or a data-broker business model

OpenDating is the first reference client for the open OpenDating protocol. Your
recovery key can restore your account on another compatible OpenDating client or
device. Adults 18 and over only.

## Keywords

`privacy,introductions,encrypted,dating,identity,nearby,relationships,chat,recovery`

## Release Notes

Replaces swipe-first browsing with deliberate private introductions, adds an
explanation and privacy receipt to every introduction, and introduces a live
Privacy Passport for account, visibility, location, and conversation controls.

## Reviewer Notes

No demo account is required. Reviewers can create a local account directly in
the app, complete onboarding, and allow location/photo permissions when prompted.

Use these notes in App Store Connect and Play Console:

```text
OpenDating creates a self-owned account on-device; there is no email/password
login or external account required for review. After onboarding, the Privacy
Passport shows the account and data boundaries as live controls. The
Introductions tab presents one person at a time, explains only visible shared
profile signals, and shows a privacy receipt. Exact location is reduced to a
coarse area on-device. Interest stays private until mutual; only then does an
end-to-end encrypted chat open. Blocks and private reports are available from
the full introduction profile.
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

The replacement flow must be welcome, Privacy Passport, private introduction,
matches, and profile. Do not reuse the rejected swipe-deck screenshots.
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
