// CPPP adapter — eprocure.gov.in has no official API, so we parse the
// "Latest Active Tenders" HTML table politely. Verify the selectors below
// against the live page; CPPP's table markup is stable but not contractual.
import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';

async function getHtml(source, offline) {
  if (offline) return fs.readFile(source.fixture, 'utf8');
  await new Promise(r => setTimeout(r, source.rateLimitMs || 1200)); // be polite
  const res = await fetch(source.url, {
    headers: { 'User-Agent': 'bharat.commercios tender indexer (contact: admin@bharat.commercios.com)' }
  });
  if (!res.ok) throw new Error(`CPPP fetch failed: ${res.status}`);
  return res.text();
}

// The CPPP results table has rows with these columns (order as published):
//   S.No | e-Published Date | Bid Submission Closing Date | Tender Opening Date | Title and Ref.No./Tender ID | Organisation Chain
export async function fetchRaw(source, { offline }) {
  const html = await getHtml(source, offline);
  const $ = cheerio.load(html);

  // Prefer the known results table; fall back to any table with a header row containing "Closing".
  let $rows = $('table#table tr, table.list_table tr');
  if ($rows.length === 0) {
    $('table').each((_, t) => {
      const head = $(t).text().toLowerCase();
      if (head.includes('closing') && head.includes('organisation')) $rows = $(t).find('tr');
    });
  }

  const out = [];
  $rows.each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 6) return; // skip header / layout rows
    const cell = i => $(cells[i]).text().replace(/\s+/g, ' ').trim();
    const titleRefHtml = $(cells[4]);
    // Title and Ref.No./Tender ID cell usually holds "<title> [<ref/id>]" and a link.
    const titleRef = cell(4);
    const href = titleRefHtml.find('a').attr('href') || '';
    out.push({
      publishedRaw: cell(1),
      closingRaw: cell(2),
      openingRaw: cell(3),
      titleRef,
      orgChain: cell(5),
      href
    });
  });
  return out;
}
