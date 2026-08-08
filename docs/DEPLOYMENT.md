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

**Note:** The ship.sh pipeline currently only covers iOS (no Android stages defined). Android must be deployed separately via `eas build --platform android --profile production`.

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
| iOS builds (EAS) | ❌ Never built |
| Android builds (EAS) | ✅ 2 previous (v0.1.0 build 1) |
| iOS submissions | ❌ Never submitted |
| Android submissions | ❌ Never submitted |
| `build.config.env` | ❌ Missing — needs creation |
| `ios/exportOptions.plist` | ❌ Missing — needed by local build script |
| iOS App Store listing | ❌ Not set up |
| Google Play listing | ❌ Not set up |
| App Store Connect API key | ❓ Unknown — check `~/.appstoreconnect/` |
| Google Play service account | ❓ Unknown |
| Android keystore | ❓ Check `android/gradle.properties` |
| `ios/` directory | ❌ Doesn't exist locally (EAS generates in cloud) |

---

## What To Do Next

### Immediately (can be done now)

1. **Build and submit iOS via EAS:**
   ```bash
   eas build --platform ios --profile production --auto-submit
   ```

2. **Build and submit Android via EAS:**
   ```bash
   eas build --platform android --profile production
   eas submit --platform android --profile production
   ```

### Before First App Store Review

- [ ] Create `build.config.env` using the template above
- [ ] Generate App Store Connect API key and place at `~/.appstoreconnect/AuthKey_<ID>.p8`
- [ ] Set up iOS app listing in App Store Connect (screenshots, description, privacy policy URL, age rating)
- [ ] Generate Google Play service account JSON for automated uploads
- [ ] Set up Google Play listing (screenshots, description, content rating)
- [ ] Create `ios/exportOptions.plist` for local builds
- [ ] Fix Android SDK location (move from exFAT to APFS) for local Android builds
- [ ] Capture App Store screenshots using `scripts/capture-screenshots.sh`
- [ ] Set up privacy policy URL (currently needed for both stores)
- [ ] Add Android stages to `ship.sh` if full pipeline coverage is desired

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
