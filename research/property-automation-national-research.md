# Can we automate land-record retrieval for citizens?

**National research — 17 July 2026**
Prepared for: Commercios / bharat.commercios.com

---

## Bottom line

**Don't build a scraper. Build the guidance layer.**

Automated retrieval of land records across India is technically possible, legally
grey, operationally brutal, and — most importantly — **solves a problem citizens
don't actually have.**

Citizens are not blocked from their land records. Every state publishes them free
online. What defeats people is not access; it's **knowing which record, at which
office, under which name, in which of two parallel systems, before which
deadline.**

That gap needs no scraping to close. It's the same product you've already shipped
once: `bharat.commercios.com` schemes is a curated directory that links out to
official portals. It scrapes nothing. It works.

---

## What I measured

Not opinions — I fetched these directly on 17 July 2026.

### robots.txt across state land-record portals

| State | Host | robots.txt |
|---|---|---|
| **Karnataka** | landrecords.karnataka.gov.in | ⛔ **`Disallow: /`** |
| Bihar | biharbhumi.bihar.gov.in | none (404) |
| Bihar (survey) | dlrs.bihar.gov.in | 200, no disallow |
| UP | upbhulekh.gov.in | none (404) |
| Rajasthan | apnakhata.rajasthan.gov.in | none (404) |
| Maharashtra | bhulekh.mahabhumi.gov.in | none (404) |
| Andhra Pradesh | meebhoomi.ap.gov.in | 200, no disallow |
| West Bengal | banglarbhumi.gov.in | none (404) |
| Odisha | bhulekh.ori.nic.in | none (404) |
| Punjab | jamabandi.punjab.gov.in | none (404) |
| Haryana | jamabandi.nic.in | none (302) |
| Chhattisgarh | bhuiyan.cg.nic.in | **401 — auth required** |
| Tamil Nadu (reg) | tnreginet.gov.in | none (404) |
| MP / Telangana / Jharkhand / Assam / Kerala | — | unreachable at time of test |
| **DILRMP (national)** | dilrmp.gov.in | none (302) |
| **NGDRS (national)** | ngdrs.gov.in | none (404) |
| DoLR | dolr.gov.in | 200, 1 disallow rule |

**Read this carefully:** land-record portals are *quieter* than the tender
portals. Only Karnataka forbids crawling outright. Most declare nothing.

**Silence is not permission.** It means nobody wrote the file — most of these are
NIC-built ASP.NET applications where robots.txt was never part of the delivery.
Inferring consent from an omission is exactly the reasoning we rejected on
tenders. It would be self-serving to accept it here because the answer suits us.

### Access controls — the real gate

| State | Landing page | Signal |
|---|---|---|
| **Maharashtra** | bhulekh.mahabhumi.gov.in | **CAPTCHA** + ASP ViewState |
| **Andhra Pradesh** | meebhoomi.ap.gov.in | **CAPTCHA** |
| **Tamil Nadu** | tnreginet.gov.in | **CAPTCHA** + session |
| Bihar | biharbhumi.bihar.gov.in | ASP ViewState |
| Rajasthan | apnakhata.rajasthan.gov.in | ASP ViewState |
| Odisha | bhulekh.ori.nic.in | ASP ViewState + session |
| UP, WB | — | none on landing page |

These are **landing pages**. The actual query forms — where you pick district →
tehsil → village → khata — gate harder. Assume CAPTCHA is the norm on the pages
that matter.

**A CAPTCHA is not a technical obstacle. It is a sentence in English.** It says:
*a human should be doing this.* Where a department has paid to install one,
routing around it isn't a grey area — it's overriding a stated decision. That's
true whether or not robots.txt exists, and it's why "no robots.txt" doesn't get
us anywhere.

---

## Is there a sanctioned route? No.

**DILRMP** (Digital India Land Records Modernisation Programme) is the central
umbrella, 100% centrally funded since 2016, with the stated objective of an
"Integrated Land Information Management System… enabling sharing of information
with various organisations/agencies."

That sounds promising. It isn't — yet.

- **No public API.** Not documented at dilrmp.gov.in or dolr.gov.in.
- **data.gov.in's DILRMP datasets are programme statistics**, not land records —
  e.g. *"State-wise Details of Various Components/Activities of DILRMP in
  Northeast States 2021-22 to 2025-26."* That's budget and progress reporting.
- On OGD, for the DILRMP resource: **"the API for this resource does not exist,
  users can submit a request for it."**

This is the same wall we hit on tenders, for the same reason: **the state
digitised the front door, not the pipe.** These systems were built for a citizen
with a browser, not for a machine.

**Land is a State subject** (Constitution, List II). There is no national land
record. There are 28+ separate systems, separately procured, separately
maintained, with different vocabularies for the same object — *khatiyan*,
*7/12*, *RTC*, *patta*, *khatauni*, *jamabandi*, *chitta*, *adangal*. A national
scraper isn't one integration. It's 28, forever.

---

## Privacy — the risk that outlives the technical ones

Land records name individuals and disclose their holdings. Aggregating them into
a searchable database is processing personal data at scale.

**The DPDP Act 2023 probably exempts you** — s.3(c)(ii) disapplies the Act to
personal data made publicly available by a person under a legal obligation to
publish it. State-published land records plausibly qualify.

**But "probably exempt" is not the same as "wise."** Three things to sit with:

1. **A portal search and a bulk index are different products.** Today, finding a
   person's holdings requires knowing their district, tehsil and village.
   A national name-search collapses that friction. You would have built a tool
   that locates any Indian's land by name — useful for a citizen finding their
   great-grandfather's khatiyan, and equally useful for someone targeting a
   widow, a Dalit landholder, or a litigant. The state's obscurity here is doing
   protective work, and it is not accidental.
2. **You'd hold a stale mirror of a live legal record.** Someone will act on your
   copy. If it's a month old and a mutation has since gone through, you're the
   proximate cause of a bad decision on someone's largest asset.
3. **You are a registered company publishing under your own name.** Bulk
   aggregation of citizens' property data invites scrutiny you cannot currently
   staff.

**Not legal advice.** If you pursue any aggregation, get a DPDP-literate lawyer
before the first record is stored, not after.

---

## The insight that matters

**Look at what actually helped a real user today.**

Arpit's great-grandfather's land in Bihar, papers lost in a disaster. The useful
answer was:

- Bihar has a **Special Survey running now**, deadline extended to **December
  2026** — and this creates a *new* Record of Rights.
- The **vanshavali (pedigree) form** exists precisely for property recorded in a
  grandfather's or great-grandfather's name.
- It **does not require Sarpanch approval** — a misconception that costs people
  weeks.
- His great-grandfather's era maps onto the **Cadastral Survey khatiyan
  (~1900-1920s)**, which is likely to name him directly.
- The real deadline is **not December** — it's whenever his *mouza's* draft
  record publishes, after which the objection window is short.
- Two parallel systems exist — **registration** (deed) and **revenue** (who's
  recorded now) — and he needs both.
- The decisive question is **who is in possession**, because limitation may have
  run.

**Every one of those is knowledge, not data.** Not one required scraping
anything. A scraper would have returned his khatiyan and told him none of it —
and the khatiyan alone would not have told him he has five months to act.

**That is the product.** Not "we fetch your record faster than the portal" —
the portal is free and works. But **"you don't know what to ask for, which of two
systems holds it, or that a clock is running."**

---

## Recommended product: the guidance layer

Extend the pattern that already works on your schemes site.

### 1. State-by-state playbooks

For each state: which portal for which record, the local vocabulary, what you
need before you start, what it costs, how long it takes, and the failure modes.
Deep-link to the official portal — send traffic *to* the state, don't mirror it.

**Start with Bihar.** The survey deadline gives you urgency, a large affected
population, and a captive audience searching right now.

### 2. Situation-based flows

Not "what is a khatiyan" — nobody searches that. Instead:

- *"Property is in my dead grandfather's name"* → vanshavali + Prapatra-2 (Bihar)
- *"I lost my papers"* → certified copy from SRO; the record survives
- *"I'm buying — how do I check the seller owns it?"* → EC + revenue records
- *"A relative is occupying our ancestral land"* → possession, limitation, get a vakil

Each ends at the right official page with the right form name and the right
questions answered.

### 3. Deadline tracking

The single highest-value automation available to you, and it needs **no personal
data at all**. Bihar's survey stage advances *mouza* by *mouza*. Publish which
stage each district has reached. Let people subscribe to their village.

That's a genuinely useful alert service built entirely on **public
administrative announcements** — not citizens' records.

### 4. Document explainers

Photograph a khatiyan, get told what each column means. Runs entirely on the
user's own document, in their own hands. No aggregation, no privacy exposure, no
portal to scrape.

---

## What this avoids

| Scraper | Guidance layer |
|---|---|
| 28+ integrations, each breaking separately | One content system |
| CAPTCHAs you must not bypass | Nothing to bypass |
| DPDP exposure on citizens' data | No personal data held |
| A stale mirror people act on | Always sends users to the live source |
| A name-search tool that helps predators too | Helps only the person asking |
| Competes with the state | Aligns with it — you drive traffic to their portal |
| Moat = infrastructure spend | Moat = knowledge, which compounds |

---

## Honest counter-argument

The strongest case *against* my recommendation:

**Guidance doesn't scale the way data does.** Twenty-eight states × dozens of
situations is a large, manual, slowly-decaying content operation. Portals change,
deadlines move, rules shift. It is a *media* business, not a tech one, and its
margins and defensibility differ accordingly. A scraper — if it were permitted —
would be a smaller, more leveraged asset.

**That's true.** But it argues for narrowing scope, not for scraping. Bihar's
survey alone plausibly affects tens of millions of people with a hard deadline
five months out. If you can't win that one state with guidance, a national
scraper wouldn't have saved you.

---

## What I'd do next

1. **Ship a Bihar land-survey page.** Curated, honest, deep-linked, urgent. Same
   architecture as schemes: static HTML in `docs/bihar-survey/`. No pipeline.
2. **Measure it.** If Bihar traffic converts, the guidance thesis holds. If it
   doesn't, no amount of scraping infrastructure would have helped.
3. **Then** consider the deadline tracker — public survey-stage data only.
4. **Leave the tender pipeline dormant** pending NIC's reply.
5. **Never** build the national name-search. Not because it's hard — because it
   works.

---

## Open questions for you

- **Is Commercios a media business or a data business?** The honest answer to
  that decides this entirely, and only you can give it.
- **Bihar first, or nationally shallow?** I'd argue depth in one state with a
  live deadline beats a thin map of twenty-eight.
- **Do you have Bihar revenue-law expertise?** The guidance product's whole moat
  is being *right*. Confidently wrong advice about someone's ancestral land is
  worse than no advice.

---

## Sources

- robots.txt and CAPTCHA sweep — fetched directly, 17 Jul 2026 (reproducible: `curl https://<host>/robots.txt`)
- [DILRMP — Department of Land Resources](https://dolr.gov.in/en/programmes-schemes/dilrmp-2/)
- [DILRMP-MIS 4.0](https://dilrmp.gov.in/)
- [DILRMP datasets on OGD](https://www.data.gov.in/keywords/DILRMP)
- [DPDP Act 2023 (MeitY, full text)](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)
- [Understanding India's New Data Protection Law — Carnegie](https://carnegieendowment.org/research/2023/10/understanding-indias-new-data-protection-law)
- [Bihar land survey deadline extended to Dec 2026 — India TV](https://www.indiatvnews.com/bihar/news-bihar-land-survey-government-extends-deadline-by-five-months-to-december-2026-latest-updates-2025-03-13-980416)
- [Bhu-Sarvekshan — BiharConnect](https://biharconnect.in/land-survey/bhu-sarvekshan-a-step-towards-resolving-land-disputes-in-bihar/)
