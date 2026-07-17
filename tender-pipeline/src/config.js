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

      // ⚠️ PERMITTED-BUT-PENDING. eprocure.gov.in publishes NO robots.txt
      // (checked 17-Jul-2026: HTTP 404), so nothing here is disallowed — but
      // absence of a prohibition is not a grant of permission, and NIC
      // publishes no official API. A request is with them:
      // deploy/nic-access-request.md
      //
      // Left enabled because it is harmless in practice: the anonymous widget
      // has no organisation field, so gates.js:31 holds every row for review
      // and this source publishes ZERO records. It costs one polite request per
      // run and produces nothing until either (a) NIC permits fuller access, or
      // (b) you decide to relax the organisation rule and publish thin rows.
      //
      // Do NOT "fix" the zero-rows problem with a logged-in session. Reaching
      // listings that anonymous visitors cannot see is circumventing an access
      // control, which is a different thing entirely from reading a public page.
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

      // ⛔ DISABLED — the portal forbids automated access. Do not re-enable
      // without written permission from NIC / the Karnataka e-procurement cell.
      //
      // Checked 17-Jul-2026:
      //   $ curl https://eproc.karnataka.gov.in/robots.txt
      //   User-agent: *
      //   Disallow: /
      //
      // This is not a crawl-delay hint or a partial restriction — it disallows
      // every path to every agent. mahatenders.gov.in returns the same, so this
      // appears to be the GePNIC platform's standard policy rather than one
      // state's choice. Assume every *.gov.in GePNIC portal is closed to
      // automation until its own robots.txt proves otherwise.
      //
      // The offline fixture below is retained: it is a saved copy used for
      // testing the parser, and reading it hits no network. --offline runs are
      // unaffected by this flag being false... but note run.js skips disabled
      // sources in BOTH modes, so the fixture is currently unused. That is
      // intentional — it keeps the parser code and its test data together for
      // whenever permission arrives.
      //
      // Request sent to NIC: see deploy/nic-access-request.md
      enabled: false,

      baseUrl: 'https://eproc.karnataka.gov.in',
      url: 'https://eproc.karnataka.gov.in/nicgep/app?page=FrontEndLatestActiveTenders&service=page',
      fixture: 'fixtures/gepnic-ka-list.html',
      enrichDetails: false,
      rateLimitMs: 1500
    },
    {
      id: 'ogd',
      adapter: 'ogd',
      portal: 'OGD',
      tier: 'tier_1_official',
      enabled: true,
      // The original comment here was right, and worth restating after checking:
      // data.gov.in has STATIC datasets, NOT a live tenders feed.
      //
      // Verified 17-Jul-2026 against https://www.data.gov.in/keywords/Tender.
      // Everything published under the "Tender" keyword is historical or
      // statistical, e.g.:
      //   · Assam Public Procurement Data 2016-17
      //   · Year-wise Tenders Floated ... Karnataka 2018-19 to 2020-21
      //   · Ministry-wise Status of Non-compliant Tenders (as on 31-01-2025)
      //   · NTPC solar tenders (reply to an Unstarred Question, Jan 2019)
      //
      // None of these are open tenders anyone can bid on. So OGD cannot power a
      // "live tenders" product. It remains here because it is the one route
      // that is unambiguously permitted, and it may be useful later for
      // historical/analytical pages (e.g. "who awards the most contracts").
      //
      // run.js skips this source in live mode while resourceId starts with
      // REPLACE, so it is effectively inert today.
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
