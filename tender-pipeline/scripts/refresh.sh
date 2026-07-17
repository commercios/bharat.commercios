#!/usr/bin/env bash
#
# refresh.sh — cron/systemd entrypoint. Run → verify → publish, or fail loudly.
#
#   ./scripts/refresh.sh --web-root /var/www/bharat
#   ./scripts/refresh.sh --web-root /var/www/bharat --min-count 5
#
# Reads ./.env for DATAGOVINDIA_API_KEY (must be chmod 600).
# Exits non-zero if anything is wrong — cron will mail you; systemd marks the
# unit failed. Either way the live feed is left untouched.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=lib/common.sh
. "$SCRIPT_DIR/lib/common.sh"

WEB_ROOT=""
MIN_COUNT=1
MAX_DROP=30

while [ $# -gt 0 ]; do
  case "$1" in
    --web-root)  WEB_ROOT="${2:?}"; shift 2 ;;
    --min-count) MIN_COUNT="${2:?}"; shift 2 ;;
    --max-drop)  MAX_DROP="${2:?}"; shift 2 ;;
    -h|--help)   sed -n '2,11p' "$0"; exit 0 ;;
    *)           die "unknown arg: $1" ;;
  esac
done

[ -n "$WEB_ROOT" ] || die "--web-root is required"
cd "$ROOT"

TMP_LAST="$(mktemp)"
# If the gate refuses, put data/tenders.json back the way it was. run.js has
# already overwritten it with the bad result, and next run's diffPublished()
# would otherwise treat the empty file as the previous state and log a second
# spurious round of "removed" events.
restore_on_fail() {
  local rc=$?
  if [ "$rc" -ne 0 ] && [ -s "$TMP_LAST" ]; then
    cp -p "$TMP_LAST" data/tenders.json
    warn "gate refused — restored data/tenders.json to its pre-run state"
  fi
  rm -f "$TMP_LAST"
  exit "$rc"
}
trap restore_on_fail EXIT

log "=== tender refresh $(date -u +%FT%TZ) ==="

# ── drop-guard baseline ───────────────────────────────────────────────────────
# Seed from the feed that is actually LIVE, not from data/tenders.json.
#
# run.js overwrites data/tenders.json even when every adapter fails — it catches
# per-source errors, continues, and writes count:0. So data/tenders.json is not
# a trustworthy baseline: one failed run poisons it to 0, which silently
# disarms the drop guard for every run afterwards. The live feed is the only
# thing that reliably reflects the last known-good state.
if [ -f "$WEB_ROOT/tenders.json" ]; then
  cp -p "$WEB_ROOT/tenders.json" data/tenders.json.prev
  log "baseline: live feed ($(json_get "$WEB_ROOT/tenders.json" meta.count) tenders)"
elif [ -f data/tenders.json ]; then
  cp -p data/tenders.json data/tenders.json.prev
  warn "no live feed at $WEB_ROOT/tenders.json — falling back to data/tenders.json as baseline"
else
  log "no baseline available — first run, drop guard cannot fire"
fi

# Keep the pre-run output so we can restore it if the gate refuses.
[ -f data/tenders.json ] && cp -p data/tenders.json "$TMP_LAST" || true

# Parsed, not sourced — a key containing $, backticks or spaces is safe here.
load_env "$ROOT/.env"

node src/run.js

# 02-deploy-vps.sh runs 01-verify.sh itself and refuses to publish if it fails,
# so the gate runs exactly once here.
"$SCRIPT_DIR/02-deploy-vps.sh" \
  --dir "$ROOT" --web-root "$WEB_ROOT" \
  --min-count "$MIN_COUNT" --max-drop "$MAX_DROP"

ok "refresh complete"
