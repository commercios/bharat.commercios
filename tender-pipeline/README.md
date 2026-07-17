# Bharat Tender Pipeline

Ingests government tenders from official sources, validates every record against
`tender.schema.json`, applies the trust gates from `tenders-agentic-refresh-design.md`,
and writes a `tenders.json` that **bharat.commercios.com** reads directly.

Flow: **fetch → change-detect → normalise → gate (schema · business rules · trust) →
auto-publish or review → dedupe → write `tenders.json` + changelog.**

## Install
```bash
npm install
```
Requires Node 18+ (uses global `fetch`). Node 22 recommended.

## Try it now (no network, no keys)
```bash
node src/run.js --offline      # runs against fixtures/
```
Produces `data/tenders.json`, `data/review-queue.json`, `data/changelog.ndjson`.

## Go live
Edit `src/config.js`:

- **OGD (data.gov.in)** — set `resourceId` to a real tenders dataset resource ID and
  export `DATAGOVINDIA_API_KEY` (get a free key at data.gov.in). The adapter calls
  `https://api.data.gov.in/resource/{resourceId}?api-key={KEY}&format=json&limit=100`.
  Adjust the field map at the top of `normalize.js` (`OGD_MAP`) to the dataset's columns.
- **CPPP (eprocure.gov.in)** — no official API, so `adapters/cppp.js` parses the
  *Latest Active Tenders* table with cheerio. **Verify the selectors against the live
  page** (`table#table tr` / column order) — CPPP's markup is stable but not contractual.
  The list page omits tender value/EMD; fetch the detail page per row if you need `pac_inr`.
- **Approval mode** — `config.approvalMode = true` forces every record to the review
  queue instead of auto-publishing (also settable per source). Auto-publish otherwise
  requires `tier_1_official` + `trust_score ≥ autoMinScore` (agent finds use `agentMinScore`).

Then:
```bash
node src/run.js                # live
```

## Publish target
By default the pipeline writes `data/tenders.json`. Point `config.paths.publishTo` at your
web root (or the repo path you deploy), and the site loads it as-is. To use a database
instead, replace the `publish()` function in `src/store.js` — nothing else changes.

## Schedule (daily)
Cron:
```
0 6 * * *  cd /path/to/tender-pipeline && /usr/bin/node src/run.js >> data/run.log 2>&1
```
Or from n8n: a **Schedule Trigger → Execute Command** node running `node src/run.js`, which
mirrors the `n8n-tender-cppp-skeleton.json` graph (poller → gates → publish/review).

## Add sources
Each adapter exports `async fetchRaw(source, {offline}) -> rawItems[]` and gets a
normaliser in `normalize.js`. To cover GeM and the state GePNIC portals, copy
`adapters/cppp.js`, adjust selectors, and add an entry to `config.sources`. The future
Discovery Agent is just another adapter that emits `discovered_by: 'agent'` records — the
gates then hold them to the stricter `agentMinScore`.

## Outputs
- `data/tenders.json` — published, schema-valid records (what the site reads).
- `data/review-queue.json` — records held by a gate (schema, business rule, below threshold, or approval mode), with reasons. The editor works this queue.
- `data/changelog.ndjson` — append-only added/updated/status_change/removed events.
- `data/.checksums.json` — per-source content hashes for change detection.

## Honest limitations
- Runs on **your** infrastructure and needs **your** API key — it can't reach gov endpoints or your repo from a sandbox.
- CPPP selectors and the OGD field map **must be verified** against the live sources; the fixtures show the expected shapes.
- `pac_inr`/`emd_inr` are null from the CPPP list page until you add per-row detail fetching.
