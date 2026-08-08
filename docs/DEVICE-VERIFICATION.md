# Device Verification — 2026-08-08

Walked on a Samsung SM-A166U1 (Android 16) against the production relay,
`opendating-relay.jonathang132298.workers.dev`.

## Result

All eleven onboarding steps complete, and the profile goes live.

| Step | Screen | Result |
|---|---|---|
| 1 | Welcome | ✅ |
| 2 | Create account | ✅ real keypair, SecureStore |
| 2b | Import account | ✅ renders |
| 3 | Privacy | ✅ |
| 4 | About you | ✅ name, age, gender chips |
| 5 | Preferences | ✅ sliders render and are brand-themed |
| 6 | Intent | ✅ incl. validation banner |
| 7 | About | ✅ prompt selector |
| 8 | Photos | ✅ incl. "Add photos later" |
| 9 | Location | ✅ incl. skip |
| 10 | Review | ✅ all values correct |
| 11 | **Profile created** | ✅ **"You're ready! Your profile is live."** |
| — | Discover / tabs | ✅ deck, PASS/LIKE, tab bar |

Zero Compose `MissingHostException`. Zero JS errors in logcat.

## What was broken and why

**Profile creation failed** with `Not enough relays received the event
(0 publish, 1 required)`. The relay sets `limitation.auth_required`, but NDK
was constructed with no signer, so it could never answer the NIP-42 challenge
and every event was rejected. Confirmed against production by disabling auth
in the CLI harness and reproducing the rejection.

Fixed by giving NDK an `NDKPrivateKeySigner` and a `signIn` auth policy, and
by replacing a one-second sleep with a poll on
`NDKRelayStatus.AUTHENTICATED`. That sleep was wrong twice over: a slow
handshake meant the first publish was rejected, and **a REQ sent before auth
completes is dropped silently** — the subscription looks established, no error
is raised, and every later response arrives with nobody listening.

**Seven screens carried a latent Compose crash.** `@expo/ui` views must be a
*direct* child of `<Host>`; each screen wrapped its whole body in Host and
then nested a `BackHeader`/`ScrollView`/`View`. The onboarding shell stated
the wrong assumption outright — *"Every onboarding screen gets a Host so no
individual screen has to remember"* — and covered none of them. Replaced with
plain React Native primitives. `Slider` is the only `@expo/ui` component left,
in its own tight Host with `seedColor` so it matches the brand.

**Two dead ends.** The onboarding draft lived only in React context, so a
reload stranded the member on review with a disabled button; it is now
persisted. The photos step required two photos with no escape, which is a
dead end whenever the OS photo permission is denied — and reviewers deny
permissions routinely.

## Known good, but unverified by eye

Discovery returned "Unable to determine your area" — correct, because the
location step was skipped during this walk, so no geohash was ever sent. The
backend's `invalid_location` surfaced in plain language with a retry.

Not yet walked on device: discovery with a real location, likes, matches,
chat, edit-profile, settings, filters, report, verification. All are free of
`@expo/ui` (23 of 26 screens are), so the Compose class of failure cannot
affect them, and every backend path behind them is verified by
`scripts/od-client.ts` against production.

## Before submission

- `app.json` carries `privacyPolicyUrl`, `supportUrl`, `marketingUrl` — not
  Expo config keys. They are silently ignored; they belong in App Store
  Connect.
- Onboarding step 3 says "not us, not the relay". CLAUDE.md forbids protocol
  jargon in user-facing copy.
- The import-account screen shows "nsec" prominently. Defensible on an
  advanced screen, but it is the one term CLAUDE.md calls out by name.
- `app.json` requests `ACCESS_FINE_LOCATION`. The app only ever uses a ~5 km
  geohash, so the coarse permission alone would match both the behaviour and
  the privacy positioning, and would drop the "Precise" option from the OS
  prompt.
