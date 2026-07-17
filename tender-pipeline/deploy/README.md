# Deploy / schedule options

Pick ONE scheduler. All of them now run **`scripts/refresh.sh`** (or the gated
workflow), not `node src/run.js` directly — the gate is the point.

- **github-actions-refresh.yml** — repo/Pages hosting. **This is the realistic
  option:** GitHub runners can reach the gov endpoints; a local sandbox cannot.
  Add `DATAGOVINDIA_API_KEY` as a repo secret, and set Settings → Actions →
  General → Workflow permissions → Read and write.
- **crontab.txt** — simplest on a VPS you own.
- **tender-pipeline.service + .timer** — systemd. Key goes in
  `/etc/tender-pipeline.env` (chmod 600), then
  `systemctl enable --now tender-pipeline.timer`.

Before enabling automated scraping, confirm CPPP/GePNIC `robots.txt` and terms.
The API key is never committed — it lives in an env file or repo secret.

## Why nothing calls `node src/run.js` directly any more

`src/run.js:35-37` catches per-source adapter errors and continues. If every
source fails, the run still **exits 0** and writes `verified: true, count: 0`.
The previous version of these files published that unconditionally.

Not hypothetical — reproducible. A live run with the gov hosts unreachable:

```
  ✗ cppp: fetch failed
  ✗ ka-gepnic: fetch failed
  published: 0   →  data/tenders.json  {verified: true, count: 0}
```

Because the site's pill keys off `meta.verified`, that would have rendered
**"Live · verified feed" above an empty tender list.** `scripts/01-verify.sh`
refuses it, and `refresh.sh` exits non-zero so cron mails you and systemd marks
the unit failed.

## `meta.verified` is not a quality signal

`run.js:59` sets it as `{ verified: !OFFLINE }` — it means "this run hit the
network", nothing more. **`--min-count` and `--max-drop` are the real guards.**

## Tune `--min-count` before you trust any of this

The default of 1 is a placeholder. As of 16-Jul-2026, `config.js` implies:

| source | live behaviour |
|---|---|
| `cppp` | publishes **0** — the no-session widget carries no organisation, and `gates.js:31` holds every such row for review |
| `ka-gepnic` | the only source expected to carry the feed |
| `ogd` | skipped while `resourceId` is `REPLACE_WITH_...` |
| `gem` | `enabled: false` |

The live feed rests entirely on `ka-gepnic`. Once a successful live run shows the
real floor, raise `--min-count` (crontab / .service) and `MIN_COUNT` (workflow
env) to something meaningful.

## The drop-guard baseline comes from the live feed, deliberately

Not from `data/tenders.json`. `run.js` overwrites that file even on total
failure, so one bad run poisons it to 0 — which silently disarms the drop guard
for every run afterwards. Both the workflow and `refresh.sh` seed the baseline
from the currently-published feed instead, so the comparison is always "new
scrape vs what the public currently sees".

`refresh.sh` also restores `data/tenders.json` if the gate refuses, so the next
run's `diffPublished()` doesn't mistake the empty file for the previous state.

## Known issues, not fixed here

- A failed scrape still appends `{"event":"removed"}` to `data/changelog.ndjson`
  for every previously-published tender — `run.js` calls `appendChangelog()`
  before any gate can intervene. Nothing gets published, but the changelog
  records a mass deletion that never happened. Fixing it means moving that call
  behind a success check in `run.js`.
- `data/changelog.ndjson` appends forever, with no rotation.

## Rollback

```bash
scripts/02-deploy-vps.sh --web-root /var/www/bharat --rollback   # VPS
git revert HEAD && git push                                      # Pages
```
