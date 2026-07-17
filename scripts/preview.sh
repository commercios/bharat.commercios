#!/usr/bin/env bash
#
# preview.sh — see the site exactly as it will look live, before you push.
#
#   ./scripts/preview.sh          # serves on http://localhost:8000
#   ./scripts/preview.sh 9000     # or pick a port
#
# Why this exists: your pages use absolute paths (/assets/site.css, /rti/).
# Opening the HTML file directly resolves those against your Mac's root, so you
# see an unstyled, broken page and learn nothing. A local server resolves them
# the same way GitHub Pages does — so what you see here is what visitors get.
#
# Ctrl-C to stop.

set -euo pipefail
PORT="${1:-8000}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../docs" && pwd)"

command -v python3 >/dev/null || { echo "python3 not found"; exit 1; }

cd "$ROOT"
echo
echo "  Serving $ROOT"
echo
echo "    http://localhost:$PORT/                 Schemes"
echo "    http://localhost:$PORT/tenders/         Tenders"
echo "    http://localhost:$PORT/property/        Property"
echo "    http://localhost:$PORT/auctions/        Auctions"
echo "    http://localhost:$PORT/unclaimed/       Unclaimed money"
echo "    http://localhost:$PORT/bihar-survey/    Bihar land survey"
echo "    http://localhost:$PORT/rti/             RTI"
echo
echo "  Ctrl-C to stop."
echo

(sleep 1 && open "http://localhost:$PORT/") >/dev/null 2>&1 &
exec python3 -m http.server "$PORT"
