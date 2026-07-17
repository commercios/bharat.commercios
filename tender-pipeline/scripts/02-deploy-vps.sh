#!/usr/bin/env bash
#
# 02-deploy-vps.sh — publish to a filesystem web root, atomically.
#
#   ./02-deploy-vps.sh --web-root /var/www/bharat
#   ./02-deploy-vps.sh --web-root /var/www/bharat --with-index   # first launch
#   ./02-deploy-vps.sh --web-root /var/www/bharat --allow-unverified
#   ./02-deploy-vps.sh --web-root /var/www/bharat --rollback
#
# Use this OR 02-deploy-git.sh — never both. See README.md.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "$SCRIPT_DIR/lib/common.sh"

PIPELINE_DIR="${PIPELINE_DIR:-$PWD}"
WEB_ROOT=""
INDEX_SRC=""
WITH_INDEX=0
ROLLBACK=0
VERIFY_ARGS=()

while [ $# -gt 0 ]; do
  case "$1" in
    --web-root)         WEB_ROOT="${2:?}"; shift 2 ;;
    --dir)              PIPELINE_DIR="${2:?}"; shift 2 ;;
    --with-index)       WITH_INDEX=1; shift ;;
    --index-src)        INDEX_SRC="${2:?}"; WITH_INDEX=1; shift 2 ;;
    --rollback)         ROLLBACK=1; shift ;;
    --allow-unverified) VERIFY_ARGS+=(--allow-unverified); shift ;;
    --max-drop)         VERIFY_ARGS+=(--max-drop "${2:?}"); shift 2 ;;
    --min-count)        VERIFY_ARGS+=(--min-count "${2:?}"); shift 2 ;;
    -h|--help)          sed -n '2,11p' "$0"; exit 0 ;;
    *)                  die "unknown arg: $1" ;;
  esac
done

[ -n "$WEB_ROOT" ] || die "--web-root is required (no default — that's the point)"
[ -d "$WEB_ROOT" ] || die "web root does not exist: $WEB_ROOT"

TARGET="$WEB_ROOT/tenders.json"

# ── rollback ──────────────────────────────────────────────────────────────────
if [ "$ROLLBACK" -eq 1 ]; then
  [ -f "$TARGET.bak" ] || die "no $TARGET.bak to roll back to"
  assert_valid_json "$TARGET.bak"
  cp -p "$TARGET.bak" "$TARGET.rollback.tmp"
  mv -f "$TARGET.rollback.tmp" "$TARGET"
  ok "rolled back to the previous tenders.json"
  rb_count="$(json_get "$TARGET" meta.count)"
  rb_verified="$(json_get "$TARGET" meta.verified)"
  log "now serving count=${rb_count:-?} verified=${rb_verified:-?}"
  exit 0
fi

# ── writability, checked before we touch anything ─────────────────────────────
# The original runbook `cp`'d into /var/www without sudo, then used sudo one
# step later. Fail early and say so, rather than half-deploying.
[ -w "$WEB_ROOT" ] || die "no write permission on $WEB_ROOT
    Either run this with sudo, or chown the directory to your user:
    sudo chown -R \"\$USER\" $WEB_ROOT"

# ── the gate ──────────────────────────────────────────────────────────────────
"$SCRIPT_DIR/01-verify.sh" --dir "$PIPELINE_DIR" "${VERIFY_ARGS[@]+"${VERIFY_ARGS[@]}"}" \
  || die "verification failed — nothing was published"

cd "$PIPELINE_DIR"

# ── index.html ────────────────────────────────────────────────────────────────
if [ "$WITH_INDEX" -eq 1 ]; then
  if [ -z "$INDEX_SRC" ]; then
    for cand in "$PIPELINE_DIR/index.html" "$SCRIPT_DIR/index.html" "$PWD/index.html"; do
      [ -f "$cand" ] && { INDEX_SRC="$cand"; break; }
    done
  fi
  [ -n "$INDEX_SRC" ] && [ -f "$INDEX_SRC" ] \
    || die "--with-index given but no index.html found. Pass --index-src <path>."
  cp "$INDEX_SRC" "$WEB_ROOT/index.html.tmp"
  mv -f "$WEB_ROOT/index.html.tmp" "$WEB_ROOT/index.html"
  ok "published index.html (from $INDEX_SRC)"
fi

# ── atomic publish ────────────────────────────────────────────────────────────
# cp straight onto the live path truncates it mid-write; a visitor loading at
# that moment gets invalid JSON. Write beside it, then rename — rename is
# atomic within a filesystem, so readers see old or new, never half.
if [ -f "$TARGET" ]; then
  cp -p "$TARGET" "$TARGET.bak"
  log "previous version saved to $TARGET.bak"
fi

cp data/tenders.json "$TARGET.tmp"
assert_valid_json "$TARGET.tmp"
chmod 644 "$TARGET.tmp"
mv -f "$TARGET.tmp" "$TARGET"          # atomic
ok "published $TARGET"

# ── cache-bust ────────────────────────────────────────────────────────────────
# index.html almost certainly fetches tenders.json by a bare path, so browsers
# and any CDN in front will serve the stale copy. Emit a version stamp the page
# can append as ?v=… — and tell the user if it isn't wired up yet.
stamp="$(date -u +%Y%m%d%H%M%S)"
printf '{"version":"%s"}\n' "$stamp" > "$WEB_ROOT/version.json.tmp"
mv -f "$WEB_ROOT/version.json.tmp" "$WEB_ROOT/version.json"
log "wrote version.json ($stamp)"

if [ -f "$WEB_ROOT/index.html" ] && ! grep -q 'version.json' "$WEB_ROOT/index.html"; then
  warn "index.html doesn't read version.json — clients may serve a cached tenders.json."
  warn "Either add a cache-busting query to the fetch, or set on the server:"
  warn "  location = /tenders.json { add_header Cache-Control \"no-cache, must-revalidate\"; }"
fi

count="$(json_get "$TARGET" meta.count)"
verified="$(json_get "$TARGET" meta.verified)"
echo
ok "live: count=$count verified=$verified"
log "rollback with: $0 --web-root '$WEB_ROOT' --rollback"

# Deliberately NOT reloading nginx: it serves static files from disk per
# request, so a reload does nothing here. If your host caches upstream, purge
# the CDN instead.
