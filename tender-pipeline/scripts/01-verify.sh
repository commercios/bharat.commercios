#!/usr/bin/env bash
#
# 01-verify.sh — the gate. Exits non-zero if the data is not fit to publish.
#
#   ./01-verify.sh                       # strict: verified must be true
#   ./01-verify.sh --allow-unverified    # deliberate Preview deploy
#   ./01-verify.sh --max-drop 50         # tolerate a 50% fall in count
#
# The original runbook *printed* meta.verified and then copied the file
# regardless. This refuses.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "$SCRIPT_DIR/lib/common.sh"

PIPELINE_DIR="${PIPELINE_DIR:-$PWD}"
ALLOW_UNVERIFIED=0
MAX_DROP_PCT=30
MIN_COUNT=1

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)              PIPELINE_DIR="${2:?}"; shift 2 ;;
    --allow-unverified) ALLOW_UNVERIFIED=1; shift ;;
    --max-drop)         MAX_DROP_PCT="${2:?}"; shift 2 ;;
    --min-count)        MIN_COUNT="${2:?}"; shift 2 ;;
    -h|--help)          sed -n '2,10p' "$0"; exit 0 ;;
    *)                  die "unknown arg: $1" ;;
  esac
done

need node
cd "$PIPELINE_DIR"
[ -f data/tenders.json ] || die "no data/tenders.json — run ./00-build.sh first"

# ── structural checks ─────────────────────────────────────────────────────────
assert_valid_json data/tenders.json
ok "tenders.json parses"

count="$(json_get data/tenders.json meta.count)"
verified="$(json_get data/tenders.json meta.verified)"
# The pipeline writes snake_case (meta.generated_at); accept camelCase too.
generated="$(json_get data/tenders.json meta.generated_at)"
[ -n "$generated" ] || generated="$(json_get data/tenders.json meta.generatedAt)"
mode="$(json_get data/tenders.json meta.mode)"

[ -n "$count" ] || die "meta.count is missing — refusing to publish a malformed file"

# meta.count must agree with reality, or the site lies about itself.
actual="$(node -e '
  const d = require("./data/tenders.json");
  const arr = d.tenders || d.items || d.data;
  process.stdout.write(Array.isArray(arr) ? String(arr.length) : "");
')"
if [ -n "$actual" ] && [ "$actual" != "$count" ]; then
  die "meta.count=$count but the tender array holds $actual — pipeline bug, not publishing"
fi
ok "meta.count agrees with the array ($count)"

if [ "$count" -lt "$MIN_COUNT" ]; then
  die "count=$count is below --min-count=$MIN_COUNT — almost certainly a failed scrape"
fi

# ── drop guard ────────────────────────────────────────────────────────────────
# A live run that gets blocked or rate-limited often "succeeds" with near-zero
# rows. Without this, that garbage silently replaces good data.
if [ -f data/tenders.json.prev ] && node -e 'JSON.parse(require("fs").readFileSync("data/tenders.json.prev"))' 2>/dev/null; then
  prev="$(json_get data/tenders.json.prev meta.count || echo '')"
  if [ -n "$prev" ] && [ "$prev" -gt 0 ] 2>/dev/null; then
    drop=$(( (prev - count) * 100 / prev ))
    if [ "$drop" -gt "$MAX_DROP_PCT" ]; then
      die "count fell ${drop}% ($prev → $count), over the ${MAX_DROP_PCT}% threshold.
    If this drop is real, re-run with --max-drop $((drop + 1))."
    fi
    [ "$drop" -gt 0 ] && log "count moved $prev → $count (${drop}% drop, within threshold)" \
                      || log "count moved $prev → $count"
  fi
fi

# ── review queue ──────────────────────────────────────────────────────────────
if [ -f data/review-queue.json ]; then
  assert_valid_json data/review-queue.json
  node -e '
    const q = require("./data/review-queue.json");
    const rows = Array.isArray(q) ? q : (q.items || []);
    console.log("held for review: " + rows.length);
    const byStage = {};
    for (const r of rows) byStage[r.stage || "?"] = (byStage[r.stage || "?"] || 0) + 1;
    for (const [s, n] of Object.entries(byStage)) console.log("  " + s + ": " + n);
    for (const r of rows.slice(0, 5))
      console.log("  - " + (r.stage || "?") + " " + JSON.stringify(r.errors || r.reason || {}));
    if (rows.length > 5) console.log("  … " + (rows.length - 5) + " more");
  '
else
  warn "no data/review-queue.json"
fi

[ -n "$generated" ] && log "generated: $generated"
[ -n "$mode" ] && log "mode: $mode"

# ── the gate ──────────────────────────────────────────────────────────────────
if [ "$verified" = "true" ]; then
  # Be honest about what this flag means. src/run.js sets it as:
  #     publish(..., { verified: !OFFLINE })
  # So it records "this run hit the network" — NOT "this data is correct".
  # run.js also catches per-source adapter errors and continues, so an all-
  # sources-failed run still exits 0 with verified:true and count:0.
  # The real protection is --min-count and --max-drop above, not this flag.
  ok "VERIFIED — live run, cleared to publish ($count tenders)"
  [ "$mode" = "live" ] || warn "meta.mode='$mode' but verified=true — expected mode=live. Check run.js."
  exit 0
fi

if [ "$ALLOW_UNVERIFIED" -eq 1 ]; then
  warn "verified=$verified — publishing anyway (--allow-unverified)."
  warn "The site will render the Preview banner. Do not treat this as live data."
  exit 0
fi

die "verified=$verified — NOT publishing.
    Offline/fixture runs are never verified; that is by design.
    For a deliberate preview deploy: ./01-verify.sh --allow-unverified"
