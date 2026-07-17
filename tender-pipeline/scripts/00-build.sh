#!/usr/bin/env bash
#
# 00-build.sh — unpack, install, and run the tender pipeline.
#
#   ./00-build.sh --offline              # fixtures only, no network
#   ./00-build.sh --live                 # hits CPPP/GePNIC
#   ./00-build.sh --offline --from tender-pipeline.tar.gz
#
# Replaces steps 0–2 of the original runbook.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "$SCRIPT_DIR/lib/common.sh"

TARBALL=""
MODE=""
PIPELINE_DIR="${PIPELINE_DIR:-}"

while [ $# -gt 0 ]; do
  case "$1" in
    --offline)  MODE=offline; shift ;;
    --live)     MODE=live; shift ;;
    --from)     TARBALL="${2:?--from needs a path}"; shift 2 ;;
    --dir)      PIPELINE_DIR="${2:?--dir needs a path}"; shift 2 ;;
    -h|--help)  sed -n '2,10p' "$0"; exit 0 ;;
    *)          die "unknown arg: $1" ;;
  esac
done

[ -n "$MODE" ] || die "specify --offline or --live (there is no safe default)"
need node
need npm

# ── locate the pipeline ───────────────────────────────────────────────────────
if [ -z "$PIPELINE_DIR" ]; then
  if [ -n "$TARBALL" ]; then
    [ -f "$TARBALL" ] || die "tarball not found: $TARBALL"
    need tar
    # The runbook assumed `cd tender-pipeline` — but the tarball's top-level
    # directory name is not guaranteed. Read it instead of guessing.
    top="$(tar tzf "$TARBALL" | head -1 | cut -d/ -f1)"
    [ -n "$top" ] || die "could not read top-level dir from $TARBALL"
    log "tarball top-level dir: $top"
    tar xzf "$TARBALL"
    PIPELINE_DIR="$PWD/$top"
  elif [ -f "$PWD/src/run.js" ]; then
    PIPELINE_DIR="$PWD"
  elif [ -f "$PWD/tender-pipeline/src/run.js" ]; then
    PIPELINE_DIR="$PWD/tender-pipeline"
  else
    die "can't find the pipeline. Pass --from <tarball> or --dir <path>."
  fi
fi

[ -f "$PIPELINE_DIR/src/run.js" ] || die "no src/run.js under $PIPELINE_DIR"
cd "$PIPELINE_DIR"   # safe now: we verified it exists first
ok "pipeline: $PIPELINE_DIR"

# ── secret hygiene, before anything can commit ────────────────────────────────
assert_env_ignored "$PIPELINE_DIR"

# ── install ───────────────────────────────────────────────────────────────────
# `npm ci` hard-fails without package-lock.json. Fall back rather than abort.
if [ -f package-lock.json ]; then
  log "npm ci"
  npm ci
else
  warn "no package-lock.json — falling back to 'npm install' (versions unpinned)"
  npm install
fi

# ── preserve the last known-good output before we overwrite it ────────────────
if [ -f data/tenders.json ]; then
  cp -p data/tenders.json "data/tenders.json.prev"
  log "kept previous output as data/tenders.json.prev"
fi

# ── run ───────────────────────────────────────────────────────────────────────
if [ "$MODE" = live ]; then
  load_env "$PIPELINE_DIR/.env"
  warn "LIVE run — this hits CPPP/GePNIC. Respect their robots.txt and rate limits."
  node src/run.js
else
  log "offline run (fixtures)"
  node src/run.js --offline
fi

# ── sanity ────────────────────────────────────────────────────────────────────
[ -f data/tenders.json ] || die "run completed but data/tenders.json was not written"
assert_valid_json data/tenders.json

count="$(json_get data/tenders.json meta.count)"
verified="$(json_get data/tenders.json meta.verified)"
ok "build done — count=${count:-?} verified=${verified:-?}"
echo
log "next: ./01-verify.sh --dir '$PIPELINE_DIR'"
