# SEO blog research

**Checked:** 2026-08-29; product and publication state refreshed 2026-08-31

**Scope:** product truth, live site, and current primary sources for two
competitor-alternative articles and one narrow direct comparison.

Only the four articles explicitly marked `draft: false` were rechecked for the
August 31 web release. Every other article remains fail-closed until its claims
are checked again against then-current sources and product state.

## Product truth that article copy must preserve

- OpenDating is live as a browser app at `opendating-mobile.expo.app`. Native
  Mobile 0.1.1 remains a proposed launch candidate, and iOS/Android store
  availability must not be promised. Sources: the production URL,
  `docs/RELEASE-STATUS.md`, and `release/manifest.json`.
- Web is the currently available platform. Native iOS and Android remain
  pre-release. Source: `scripts/release/release.config.json` plus the release
  files above.
- The core app is free. The candidate also contains an optional **$4.99 US
  lifetime** purchase for three accent themes; purchase/restore is not yet
  proven on a physical iOS device. It does not buy discovery, ranking,
  matching, messaging, recovery, deletion, or safety. Source:
  `docs/MONETIZATION.md`.
- Account creation requires no phone number, email address, password, or social
  login. On the web, the recovery key is encrypted in local storage behind a
  browser-lock passphrase; plaintext exists temporarily in JavaScript memory
  while unlocked. There is no conventional password reset. Sources:
  `src/app/(onboarding)/welcome.tsx`, `src/app/(onboarding)/create-account.tsx`,
  `docs/SECURITY.md`, and `docs/RELEASE-STATUS.md`.
- Raw coordinates are converted on-device to a geohash of at most five
  characters; only that prefix crosses the location module boundary. Describe
  it as an **approximate area**, not an exact or invariant 5 km square. Sources:
  `src/lib/location/index.ts`, `src/lib/location/geohash.ts`, and
  `src/features/discovery/use-discovery.ts`.
- Direct-message content is end-to-end encrypted after mutual interest. The
  service can still observe timing and traffic volume, recipients can retain
  screenshots/copies, and message history already delivered to another device
  cannot be remotely erased. Sources: `docs/PRIVACY.md`,
  `src/lib/opendating/open-dating-client.ts`, and
  `src/app/(tabs)/passport.tsx`.
- The current deployment uses OpenDating-operated first-party services. The
  wire protocol is open, but independent providers, federation, full data
  portability, and provider migration are post-GA. Sources: `README.md`,
  `docs/ROADMAP-1.0.md`, and the public
  `blog/how-decentralized-dating-works` correction.
- One-at-a-time introductions, their explanation, and the privacy receipt exist
  in current source. Physical-device proof from the release candidate remains
  open. Sources: `src/app/(tabs)/discover.tsx`,
  `src/features/discovery/private-introduction.ts`,
  `docs/RELEASE-STATUS.md`, and `release/manifest.json`.

## Six-article starting set

| Category | Working title | Decision-useful angle | Review state |
|---|---|---|---|
| User-problem guide | How to use a dating app without sharing exact GPS | Permission choices, what coarse location does and does not protect, and why an approximate area is not anonymity | Safest first publication after release-state caveat and source review |
| User-problem guide | How to date without using a phone number or email login | Recovery-key trade-off, loss/recovery risk, and when a conventional account is the better choice | Keep draft until recovery language is security-reviewed |
| Alternative | A Tinder alternative for people who want less account and location data | Compare disclosed account/location inputs, message-policy boundary, platforms, availability, and paid model | Supportable from current primary sources below |
| Alternative | A Bumble alternative for people who want coarse location and encrypted chats | Compare phone verification, coordinates, message processing, platforms, availability, and paid model | Supportable from current primary sources below |
| Direct comparison | OpenDating vs Tinder: privacy model, availability, and pricing | A dated fact table only; no winner score, efficacy, audience-size, or safety-superiority claims | Supportable only within the bounded matrix below; keep draft for legal review |
| Evergreen advantage | What OpenDating's on-device coarse location and encrypted messages actually protect | Explain the genuine implementation and its metadata, recovery, operator, portability, and release limitations | Publishable after source audit; avoid calling today's service decentralized |

## Competitor facts from current primary sources

### Tinder

- **Availability:** free core matching/chat on iOS, Android, and web. Tinder's
  current help page states iOS 16+, Android 10+, and current major browsers.
  [Official overview](https://www.help.tinder.com/hc/en-us/articles/115004647686-Tinder-Overview)
- **Paid model:** Plus, Gold, and Platinum subscriptions add features such as
  unlimited Likes, Passport, Rewinds, Likes You, Incognito, and prioritized
  Likes. Benefits can vary under testing.
  [Official subscription matrix](https://www.help.tinder.com/hc/en-us/articles/115004487406-Tinder-subscriptions)
- **Price:** do not quote a universal monthly price. Tinder's terms permit price
  variation by region, duration, bundle, past purchases, account activity,
  promotions, and tests; the US App Store lists SKUs without enough plan and
  duration context for an honest monthly comparison.
  [Terms, section 8](https://policies.tinder.com/terms/intl/en/),
  [US App Store](https://apps.apple.com/us/app/tinder-dating-app-date-chat/id547702041)
- **Account data:** the current policy lists phone number, email address, and
  date of birth as examples of account data provided to create an account.
  [Privacy policy, section 3](https://policies.tinder.com/privacy/intl/en/)
- **Location:** official help says device/browser location access is required;
  the privacy policy says latitude and longitude may be collected with
  permission. Do not claim Tinder always collects background location.
  [Location help](https://www.help.tinder.com/hc/en-us/articles/115005668326-Grant-access-to-device-location),
  [privacy policy](https://policies.tinder.com/privacy/intl/en/)
- **Chats and data use:** the policy includes chats in collected `Content` and
  says content and activity can be processed for service operation, safety,
  research, improvement, machine learning, advertising, and other listed
  purposes. It also permits defined sharing with vendors, advertising partners,
  Match Group affiliates, authorities, and transaction successors. State what
  the policy says; do not write “employees read every message” or “Tinder sells
  chats.”
  [Privacy policy, sections 3-6](https://policies.tinder.com/privacy/intl/en/)
- **Encryption:** no current primary source found promises end-to-end encryption
  or user-held message keys. Google Play's developer declaration says data is
  encrypted **in transit**, which is not evidence of E2EE.
  [Google Play](https://play.google.com/store/apps/details?id=com.tinder)
- **Deletion:** do not promise immediate, total deletion. The policy describes a
  three-month safety window after closure plus longer retention for bans,
  transactions, logs, legal duties, and disputes.
  [Privacy policy, section 9](https://policies.tinder.com/privacy/intl/en/)

### Bumble

- **Availability:** free to download/use with in-app purchases on iOS and
  Android. Bumble Web was discontinued in March 2026.
  [US App Store](https://apps.apple.com/us/app/bumble-dating-app-meet-date/id930441707),
  [Google Play](https://play.google.com/store/apps/details?hl=en-US&id=com.bumble.app),
  [official web discontinuation notice](https://support.bumble.com/hc/en-us/articles/30996192802973-An-update-on-Bumble-web)
- **Paid model:** Boost, Premium, Premium+, Spotlight, SuperSwipe, and Notes are
  optional paid products. Paid benefits include features such as unlimited
  likes, match extension/rematch, advanced filters, Incognito, Travel Mode, and
  feed priority.
  [Official plan matrix](https://support.bumble.com/hc/en-us/articles/32668790872733-Understanding-Bumble-s-paid-features-and-subscription-plans)
- **Price:** do not quote a universal monthly price. Bumble says cost varies by
  tier, duration, and package size and directs members to the in-app Pay Plan
  page for current pricing.
  [Official pricing notice](https://support.bumble.com/hc/en-us/articles/30614091973149-Pricing-information-for-paid-features)
- **Account data:** Bumble's policy says a phone number is required for account
  verification/one-member-one-account; photo or ID verification can be required
  in some cases. Do not simplify this to “every user is ID verified.”
  [Privacy policy](https://bumble.com/privacy-policy)
- **Location:** with permission, Bumble says it can collect Wi-Fi access-point
  information and longitude/latitude and can save device coordinates for
  features. The policy says permission can be turned off. Do not call the
  location public: Bumble says other members see general location information.
  [Privacy policy, geolocation section](https://bumble.com/privacy-policy)
- **Messages:** Bumble says it reviews message content to identify topics,
  sentiments, and trends after taking steps to remove identifying information.
  Its policy also names moderation providers that may process reports, messages,
  and media. This is a policy claim, not evidence that a specific employee reads
  all messages.
  [Privacy policy, messages and service-provider sections](https://bumble.com/privacy-policy)
- **Encryption:** no current primary source found promises end-to-end encryption
  or user-held message keys. Do not infer “plaintext” merely from that absence.

## Narrow direct-comparison matrix that is supportable now

| Dimension | OpenDating current truth | Tinder current primary-source truth |
|---|---|---|
| Availability | Live free web app; native iOS/Android candidates remain pre-release | Available free on iOS, Android, and web |
| Account | No phone/email/password/social login; recovery key and no conventional password reset | Policy lists phone/email/DOB account data |
| Location | Raw GPS becomes a max-five-character geohash on-device; only the prefix leaves the module | Device/browser location access required; latitude/longitude may be collected with permission |
| Messages | E2EE content after mutual interest; service still sees network metadata | Policy treats chats as collected Content; no primary-source E2EE promise found |
| Discovery | One explained introduction at a time with a privacy receipt | Swipe Right/Like; mutual likes create a match |
| Price | Free on web; native billing remains candidate-only | Free core plus variable-price Plus/Gold/Platinum subscriptions |
| Who should choose it | Only testers who accept pre-release, small-network, recovery, and operator/portability limits | Someone needing a generally available product, web access, broad geographic support, or conventional account/support expectations |

The comparison must identify the date checked and link each Tinder row to the
official sources above. “More private,” “safer,” “better matches,” and fixed
monthly savings are conclusions, not verified facts, and should not appear.

## Unsupported or stale claims already present

- Resolved August 31: `scripts/release/release.config.json` now describes the
  live web app, first-party operation, four reviewed articles, and fail-closed
  generation without “decentralized dating” or “surveillance capitalism” copy.
- The live/indexed `how-decentralized-dating-works` page correctly discloses the
  first-party operator and post-GA federation goal, but its stronger statements
  that relay enforcement prevents every unmatched message and hides blockers
  from discovery exceed the current release evidence. Re-audit against the
  deployed relay before retaining them.
- `public/blog/location-privacy-dating-apps/index.html` is `noindex`, but its
  “most dating apps” data-use claims are unsourced and “eliminates these risks”
  is an absolute OpenDating cannot prove. Coarse location reduces precision; it
  does not eliminate inference, screenshots, compromised endpoints, or metadata.
- `public/blog/why-privacy-matters-in-dating/index.html` is `noindex`, but claims
  that major competitors store all messages in plaintext, sell data to brokers,
  retain photos permanently, and allow employee access are unsupported as
  written. Its OpenDating statement “delete your key, and your presence
  disappears” is false: deletion must route through the advertised deletion
  service, and another member can retain delivered content.
- The archived encryption article's general breach, subpoena, merger, and named
  competitor framing is unsourced. Keep it unpublished unless every example is
  replaced with a current primary source.
- Do not claim current federation, independent providers, full profile/match/
  message portability, zero central servers, anonymity, precise risk
  elimination, universal 5 km geometry, immediate complete deletion, or public
  App Store/Play availability.

## Live production evidence

Read-only HTTP checks on 2026-08-29:

| URL requested | Result | What it proves |
|---|---|---|
| `https://jongan69.github.io/opendating-mobile/` | 301 to `https://pages.jongan.com/opendating-mobile/`, then 200 | Public landing page responds; response `Last-Modified` was 2026-08-14, so it does not prove current source is deployed |
| `/blog/` | 200 | Public legacy blog index exists |
| `/blog/how-decentralized-dating-works/` | 200 | One legacy article is publicly reachable and listed in the live sitemap |
| `/blog/this-is-a-draft/` | 404 | That nonexistent/draft probe is not public; it does not prove the new generator's gating |
| `/sitemap.xml` | 200 XML | Lists `/blog` and only the legacy decentralized article under `/blog`; no new six-article set is live |

Resolved August 31: `https://opendating-mobile.expo.app` is the canonical origin
in the app shell, generated articles, sitemap, robots file, product facts, and
machine-readable product summary. The secondary Pages copy points back to EAS.

No deployment or external write was performed.
