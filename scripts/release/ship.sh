#!/usr/bin/env bash
#
# ship.sh — project-agnostic React Native release + launch pipeline.
#
# Everything project-specific lives in release.config.json. This file should be
# droppable into any RN/Expo repo unchanged.
#
#   ./release/ship.sh                    # full pipeline, per config
#   ./release/ship.sh --only ios         # single stage
#   ./release/ship.sh --skip seo,domain  # everything except those
#   ./release/ship.sh --dry-run          # print the plan, touch nothing
#
# Stages: cleanup commit verify push domain landing seo web ios-build ios-verify ios-submit
#
# Requires: bash 4+, node 18+, git. Stage-specific tools checked at stage start.
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="${RELEASE_CONFIG:-$HERE/release.config.json}"
[[ -f "$CONFIG" ]] || { echo "No config at $CONFIG"; exit 1; }

# repo.root is resolved relative to this directory, not the caller's cwd, so the
# pipeline behaves the same however it is invoked.
REPO_ROOT="$(cd "$HERE/$(node -p "require('$CONFIG').repo?.root ?? '..'")" && pwd)"
cd "$REPO_ROOT"
[[ -f package.json ]] || die "repo.root resolved to $REPO_ROOT, which has no package.json — check repo.root in the config"

# Auto-load .env so provider keys are available to child processes.
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

# ── output ────────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then C_H=$'\033[1;36m'; C_W=$'\033[1;33m'; C_E=$'\033[1;31m'; C_0=$'\033[0m'
else C_H=""; C_W=""; C_E=""; C_0=""; fi
step() { printf '\n%s==> %s%s\n' "$C_H" "$1" "$C_0"; }
warn() { printf '%s !! %s%s\n' "$C_W" "$1" "$C_0"; }
die()  { printf '%s xx %s%s\n' "$C_E" "$1" "$C_0"; exit 1; }

# ── config access ─────────────────────────────────────────────────────────────
# cfg <dotted.path> [fallback]
cfg() {
  node -e '
    const c = require(process.argv[1]);
    const v = process.argv[2].split(".").reduce((o,k)=>o?.[k], c);
    if (v === undefined || v === null) { process.stdout.write(process.argv[3] ?? ""); }
    else if (Array.isArray(v)) { process.stdout.write(v.join("\n")); }
    else if (typeof v === "object") { process.stdout.write(JSON.stringify(v)); }
    else { process.stdout.write(String(v)); }
  ' "$CONFIG" "$1" "${2:-}"
}
enabled() { [[ "$(cfg "$1.enabled" false)" == "true" ]]; }
need()    { command -v "$1" >/dev/null 2>&1 || die "$1 is required for this stage but was not found"; }

# ── arg parsing ───────────────────────────────────────────────────────────────
ALL_STAGES=(cleanup commit verify push domain seo blog web ios-build ios-verify ios-submit)
ONLY=""; SKIP=""; DRY_RUN=false; COMMIT_MSG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)       ONLY="$2"; shift 2 ;;
    --skip)       SKIP="$2"; shift 2 ;;
    --message|-m) COMMIT_MSG="$2"; shift 2 ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --help|-h)    sed -n '2,20p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *)            die "Unknown argument: $1" ;;
  esac
done

should_run() {
  local s="$1"
  [[ -n "$ONLY" ]] && { [[ ",$ONLY," == *",$s,"* ]] && return 0 || return 1; }
  [[ -n "$SKIP" && ",$SKIP," == *",$s,"* ]] && return 1
  return 0
}
run() { if $DRY_RUN; then printf '   [dry-run] %s\n' "$*"; else "$@"; fi; }

PROJECT_NAME="$(cfg project.name project)"
printf '%s%s release pipeline%s  (config: %s)\n' "$C_H" "$PROJECT_NAME" "$C_0" "$CONFIG"
$DRY_RUN && warn "DRY RUN — no commands will execute"

# ── cleanup ───────────────────────────────────────────────────────────────────
if should_run cleanup; then
  step "Cleanup"
  # A git process killed mid-run leaves this behind and blocks every later write.
  if [[ -f .git/index.lock ]]; then
    warn "removing stale .git/index.lock"
    run rm -f .git/index.lock
  fi
  run rm -rf dist-verify-* .DS_Store
  $DRY_RUN || git status --short || true
fi

# ── commit ────────────────────────────────────────────────────────────────────
if should_run commit; then
  step "Commit"
  need git
  if [[ -z "$(git status --porcelain)" ]]; then
    echo "   working tree clean, nothing to commit"
  else
    [[ -z "$COMMIT_MSG" ]] && COMMIT_MSG="chore(release): $PROJECT_NAME $(cfg ios.version)"
    run git add -A
    if $DRY_RUN; then
      printf '   [dry-run] git commit -m "%s"\n' "$COMMIT_MSG"
    else
      git diff --cached --quiet || git commit -m "$COMMIT_MSG"
    fi
  fi
fi

# ── verify ────────────────────────────────────────────────────────────────────
# Runs before anything leaves the machine.
if should_run verify; then
  step "Verify"
  while IFS= read -r cmd; do
    [[ -z "$cmd" ]] && continue
    echo "   $cmd"
    run bash -c "$cmd"
  done <<< "$(cfg verify.commands)"
fi

# ── push ──────────────────────────────────────────────────────────────────────
if should_run push; then
  step "Push"
  need git
  BRANCH="$(cfg repo.defaultBranch main)"
  REMOTE="$(cfg repo.remote origin)"
  $DRY_RUN || git --no-pager log --oneline -3
  run git push "$REMOTE" "$BRANCH"
fi

# ── domain ────────────────────────────────────────────────────────────────────
if should_run domain && enabled domain; then
  step "Domain registration (Namecheap)"
  need node
  run node "$HERE/lib/buy-domain.mjs" --config "$CONFIG" $($DRY_RUN && echo --dry-run || true)
fi

# ── seo ───────────────────────────────────────────────────────────────────────
# Generates markdown source only. Rendering is the separate 'blog' stage so an
# article can be edited and rebuilt without paying to regenerate it.
if should_run seo && enabled seo; then
  step "SEO article generation"
  need node
  $DRY_RUN || [[ -n "${AI_API_KEY:-}" ]] || die "AI_API_KEY is not set"
  run node "$HERE/lib/generate-articles.mjs" --config "$CONFIG" $($DRY_RUN && echo --dry-run || true)
fi

# ── blog ──────────────────────────────────────────────────────────────────────
if should_run blog && enabled blog; then
  BLOG_MODE="$(cfg blog.mode expo-public)"
  need node
  if [[ "$BLOG_MODE" == "astro" ]]; then
    step "Scaffold standalone Astro site"
    run node "$HERE/lib/scaffold-landing.mjs" --config "$CONFIG" $($DRY_RUN && echo --dry-run || true)
  else
    # Renders static HTML into public/, which Expo copies verbatim on web export.
    # Works alongside web.output="single" because these files bypass the SPA.
    step "Render blog into $(cfg blog.publicDir public)$(cfg blog.basePath /blog)"
    run node "$HERE/lib/build-blog.mjs" --config "$CONFIG" $($DRY_RUN && echo --dry-run || true)
  fi
fi

# ── web deploy ────────────────────────────────────────────────────────────────
if should_run web && enabled web; then
  step "Deploy web"
  run bash -c "$(cfg web.deployCommand)"

  URL="$(cfg web.productionUrl)"
  if [[ -n "$URL" ]] && ! $DRY_RUN; then
    while IFS= read -r anchor; do
      [[ -z "$anchor" ]] && continue
      id="${anchor#\#}"
      if curl -fsSL "$URL" 2>/dev/null | grep -q "id=\"$id\"\|id='$id'"; then
        echo "   ok   $URL$anchor"
      else
        warn "anchor '$anchor' not found in deployed HTML — App Store support/privacy URLs may not resolve"
      fi
    done <<< "$(cfg web.verifyAnchors)"
  fi
fi

# ── ios build ─────────────────────────────────────────────────────────────────
IPA_PATH=""
if enabled ios; then
  IPA_PATH="$(cfg ios.outputDir builds)/$(cfg project.slug app)-ios-$(cfg ios.version)-$(cfg ios.buildNumber).ipa"
fi

if should_run ios-build && enabled ios; then
  step "iOS production build"
  [[ "$(uname)" == "Darwin" ]] || die "iOS builds require macOS"
  run mkdir -p "$(cfg ios.outputDir builds)"
  EXTRA=""; [[ "$(cfg ios.local true)" == "true" ]] && EXTRA="--local"
  run env EAS_NO_VCS=1 npx eas-cli@latest build \
    --platform ios --profile "$(cfg ios.easProfile production)" \
    $EXTRA --non-interactive --output "$IPA_PATH"
fi

# ── ios verify ────────────────────────────────────────────────────────────────
# Catches a dev-signed or mis-versioned archive before wasting an upload on it.
if should_run ios-verify && enabled ios; then
  step "Verify IPA"
  $DRY_RUN || [[ -f "$IPA_PATH" ]] || die "IPA not found at $IPA_PATH"
  run node "$HERE/lib/verify-ipa.mjs" --ipa "$IPA_PATH" \
    --bundle-id "$(cfg ios.bundleId)" --version "$(cfg ios.version)"
fi

# ── ios submit ────────────────────────────────────────────────────────────────
if should_run ios-submit && enabled ios; then
  step "Upload to App Store Connect"
  run npx eas-cli@latest submit --platform ios \
    --profile "$(cfg ios.easProfile production)" \
    --path "$IPA_PATH" --non-interactive --wait
fi

# ── done ──────────────────────────────────────────────────────────────────────
step "Pipeline complete"
cat <<EOF

  Automated stages finished for $PROJECT_NAME.

  "Uploaded" is not "processed", and "processed" is not "submitted for review".
  Finish in App Store Connect: select the build, attach any review attachment,
  and submit.
EOF
