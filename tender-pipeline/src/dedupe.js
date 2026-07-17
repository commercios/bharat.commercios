// Dedupe by nit_ref. When the same NIT appears more than once (e.g. an original
// plus a corrigendum, or the same tender on two portals), keep the freshest by
// published_date, then last_verified. A corrigendum supersedes the original.
export function dedupe(records) {
  const byRef = new Map();
  let dropped = 0;
  const freshness = r => new Date(r.published_date || 0).getTime() || new Date(r.last_verified || 0).getTime();
  for (const r of records) {
    const key = (r.nit_ref || r.id).trim();
    const prev = byRef.get(key);
    if (!prev) { byRef.set(key, r); continue; }
    dropped++;
    if (freshness(r) >= freshness(prev)) byRef.set(key, r);
  }
  return { records: [...byRef.values()], dropped };
}
