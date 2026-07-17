import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(fs.readFileSync(new URL('./schema/tender.schema.json', import.meta.url)));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateFn = ajv.compile(schema);

// product_category is a non-nullable optional in the schema — drop it when unknown.
export function cleanRecord(r) {
  if (r.product_category == null) delete r.product_category;
  if (r.plain_summary == null) delete r.plain_summary;
  return r;
}

export function validateSchema(record) {
  const ok = validateFn(record);
  return { ok, errors: ok ? [] : validateFn.errors.map(e => `${e.instancePath || '/'} ${e.message}`) };
}

// Gate 2 — business rules. Mutates status for read-time correctness; returns pass/fail + reasons.
export function businessRules(record, now = Date.now()) {
  const errors = [];
  const end = record.bid_submission_end ? new Date(record.bid_submission_end).getTime() : null;
  const start = record.bid_submission_start ? new Date(record.bid_submission_start).getTime() : null;
  if (record.award) record.status = 'Awarded';
  else if (start && start > now) record.status = 'Forthcoming';
  else if (record.status === 'Active' && end && end < now) record.status = 'Closed';
  if (record.status === 'Active' && !end) errors.push('active_without_close_date');
  if (!record.organisation) errors.push('missing_organisation');
  if (record.pac_inr != null && record.pac_inr < 0) errors.push('pac_negative');
  if (record.emd_inr != null && record.emd_inr < 0) errors.push('emd_negative');
  return { ok: errors.length === 0, errors };
}

// Gate 3 — corroboration / trust score (0..100).
export function trustScore(record) {
  let s = record.source_tier === 'tier_1_official' ? 70 : 40;
  if (record.pac_inr != null) s += 5;
  if (record.bid_opening_date) s += 5;
  if (record.published_date) s += 5;
  if (record.documents && record.documents.length) s += 10;
  return Math.min(100, s);
}

// Auto-publish gate with approval fallback + per-provenance threshold.
export function publishDecision(record, config, source) {
  const approvalOn = config.approvalMode || (source && source.approvalMode);
  if (approvalOn) return { publish: false, reason: 'approval_mode_on' };
  if (record.source_tier !== 'tier_1_official') return { publish: false, reason: 'not_tier_1' };
  const min = record.discovered_by === 'agent' ? config.agentMinScore : config.autoMinScore;
  if ((record.trust_score ?? 0) < min) return { publish: false, reason: `below_threshold_${min}` };
  return { publish: true, reason: 'auto_publish' };
}
