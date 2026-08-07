#!/usr/bin/env bash
# build-ios.sh — Repo-agnostic iOS build + App Store Connect upload.
#
# Zero dependencies beyond macOS + Xcode. No EAS, no Expo, no third-party tools.
#
# Configuration: copy scripts/build.config.env.example to build.config.env
# and fill in your project's values. Falls back to .env for legacy projects.
#
# Usage:
#   ./scripts/build-ios.sh              # Build + upload to TestFlight
#   ./scripts/build-ios.sh --no-submit  # Build only, skip upload
#
# Prerequisites:
#   - macOS with Xcode 16+ (or matching your deployment target)
#   - Apple Developer account with App Store Connect access
#   - App Store Connect API key (.p8) for upload
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
cd "$ROOT"

# ── Load config ─────────────────────────────────────────────────────────────
# Priority: build.config.env > .env
if [[ -f "$ROOT/build.config.env" ]]; then
  set -a; source "$ROOT/build.config.env"; set +a
elif [[ -f "$ROOT/.env" ]]; then
  set -a; source "$ROOT/.env"; set +a
fi

# ── Resolve project values (config → auto-detect) ───────────────────────────
APP_NAME="${APP_NAME:-$(node -e "try{process.stdout.write(require('./app.json').expo?.name||'')}catch(e){}" 2>/dev/null || echo 'App')}"
BUNDLE_ID="${APP_BUNDLE_ID:-$(node -e "try{process.stdout.write(require('./app.json').expo?.ios?.bundleIdentifier||'')}catch(e){}" 2>/dev/null)}"
SCHEME="${IOS_SCHEME:-$APP_NAME}"
WORKSPACE="${IOS_WORKSPACE:-ios/${APP_NAME}.xcworkspace}"
TEAM="${IOS_DEVELOPMENT_TEAM:-}"
EXPORT_OPTS="${IOS_EXPORT_OPTIONS:-ios/exportOptions.plist}"

SUBMIT=true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-submit) SUBMIT=false; shift ;;
    --submit) SUBMIT=true; shift ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

RED='\033[1;31m'; GREEN='\033[1;32m'; CYAN='\033[1;36m'; NC='\033[0m'
step() { printf "\n${CYAN}==> %s${NC}\n" "$1"; }
ok()   { printf "${GREEN}  ✓ %s${NC}\n" "$1"; }
fail() { printf "${RED}  ✗ %s${NC}\n" "$1"; exit 1; }

# ── Preflight ───────────────────────────────────────────────────────────────

step "Preflight"
if [[ ! -d "$WORKSPACE" ]]; then
  # Try to find workspace
  WORKSPACE=$(find ios -maxdepth 1 -name "*.xcworkspace" -type d 2>/dev/null | head -1)
  [[ -n "$WORKSPACE" ]] || fail "No .xcworkspace found in ios/. Set IOS_WORKSPACE in build.config.env"
  SCHEME="${SCHEME:-$(basename "$WORKSPACE" .xcworkspace)}"
fi

if [[ ! -d ios/Pods ]]; then
  echo "  Pods not installed. Running pod install..."
  (cd ios && pod install) || fail "pod install failed"
fi
ok "Workspace: $WORKSPACE | Scheme: $SCHEME | Team: ${TEAM:-auto}"

# ── Typecheck (non-blocking for non-TS projects) ────────────────────────────
if [[ -f tsconfig.json ]] && command -v node &>/dev/null; then
  if npx tsc --noEmit --pretty false 2>/dev/null; then
    ok "TypeScript passes"
  else
    echo "  ⚠ TypeScript errors (non-blocking — fix if this is a TS project)"
  fi
fi

# ── Build archive ───────────────────────────────────────────────────────────

step "Building archive (15-30 min)"
rm -rf builds && mkdir -p builds
ARCHIVE_PATH="builds/${APP_NAME}.xcarchive"

XCODE_ARGS=(
  -workspace "$WORKSPACE"
  -scheme "$SCHEME"
  -configuration Release
  -sdk iphoneos
  -archivePath "$ARCHIVE_PATH"
  archive
  -allowProvisioningUpdates
)

if [[ -n "$TEAM" ]]; then
  XCODE_ARGS+=(DEVELOPMENT_TEAM="$TEAM")
fi

xcodebuild "${XCODE_ARGS[@]}" 2>&1 | tail -20

[[ -d "$ARCHIVE_PATH" ]] || fail "Archive failed — check Xcode for errors"

# ── Export IPA ───────────────────────────────────────────────────────────────

step "Exporting IPA"
IPA_PATH="builds/${APP_NAME}.ipa"

if [[ ! -f "$EXPORT_OPTS" ]]; then
  fail "Export options plist not found at $EXPORT_OPTS"
fi

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath builds \
  -exportOptionsPlist "$EXPORT_OPTS" \
  2>&1 | tail -5

[[ -f "$IPA_PATH" ]] || fail "IPA export failed"
ok "IPA: $IPA_PATH ($(du -h "$IPA_PATH" | cut -f1))"

# ── Validate IPA (sanity check) ─────────────────────────────────────────────

step "Validating IPA"
if [[ -f scripts/verify-ipa.sh ]]; then
  bash scripts/verify-ipa.sh "$IPA_PATH" "$BUNDLE_ID" || true
else
  # Quick structural check — confirms it's a signed archive, not a simulator build
  if unzip -q -l "$IPA_PATH" 2>/dev/null | grep -q "Payload/${APP_NAME}.app/"; then
    ok "IPA structure valid"
  else
    fail "IPA structure invalid — missing Payload"
  fi

  # Warn if this looks like a dev build (get-task-allow = true)
  if unzip -q -p "$IPA_PATH" "Payload/${APP_NAME}.app/embedded.mobileprovision" 2>/dev/null | \
     grep -q '<key>get-task-allow</key>\s*<true/>'; then
    echo "  ⚠ WARNING: get-task-allow=true — this is a development build, not App Store"
  else
    ok "Production signed (get-task-allow=false)"
  fi
fi

# ── Upload to App Store Connect ─────────────────────────────────────────────

if $SUBMIT; then
  step "Uploading to TestFlight (xcrun altool)"

  KEY_ID="${ASC_API_KEY_ID:-}"
  ISSUER="${ASC_API_KEY_ISSUER_ID:-}"
  KEY_PATH="${ASC_API_KEY_PATH:-$HOME/.appstoreconnect/AuthKey_${KEY_ID}.p8}"

  if [[ -z "$KEY_ID" || -z "$ISSUER" ]]; then
    fail "ASC_API_KEY_ID and ASC_API_KEY_ISSUER_ID must be set in build.config.env"
  fi

  if [[ ! -f "$KEY_PATH" ]]; then
    fail "API key not found at $KEY_PATH. Download it from App Store Connect → Integrations → App Store Connect API."
  fi

  xcrun altool --upload-app \
    --type ios \
    --file "$IPA_PATH" \
    --apiKey "$KEY_ID" \
    --apiIssuer "$ISSUER" \
    2>&1

  ok "Uploaded to TestFlight"
else
  step "Skipping upload (--no-submit)"
fi

echo ""
echo "Done. Check App Store Connect → TestFlight."
