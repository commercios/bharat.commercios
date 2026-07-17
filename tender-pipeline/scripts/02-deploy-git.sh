#!/usr/bin/env bash
#
# 02-deploy-git.sh — publish via a git-backed static host (Pages, Netlify, CF).
#
#   ./02-deploy-git.sh --repo ~/sites/bharat
#   ./02-deploy-git.sh --repo ~/sites/bharat --with-index
#   ./02-deploy-git.sh --repo ~/sites/bharat --dry-run
#
# Use this OR 02-deploy-vps.sh — never both. See README.md.
#
# The original runbook ran `git add -A && git commit && git push` with no cd,
# so it committed the *pipeline* repo — node_modules, data/, and .env with your
# API key in it. This stages named files in an explicit repo instead.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "$SCRIPT_DIR/lib/common.sh"

PIPELINE_DIR="${PIPELINE_DIR:-$PWD}"
REPO=""
INDEX_SRC=""
WITH_INDEX=0
DRY_RUN=0
MSG=""
VERIFY_ARGS=()

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)             REPO="${2:?}"; shift 2 ;;
    --dir)              PIPELINE_DIR="${2:?}"; shift 2 ;;
    --with-index)       WITH_INDEX=1; shift ;;
    --index-src)        INDEX_SRC="${2:?}"; WITH_INDEX=1; shift 2 ;;
    --message|-m)       MSG="${2:?}"; shift 2 ;;
    --dry-run)          DRY_RUN=1; shift ;;
    --allow-unverified) VERIFY_ARGS+=(--allow-unverified); shift ;;
    --max-drop)         VERIFY_ARGS+=(--max-drop "${2:?}"); shift 2 ;;
    --min-count)        VERIFY_ARGS+=(--min-count "${2:?}"); shift 2 ;;
    -h|--help)          sed -n '2,10p' "$0"; exit 0 ;;
    *)                  die "unknown arg: $1" ;;
  esac
done

need git
[ -n "$REPO" ] || die "--repo is required (the deploy repo, NOT the pipeline dir)"
[ -d "$REPO" ] || die "repo does not exist: $REPO"
git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1 || die "$REPO is not a git repo"

# ── refuse to publish from the pipeline repo itself ───────────────────────────
pipeline_real="$(cd "$PIPELINE_DIR" && pwd -P)"
repo_real="$(cd "$REPO" && pwd -P)"
if [ "$pipeline_real" = "$repo_real" ]; then
  warn "deploy repo == pipeline dir. Everything here gets committed history."
  assert_env_ignored "$REPO"
  for junk in node_modules .env; do
    if [ -e "$REPO/$junk" ] && ! git -C "$REPO" check-ignore -q "$junk"; then
      die "$junk is not gitignored in $REPO — refusing to publish."
    fi
  done
fi

# ── secret guard, unconditionally ─────────────────────────────────────────────
assert_env_ignored "$REPO"
assert_env_ignored "$PIPELINE_DIR"

# ── the gate ──────────────────────────────────────────────────────────────────
"$SCRIPT_DIR/01-verify.sh" --dir "$PIPELINE_DIR" "${VERIFY_ARGS[@]+"${VERIFY_ARGS[@]}"}" \
  || die "verification failed — nothing was committed"

# ── stage ─────────────────────────────────────────────────────────────────────
cp "$PIPELINE_DIR/data/tenders.json" "$REPO/tenders.json"
assert_valid_json "$REPO/tenders.json"
FILES=(tenders.json)

if [ "$WITH_INDEX" -eq 1 ]; then
  if [ -z "$INDEX_SRC" ]; then
    for cand in "$PIPELINE_DIR/index.html" "$SCRIPT_DIR/index.html"; do
      [ -f "$cand" ] && { INDEX_SRC="$cand"; break; }
    done
  fi
  [ -n "$INDEX_SRC" ] && [ -f "$INDEX_SRC" ] || die "--with-index but no index.html found. Use --index-src."
  cp "$INDEX_SRC" "$REPO/index.html"
  FILES+=(index.html)
fi

# Named paths only — never `git add -A`.
git -C "$REPO" add -- "${FILES[@]}"

# Check for a no-op BEFORE stamping a version. A timestamp written on every run
# would always differ, so every run would commit — churning history with
# identical data and defeating this check entirely.
if git -C "$REPO" diff --cached --quiet; then
  ok "no changes to publish — data is identical to what's live"
  git -C "$REPO" reset -q -- "${FILES[@]}" 2>/dev/null || true
  exit 0
fi

# Real change — now stamp it.
stamp="$(date -u +%Y%m%d%H%M%S)"
printf '{"version":"%s"}\n' "$stamp" > "$REPO/version.json"
git -C "$REPO" add -- version.json
FILES+=(version.json)

count="$(json_get "$PIPELINE_DIR/data/tenders.json" meta.count)"
verified="$(json_get "$PIPELINE_DIR/data/tenders.json" meta.verified)"
[ -n "$MSG" ] || MSG="data: $count tenders (verified=$verified) @ $stamp"

log "staged:"
git -C "$REPO" diff --cached --stat | sed 's/^/    /' >&2

# Last line of defence: if a secret somehow got staged, stop.
if git -C "$REPO" diff --cached --name-only | grep -qE '(^|/)\.env$'; then
  die ".env is staged. Aborting. Run: git -C '$REPO' reset .env"
fi

if [ "$DRY_RUN" -eq 1 ]; then
  warn "--dry-run: staged but not committed. Undo with: git -C '$REPO' reset"
  exit 0
fi

git -C "$REPO" commit -m "$MSG"
ok "committed: $MSG"

branch="$(git -C "$REPO" rev-parse --abbrev-ref HEAD)"
git -C "$REPO" push origin "$branch"
ok "pushed to origin/$branch — your host will build from here"
echo
log "rollback: git -C '$REPO' revert HEAD && git -C '$REPO' push origin $branch"
