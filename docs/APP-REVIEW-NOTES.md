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

> **Confirm this list before sending.** Only fill in what was actually tested.

| Device | OS | Notes |
|---|---|---|
| iPhone Air (iPhone18,4) | iOS 26.6 | Physical device — primary test target |
| iPhone 17 | iOS 26.x Simulator | Development |

Add any additional physical devices used. Apple asks specifically for physical
devices; listing simulator-only coverage as if it were device testing is worse
than listing a shorter honest list.

## 3. Purpose and target audience

**Purpose.** OpenDating is a dating app for adults that is built so the service
itself learns as little as possible about its users.

**Problem it solves.** Mainstream dating apps require handing over a precise
location, a phone number or social login, and a message history the operator can
read. That data is retained, profiled, and monetized. People who want to date
without accepting that trade have had no mainstream option.

**How it solves it.**
- Exact GPS never leaves the device. Discovery transmits only a coarse area of
  roughly 5 km.
- Direct messages between matches are end-to-end encrypted.
- Accounts are created on-device. No email address, phone number, password, or
  third-party social login is collected.
- No advertising SDKs, no third-party analytics, no data sales.

**Target audience.** Adults 18 and over seeking dating and relationships, with
particular appeal to privacy-conscious users. The app is rated 17+.

**Value.** Users get the ordinary dating experience — browse, match, chat —
without the surveillance that normally accompanies it.

## 4. Setup and access instructions

**No demo account is required, and no credentials exist to provide.** There is
no email/password login and no external account system. The reviewer creates a
working account inside the app in about a minute.

1. Launch the app. Tap **Create Account** on the welcome screen.
2. The app generates an account on the device and shows a recovery key. Tap
   through to continue. (Reviewers do not need to save the key.)
3. Enter a display name, an age of 18 or over, and a gender.
4. Choose what you are looking for, and set match preferences.
5. **Allow location when prompted.** This is required for discovery to return
   results. Choosing "Don't Allow" leaves the discovery deck empty — that is
   expected behavior, not a bug.
6. Add at least one photo. Allow photo library or camera access when prompted.
7. Review the profile and tap to finish. The account is now live on the network.
8. **Discover** shows nearby people; swipe or use the buttons. **Matches** lists
   mutual likes. Tap a match to open an encrypted chat.
9. Report and block are available from any profile and from the chat screen.
10. Delete the account at **Profile → Settings → Account → Delete Account**.

**Important for discovery results.** The app shows real people in the reviewer's
coarse area on a live network. If the review location has no other users, the
discovery deck will legitimately be empty. If the reviewer needs to see a
populated deck, contact us and we will coordinate seeded test accounts in the
review region.

## 5. External services and tools

| Service | Role | Notes |
|---|---|---|
| OpenDating relay (Cloudflare Workers) | Sole backend. Profile storage, discovery matching, match/like routing, encrypted message transport, reports, blocks, account deletion. | Operated by the developer at `wss://opendating-relay.jonathang132298.workers.dev`. Service endpoints are discovered at runtime from the relay's public service document. |
| Expo Application Services (EAS) | Build and submission tooling only. | Build-time only. Not contacted by the shipped app at runtime. |

**Not used:** no payment processor, no in-app purchases or subscriptions, no
advertising SDK, no third-party analytics or crash reporting, no AI or machine
learning service, no third-party authentication provider, no data broker, and no
App Tracking Transparency prompt (the app does not track).

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
- Terms of use and community standards are shown in-app at Settings → Terms, and
  creating an account constitutes agreement to them.
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
ACCOUNT ACCESS
No demo account is needed and none exists. OpenDating has no email/password
login and no third-party sign-in. The reviewer creates an account on-device in
about one minute: tap "Create Account" on the welcome screen, then complete
onboarding (name, age 18+, gender, preferences, location permission, at least
one photo). The account is fully functional immediately.

WHAT THE APP DOES
OpenDating is a privacy-focused dating app for adults 18+. Exact GPS never
leaves the device; discovery sends only a coarse area of about 5 km. Direct
messages between matches are end-to-end encrypted. There is no advertising SDK,
no third-party analytics, and no data sale.

PERMISSIONS
- Location (when in use): required for discovery. Denying it leaves the
  discovery deck empty, which is expected behavior.
- Photo library / camera: required to add profile photos.
- No App Tracking Transparency prompt. The app does not track users.

CORE FLOWS TO REVIEW
- Account creation: welcome screen -> Create Account -> onboarding.
- Discovery: the Discover tab, swipe or use the like/pass buttons.
- Matching and messaging: the Matches tab, tap a match to open an encrypted chat.
- Reporting: available from any profile and from any chat.
- Blocking: available from any profile and from any chat; takes effect
  immediately.
- Account deletion: Profile -> Settings -> Account -> Delete Account.

NOTE ON DISCOVERY RESULTS
The app runs against a live network and shows real nearby users. If there are no
other users in the reviewer's coarse area, the discovery deck will be empty.
This is correct behavior rather than a defect. If a populated deck is needed for
review, please contact us and we will coordinate test accounts in the review
region.

PURCHASES
The app is free. There is no paid content, no in-app purchase, and no
subscription.

EXTERNAL SERVICES
The only backend is the OpenDating relay, operated by the developer on
Cloudflare Workers. No payment processor, advertising network, analytics
provider, AI service, or third-party authentication service is used.

REGIONS
The app behaves identically in all regions. There is no region-locked content,
feature gating, or regional pricing.

CONTACT
jonny2298@live.com
```
