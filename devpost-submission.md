# OpenDating — RevenueCat Shipaton 2026

Status: draft only. The public project page is published, but OpenDating has not
been entered into Shipaton judging.

The live web build is the same Expo application and is the public demo. It does
not replace the native Store URL for a standard Shipaton entry: Shipaton states
that web apps and TestFlight builds are not eligible. The only no-Store path is
the Next Gen Award for an eligible student using a verifiable academic email,
public repository, and demo video.

## Project details

- Project: OpenDating
- Tagline: Deliberate private introductions on an open protocol.
- Devpost draft: https://devpost.com/software/opendating
- Live web preview: https://opendating-mobile.expo.app
- Source: https://github.com/jongan69/opendating-mobile
- Platform: iOS (iPhone and iPad)
- Built with: Expo, React Native, TypeScript, RevenueCat, Nostr, Cloudflare Workers, Cloudflare Workers AI

## Description

### Inspiration

Dating apps often ask people to trade privacy for participation: a phone number,
precise location, readable conversations, and an engagement-optimized swipe
feed. OpenDating explores a smaller, calmer model where members own their
identity and understand each disclosure before making a choice.

### What it does

OpenDating presents one deliberate introduction at a time. Each introduction
explains the visible compatibility facts behind it and includes a privacy
receipt showing what is shared, withheld, and unlocked only after mutual
interest. Interest is private, and a conversation opens only after both people
choose each other.

Members create a self-owned account without email, phone number, or social
login. Exact GPS is reduced on-device to an approximate 5 km area before
discovery. Matched conversations use end-to-end encryption. The app also
includes blocking, private reporting, visibility controls, recovery-key backup,
and permanent account deletion.

OpenDating Plus is an optional $4.99 lifetime purchase powered by RevenueCat.
It unlocks Sage, Ocean, and Plum accent themes. It never changes discovery,
ranking, matching, messaging, recovery, deletion, or safety.

### How we built it

The client uses Expo Router, React Native, and strict TypeScript. Nostr provides
the identity and cryptographic building blocks, while the OpenDating protocol
defines profiles, discovery, private choices, matches, moderation, and encrypted
messages. A Cloudflare Worker operates the relay and media services. RevenueCat
validates the lifetime Plus entitlement using an opaque billing identifier;
profile, location, recovery-key, safety, and message content is not sent to
RevenueCat.

The browser build uses an encrypted local identity vault so the real app can be
tested without a native install. The private recovery key is encrypted with
AES-256-GCM using a PBKDF2-derived browser-lock key and is never persisted in
plaintext.

### Challenges

The hardest boundary was making a decentralized identity understandable and
recoverable without turning the recovery key into a normal password. We also
had to keep coarse location, encrypted messaging, moderation, browser storage,
and StoreKit entitlement state explicit across degraded-network and locked
states.

Apple declined the first iOS candidate under Guideline 4.3(b). We replaced the
swipe-first experience with deliberate private introductions, privacy receipts,
and a Privacy Passport before preparing a fresh release.

### Accomplishments

- One explained introduction instead of an endless swipe feed
- A live Privacy Passport for identity, visibility, and disclosure boundaries
- Coarse-location discovery without transmitting raw GPS
- Match-only end-to-end encrypted conversations
- Operational report, block, unmatch, feedback, and deletion paths
- A browser app with an encrypted recovery-key vault
- A non-consumable Plus product that sells customization, not dating outcomes

### What we learned

Privacy works better as an interaction than as a policy page. Showing a privacy
receipt at the moment of an introduction makes the boundary understandable.
Likewise, a portable identity needs visible backup, lock, and deletion controls
to feel trustworthy rather than merely decentralized.

### How we used AI

Cloudflare Workers AI screens only profile display names and bios for obvious
safety-policy violations before publication. It does not process photos,
location, recovery keys, likes, matches, reports, or encrypted messages. Codex
was used to inspect the repository, implement and review changes, run tests,
and verify deployment and release artifacts.

### What's next

Wait for App Review of iOS 0.1.1 (5), complete the App Store metadata for the
lifetime purchase, run purchase and restore on a physical iOS device, and add
the resulting Store URL, promo code, screenshot, and public demo video to the
Shipaton entry. Federation and independent service providers remain
post-hackathon work.

## Testing instructions

1. Open https://opendating-mobile.expo.app in a modern HTTPS browser.
2. Create a browser account with a 12-character-or-longer browser-lock
   passphrase, or import a disposable Nostr `nsec`/hex recovery key.
3. Complete onboarding, then verify Privacy Passport, introductions, profile,
   visibility, blocking/reporting, matches, browser lock, and recovery-key
   export/import.
4. Reload the page and verify the encrypted identity locks before reconnecting.
5. On iOS, use App Store build 0.1.1 (5) and verify the lifetime Plus purchase,
   restore, and entitlement removal with a disposable StoreKit account.

Do not use a personal recovery key or include private keys, exact location, or
message content in screenshots or bug reports.

## Public demo and repository

- Live app: https://opendating-mobile.expo.app
- Source: https://github.com/jongan69/opendating-mobile
- Demo video: pending a public YouTube or Vimeo upload, two minutes or less

## Demo video outline

- 0:00–0:15 — problem and OpenDating's private-introduction model
- 0:15–0:45 — create/import account and coarse-location boundary
- 0:45–1:15 — Privacy Passport, introduction reasons, and privacy receipt
- 1:15–1:35 — mutual match, encrypted messaging, report/block controls
- 1:35–1:50 — $4.99 lifetime Plus themes and RevenueCat restore
- 1:50–2:00 — live web app, open protocol, and closing result

## Screenshot shot list

- Prepared: `screenshots/devpost/opendating-welcome-1179x2556.png` — live app,
  exact required dimensions, no device frame, no user data
- Pending physical capture: Privacy Passport and introduction privacy receipt
- Pending IAP review capture: Plus lifetime-purchase screen

## Known limitations

- The public web app is a functional preview, but standard Shipaton eligibility
  requires the fully published native Store listing.
- OpenDating Plus remains unavailable until Apple accepts its missing review
  metadata and the purchase is proven on a physical device.
- The relay and protocol are an early public implementation without federation
  or a production availability SLA.

## Shipaton submission fields

- Includes App Icon (27378): `BrandAssetPack/icons/ios-app-icon-1024.png` is
  already the project thumbnail; confirm the checkbox during final review
- Includes screenshot (27379): prepared at
  `screenshots/devpost/opendating-welcome-1179x2556.png`; pending Devpost upload
- First Version Date Confirmation (27380): answer only after the revised build is published
- Is Staff or Sponsor (27381): false
- App type (27382): iOS (iPhone and/or iPad)
- Published App Store URL (27383): pending
- RevenueCat project ID (28118): `proj3363ecdc`
- Promo code (28135): pending App Store promo-code creation
- HAMM Award (27388): OpenDating uses one transparent lifetime purchase for
  cosmetic themes. A non-consumable purchase fits a privacy-first utility better
  than recurring access fees or advertising, and core dating and safety features
  remain free.
- Peace Prize (27389): OpenDating minimizes sensitive data collection, keeps
  choices private until mutual, encrypts matched conversations, and gives members
  direct visibility, recovery, reporting, blocking, and deletion controls.
- Design Award (27391): The app replaces swipe mechanics with one deliberate
  introduction, visible compatibility reasons, a privacy receipt, and a Privacy
  Passport. The interface uses calm platform-aware surfaces and accessible
  light, dark, and accent themes.
- Additional notes (27392): The public web preview demonstrates the application
  flow, but the standard Shipaton entry will use the published iOS Store URL and
  a physical-device demo video.

## Required completion evidence

- [x] Description drafted
- [x] 1024 × 1024 icon exists
- [x] Devpost project, write-up, links, and app icon published
- [x] Production web preview deployed
- [x] Cloudflare Worker responds in production
- [x] App Store non-consumable created
- [x] RevenueCat project, entitlement, offering, and product connected
- [x] Fresh iOS 0.1.1 build 5 uploaded and valid in App Store Connect
- [x] Build 5 attached to App Store version 0.1.1 and internal TestFlight QA
- [ ] Purchase, restore, and entitlement verified on a physical iOS device
- [x] Fresh 1179 × 2556 screenshot captured without a device frame or user data
- [ ] Fresh screenshot uploaded to Devpost
- [ ] Public YouTube or Vimeo demo, two minutes or less
- [x] Revised iOS 0.1.1 build 5 submitted and waiting for App Review
- [ ] Revised app fully published on the App Store
- [ ] App Store promo code created for judges
- [ ] Devpost project update confirmed by Jonathan
- [ ] Final Devpost submission explicitly confirmed by Jonathan
