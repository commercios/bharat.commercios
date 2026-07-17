// OGD adapter — data.gov.in Open Government Data API.
// GET https://api.data.gov.in/resource/{resourceId}?api-key={KEY}&format=json&offset=0&limit=N
// Response shape: { records: [ {..dataset fields..} ], total, count, ... }
import fs from 'node:fs/promises';

export async function fetchRaw(source, { offline }) {
  if (offline) {
    const json = JSON.parse(await fs.readFile(source.fixture, 'utf8'));
    return json.records || json;
  }
  if (!source.resourceId || source.resourceId.startsWith('REPLACE')) {
    throw new Error('OGD resourceId not configured');
  }
  const base = `https://api.data.gov.in/resource/${source.resourceId}`;
  const params = new URLSearchParams({
    'api-key': source.apiKey,
    format: 'json',
    offset: '0',
    limit: String(source.limit || 100)
  });
  const res = await fetch(`${base}?${params}`);
  if (!res.ok) throw new Error(`OGD fetch failed: ${res.status}`);
  const json = await res.json();
  return json.records || [];
}
