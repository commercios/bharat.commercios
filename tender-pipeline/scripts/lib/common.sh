#!/usr/bin/env bash
# Shared helpers for the tender-pipeline runbook scripts.
# Source this; do not execute it directly.

set -euo pipefail

# ── logging ───────────────────────────────────────────────────────────────────
_c() { [ -t 2 ] && printf '\033[%sm' "$1" >&2 || true; }
log()  { _c '0;36'; printf '· %s\n' "$*" >&2; _c '0'; }
ok()   { _c '0;32'; printf '✓ %s\n' "$*" >&2; _c '0'; }
warn() { _c '0;33'; printf '! %s\n' "$*" >&2; _c '0'; }
die()  { _c '0;31'; printf '✗ %s\n' "$*" >&2; _c '0'; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"; }

# ── safe .env loader ──────────────────────────────────────────────────────────
# The original runbook used:  set -a; . ./.env; set +a
# That *sources* the file, so a value containing $, backticks or spaces is
# mangled or executed. This parses instead — values are never evaluated.
#
# Handles:  KEY=value | KEY="value" | KEY='value' | KEY=va=lue | # comments
# Rejects:  keys that aren't [A-Za-z_][A-Za-z0-9_]*
load_env() {
  local file="${1:-.env}"
  [ -f "$file" ] || { log "no $file — continuing without it"; return 0; }

  # Refuse to read a secrets file the whole machine can see.
  local mode
  mode=$(stat -c '%a' "$file" 2>/dev/null || stat -f '%Lp' "$file" 2>/dev/null || echo '')
  case "$mode" in
    600|400) ;;
    '') warn "could not stat $file permissions" ;;
    *) die "$file is mode $mode — expected 600. Run: chmod 600 $file" ;;
  esac

  local n=0 key val
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line#"${line%%[![:space:]]*}"}"          # ltrim
    [ -z "$line" ] && continue
    case "$line" in \#*) continue ;; esac
    case "$line" in *=*) ;; *) warn "skipping malformed line: ${line:0:20}…"; continue ;; esac

    key="${line%%=*}"
    val="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"             # rtrim key
    val="${val#"${val%%[![:space:]]*}"}"             # ltrim val

    case "$key" in
      [A-Za-z_]*) ;;
      *) warn "skipping invalid key: $key"; continue ;;
    esac
    case "$key" in
      *[!A-Za-z0-9_]*) warn "skipping invalid key: $key"; continue ;;
    esac

    # strip one layer of matching quotes, then trailing whitespace if unquoted
    if [ "${val#\"}" != "$val" ] && [ "${val%\"}" != "$val" ]; then
      val="${val#\"}"; val="${val%\"}"
    elif [ "${val#\'}" != "$val" ] && [ "${val%\'}" != "$val" ]; then
      val="${val#\'}"; val="${val%\'}"
    else
      val="${val%"${val##*[![:space:]]}"}"
    fi

    export "$key=$val"
    n=$((n + 1))
  done < "$file"

  ok "loaded $n var(s) from $file"
}

# ── secret hygiene ────────────────────────────────────────────────────────────
# The original runbook wrote .env into a directory that step 5 later ran
# `git add -A` on. This is the guard that should have existed.
assert_env_ignored() {
  local dir="${1:-.}"
  [ -f "$dir/.env" ] || return 0
  git -C "$dir" rev-parse --git-dir >/dev/null 2>&1 || return 0   # not a repo, fine

  # Check TRACKED first — it's the worse state and needs different advice.
  # (Adding a tracked file to .gitignore does nothing; git keeps tracking it.)
  if git -C "$dir" ls-files --error-unmatch .env >/dev/null 2>&1; then
    die ".env is already TRACKED by git in $dir — your key is in the repo,
    and adding it to .gitignore will NOT untrack it.
    Fix:  git -C '$dir' rm --cached .env
          echo '.env' >> '$dir/.gitignore'
          git -C '$dir' commit -m 'untrack .env'
    If this was ever pushed, the key is in history on the remote.
    Rotate it at data.gov.in — treat it as compromised."
  fi
  if ! git -C "$dir" check-ignore -q .env; then
    die ".env exists in a git repo but is NOT gitignored.
    Publishing from here would push your API key.
    Fix: echo '.env' >> '$dir/.gitignore'"
  fi
  ok ".env is gitignored and untracked"
}

# Write a secrets file without the chmod-after-write race the runbook had.
write_env_secure() {
  local file="$1" content="$2"
  ( umask 077; printf '%s\n' "$content" > "$file" )
  chmod 600 "$file"
  ok "wrote $file (0600)"
}

# ── json helpers (node is already a dependency of the pipeline) ────────────────
json_get() {
  # json_get <file> <dot.path>  → prints value, empty string if absent
  node -e '
    const fs = require("fs");
    let d;
    try { d = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); }
    catch (e) { process.stderr.write("invalid JSON in " + process.argv[1] + ": " + e.message + "\n"); process.exit(2); }
    const v = process.argv[2].split(".").reduce((o, k) => (o == null ? o : o[k]), d);
    process.stdout.write(v === undefined || v === null ? "" : String(v));
  ' "$1" "$2"
}

assert_valid_json() {
  node -e '
    const fs = require("fs");
    try { JSON.parse(fs.readFileSync(process.argv[1], "utf8")); }
    catch (e) { process.stderr.write(process.argv[1] + ": " + e.message + "\n"); process.exit(2); }
  ' "$1" || die "$1 is not valid JSON"
}
