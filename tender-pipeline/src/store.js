import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = new URL('..', import.meta.url).pathname;
const abs = p => path.join(root, p);

export function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

export async function readChecksums(cfg) {
  try { return JSON.parse(await fsp.readFile(abs(cfg.paths.checksums), 'utf8')); }
  catch { return {}; }
}
export async function writeChecksums(cfg, obj) {
  await fsp.mkdir(path.dirname(abs(cfg.paths.checksums)), { recursive: true });
  await fsp.writeFile(abs(cfg.paths.checksums), JSON.stringify(obj, null, 2));
}

export async function appendChangelog(cfg, entries) {
  if (!entries.length) return;
  await fsp.mkdir(path.dirname(abs(cfg.paths.changelog)), { recursive: true });
  const lines = entries.map(e => JSON.stringify({ ts: new Date().toISOString(), ...e })).join('\n') + '\n';
  await fsp.appendFile(abs(cfg.paths.changelog), lines);
}

// Diff published set against the previous tenders.json to build changelog entries.
export async function diffPublished(cfg, next) {
  let prev = [];
  try { const raw = JSON.parse(await fsp.readFile(abs(cfg.paths.publishTo), 'utf8')); prev = Array.isArray(raw) ? raw : (raw.tenders || []); } catch {}
  const prevById = new Map(prev.map(r => [r.id, r]));
  const nextIds = new Set(next.map(r => r.id));
  const entries = [];
  for (const r of next) {
    const p = prevById.get(r.id);
    if (!p) entries.push({ event: 'added', id: r.id, nit_ref: r.nit_ref, status: r.status });
    else if (p.status !== r.status) entries.push({ event: 'status_change', id: r.id, from: p.status, to: r.status });
    else if (JSON.stringify(p) !== JSON.stringify(r)) entries.push({ event: 'updated', id: r.id, nit_ref: r.nit_ref });
  }
  for (const p of prev) if (!nextIds.has(p.id)) entries.push({ event: 'removed', id: p.id, nit_ref: p.nit_ref });
  return entries;
}

export async function publish(cfg, published, review, opts = {}) {
  const sortByClose = (a, b) =>
    (new Date(a.bid_submission_end || 8e15)) - (new Date(b.bid_submission_end || 8e15));
  published.sort(sortByClose);
  // verified is TRUE only for a real live run against official sources — an offline/fixture
  // run stamps verified:false so the site keeps the honest "Preview · sample data" pill.
  const payload = {
    meta: {
      verified: opts.verified === true,
      mode: opts.mode || 'live',
      generator: 'bharat-tender-pipeline',
      generated_at: new Date().toISOString(),
      count: published.length
    },
    tenders: published
  };
  await fsp.mkdir(path.dirname(abs(cfg.paths.publishTo)), { recursive: true });
  await fsp.writeFile(abs(cfg.paths.publishTo), JSON.stringify(payload, null, 2));
  await fsp.writeFile(abs(cfg.paths.reviewQueue), JSON.stringify(review, null, 2));
}
