#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Resize screenshots to App Store required dimensions
# ============================================================
# Takes the raw Android screenshots (captured at device
# resolution) and creates properly-sized versions for the
# iOS App Store and Google Play Store.
#
# Prerequisites:
#   - ImageMagick (`brew install imagemagick`)
#   - Raw screenshots in screenshots/
#
# Usage:
#   ./scripts/resize-screenshots.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOT_DIR="$PROJECT_DIR/screenshots"
STORE_DIR="$SCREENSHOT_DIR/app-store"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { echo -e "${CYAN}[→]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

# Check ImageMagick
if ! command -v convert &>/dev/null; then
  warn "ImageMagick not found. Install with: brew install imagemagick"
  info "Continuing without resize — raw screenshots are in $SCREENSHOT_DIR"
  exit 0
fi

mkdir -p "$STORE_DIR"

# iOS App Store required dimensions
# iPhone 6.7" (Pro Max / Plus): 1290×2796
# iPhone 6.1" (Pro / standard): 1179×2556
# iPhone 5.5" (SE / older): 1242×2208 (optional)

info "Resizing screenshots for App Store..."

# Map of screenshot → App Store name
declare -A SHOTS=(
  ["01-welcome"]="Welcome Screen"
  ["02-create-account"]="Create Account"
  ["03-privacy"]="Privacy"
  ["12-discover"]="Discover"
  ["13-matches"]="Matches"
  ["14-profile"]="Profile"
  ["15-filters"]="Filters"
)

for file in "${!SHOTS[@]}"; do
  src="$SCREENSHOT_DIR/${file}.png"
  if [ ! -f "$src" ]; then
    warn "Missing: ${file}.png — skipping"
    continue
  fi

  label="${SHOTS[$file]}"

  # iPhone 6.7" (1290×2796)
  convert "$src" \
    -resize 1290x2796^ \
    -gravity center \
    -extent 1290x2796 \
    "$STORE_DIR/6.7-${file}.png"
  ok "6.7\" → ${file}"

  # iPhone 6.1" (1179×2556)
  convert "$src" \
    -resize 1179x2556^ \
    -gravity center \
    -extent 1179x2556 \
    "$STORE_DIR/6.1-${file}.png"
  ok "6.1\" → ${file}"
done

# ── Frame the best 3 for each size ──────────────────────────
info "Creating device-framed versions..."
# If you have device frame overlays, apply them here.
# For now, just the raw resized screenshots work.

echo ""
ok "App Store screenshots ready!"
echo "  Location: $STORE_DIR"
echo "  Count:    $(ls "$STORE_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') files"
echo ""
echo "  Upload to App Store Connect → App Store → Screenshots"
echo "  Required: 3-5 screenshots per device size"
echo ""
ls -lh "$STORE_DIR"/*.png 2>/dev/null | head -20
