// Central configuration for the tender pipeline.
// Mirrors the decisions in tenders-agentic-refresh-design.md:
//   - auto-publish with a configurable approval fallback
//   - daily cadence (this script is meant to be run once per day by cron/n8n)
//   - per-provenance trust thresholds

export const config = {
  // Flip to true to force EVERY record through the review queue instead of auto-publishing.
  // Can also be set per-source via source.approvalMode.
  approvalMode: false,

  // Auto-publish only when source_tier === 'tier_1_official' AND trust_score >= threshold.
  autoMinScore: 70,   // deterministic adapters
  agentMinScore: 85,  // records discovered by the (future) agent adapter

  // Output locations (relative to project root). Point publishTo at your web root
  // or swap store.js for a DB writer — the rest of the pipeline is unchanged.
  paths: {
    publishTo: 'data/tenders.json',
    reviewQueue: 'data/review-queue.json',
    changelog: 'data/changelog.ndjson',
    checksums: 'data/.checksums.json'
  },

  // Source registry. Each source names an adapter and its options.
  // Live mode hits the URLs; --offline uses the fixture file instead.
  sources: [
    {
      id: 'cppp',
      adapter: 'gepnic',
      portal: 'CPPP',
      tier: 'tier_1_official',
      enabled: true,
      baseUrl: 'https://eprocure.gov.in',
      // Verified 16-Jul-2026: a no-session fetch returns the ~10-latest 'Latest Tenders'
      // widget (Title|Ref|Closing|Opening, NO organisation) — those rows are held for review.
      // The full active list + organisation/value/EMD need a logged-in session / headless browser.
      url: 'https://eprocure.gov.in/eprocure/app?page=FrontEndLatestActiveTenders&service=page',
      fixture: 'fixtures/cppp-widget.html',   // real 4-col widget structure
      enrichDetails: false,                    // detail links are session tokens — needs a live session/headless browser
      detailFixture: 'fixtures/gepnic-detail-sample.html',
      rateLimitMs: 1500,
      detailRateLimitMs: 1200
    },
    {
      id: 'ka-gepnic',
      adapter: 'gepnic',
      portal: 'GePNIC-State',
      tier: 'tier_1_official',
      enabled: true,
      // Every state runs the same GePNIC software — same adapter, different baseUrl.
      // State portals use the /nicgep/app path (e.g. assamtenders.gov.in/nicgep/app). Verify each.
      baseUrl: 'https://eproc.karnataka.gov.in',
      url: 'https://eproc.karnataka.gov.in/nicgep/app?page=FrontEndLatestActiveTenders&service=page',
      fixture: 'fixtures/gepnic-ka-list.html',
      enrichDetails: false,                    // enable per-row detail once you confirm it's polite
      rateLimitMs: 1500
    },
    {
      id: 'ogd',
      adapter: 'ogd',
      portal: 'OGD',
      tier: 'tier_1_official',
      enabled: true,
      // OPTIONAL — data.gov.in has STATIC datasets, not a live tenders feed. Use only for a
      // specific published dataset. The live tender feed is CPPP/GePNIC above, not this.
      // GET https://api.data.gov.in/resource/{resourceId}?api-key={KEY}&format=json&offset=0&limit=100
      resourceId: 'REPLACE_WITH_OGD_RESOURCE_ID',
      apiKey: process.env.DATAGOVINDIA_API_KEY || 'REPLACE_WITH_API_KEY',
      limit: 100,
      fixture: 'fixtures/ogd-sample.json'
    },
    {
      id: 'gem',
      adapter: 'gem',
      portal: 'GeM',
      tier: 'tier_1_official',
      enabled: false, // enable once the GeM adapter selectors are wired
      url: 'https://gem.gov.in',
      fixture: null
    }
  ]
};
