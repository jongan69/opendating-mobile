#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# OpenDating Screenshot Capture Script
# ============================================================
# Builds the Android app (debug), installs it, drives through
# every key screen with ADB input, and captures screenshots.
#
# Prerequisites:
#   - Android device connected via USB with USB debugging enabled
#   - ADB installed and in PATH
#   - Node.js/npm for building the app
#   - (optional) scrcpy for visual monitoring
#
# Usage:
#   ./scripts/capture-screenshots.sh            # full run
#   ./scripts/capture-screenshots.sh --device-only  # skip build
#   ./scripts/capture-screenshots.sh --monitor  # open scrcpy alongside
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOT_DIR="$PROJECT_DIR/screenshots"
DEVICE_ONLY=false
USE_MONITOR=false

for arg in "$@"; do
  case "$arg" in
    --device-only) DEVICE_ONLY=true ;;
    --monitor) USE_MONITOR=true ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[→]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Device detection ────────────────────────────────────────
info "Checking for Android device..."
DEVICE=$(adb devices | grep -v "List of devices" | grep "device$" | head -1 | awk '{print $1}')
if [ -z "$DEVICE" ]; then
  fail "No Android device found. Connect a device with USB debugging enabled."
fi
ok "Device found: $DEVICE"

# ── Screen dimensions ───────────────────────────────────────
info "Getting screen dimensions..."
SIZE=$(adb shell wm size | grep "Physical size" | awk '{print $3}' || adb shell wm size | head -1 | awk '{print $3}')
WIDTH=$(echo "$SIZE" | cut -d'x' -f1)
HEIGHT=$(echo "$SIZE" | cut -d'x' -f2)
ok "Screen: ${WIDTH}x${HEIGHT}"

# Calculate positions as percentage of screen
tap_x() { echo $(($WIDTH * $1 / 100)); }
tap_y() { echo $(($HEIGHT * $1 / 100)); }

# ── ADB helpers ─────────────────────────────────────────────
tap() {
  local x=$(tap_x $1)
  local y=$(tap_y $2)
  adb shell input tap "$x" "$y"
  sleep 0.5
}

swipe_left() {
  local x1=$(tap_x 80); local y1=$(tap_y 50)
  local x2=$(tap_x 20); local y2=$(tap_y 50)
  adb shell input swipe "$x1" "$y1" "$x2" "$y2" 300
  sleep 1
}

swipe_right() {
  local x1=$(tap_x 20); local y1=$(tap_y 50)
  local x2=$(tap_x 80); local y2=$(tap_y 50)
  adb shell input swipe "$x1" "$y1" "$x2" "$y2" 300
  sleep 1
}

scroll_up() {
  local x=$(tap_x 50)
  local y1=$(tap_y 70); local y2=$(tap_y 30)
  adb shell input swipe "$x" "$y1" "$x" "$y2" 300
  sleep 0.8
}

type_text() {
  adb shell input text "$1"
  sleep 0.3
}

screenshot() {
  local name="$1"
  local remote_path="/sdcard/opendating_${name}.png"
  local local_path="$SCREENSHOT_DIR/${name}.png"
  adb shell screencap -p "$remote_path"
  adb pull "$remote_path" "$local_path" > /dev/null 2>&1
  adb shell rm "$remote_path" 2>/dev/null || true
  ok "Captured: $name"
}

go_back() {
  adb shell input keyevent KEYCODE_BACK
  sleep 0.5
}

go_home() {
  adb shell input keyevent KEYCODE_HOME
  sleep 0.5
}

# Position constants (percentage-based)
CENTER_X=50
CENTER_Y=50
BOTTOM_BUTTON_Y=88        # Bottom CTA buttons
BOTTOM_LEFT_X=25          # Pass/back button
BOTTOM_RIGHT_X=75         # Like/next button
HEADER_BACK_X=8           # Back arrow in header
HEADER_BACK_Y=6
TOP_RIGHT_X=92            # Menu/settings icon
TOP_RIGHT_Y=6
KEYBOARD_ENTER_Y=86       # Keyboard enter/done
TEXT_INPUT_Y=80           # Where text inputs usually are
PHOTO_SLOT_1_X=20         # First photo slot
PHOTO_SLOT_1_Y=35
CARD_PHOTO_TAP_RIGHT=75   # Tap right side of card for next photo
CARD_PHOTO_TAP_LEFT=25    # Tap left side of card for previous

# ── Build ───────────────────────────────────────────────────
if [ "$DEVICE_ONLY" = false ]; then
  info "Building Android debug APK..."
  cd "$PROJECT_DIR"
  npx expo run:android --variant debug 2>&1 | tail -5
  ok "Build complete"
else
  info "Skipping build (--device-only)"
fi

# ── Install ─────────────────────────────────────────────────
info "Installing app..."
APK_PATH=$(find "$PROJECT_DIR/android/app/build/outputs/apk/debug" -name "*.apk" 2>/dev/null | head -1)
if [ -z "$APK_PATH" ]; then
  warn "APK not found at expected path. Trying to install via adb..."
  # Try installing whatever's on the device
else
  adb install -r "$APK_PATH" 2>&1 | tail -1
fi
ok "App installed"

# ── Monitor ────────────────────────────────────────────────
if [ "$USE_MONITOR" = true ]; then
  info "Starting scrcpy for visual monitoring..."
  scrcpy --no-audio --window-title "OpenDating Screenshot Capture" &
  SCRCPY_PID=$!
  sleep 3
fi

# Clear any previous screenshots
mkdir -p "$SCREENSHOT_DIR"
rm -f "$SCREENSHOT_DIR"/*.png

info "Starting screenshot capture..."
echo ""

# ═══════════════════════════════════════════════════════════
# SCREEN 1: Welcome
# ═══════════════════════════════════════════════════════════
info "1/15  Welcome screen"
adb shell am start -n com.jongan69.opendating/.MainActivity 2>/dev/null || \
  adb shell monkey -p com.jongan69.opendating -c android.intent.category.LAUNCHER 1
sleep 4  # Wait for app to boot
screenshot "01-welcome"

# ═══════════════════════════════════════════════════════════
# SCREEN 2: Create Account (tap "Create Account" button)
# ═══════════════════════════════════════════════════════════
info "2/15  Create Account"
tap $CENTER_X $BOTTOM_BUTTON_Y  # Tap the primary CTA
sleep 2
screenshot "02-create-account"

# ═══════════════════════════════════════════════════════════
# SCREEN 3: Privacy
# ═══════════════════════════════════════════════════════════
info "3/15  Privacy"
tap $CENTER_X $BOTTOM_BUTTON_Y  # Continue
sleep 1.5
screenshot "03-privacy"

# Screens 4-8: Navigate through onboarding by tapping bottom CTA
# (The exact screens depend on onboarding flow order)
for step in "04-basics" "05-preferences" "06-intent" "07-about"; do
  info "→  $step"
  sleep 1
  screenshot "$step"
  tap $CENTER_X $BOTTOM_BUTTON_Y  # Continue to next step
  sleep 1.5
done

# ═══════════════════════════════════════════════════════════
# SCREEN: Photos
# ═══════════════════════════════════════════════════════════
info "8/15  Photos"
screenshot "08-photos"
tap $CENTER_X $BOTTOM_BUTTON_Y  # Skip or continue
sleep 1.5

# ═══════════════════════════════════════════════════════════
# SCREEN: Location
# ═══════════════════════════════════════════════════════════
info "9/15  Location"
screenshot "09-location"
tap $CENTER_X $BOTTOM_BUTTON_Y  # Allow and continue
sleep 2

# ═══════════════════════════════════════════════════════════
# SCREEN: Review
# ═══════════════════════════════════════════════════════════
info "10/15 Profile Review"
screenshot "10-review"
tap $CENTER_X $BOTTOM_BUTTON_Y  # Create Profile
sleep 3

# ═══════════════════════════════════════════════════════════
# SCREEN: Finish → Discover
# ═══════════════════════════════════════════════════════════
info "11/15 Finish → Discover"
screenshot "11-finish"
tap $CENTER_X $BOTTOM_BUTTON_Y  # Start Discovering
sleep 3

# ═══════════════════════════════════════════════════════════
# SCREEN: Discover (empty state — no candidates yet)
# ═══════════════════════════════════════════════════════════
info "12/15 Discover"
screenshot "12-discover"

# ═══════════════════════════════════════════════════════════
# SCREEN: Matches tab
# ═══════════════════════════════════════════════════════════
info "13/15 Matches"
tap 50 96  # Tab bar: Matches (middle tab)
sleep 1.5
screenshot "13-matches"

# ═══════════════════════════════════════════════════════════
# SCREEN: Profile tab
# ═══════════════════════════════════════════════════════════
info "14/15 Profile"
tap 92 96  # Tab bar: Profile (right tab)
sleep 1.5
screenshot "14-profile"

# ═══════════════════════════════════════════════════════════
# SCREEN: Filters (from Discover)
# ═══════════════════════════════════════════════════════════
info "15/15 Filters"
tap 5 96   # Tab bar: Discover (left tab)
sleep 1
tap 92 6   # Filter icon in header
sleep 1.5
screenshot "15-filters"

# ── Cleanup ─────────────────────────────────────────────────
if [ "$USE_MONITOR" = true ] && [ -n "${SCRCPY_PID:-}" ]; then
  kill "$SCRCPY_PID" 2>/dev/null || true
fi

# ── Summary ─────────────────────────────────────────────────
echo ""
ok "All screenshots captured!"
echo ""
echo "  Location: $SCREENSHOT_DIR"
echo "  Count:    $(ls "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') files"
echo ""
ls -lh "$SCREENSHOT_DIR"/*.png 2>/dev/null || warn "No screenshots found"
echo ""
info "Next: Review the screenshots, then resize for App Store requirements:"
echo "  iPhone 6.7\": 1290×2796"
echo "  iPhone 6.1\": 1179×2556"
