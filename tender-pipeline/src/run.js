#!/usr/bin/env node
import { config } from './config.js';
import { normalize } from './normalize.js';
import { cleanRecord, validateSchema, businessRules, trustScore, publishDecision } from './gates.js';
import { dedupe } from './dedupe.js';
import { sha256, readChecksums, writeChecksums, appendChangelog, diffPublished, publish } from './store.js';

const OFFLINE = process.argv.includes('--offline');
const log = (...a) => console.log(...a);

async function loadAdapter(name) {
  return import(`./adapters/${name}.js`);
}

async function main() {
  log(`\n▶ tender pipeline — ${OFFLINE ? 'OFFLINE (fixtures)' : 'LIVE'} — ${new Date().toISOString()}`);
  const prevSums = await readChecksums(config);
  const nextSums = { ...prevSums };

  const normalized = [];
  for (const source of config.sources) {
    if (!source.enabled) { log(`  · ${source.id}: disabled, skipped`); continue; }
    if (!OFFLINE && source.fixture && source.adapter === 'ogd' && source.resourceId?.startsWith('REPLACE')) {
      log(`  · ${source.id}: not configured for live, skipped`); continue;
    }
    try {
      const adapter = await loadAdapter(source.adapter);
      const raw = await adapter.fetchRaw(source, { offline: OFFLINE });
      const sum = sha256(JSON.stringify(raw));
      const changed = prevSums[source.id] !== sum;
      nextSums[source.id] = sum;
      log(`  · ${source.id}: ${raw.length} rows ${changed ? '(changed)' : '(no change — reprocessing anyway)'}`);
      const recs = normalize(source.adapter, raw, source).map(cleanRecord);
      normalized.push(...recs);
    } catch (e) {
      log(`  ✗ ${source.id}: ${e.message}`);
    }
  }

  // Gates
  const toPublish = [];
  const review = [];
  for (const r of normalized) {
    const br = businessRules(r);
    if (!br.ok) { review.push({ record: r, stage: 'business_rules', errors: br.errors }); continue; }
    r.trust_score = trustScore(r);
    const sv = validateSchema(r);
    if (!sv.ok) { review.push({ record: r, stage: 'schema', errors: sv.errors }); continue; }
    const src = config.sources.find(s => s.portal === r.source_portal) || {};
    const pd = publishDecision(r, config, src);
    if (pd.publish) toPublish.push(r);
    else review.push({ record: r, stage: 'publish_gate', reason: pd.reason });
  }

  const { records: deduped, dropped } = dedupe(toPublish);

  // Changelog vs previous publish, then write everything
  const changes = await diffPublished(config, deduped);
  await publish(config, deduped, review, { verified: !OFFLINE, mode: OFFLINE ? 'offline-fixtures' : 'live' });
  await appendChangelog(config, changes);
  await writeChecksums(config, nextSums);

  log(`\n  published: ${deduped.length}  (deduped -${dropped})   review-queue: ${review.length}   changelog: +${changes.length}`);
  log(`  → ${config.paths.publishTo}`);
  log(`  → ${config.paths.reviewQueue}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
