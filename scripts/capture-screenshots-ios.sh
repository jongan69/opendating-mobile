#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# OpenDating iOS Screenshot Capture (Simulator)
# ============================================================
# Boots an iOS simulator, builds the app, and captures
# screenshots at every key screen using simctl.
#
# Prerequisites:
#   - macOS with Xcode installed
#   - iOS Simulator available
#
# Usage:
#   ./scripts/capture-screenshots-ios.sh
#   ./scripts/capture-screenshots-ios.sh --device "iPhone 17 Pro"
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOT_DIR="$PROJECT_DIR/screenshots"
SIM_DEVICE="${1:-iPhone 17 Pro}"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${CYAN}[→]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Find or boot simulator ──────────────────────────────────
info "Booting simulator: $SIM_DEVICE"
SIM_UDID=$(xcrun simctl list devices | grep "$SIM_DEVICE" | grep -v "unavailable" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

if [ -z "$SIM_UDID" ]; then
  fail "Simulator '$SIM_DEVICE' not found. Available devices:"
  xcrun simctl list devices | grep -v "unavailable" | head -20
fi

xcrun simctl boot "$SIM_UDID" 2>/dev/null || true
open -a Simulator
sleep 3
ok "Simulator ready: $SIM_UDID"

# ── Build and install ───────────────────────────────────────
info "Building for iOS simulator..."
cd "$PROJECT_DIR"
npx expo run:ios --simulator 2>&1 | tail -5
sleep 3
ok "Build complete"

# ── Helper: take screenshot ─────────────────────────────────
screenshot() {
  local name="$1"
  local path="$SCREENSHOT_DIR/${name}.png"
  xcrun simctl io "$SIM_UDID" screenshot "$path"
  ok "Captured: $name"
}

# Clear previous
mkdir -p "$SCREENSHOT_DIR"
rm -f "$SCREENSHOT_DIR"/*.png

info "Starting screenshot capture..."

# ── Navigate and capture ────────────────────────────────────
# Note: simctl doesn't simulate taps well. These screenshots
# capture what's on screen after each manual navigation step.
# For fully automated navigation, use a UI testing framework
# (XCTest/Detox) or drive the simulator manually.

# Launch the app
xcrun simctl launch "$SIM_UDID" com.jongan69.opendating
sleep 5
screenshot "01-welcome"

# The remaining screens require manual navigation or a UI test.
# simctl can't simulate complex gestures (swipes, etc.).
# For full automation, integrate with Detox or XCTest.

echo ""
ok "Welcome screenshot captured (iOS simulator)."
echo "  Full automation requires XCTest/Detox — simctl can't simulate taps."
echo "  Manually navigate and re-run: xcrun simctl io '$SIM_UDID' screenshot <path>"
echo ""
echo "  Or use the Android script: ./scripts/capture-screenshots.sh"
echo "  (ADB can simulate taps/swipes for full automation)"
