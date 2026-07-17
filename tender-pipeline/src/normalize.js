import crypto from 'node:crypto';

const MONTHS = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

// Parse CPPP dates like "16-Jul-2026 03:00 PM" (also tolerates "16-Jul-2026").
export function parseCpppDate(s) {
  if (!s) return null;
  const m = s.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (!m) { const d = new Date(s); return isNaN(d) ? null : d.toISOString(); }
  let [, dd, mon, yyyy, hh, mm, ap] = m;
  let h = hh ? parseInt(hh, 10) : 0;
  if (ap) { const P = ap.toUpperCase(); if (P === 'PM' && h < 12) h += 12; if (P === 'AM' && h === 12) h = 0; }
  const d = new Date(Date.UTC(+yyyy, MONTHS[mon.toLowerCase()], +dd, h, mm ? +mm : 0));
  return isNaN(d) ? null : d.toISOString();
}

function idFor(portal, ref, title) {
  return 'tnd_' + crypto.createHash('sha1').update(`${portal}|${ref}|${title}`).digest('hex').slice(0, 10);
}

const STATE_HINTS = ['Karnataka','Maharashtra','Tamil Nadu','West Bengal','Uttar Pradesh','Rajasthan','Kerala','Bihar','Gujarat','Assam','Telangana','Madhya Pradesh','Punjab','Odisha','Jharkhand','Delhi'];
function inferState(text) { return STATE_HINTS.find(s => (text || '').includes(s)) || 'All India'; }
function inferOrgType(text) { return STATE_HINTS.some(s => (text || '').includes(s)) ? 'State' : 'Central'; }
function inferCategory(title) {
  const t = (title || '').toLowerCase();
  if (/consultan|advisory|feasibility|survey|study/.test(t)) return 'Consultancy';
  if (/construction|widening|road|building|works|civil|renovation|rehab/.test(t)) return 'Works';
  if (/o&m|maintenance|operation|service|amc|housekeep/.test(t)) return 'Services';
  return 'Goods';
}

function splitTitleRef(titleRef) {
  if (!titleRef) return { title: 'Untitled tender', ref: '' };
  const brackets = [...titleRef.matchAll(/\[([^\]]+)\]/g)].map(m => m[1].trim());
  const ref = brackets.length ? brackets[brackets.length - 1] : '';
  const title = titleRef.split('[')[0].replace(/\s+/g, ' ').trim() || titleRef.trim();
  return { title, ref };
}

export function normalizeGepnic(raw, source) {
  const title = raw.title || 'Untitled tender';
  const nit_ref = raw.nit_ref || ('CPPP-' + idFor(source.portal || 'CPPP', title, '').slice(4));
  const url = raw.url || source.url;
  const orgChain = (raw.orgChain || '').trim();
  return {
    id: idFor(source.portal, nit_ref, title),
    nit_ref,
    title,
    // Widget listings omit organisation. Leave it null so the record is held for
    // review instead of being auto-published under a "verified" banner.
    organisation: orgChain || null,
    org_type: inferOrgType(orgChain),
    state: inferState(orgChain),
    source_portal: source.portal || 'CPPP',
    tender_type: raw.tenderType || 'Open',
    procurement_category: inferCategory(title),
    product_category: raw.productCategory || null,
    pac_inr: raw.pac ?? null,   // populated when enrichDetails follows the detail page
    emd_inr: raw.emd ?? null,
    published_date: parseCpppDate(raw.publishedRaw),
    bid_submission_end: parseCpppDate(raw.closingRaw),
    bid_opening_date: parseCpppDate(raw.openingRaw),
    status: 'Active',
    source_tier: source.tier,
    source_urls: [url],
    discovered_by: 'deterministic',
    last_verified: new Date().toISOString()
  };
}

// OGD datasets differ field-to-field; map by trying candidate keys in order.
const OGD_MAP = {
  title:        ['tender_title', 'title', 'work_description', 'nameofwork', 'name_of_work'],
  organisation: ['organisation', 'organisation_name', 'department', 'ministry', 'org_name'],
  nit_ref:      ['tender_id', 'tender_reference_number', 'nit_no', 'reference_no', 'tender_ref_no'],
  pac:          ['tender_value', 'estimated_cost', 'value', 'contract_value'],
  emd:          ['emd', 'emd_amount', 'earnest_money'],
  published:    ['published_date', 'tender_published_date', 'epublished_date'],
  closing:      ['bid_submission_end_date', 'closing_date', 'last_date', 'submission_end_date'],
  opening:      ['bid_opening_date', 'opening_date', 'tender_opening_date'],
  state:        ['state', 'state_name'],
  category:     ['product_category', 'category', 'tender_category']
};
const pick = (rec, keys) => { for (const k of keys) if (rec[k] != null && rec[k] !== '') return rec[k]; return null; };
const toNum = v => { if (v == null) return null; const n = Number(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; };
const toISO = v => { if (!v) return null; const d = new Date(v); return isNaN(d) ? parseCpppDate(v) : d.toISOString(); };

export function normalizeOgd(rec, source) {
  const title = pick(rec, OGD_MAP.title) || 'Untitled tender';
  const nit_ref = pick(rec, OGD_MAP.nit_ref) || ('OGD-' + idFor('OGD', JSON.stringify(rec), '').slice(4));
  const org = pick(rec, OGD_MAP.organisation) || 'Unknown organisation';
  return {
    id: idFor(source.portal, nit_ref, title),
    nit_ref: String(nit_ref),
    title: String(title),
    organisation: String(org),
    org_type: inferOrgType(org + ' ' + (pick(rec, OGD_MAP.state) || '')),
    state: pick(rec, OGD_MAP.state) || inferState(org),
    source_portal: 'OGD',
    tender_type: 'Open',
    procurement_category: inferCategory(title),
    product_category: pick(rec, OGD_MAP.category),
    pac_inr: toNum(pick(rec, OGD_MAP.pac)),
    emd_inr: toNum(pick(rec, OGD_MAP.emd)),
    published_date: toISO(pick(rec, OGD_MAP.published)),
    bid_submission_end: toISO(pick(rec, OGD_MAP.closing)),
    bid_opening_date: toISO(pick(rec, OGD_MAP.opening)),
    status: 'Active',
    source_tier: source.tier,
    source_urls: ['https://data.gov.in'],
    discovered_by: 'deterministic',
    last_verified: new Date().toISOString()
  };
}

export const normalizeCppp = normalizeGepnic; // CPPP runs on GePNIC

export function normalize(adapter, rawItems, source) {
  const fn = (adapter === 'gepnic' || adapter === 'cppp') ? normalizeGepnic
           : adapter === 'ogd' ? normalizeOgd : null;
  if (!fn) return [];
  return rawItems.map(r => fn(r, source));
}
