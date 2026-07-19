# Government APIs you can actually integrate

**18 July 2026 — every claim below was tested with curl, not taken from docs.**

## The one question that filters everything

Your site is **static HTML on GitHub Pages. There is no backend.** That single
fact decides which government API is usable and which is a fantasy:

- An API that needs a **secret key or a per-user login** cannot run from a static
  page — the moment the code reaches the browser, so does the secret.
- An API that is **open and CORS-enabled** can be called straight from the
  visitor's browser, with no server at all.

So the real question isn't "what APIs exist" (thousands do). It's **"what can a
site with no backend lawfully call and display?"** I tested for exactly that.

---

## ✅ USABLE TODAY — data.gov.in Open Government Data API

**This is the first thing in this entire project that is official, live,
permitted, AND works from a static site.** Everything before it was blocked.

Tested 18 July 2026:

```
GET https://api.data.gov.in/resource/{id}?api-key={key}&format=json&limit=N

HTTP 200
Access-Control-Allow-Origin: *          ← CORS OPEN. Browser can call it directly.
X-Ratelimit-Limit: -1                   ← unmetered on the key tested
```

**Flagship live dataset — daily mandi (market) commodity prices:**

```
Title:   Current Daily Price of Various Commodities from Various Markets (Mandi)
Source:  Ministry of Agriculture & Farmers Welfare
Records: 16,936 today, updated 2026-07-18 23:00 (i.e. refreshed hourly)
Sample:  Bhindi (Ladies Finger) · Tiruchengode APMC, Namakkal, Tamil Nadu
         modal price ₹3,750 · arrival 18/07/2026
Fields:  state, district, market, commodity, variety,
         min_price, max_price, modal_price, arrival_date
```

That is **live, official, per-district, per-commodity price data** — refreshed
daily, callable from a browser, free. It is genuinely useful to exactly the
audience the rest of the site serves: farmers, small traders, rural households.

**The catalog is enormous:** 285,829 datasets. But be honest about the split —
the large majority are *static statistics* (crime counts, court numbers, Rajya
Sabha attendance, district dealer lists). Those are report fodder, not live
features. The valuable subset is the handful that refresh: **mandi prices** is
the standout; air quality (AQI) and fuel-price datasets are in the same family.

### How you'd actually use it

A small piece of JavaScript on a new `/prices/` page, run in the visitor's
browser:

```js
const KEY = 'your-free-data.gov.in-key';
const ID  = '9ef84268-d588-465a-a308-a864a43d0070';   // mandi prices
const url = `https://api.data.gov.in/resource/${ID}`
          + `?api-key=${KEY}&format=json&limit=50`
          + `&filters[state]=Bihar&filters[commodity]=Wheat`;
const { records } = await (await fetch(url)).json();
// render records into a table — no server involved
```

Filtering by `state`, `district`, `commodity` is supported server-side, so a
Bihar farmer sees Bihar prices without downloading the whole set.

### The one honest caveat — the API key

- The key I tested is data.gov.in's **shared public sample key**. Don't ship on
  it; **register your own free key** at data.gov.in (email + purpose, minutes).
- A key in client-side JS **is visible** to anyone who views source. For
  data.gov.in this is low-risk: the key only reads public data and, being free
  and effectively unmetered, there's little to abuse. It is not a secret in the
  password sense.
- **But if the key ever becomes rate-limited or metered, client-side exposure
  becomes a real problem** — a stranger could burn your quota. The clean answer
  then is a tiny proxy (a Cloudflare Worker, free tier) that holds the key
  server-side and forwards the call. Not needed to start; needed if you scale.

**Verdict: build a `/prices/` page. It's the first feature that can show live
government data rather than link out to it. Start client-side with your own key;
add a Worker proxy only if usage demands it.**

---

## ✅ USABLE — RBI and other open reference data

Some institutions publish open, keyless data suitable for a static site:

- **RBI** publishes reference rates and reports; parts are open JSON/CSV. Worth a
  targeted check per dataset — CORS varies by endpoint, so test before building.
- **IMD / open weather**, **AQI (CPCB)** via data.gov.in — live environmental
  data, same integration pattern as mandi prices.

**Verdict: opportunistic. Test CORS per endpoint; only build where `Access-
Control-Allow-Origin` is present.**

---

## ⛔ NOT USABLE from a static site — the consent/KYC family

These are real, official, and powerful — and **every one needs a backend.** They
authenticate a specific citizen and return that citizen's private data, so they
require a server, a registered secret, and (for most) MeitY/NeSL approval.

| API | What it does | Why it can't run on Pages |
|---|---|---|
| **DigiLocker** (API Setu) | Pull a citizen's own DL, RC, certificates | OAuth + per-org secret + MeitY approval |
| **eKYC / Aadhaar** | Identity verification | Licensed, secret-based, criminal liability for misuse |
| **Setu / Signzy / Karza-style** | PAN, GST, bank verification | Commercial keys, server-only |
| **API Setu "Services" (109 of them)** | Verified pulls | Requester onboarding + secret |

**API Setu is 2,791 "Docs" vs 109 "Services".** The Docs are overwhelmingly
DigiLocker document-pull specs — consent-based, backend-required. Almost none of
API Setu is callable from a static page. That's not a flaw; it's what identity
data *should* require.

**Verdict: these need the backend + `arpit@commercios.com` + MeitY route already
in the roadmap. Nothing here changes that. Don't attempt them client-side — you
can't, and shouldn't want to.**

---

## What this means for the site

**A real line now exists where before there was only "blocked":**

```
Can call from the static site TODAY, no backend:
  · data.gov.in open datasets (mandi prices = the live flagship)
  · select RBI / AQI / weather open endpoints (test CORS first)

Needs a backend + approval (unchanged from prior research):
  · DigiLocker, eKYC, all verification/KYC APIs
  · anything returning a specific citizen's private data
```

**The mandi-price page is the highest-value thing available right now** because
it is the *only* feature that can display live official data instead of linking
to a portal — and it serves the same rural, small-business audience as the rest
of the site. It also strengthens the tenders/schemes story: a farmer checking
today's wheat price is one nudge from the PM-KISAN scheme page and the
procurement pages.

## What I'd do

1. **Register your own data.gov.in key** (free, minutes). Do not ship the sample key.
2. **Build `/prices/`** — a client-side page: pick state + commodity, show
   today's mandi prices in a table, with the `arrival_date` shown so nobody
   mistakes it for a live tick. Same design system, same QA gate.
3. **Add a `reviewed`/`data as of` stamp** driven by the API's `updated_date`, so
   the page tells the truth about freshness automatically.
4. **Only if it gets traffic:** move the key behind a free Cloudflare Worker.
5. **Leave the KYC family alone** until the backend exists.

---

## Sources — all tested live 18 Jul 2026

- data.gov.in API — `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
  (HTTP 200, `Access-Control-Allow-Origin: *`, live mandi data, 285,829-dataset catalog)
- [data.gov.in](https://data.gov.in) — register for a free API key
- [API Setu directory](https://directory.apisetu.gov.in/search) — 2,791 Docs / 109 Services, consent-based
- CORS + rate-limit headers captured directly; reproducible with `curl -D -`
