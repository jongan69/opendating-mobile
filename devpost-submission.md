# OpenDating — RevenueCat Shipaton 2026

Status: draft only. Nothing in this file has been submitted to Devpost.

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

Complete the RevenueCat catalog, run the lifetime purchase and restore flow on
a physical iOS device, publish the revised App Store build, and validate the
live Store listing. Federation and independent service providers remain
post-hackathon work.

## Shipaton submission fields

- Includes App Icon (27378): pending upload of
  `BrandAssetPack/icons/ios-app-icon-1024.png`
- Includes screenshot (27379): pending fresh 1179 × 2556 physical-device capture
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
- [ ] Purchase, restore, and entitlement verified on a physical iOS device
- [ ] Fresh 1179 × 2556 screenshot uploaded without a device frame
- [ ] Public YouTube or Vimeo demo, two minutes or less
- [ ] Revised app fully published on the App Store
- [ ] App Store promo code created for judges
- [ ] Devpost project update confirmed by Jonathan
- [ ] Final Devpost submission explicitly confirmed by Jonathan
