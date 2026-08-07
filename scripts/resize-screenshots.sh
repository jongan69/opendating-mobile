#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# 📐 Screenshot Resizer — Project-Agnostic
# ============================================================
# Converts raw device screenshots to App Store required sizes.
#
# Prerequisites: ImageMagick (`brew install imagemagick`)
#
# Usage:
#   ./scripts/resize-screenshots.sh                     # all screenshots
#   ./scripts/resize-screenshots.sh 01-welcome 02-login # specific files
#   ./scripts/resize-screenshots.sh --store google       # Google Play sizes
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SCREENSHOT_DIR="$PROJECT_DIR/screenshots"
STORE="apple"  # "apple" or "google"
FILES=()

for arg in "$@"; do
  case "$arg" in
    --store) STORE="$2"; shift 2 ;;
    --store=*) STORE="${arg#*=}" ;;
    --help|-h)
      echo "Usage: $0 [--store apple|google] [files...]"
      echo "  --store apple   iOS App Store sizes (default)"
      echo "  --store google  Google Play Store sizes"
      exit 0
      ;;
    *) FILES+=("$arg") ;;
  esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { echo -e "${CYAN}[→]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

if ! command -v convert &>/dev/null; then
  echo "ImageMagick not found. Install with: brew install imagemagick"
  exit 0
fi

# Default: all PNGs in screenshots/
if [ ${#FILES[@]} -eq 0 ]; then
  for f in "$SCREENSHOT_DIR"/*.png; do
    [ -f "$f" ] && FILES+=("$(basename "$f" .png)")
  done
fi

[ ${#FILES[@]} -eq 0 ] && { warn "No screenshots found in $SCREENSHOT_DIR"; exit 0; }

case "$STORE" in
  apple)
    OUT_DIR="$SCREENSHOT_DIR/app-store"
    SIZES=(
      "6.7:1290:2796"
      "6.1:1179:2556"
    )
    info "Resizing ${#FILES[@]} screenshots for iOS App Store..."
    ;;
  google)
    OUT_DIR="$SCREENSHOT_DIR/play-store"
    SIZES=(
      "phone:1080:1920"
    )
    info "Resizing ${#FILES[@]} screenshots for Google Play..."
    ;;
  *) echo "Unknown store: $STORE"; exit 1 ;;
esac

mkdir -p "$OUT_DIR"

BG_COLOR="#FAF9F7"  # warm off-white — change in your config

for name in "${FILES[@]}"; do
  src="$SCREENSHOT_DIR/${name}.png"
  [ ! -f "$src" ] && { warn "Missing: ${name}.png"; continue; }

  for size_spec in "${SIZES[@]}"; do
    label="${size_spec%%:*}"
    rest="${size_spec#*:}"
    w="${rest%%:*}"
    h="${rest#*:}"

    dst="$OUT_DIR/${label}-${name}.png"
    convert "$src" \
      -resize "${w}x${h}^" \
      -gravity center \
      -extent "${w}x${h}" \
      -background "$BG_COLOR" \
      "$dst" 2>/dev/null
    ok "${label} → ${name}"
  done
done

echo ""
ok "Done! $(ls "$OUT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ') files in $OUT_DIR"
ls -lh "$OUT_DIR"/*.png 2>/dev/null | head -20
