// GePNIC adapter — the NIC e-procurement platform behind CPPP (eprocure.gov.in)
// AND every state portal (assamtenders.gov.in/nicgep/app, etc.). Verified against
// the live CPPP page on 16-Jul-2026:
//   * The "Latest Tenders" widget is server-rendered: Title | Reference No | Closing | Bid Opening.
//   * The full active list + Organisation/Value/EMD sit behind a JS/session page.
//   * Detail links are session tokens (ephemeral) — enrichment needs a live session/headless browser.
// The parser is HEADER-DRIVEN: it maps columns by their header text, so it works on
// both the 4-column widget and the 6-column full listing without hardcoded indices.
import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';

const UA = 'bharat.commercios tender indexer (contact: admin@bharat.commercios.com)';

async function getHtml(url, { offline, fixture, rateLimitMs }) {
  if (offline) return fs.readFile(fixture, 'utf8');
  if (rateLimitMs) await new Promise(r => setTimeout(r, rateLimitMs));
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`fetch ${res.status} ${url}`);
  return res.text();
}
function abs(baseUrl, href) {
  if (!href) return baseUrl;
  if (href.startsWith('http')) return href;
  return baseUrl.replace(/\/$/, '') + (href.startsWith('/') ? '' : '/') + href;
}

function parseListing($, source) {
  // Pick the table whose header row mentions a reference column and a closing date.
  let table = null;
  $('table').each((_, t) => {
    const h = $(t).find('tr').first().text().toLowerCase();
    if (!table && h.includes('reference') && h.includes('closing')) table = t;
  });
  if (!table) table = $('table#table')[0] || $('table.list_table')[0];
  if (!table) return [];

  const $trs = $(table).find('tr');
  const header = $($trs[0]).find('th, td').map((i, el) =>
    $(el).text().replace(/\s+/g, ' ').trim().toLowerCase()).get();
  const col = (...ps) => header.findIndex(h => ps.some(p => h.includes(p)));
  const iTitle = col('title'), iClose = col('closing'), iOpen = col('opening'),
        iPub = col('e-publish', 'published'), iOrg = col('organisation', 'organization');
  let iRef = col('reference', 'ref.no', 'ref no', 'tender id');
  if (iRef === iTitle) iRef = -1;   // combined "Title and Ref.No./Tender ID" cell → extract ref from brackets

  const items = [];
  $trs.slice(1).each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 2) return;
    const cell = i => (i >= 0 && tds[i]) ? $(tds[i]).text().replace(/\s+/g, ' ').trim() : '';
    let titleCell = cell(iTitle);
    let title = titleCell.replace(/^\d+\.\s*/, '').trim();           // strip "1. "
    let ref = cell(iRef);
    // If there's no dedicated ref column, some listings embed "[ref] [id]" in the title.
    if (!ref) {
      const b = [...titleCell.matchAll(/\[([^\]]+)\]/g)].map(m => m[1].trim());
      if (b.length) { ref = b[b.length - 1]; title = titleCell.split('[')[0].replace(/^\d+\.\s*/, '').trim(); }
    }
    if (!title && !ref) return;
    const href = (iTitle >= 0 && tds[iTitle]) ? ($(tds[iTitle]).find('a').attr('href') || '') : '';
    items.push({
      title: title || 'Untitled tender',
      nit_ref: ref || '',
      orgChain: cell(iOrg),          // '' on the widget → held for review downstream
      publishedRaw: cell(iPub),
      closingRaw: cell(iClose),
      openingRaw: cell(iOpen),
      url: abs(source.baseUrl, href)
    });
  });
  return items;
}

// Detail-page label map (used only when a real session makes detail pages reachable).
function labelMap($) {
  const map = {};
  $('td, th').each((_, el) => {
    const label = $(el).text().replace(/\s+/g, ' ').trim().toLowerCase();
    if (!label) return;
    const nxt = $(el).next('td, th');
    if (nxt.length) map[label] = $(nxt).text().replace(/\s+/g, ' ').trim();
  });
  return map;
}
const findVal = (m, needles) => { for (const k in m) if (needles.some(n => k.includes(n))) return m[k]; return null; };
const toNum = v => { if (v == null) return null; const n = Number(String(v).replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; };
function mapTenderType(v) {
  const t = (v || '').toLowerCase();
  if (t.includes('limited')) return 'Limited';
  if (t.includes('eoi') || t.includes('expression')) return 'EOI';
  if (t.includes('auction')) return 'Auction';
  if (t.includes('single')) return 'Single';
  if (t.includes('global')) return 'Global';
  if (t.includes('open')) return 'Open';
  return null;
}
export function parseDetail(html) {
  const $ = cheerio.load(html);
  const m = labelMap($);
  return {
    pac: toNum(findVal(m, ['tender value', 'estimated cost', 'contract value'])),
    emd: toNum(findVal(m, ['emd amount', 'emd (', 'earnest money'])),
    tenderType: mapTenderType(findVal(m, ['tender type', 'form of contract'])),
    productCategory: findVal(m, ['product category', 'tender category']) || null,
    orgChain: findVal(m, ['organisation chain', 'organization chain']) || null
  };
}

export async function fetchRaw(source, { offline }) {
  const html = await getHtml(source.url, { offline, fixture: source.fixture, rateLimitMs: source.rateLimitMs });
  const $ = cheerio.load(html);
  const items = parseListing($, source);

  // enrichDetails only works with a live session (detail URLs are session tokens).
  if (source.enrichDetails) {
    for (const it of items) {
      try {
        const dhtml = await getHtml(it.url, { offline, fixture: source.detailFixture, rateLimitMs: source.detailRateLimitMs || 1200 });
        const d = parseDetail(dhtml);
        it.pac = d.pac; it.emd = d.emd;
        if (d.tenderType) it.tenderType = d.tenderType;
        if (d.productCategory) it.productCategory = d.productCategory;
        if (d.orgChain) it.orgChain = d.orgChain;
      } catch (e) { it.enrichError = e.message; }
    }
  }
  return items;
}
