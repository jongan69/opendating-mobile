# OpenDating Mobile — Deployment Guide

**Last updated:** 2026-08-08
**App:** OpenDating v0.1.0
**Bundle IDs:** `com.jongan69.opendating` (iOS + Android)

---

## Quick Deploy (EAS Cloud Build)

EAS is the primary deployment path. It builds in the cloud — no local Xcode or Android SDK needed.

### Prerequisites

- [x] EAS CLI logged in (`jongan69` / `jonny2298@live.com`)
- [x] `eas.json` configured with `production` profile
- [x] TypeScript passes (0 errors)
- [x] ESLint passes (0 errors, 9 warnings)
- [x] 81 tests pass across 6 suites

### iOS — Build + Submit to TestFlight

```bash
# Build in the cloud (15-30 min)
eas build --platform ios --profile production --auto-submit

# Or build then submit separately:
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

The `submit.production.ios` config in `eas.json` already has `appleId: "jonny2298@live.com"`. After upload, go to [App Store Connect](https://appstoreconnect.apple.com) → TestFlight, select the build, and submit for review.

### Android — Build + Submit to Play Store

```bash
# Build AAB in the cloud (10-20 min)
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android --profile production
```

After upload, go to [Google Play Console](https://play.google.com/console) → OpenDating → Release, start rollout.

---

## Alternative: Local Build Scripts

The `scripts/` directory has repo-agnostic shell scripts for local builds. Zero dependencies beyond the platform SDKs.

### What You Need (Not Yet Configured)

These scripts need a `build.config.env` file at the repo root. **This file does not exist yet.**

Create `build.config.env`:

```bash
# ── App identity ──────────────────────────────────────────────────────
APP_NAME="OpenDating"
APP_BUNDLE_ID="com.jongan69.opendating"

# ── iOS ───────────────────────────────────────────────────────────────
IOS_DEVELOPMENT_TEAM="<your Apple Team ID from developer.apple.com/account>"
IOS_EXPORT_OPTIONS="ios/exportOptions.plist"

# App Store Connect API key (get from App Store Connect → Integrations → App Store Connect API)
ASC_API_KEY_ID="<key ID, e.g. AB12CD34EF>"
ASC_API_KEY_ISSUER_ID="<issuer ID from App Store Connect → Users and Access → Keys>"
# Default key path: ~/.appstoreconnect/AuthKey_<KEY_ID>.p8
ASC_API_KEY_PATH="$HOME/.appstoreconnect/AuthKey_<KEY_ID>.p8"

# ── Android ───────────────────────────────────────────────────────────
ANDROID_PROJECT_DIR="android"
ANDROID_KEYSTORE_PATH="<path to .keystore or .jks>"
ANDROID_KEYSTORE_PASSWORD="<keystore password>"
ANDROID_KEY_ALIAS="<key alias>"
ANDROID_KEY_PASSWORD="<key password>"

# Google Play service account JSON (get from play.google.com/console → API access)
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="$HOME/.google-play/service-account.json"
```

### iOS Local Build

```bash
./scripts/build-ios.sh              # Build + upload to TestFlight
./scripts/build-ios.sh --no-submit  # Build IPA only, skip upload
```

**Additional requirements:**
- macOS with Xcode 16+
- `ios/exportOptions.plist` (not yet created — use `xcodebuild -exportOptionsPlist` or generate from Xcode)
- App Store Connect API key (`.p8` file)

### Android Local Build

```bash
./scripts/build-android.sh              # Build AAB + upload to Play Store
./scripts/build-android.sh --no-submit  # Build only
./scripts/build-android.sh --apk        # Build APK instead of AAB
```

**Additional requirements:**
- Android SDK (`ANDROID_HOME` set)
- JDK 17+
- **⚠️ Known issue on this machine:** `~/Library/Android/sdk` is a symlink to an exFAT volume. macOS AppleDouble `._*` sidecars break CMake globs in `react-native-worklets` and `react-native-screens`. Fix:
  ```bash
  dot_clean -m /Volumes/T9/DevTools/AndroidSDK
  ```
  Durable fix: move the SDK to the internal APFS disk.

---

## Release Pipeline (`scripts/release/ship.sh`)

A full-featured orchestration script that chains: cleanup → commit → verify → push → domain → SEO → blog → web → iOS build → iOS verify → iOS submit.

```bash
./scripts/release/ship.sh --dry-run          # Print the plan, touch nothing
./scripts/release/ship.sh --only ios-build   # Single stage
./scripts/release/ship.sh --only ios-submit  # Upload to App Store Connect
./scripts/release/ship.sh --skip seo,domain  # All but these
```

### Stages enabled for OpenDating

| Stage | Enabled | Status |
|-------|---------|--------|
| `cleanup` | always | ✅ |
| `commit` | always | ✅ |
| `verify` | always | ✅ (typecheck) |
| `push` | always | ✅ |
| `domain` | `false` | ⏳ Pending domain registration |
| `seo` | `true` | ⚠️ Needs `AI_API_KEY` set (already in `.env`) |
| `blog` | `true` | ⚠️ Renders to `public/blog/` for web deploy |
| `web` | `true` | ⚠️ Needs `npm run deploy:web:prod` configured |
| `ios-build` | `true` | ✅ Uses EAS cloud build |
| `ios-verify` | `true` | ✅ Checks IPA is App Store signed |
| `ios-submit` | `true` | ✅ Uploads to App Store Connect |

| `android-build` | `true` | ✅ EAS cloud build (AAB) |
| `android-submit` | `true` | ⛔ Blocked — see "Two hard blockers" below |

Both stores are reachable from the pipeline:

```bash
./scripts/release/ship.sh --only android-build,android-submit
./scripts/release/ship.sh --only ios-build,ios-verify,ios-submit
```

`android.local` defaults to `false`, so the build runs in the cloud and
`android-submit` resolves the artifact with `--latest` rather than a local path.
Set it to `true` only if the local Android SDK problem below is fixed.

---

## Screenshot Capture

Scripts for generating App Store screenshots:

```bash
./scripts/capture-screenshots.sh         # Capture all device sizes
./scripts/capture-screenshots-ios.sh     # iOS-specific captures
./scripts/resize-screenshots.sh          # Resize to required dimensions
```

Uses the `screenshot` EAS profile which sets `EXPO_PUBLIC_SCREENSHOT_MODE=true`.

---

## Current State (2026-08-08)

| Item | Status |
|------|--------|
| EAS login | ✅ `jongan69` |
| `eas.json` production profile | ✅ Configured |
| TypeScript | ✅ 0 errors |
| ESLint | ✅ 0 errors, 9 warnings |
| Tests | ✅ 81 tests, 6 suites |
| Android builds (EAS) | ✅ v0.1.0 build 3 **finished**, store AAB, commit `2c9a9e4` |
| Android submissions | ❌ Blocked — `serviceAccountKeyPath` is empty; no Play service account/app record available locally |
| Android keystore | ✅ Managed by Expo (Build Credentials 7eb19zjEJ1) |
| iOS builds (EAS) | ✅ v0.1.0 build 2 **finished**, App Store IPA, commit `2c9a9e4` |
| iOS IPA verification | ✅ App Store signed locally (`builds/opendating-ios-0.1.0-2.ipa`) |
| iOS submissions | ❌ Blocked — no App Store Connect app record/`ascAppId` for `com.jongan69.opendating` |
| iOS App Store listing | ✅ Copy and metadata prepared in `docs/STORE_LISTING.md` and `store.config.json`; not pushed because the app record does not exist yet |
| `ship.sh` Android stages | ✅ `android-build`, `android-submit` |
| `eas.json` submit config | ✅ Both platforms, env-var driven |
| App Store Connect API key | ✅ `AuthKey_563GUURUSD.p8` present; matching issuer ID verified locally; app record ID still needed |
| Google Play service account | ❌ `~/.google-play/` does not exist |
| `build.config.env` | ❌ Missing — only needed for the local-build path |
| `ios/exportOptions.plist` | ❌ Missing — only needed for the local-build path |
| `ios/` directory | ❌ Doesn't exist locally (EAS generates in cloud) |

Current finished binaries:

- iOS: build `c51e102b-4592-448e-8f42-3127ceead80f`, IPA
  `https://expo.dev/accounts/jongan69/projects/opendating-mobile/builds/c51e102b-4592-448e-8f42-3127ceead80f`
- Android: build `f5b79c72-91ee-4dd3-96e7-0343911e2ca2`, AAB
  `https://expo.dev/accounts/jongan69/projects/opendating-mobile/builds/f5b79c72-91ee-4dd3-96e7-0343911e2ca2`

Both are built from commit `2c9a9e4`. Commit `3f506ce` only adds `builds/` to
`.gitignore`, so the binaries still match the release code.

---

## Two hard blockers, both requiring store-console access

Neither can be automated, and neither is a code problem. Everything else in
this repo is ready; these two gates are what stand between the current state
and a build sitting in each store's console.

### 1. iOS — App Store Connect app record and `ascAppId`

The App Store signed IPA is built and locally verified. A retry with the local
App Store Connect issuer ID got past credential validation, then stopped because
there is no App Store Connect app record for `com.jongan69.opendating`.

This was verified through the App Store Connect API on 2026-08-08:

- Bundle ID exists: `com.jongan69.opendating`
- Matching App Store Connect app records: `0`
- Apple's current OpenAPI spec exposes `GET /v1/apps`, but no `POST /v1/apps`,
  so the app record still needs to be created in App Store Connect or through an
  interactive Apple Developer flow.

Create the app record in App Store Connect with:

- Name: `OpenDating`
- Bundle ID: `com.jongan69.opendating`
- SKU: `com.jongan69.opendating`
- Primary locale: `en-US`

```bash
export ASC_API_KEY_PATH="$HOME/.appstoreconnect/private_keys/AuthKey_563GUURUSD.p8"
export ASC_API_KEY_ISSUER_ID="<the UUID>"

npm run store:ios:lookup-asc-app-id
npm run store:ios:lookup-asc-app-id -- --write-eas-json

eas submit --platform ios --id c51e102b-4592-448e-8f42-3127ceead80f \
  --profile production --non-interactive --wait
```

After the binary upload succeeds, push the prepared App Store metadata:

```bash
npm run store:metadata:push -- --non-interactive
```

### 2. Android — no Google Play service account, and no app in the console

The AAB is built and waiting (v0.1.0 build 3, commit `2c9a9e4`, store
distribution). Two things block the upload:

**Google Play refuses an API upload until the package already exists in the
console with one release uploaded by hand.** This is a one-time gate per app
and it is the single most common surprise in an otherwise automated pipeline.
Upload the AAB through the Play Console UI once — download it from
[the build page](https://expo.dev/accounts/jongan69/projects/opendating-mobile/builds/f5b79c72-91ee-4dd3-96e7-0343911e2ca2)
— and every subsequent release can go through `android-submit`.

**A service account key is needed for automated uploads.** Play Console → Setup
→ API access → create a service account in Google Cloud, grant it "Release
manager", download the JSON:

```bash
export GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="$HOME/.google-play/service-account.json"

eas submit --platform android --id f5b79c72-91ee-4dd3-96e7-0343911e2ca2 \
  --profile production --non-interactive --wait
```

`eas.json` submits to the **internal** track with `releaseStatus: draft`, so
nothing reaches the public until it is promoted in the console.

---

## What To Do Next

### Blocked on your login (cannot be scripted)

1. Create the App Store Connect app record for `com.jongan69.opendating`
2. Export `ASC_API_KEY_ISSUER_ID` and write the numeric `ascAppId` to `eas.json`
3. Upload the Android AAB to Play Console once, by hand
4. Create the Play service account JSON and export `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

### Then, fully automated

```bash
./scripts/release/ship.sh --only android-build,android-submit
./scripts/release/ship.sh --only ios-build,ios-verify,ios-submit
```

### Before First App Store Review

- [ ] Create `build.config.env` using the template above
- [ ] Create App Store Connect app record and write `ascAppId` to `eas.json`
- [x] Prepare iOS App Store listing copy and metadata (`docs/STORE_LISTING.md`, `store.config.json`)
- [ ] Push iOS metadata after the app record/binary exists
- [ ] Generate Google Play service account JSON for automated uploads
- [ ] Set up Google Play listing (screenshots, description, content rating)
- [ ] Create `ios/exportOptions.plist` for local builds
- [ ] Fix Android SDK location (move from exFAT to APFS) for local Android builds
- [ ] Capture App Store screenshots using `scripts/capture-screenshots.sh`
- [x] Set up privacy/support URL:
      `https://jongan69.github.io/opendating-mobile/privacy/`
- [x] Add Android stages to `ship.sh`

### App Store Assets Checklist

Both stores require:

- **App icon** (1024×1024 PNG, no alpha for iOS) — `scripts/generate-brand-assets.py` can generate
- **Screenshots** — 6.7" iPhone (1290×2796) and 6.9" iPhone (1320×2868) required for iOS; various phone + tablet sizes for Android
- **App description** — See `scripts/release/release.config.json` for tagline and differentiators
- **Privacy Policy URL** — Must be publicly accessible
- **Support URL** — Must be publicly accessible
- **Age rating** — Dating app = 17+
- **Content declarations** — User-generated content, chat/messaging

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:
- TypeScript typecheck
- ESLint
- Jest tests

All three must pass. The workflow does **not** deploy — deployment is manual via EAS CLI or the local build scripts.

---

## Verification Checklist (Pre-Submit)

Run before every App Store submission:

- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run lint` — 0 errors (warnings OK)
- [ ] `npm test` — all 81 tests pass
- [ ] Relay is live: `curl -H "Accept: application/nostr+json" https://opendating-relay.jonathang132298.workers.dev`
- [ ] No hardcoded service pubkeys (all from NIP-11)
- [ ] No "npub", "nsec", "relay", "NIP-42" in user-facing strings
- [ ] `.env` values are correct (relay URL, protocol version)
- [ ] Version in `app.json` matches the release version
- [ ] No permission is declared that no code path exercises — check the merged
      manifest, not `app.json`, because plugins inject permissions the static
      config never mentions:
      ```bash
      npx expo prebuild --platform android --no-install \
        && grep uses-permission android/app/src/main/AndroidManifest.xml
      ```

## Android permissions, and why `blockedPermissions` is the mechanism

`android.permissions` in `app.json` is **additive** — config plugins append to
it. Removing an entry there does not remove it from the built app.
`expo-location` contributes `ACCESS_FINE_LOCATION` and `expo-image-picker`
contributes `RECORD_AUDIO` whatever the static config says.

`android.blockedPermissions` is the only thing that strips them: it emits
`tools:node="remove"` so no installed library or plugin can reintroduce the
permission at manifest merge.

Currently blocked, both verified absent from the merged manifest:

| Permission | Why |
|---|---|
| `ACCESS_FINE_LOCATION` | The app only ever derives a 5-character geohash (~±2.4 km) at `Accuracy.Balanced`. Coarse alone matches the behaviour and the privacy positioning, and drops "Precise" from the OS prompt. |
| `RECORD_AUDIO` | There is no audio code anywhere in the app. A dating app asking to record audio is both a Play policy problem and an obvious trust problem. |

Two remain declared and are worth a decision before submission:

- `SYSTEM_ALERT_WINDOW` ("draw over other apps") comes from React Native's own
  manifest for the dev overlay. Blocking it is the right call for a store
  build, but it may affect the dev-client overlay, so it is left alone rather
  than traded for a broken development loop.
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` are scoped to
  `maxSdkVersion="32"`. Modern Android uses the system photo picker and needs
  neither, but blocking them risks photo selection on Android 12 and below,
  which is untested here — the verification device runs Android 16.
