#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# 📱 Mobile Screenshot Capture — Project-Agnostic
# ============================================================
# Installs an Android APK, drives through screens defined in
# a JSON config, and captures PNGs at each step.
#
# Works with any Android app — Expo, bare RN, Flutter, native.
#
# Prerequisites:
#   - Android device connected via USB debugging
#   - ADB in PATH
#   - (optional) ImageMagick for App Store resizing
#   - (optional) scrcpy for visual monitoring
#
# Usage:
#   ./scripts/capture-screenshots.sh                    # build + capture
#   ./scripts/capture-screenshots.sh --apk ./app.apk    # skip build, use APK
#   ./scripts/capture-screenshots.sh --monitor          # open scrcpy alongside
#   ./scripts/capture-screenshots.sh --config ./my.json # custom screen config
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOT_DIR="$PROJECT_DIR/screenshots"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[→]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Parse flags ───────────────────────────────────────────────
APK_PATH=""
USE_MONITOR=false
CONFIG_FILE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --apk)
      [ "$#" -ge 2 ] || { echo "--apk requires a path"; exit 1; }
      APK_PATH="$2"
      shift 2
      ;;
    --apk=*)
      APK_PATH="${1#*=}"
      shift
      ;;
    --monitor)
      USE_MONITOR=true
      shift
      ;;
    --config)
      [ "$#" -ge 2 ] || { echo "--config requires a path"; exit 1; }
      CONFIG_FILE="$2"
      shift 2
      ;;
    --config=*)
      CONFIG_FILE="${1#*=}"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--apk <path>] [--monitor] [--config <json>]"
      echo ""
      echo "  --apk <path>    Skip build, install this APK directly"
      echo "  --monitor       Open scrcpy for visual monitoring"
      echo "  --config <json> Path to screenshots.config.json"
      exit 0
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

# ── Resolve config ────────────────────────────────────────────
if [ -z "$CONFIG_FILE" ]; then
  CONFIG_FILE="$PROJECT_DIR/screenshots.config.json"
fi

if [ -f "$CONFIG_FILE" ]; then
  PACKAGE=$(python3 -c "import json,sys; print(json.load(open('$CONFIG_FILE')).get('package',''))" 2>/dev/null || echo "")
else
  PACKAGE=""
fi

# Fallback: detect from common sources
if [ -z "$PACKAGE" ]; then
  if [ -f "$PROJECT_DIR/app.json" ]; then
    # Expo
    PACKAGE=$(python3 -c "import json,sys; c=json.load(open('$PROJECT_DIR/app.json')); e=c.get('expo',c); a=e.get('android',{}); print(a.get('package',''))" 2>/dev/null || echo "")
  fi
fi

if [ -z "$PACKAGE" ]; then
  fail "Could not determine package name. Create a screenshots.config.json or set android.package in app.json."
fi
ok "Package: $PACKAGE"

# ── Device detection ─────────────────────────────────────────
info "Checking for Android device..."
DEVICE=$(adb devices | grep -v "List of devices" | grep "device$" | head -1 | awk '{print $1}')
[ -z "$DEVICE" ] && fail "No Android device found."
ok "Device: $DEVICE"
adb shell svc power stayon usb >/dev/null 2>&1 || true
adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
adb shell wm dismiss-keyguard >/dev/null 2>&1 || true

# ── Screen dimensions ────────────────────────────────────────
info "Getting screen dimensions..."
SIZE=$(adb shell wm size | grep "Physical size" | awk '{print $3}' || adb shell wm size | head -1 | awk '{print $3}')
WIDTH=$(echo "$SIZE" | cut -d'x' -f1)
HEIGHT=$(echo "$SIZE" | cut -d'x' -f2)
ok "Screen: ${WIDTH}x${HEIGHT}"

tap_x() { echo $(($WIDTH * $1 / 100)); }
tap_y() { echo $(($HEIGHT * $1 / 100)); }

# ── ADB helpers ──────────────────────────────────────────────
tap()    { adb shell input tap "$(tap_x $1)" "$(tap_y $2)"; sleep 0.5; }
tap_abs() { adb shell input tap "$1" "$2"; sleep 0.5; }
long_press() { adb shell input swipe "$(tap_x $1)" "$(tap_y $1)" "$(tap_x $1)" "$(tap_y $1)" 800; sleep 1; }
swipe()  { adb shell input swipe "$(tap_x $1)" "$(tap_y $2)" "$(tap_x $3)" "$(tap_y $4)" 300; sleep 0.8; }
type_text() { adb shell input text "$1"; sleep 0.3; }
go_back() { adb shell input keyevent KEYCODE_BACK; sleep 0.5; }
go_home() { adb shell input keyevent KEYCODE_HOME; sleep 0.5; }
press_enter() { adb shell input keyevent KEYCODE_ENTER; sleep 0.5; }
wait_sec() { sleep "$1"; }

screenshot() {
  local name="$1"
  local remote_path="/sdcard/screenshot_${name}.png"
  local local_path="$SCREENSHOT_DIR/${name}.png"
  ensure_app_visible
  adb shell screencap -p "$remote_path"
  adb pull "$remote_path" "$local_path" > /dev/null 2>&1
  adb shell rm "$remote_path" 2>/dev/null || true
  ok "Captured: $name"
}

# ── Launch app ───────────────────────────────────────────────
launch_app() {
  adb shell am start -n "${PACKAGE}/.MainActivity" 2>/dev/null || \
    adb shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1
  sleep 4
}

ensure_app_visible() {
  adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
  adb shell wm dismiss-keyguard >/dev/null 2>&1 || true
  adb shell cmd statusbar collapse >/dev/null 2>&1 || true

  local window_state
  window_state="$(adb shell dumpsys window 2>/dev/null || true)"

  if echo "$window_state" | grep -Eq 'isKeyguardShowing=true|mDreamingLockscreen=true'; then
    fail "Android device is locked. Unlock it once, keep it connected, and rerun this script."
  fi

  if ! echo "$window_state" | grep -Eq "m(CurrentFocus|FocusedApp)=.*$PACKAGE"; then
    warn "App activity is not reported focused; continuing for visual audit"
  fi
}

# ── Build and install ────────────────────────────────────────
if [ -n "$APK_PATH" ]; then
  info "Installing: $APK_PATH"
  adb install -r "$APK_PATH" 2>&1 | tail -1
  ok "App installed"
else
  info "Building Android debug APK..."
  cd "$PROJECT_DIR"

  if [ -f "./android/gradlew" ]; then
    (cd android && ./gradlew assembleDebug 2>&1 | tail -3)
    APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" 2>/dev/null | head -1)
  elif [ -f "./app.json" ]; then
    npx expo run:android --variant debug 2>&1 | tail -3
    APK_PATH=$(find android/app/build/outputs/apk/debug -name "*.apk" 2>/dev/null | head -1)
  fi

  if [ -z "$APK_PATH" ]; then
    fail "Build did not produce an APK. Check the build output above."
  fi

  info "Installing..."
  adb install -r "$APK_PATH" 2>&1 | tail -1
  ok "App installed"
fi

info "Resetting app data..."
adb shell pm clear "$PACKAGE" >/dev/null 2>&1 || true
ok "App data reset"

# ── Monitor ─────────────────────────────────────────────────
if [ "$USE_MONITOR" = true ]; then
  if command -v scrcpy &>/dev/null; then
    info "Starting scrcpy..."
    scrcpy --no-audio --window-title "Screenshot Capture" &
    SCRCPY_PID=$!
    sleep 3
  else
    warn "scrcpy not found — skipping visual monitor"
  fi
fi

# ── Run the screen flow ──────────────────────────────────────
mkdir -p "$SCREENSHOT_DIR"
rm -f "$SCREENSHOT_DIR"/*.png

info "Launching app..."
launch_app

if [ -f "$CONFIG_FILE" ]; then
  # ── Config-driven flow ─────────────────────────────────────
  info "Reading screen flow from $(basename "$CONFIG_FILE")..."

  SCREEN_COUNT=$(python3 -c "
import json
with open('$CONFIG_FILE') as f:
    config = json.load(f)
print(len(config.get('screens', [])))
" 2>/dev/null || echo "0")

  for ((i=0; i<SCREEN_COUNT; i++)); do
    eval "$(python3 -c "
import json
with open('$CONFIG_FILE') as f:
    config = json.load(f)
screen = config['screens'][$i]
name = screen['name']
actions = screen.get('actions', [])
delay = screen.get('delay', 1.5)

# Output bash commands
cmds = []
for a in actions:
    t = a.get('type','')
    if t == 'tap':
        cmds.append(f'tap {a[\"x\"]} {a[\"y\"]}')
    elif t == 'swipe':
        cmds.append(f'swipe {a[\"x1\"]} {a[\"y1\"]} {a[\"x2\"]} {a[\"y2\"]}')
    elif t == 'text':
        cmds.append(f'type_text \"{a[\"value\"]}\"')
    elif t == 'back':
        cmds.append('go_back')
    elif t == 'enter':
        cmds.append('press_enter')
    elif t == 'wait':
        cmds.append(f'wait_sec {a[\"seconds\"]}')
    elif t == 'launch':
        cmds.append('launch_app')

print(f'info \"{$i}/{$SCREEN_COUNT}  {name}\"')
for c in cmds:
    print(c)
print(f'sleep {delay}')
print(f'screenshot \"{name}\"')
")"
  done

else
  # ── Default: capture launch screen only ────────────────────
  warn "No screenshots.config.json found — capturing launch screen only."
  sleep 2
  screenshot "01-launch"

  # Try tab bar navigation if it looks like a 3-tab app
  info "Trying tab navigation..."
  tap 50 96; sleep 1.5; screenshot "02-tab-middle"
  tap 92 96; sleep 1.5; screenshot "03-tab-right"
  tap 5 96;  sleep 1.5; screenshot "04-tab-left"
fi

# ── Cleanup ──────────────────────────────────────────────────
[ -n "${SCRCPY_PID:-}" ] && kill "$SCRCPY_PID" 2>/dev/null || true

echo ""
ok "Screenshots captured!"
echo "  Location: $SCREENSHOT_DIR"
echo "  Count:    $(ls "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') files"
echo ""
ls -lh "$SCREENSHOT_DIR"/*.png 2>/dev/null | head -20
echo ""
info "For App Store, run: ./scripts/resize-screenshots.sh"
