#!/usr/bin/env bash
# build-android.sh — Repo-agnostic Android build + Play Store submission.
#
# Zero dependencies beyond Android SDK + JDK. No EAS, no Expo, no fastlane.
#
# Configuration: copy scripts/build.config.env.example to build.config.env
# and fill in your project's values.
#
# Usage:
#   ./scripts/build-android.sh              # Build AAB + upload to Play Store
#   ./scripts/build-android.sh --no-submit  # Build only
#   ./scripts/build-android.sh --apk        # Build APK instead of AAB
#
# Prerequisites:
#   - Android SDK installed (ANDROID_HOME set)
#   - JDK 17+
#   - For release builds: keystore configured
#   - For upload: Google Play service account JSON key
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT"

# ── Load config ─────────────────────────────────────────────────────────────
if [[ -f "$ROOT/build.config.env" ]]; then
  set -a; source "$ROOT/build.config.env"; set +a
elif [[ -f "$ROOT/.env" ]]; then
  set -a; source "$ROOT/.env"; set +a
fi

# ── Resolve project values ──────────────────────────────────────────────────
APP_NAME="${APP_NAME:-$(node -e "try{process.stdout.write(require('./app.json').expo?.name||'')}catch(e){}" 2>/dev/null || echo 'App')}"
BUNDLE_ID="${APP_BUNDLE_ID:-$(node -e "try{process.stdout.write(require('./app.json').expo?.android?.package||'')}catch(e){}" 2>/dev/null)}"
ANDROID_DIR="${ANDROID_PROJECT_DIR:-android}"
BUILD_APK=false
SUBMIT=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-submit) SUBMIT=false; shift ;;
    --submit) SUBMIT=true; shift ;;
    --apk) BUILD_APK=true; shift ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

RED='\033[1;31m'; GREEN='\033[1;32m'; CYAN='\033[1;36m'; NC='\033[0m'
step() { printf "\n${CYAN}==> %s${NC}\n" "$1"; }
ok()   { printf "${GREEN}  ✓ %s${NC}\n" "$1"; }
fail() { printf "${RED}  ✗ %s${NC}\n" "$1"; exit 1; }

# ── Preflight ───────────────────────────────────────────────────────────────

step "Preflight"

# Check Android SDK
if [[ -z "${ANDROID_HOME:-}" ]]; then
  # Common default locations
  if [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
  elif [[ -d "$HOME/Android/Sdk" ]]; then
    export ANDROID_HOME="$HOME/Android/Sdk"
  else
    fail "ANDROID_HOME not set. Install Android SDK or set ANDROID_HOME."
  fi
fi

if [[ ! -d "$ANDROID_DIR" ]]; then
  fail "Android project directory '$ANDROID_DIR' not found. Set ANDROID_PROJECT_DIR in build.config.env"
fi

# Check keystore config for release builds
KEYSTORE="${ANDROID_KEYSTORE_PATH:-}"
KEYSTORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-}"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-${ANDROID_KEYSTORE_PASSWORD:-}}"

if [[ -z "$KEYSTORE" ]]; then
  # Auto-detect from android/gradle.properties or android/app/build.gradle
  if [[ -f "$ANDROID_DIR/gradle.properties" ]]; then
    KEYSTORE=$(grep -oP 'MYAPP_RELEASE_STORE_FILE=\K.*' "$ANDROID_DIR/gradle.properties" 2>/dev/null || true)
    KEYSTORE_PASS=$(grep -oP 'MYAPP_RELEASE_STORE_PASSWORD=\K.*' "$ANDROID_DIR/gradle.properties" 2>/dev/null || true)
    KEY_ALIAS=$(grep -oP 'MYAPP_RELEASE_KEY_ALIAS=\K.*' "$ANDROID_DIR/gradle.properties" 2>/dev/null || true)
    KEY_PASS=$(grep -oP 'MYAPP_RELEASE_KEY_PASSWORD=\K.*' "$ANDROID_DIR/gradle.properties" 2>/dev/null || true)
  fi
fi

if [[ -z "$KEYSTORE" && "$SUBMIT" == "true" ]]; then
  echo "  ⚠ No keystore configured. Build will use debug signing (not suitable for Play Store)."
  echo "  Set ANDROID_KEYSTORE_PATH in build.config.env or configure gradle.properties."
fi

ok "Android SDK: $ANDROID_HOME | Project: $ANDROID_DIR"

# ── Typecheck (non-blocking for non-TS projects) ────────────────────────────
if [[ -f tsconfig.json ]] && command -v node &>/dev/null; then
  if npx tsc --noEmit --pretty false 2>/dev/null; then
    ok "TypeScript passes"
  fi
fi

# ── Build ───────────────────────────────────────────────────────────────────

if $BUILD_APK; then
  step "Building release APK (5-15 min)"
  (cd "$ANDROID_DIR" && ./gradlew assembleRelease 2>&1 | tail -20)
  ARTIFACT_PATH=$(find "$ANDROID_DIR/app/build/outputs/apk/release" -name "*.apk" -type f 2>/dev/null | head -1)
else
  step "Building release AAB (5-15 min)"
  (cd "$ANDROID_DIR" && ./gradlew bundleRelease 2>&1 | tail -20)
  ARTIFACT_PATH=$(find "$ANDROID_DIR/app/build/outputs/bundle/release" -name "*.aab" -type f 2>/dev/null | head -1)
fi

if [[ -z "$ARTIFACT_PATH" || ! -f "$ARTIFACT_PATH" ]]; then
  fail "Build failed — no output artifact found. Check Gradle output above."
fi

ARTIFACT_SIZE=$(du -h "$ARTIFACT_PATH" | cut -f1)
ok "Artifact: $ARTIFACT_PATH ($ARTIFACT_SIZE)"

# ── Copy to builds/ ─────────────────────────────────────────────────────────

mkdir -p builds
EXT="${ARTIFACT_PATH##*.}"
cp "$ARTIFACT_PATH" "builds/${APP_NAME}.${EXT}"
ok "Copied to builds/${APP_NAME}.${EXT}"

# ── Upload to Google Play ───────────────────────────────────────────────────

if $SUBMIT; then
  step "Uploading to Google Play Console"

  SERVICE_ACCOUNT_JSON="${GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:-}"

  if [[ -z "$SERVICE_ACCOUNT_JSON" ]]; then
    cat <<EOF
  ⚠ GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not set in build.config.env.

  Automatic upload requires a Google Play service account:
    1. Go to https://play.google.com/console/developers/api-access
    2. Create a service account + download JSON key
    3. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/path/to/key.json in build.config.env
    4. Grant the service account "Release manager" permission in Play Console

  Manual upload (no config needed):
    Open https://play.google.com/console → ${APP_NAME} → Release → Upload
    Drag and drop: builds/${APP_NAME}.aab

EOF
    exit 0
  fi

  if [[ ! -f "$SERVICE_ACCOUNT_JSON" ]]; then
    fail "Service account JSON not found at $SERVICE_ACCOUNT_JSON"
  fi

  # Use Google Play Developer API via curl (no gcloud, no fastlane)
  # Step 1: Get access token from service account
  ACCESS_TOKEN=$(node -e "
    const fs = require('fs');
    const jwt = require('jsonwebtoken');
    const key = JSON.parse(fs.readFileSync('$SERVICE_ACCOUNT_JSON'));
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      { iss: key.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: key.token_uri, iat: now, exp: now + 3600 },
      key.private_key,
      { algorithm: 'RS256' }
    );
    const https = require('https');
    const data = 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + encodeURIComponent(token);
    const req = https.request(key.token_uri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': data.length } }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => { try { process.stdout.write(JSON.parse(body).access_token); } catch(e) {} });
    });
    req.write(data);
    req.end();
  " 2>/dev/null)

  if [[ -z "$ACCESS_TOKEN" ]]; then
    echo "  ⚠ Could not get Google Play access token (node + jsonwebtoken required)."
    echo "  Install: npm install jsonwebtoken  (or bun add jsonwebtoken)"
    echo "  Then retry."
    exit 1
  fi

  # Step 2: Create an edit
  PACKAGE_NAME="${BUNDLE_ID:-$(node -e "try{process.stdout.write(require('./app.json').expo?.android?.package||'')}catch(e){}" 2>/dev/null)}"
  if [[ -z "$PACKAGE_NAME" ]]; then
    fail "APP_BUNDLE_ID not set and could not auto-detect. Set it in build.config.env"
  fi

  EDIT_ID=$(curl -s -X POST \
    "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/$PACKAGE_NAME/edits" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' | node -e "process.stdin.on('data',d=>{try{process.stdout.write(JSON.parse(d).id)}catch(e){}})" 2>/dev/null)

  if [[ -z "$EDIT_ID" ]]; then
    fail "Could not create Play Console edit. Check service account permissions."
  fi

  # Step 3: Upload AAB
  echo "  Uploading artifact..."
  curl -s -X POST \
    "https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/$PACKAGE_NAME/edits/$EDIT_ID/bundles?uploadType=media" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@$ARTIFACT_PATH" > /dev/null

  # Step 4: Commit the edit (sets it to "Ready to publish" — still requires manual "Start rollout" in console)
  curl -s -X POST \
    "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/$PACKAGE_NAME/edits/$EDIT_ID:commit" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' > /dev/null

  ok "Uploaded to Google Play Console (Internal track — requires manual rollout)"
else
  step "Skipping upload (--no-submit)"
fi

echo ""
echo "Done. To release: https://play.google.com/console → ${APP_NAME} → Release"
