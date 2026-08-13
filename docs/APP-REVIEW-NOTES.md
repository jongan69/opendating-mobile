# App Review Information

Copy the **Reviewer Notes** block at the bottom into the Notes field of the App
Review Information section in App Store Connect. The rest of this document is
the working source for that block.

**Last updated:** 2026-08-09 · **App version:** 0.1.1

---

## 1. Screen recording

See [Demo Recording Script](DEMO-RECORDING-SCRIPT.md) for the shot list.

Requirements Apple stated: captured on a physical device, on the latest OS,
beginning with app launch, showing the typical user flow. Must include account
registration, login, and deletion; user-generated content with reporting and
blocking; and every permission prompt.

There is no paid content, purchase, or subscription flow in this app, so that
section does not apply. Say so explicitly in the reply rather than omitting it.

## 2. Devices and operating systems tested

Only devices with a completed physical-device walkthrough belong in this
table. Add the connected 11-inch iPad Pro after its 0.1.1 walkthrough passes.

| Device | OS | Notes |
|---|---|---|
| Samsung SM-A166U1 | Android 16 | Physical device — onboarding and discovery verified |

## 3. Purpose and target audience

**Purpose.** OpenDating gives adults deliberate private introductions while the
service itself learns as little as possible about them. It does not present an
endless swipe feed: one person is introduced at a time with an explanation and
a privacy receipt.

**Problem it solves.** Mainstream dating apps require handing over a precise
location, a phone number or social login, and a message history the operator can
read. That data is retained, profiled, and monetized. People who want to date
without accepting that trade have had no mainstream option.

**How it is materially different.**
- Every introduction identifies the visible compatibility facts behind it,
  such as shared interests, matching intent, or a coarse distance bucket.
- A privacy receipt states what is shared now, what remains withheld, and what
  becomes available only after mutual interest.
- The Privacy Passport is a primary tab with the member-owned account ID,
  visibility control, backup path, and location/decision/conversation boundaries.
- Exact GPS never leaves the device. Discovery transmits only a coarse area of
  roughly 5 km.
- Direct messages between matches are end-to-end encrypted.
- Accounts are created on-device. No email address, phone number, password, or
  third-party social login is collected.
- No advertising SDKs, no third-party analytics, no data sales.

**Target audience.** Adults 18 and over seeking dating and relationships, with
particular appeal to privacy-conscious users. The app is rated 17+.

**Value.** Members make a small number of understandable, private choices and
retain a portable recovery path, instead of surrendering identity, exact
location, or readable conversations to a conventional dating account.

## 4. Setup and access instructions

**No demo account is required, and no credentials exist to provide.** There is
no email/password login and no external account system. The reviewer creates a
working account inside the app in about a minute.

1. Launch the app. Tap **Create Account** on the welcome screen.
2. The app generates an account and stores its recovery key securely on the
   device. The recovery key is not displayed during account creation.
3. Read and accept the Terms of Service and Community Standards.
4. Enter a display name, an age of 18 or over, and a gender.
5. Choose what you are looking for, and set match preferences.
6. **Allow location when prompted.** This is required for introductions to return
   results. Choosing "Don't Allow" leaves introductions empty — that is
   expected behavior, not a bug.
7. Add at least two photos, or choose **Add photos later**. For the fullest
   review flow, add two photos and allow photo-library access when prompted.
8. Review the profile and tap to finish. The app opens **Privacy Passport** so
   the account, visibility, location, decision, and conversation boundaries are
   visible before any profile is evaluated.
9. **Introductions** shows one nearby person with compatibility reasons and a
   privacy receipt. Choose **Skip privately** or **Express private interest**.
   **Matches** lists mutual choices. Tap a match to open an encrypted chat.
10. Report and block are available from any profile and from the chat screen.
11. Delete the account at **Profile → Settings → Account → Delete Account**.

**Important for discovery results.** The app shows real people in the reviewer's
coarse area on a live network. If the review location has no other users, the
introductions screen will legitimately be empty. If the reviewer needs to see a
populated introduction, contact us and we will coordinate test accounts in the
review region.

## 5. External services and tools

| Service | Role | Notes |
|---|---|---|
| OpenDating relay (Cloudflare Workers) | Sole backend. Profile storage, discovery matching, match/like routing, encrypted message transport, reports, blocks, account deletion. | Operated by the developer at `wss://opendating-relay.jonathang132298.workers.dev`. Service endpoints are discovered at runtime from the relay's public service document. |
| Cloudflare Workers AI | Automated safety screening for profile display names and bios before publication. | The developer-operated relay sends this profile text to Cloudflare's `@cf/meta/llama-3.2-3b-instruct` model. Photos are not sent, and it does not process encrypted messages. Disclosed in-app on the onboarding privacy screen and at Settings → Privacy. |
| Expo Application Services (EAS) | Build and submission tooling only. | Build-time only. Not contacted by the shipped app at runtime. |

**Not used:** no payment processor, no in-app purchases or subscriptions, no
advertising SDK, no third-party analytics or crash reporting, no third-party
authentication provider, no data broker, and no App Tracking Transparency
prompt (the app does not track).

The app's privacy manifest declares `NSPrivacyTracking: false` with no tracking
domains.

## 6. Regional differences

**The app functions identically in all regions.** There is no region-locked
content, no country-specific feature gating, no regional pricing (the app is
free everywhere), and no geographic availability restriction in the app itself.

A country code derived from the user's coarse location is used only to scope
discovery to a sensible area. It does not enable or disable features.

## 7. Regulated industry and third-party material

OpenDating does not operate in a regulated industry. It is a dating and social
networking app. It does not provide financial, medical, legal, gambling, or
other regulated services.

**Third-party material.** All app content — brand assets, icons, and copy — is
original work owned by the developer. The app ships no licensed third-party
media. Profile photos and message content are created and uploaded by users.

**Age assurance.** The app is 18+. Age is collected during onboarding and
enforced at a minimum of 18, and the App Store age rating is set to 17+.

**User-generated content controls,** as required by Guideline 1.2:
- Terms of Service and Community Standards are shown during onboarding and at
  Settings → Terms. Profile creation is disabled until the member explicitly
  accepts the August 9, 2026 policy version; version and acceptance time are
  recorded locally for the account.
- Any profile can be reported from the profile screen or from a chat.
- Any user can be blocked; blocks take effect immediately on-device and are
  enforced server-side.
- Reported content and abuse reports go to `jonny2298@live.com`, which is
  published in-app.
- Users can delete their own account and profile content at any time from
  Settings.

---

## Reviewer Notes — paste this into App Store Connect

```text
SCREEN RECORDING
A physical-device recording on the latest iPadOS is attached to the App Review
reply. It begins with app launch and shows account access and registration,
policy consent, permission prompts, discovery, reporting, blocking, matching,
encrypted messaging, and account deletion. There are no purchases or
subscriptions to demonstrate.

DEVICES TESTED
- Samsung SM-A166U1, Android 16: physical-device onboarding and discovery.
The physical iPad model and iPadOS result shown in the recording will be added
here after the final 0.1.1 walkthrough passes.

PURPOSE AND AUDIENCE
OpenDating provides deliberate private introductions for adults 18+ seeking
dating and relationships. It does not use an endless swipe feed. The app shows
one person at a time, explains the visible compatibility facts behind the
introduction, and displays a privacy receipt for what is shared, withheld, and
unlocked after mutual interest. Its primary Privacy Passport tab gives the
member a live account identifier, visibility control, backup path, and clear
location, decision, and conversation boundaries. Exact GPS never leaves the
device, introductions use only a coarse area of about 5 km, and messages
between matches are end-to-end encrypted. There is no advertising SDK,
third-party analytics, or data sale.

ACCOUNT ACCESS AND SETUP
No demo credentials exist because OpenDating has no email/password login or
third-party sign-in. Existing members tap "I already have an account" and enter
their recovery key in a masked field. A reviewer can create a new account:
1. Tap "Create Account." A recovery key is generated and stored securely on
   the device; it is not displayed.
2. Read and accept the Terms of Service and Community Standards.
3. Enter name, age 18+, gender, preferences, intent, and bio.
4. Add at least two photos and allow photo-library access, or choose "Add
   photos later."
5. Allow location while using the app. Denying it leaves introductions empty.
6. Review the profile and tap "Create Profile."
7. The app opens Privacy Passport. Review the live account and visibility
   controls, then open Introductions to see one explained introduction and its
   privacy receipt.
Report and Block are available from profiles and chats. Delete Account is at
Profile -> Settings -> Account -> Delete Account.

DISCOVERY RESULTS
The app uses a live network and shows real people in the reviewer's coarse
area. If no other users are nearby, introductions can legitimately be empty.
Contact us and we will coordinate test accounts in the review region.

PERMISSIONS AND PURCHASES
- Location while using the app: converts the device location to a coarse area
  for nearby discovery; exact GPS is not transmitted.
- Photo library: adds profile photos.
- No App Tracking Transparency prompt; the app does not track.
The app is free with no paid content, purchase, or subscription.

EXTERNAL SERVICES
- Developer-operated OpenDating relay on Cloudflare Workers: profile storage,
  discovery, likes, matching, encrypted-message transport, reports, blocks,
  and deletion.
- Cloudflare Workers AI (`@cf/meta/llama-3.2-3b-instruct`): safety screening
  of profile display names and bios before publication. Photos are not sent to
  it and it does not process encrypted messages. This is disclosed to the user
  in-app on the onboarding privacy screen and at Settings -> Privacy.
- Expo Application Services: build and submission tooling only; not contacted
  by the shipped app at runtime.
No payment processor, advertising network, analytics provider, data broker, or
third-party authentication service is used.

REGIONS
The app behaves consistently across all regions. There is no region-locked
content, feature gating, regional pricing, or in-app availability restriction.

REGULATED SERVICES AND THIRD-PARTY MATERIAL
OpenDating is a dating/social-networking app, not a financial, medical, legal,
gambling, or other regulated service. Brand assets and shipped content are
original developer-owned work. Profile photos and text are user-generated.
The app is 18+, the App Store age rating is 17+, users must explicitly accept
the Terms and Community Standards, and profiles support reporting and blocking.

CONTACT
jonny2298@live.com
```
