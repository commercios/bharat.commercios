# Strategy review: the six-vertical plan

**17 July 2026 — commissioned brief: "make bharat.commercios.com the expert
assistant for all govt information, processes, live information."**

You asked me to question every step. So this opens by questioning the plan,
because the research turned up something that should change it.

---

## The finding

**The Government of India has already built a national aggregator for every one
of your six verticals. Not one. All six.**

| Your vertical | The government's aggregator | Scale |
|---|---|---|
| **Schemes** | [myScheme.gov.in](https://www.myscheme.gov.in) — MeitY | **4,750+ schemes** (700 central, 4,050 state/UT), with eligibility matching |
| **Tenders** | [CPPP](https://eprocure.gov.in) — NIC | Publication **mandatory** for all central ministries/CPSEs; real-time feed from 100+ organisations |
| **Property** | State Bhulekh portals + DILRMP | Every state, free, online |
| **RTI** | [RTI Online](https://rtionline.gov.in) + state portals | Bihar even lets you file **by phone** (Jaankari, since 2007) |
| **Unclaimed money** | [UDGAM](https://udgam.rbi.org.in) (RBI) + [IEPF](https://iepf.gov.in) + [unclaimedassetsportal.in](https://unclaimedassetsportal.in) | 30 banks ≈ 90% of unclaimed deposits |
| **Auctions** | [IBAPI](https://ibapi.in) (DFS/Finance, RBI-mandated) + BaankNet/eBKray (IBBI-mandated) | All public sector banks required to list |

And above them: [UMANG](https://web.umang.gov.in) aggregates services;
[India.gov.in](https://www.india.gov.in) is the national portal;
[API Setu](https://directory.apisetu.gov.in) exposes 8,893 APIs.

### The number that matters most

```
myScheme.gov.in           4,750+ schemes, eligibility-matched, MeitY-maintained
bharat.commercios.com        46 schemes, hand-curated, inline in a 317 KB HTML file
```

**A hundredfold gap**, against an organisation with a statutory mandate, a
budget, and direct lines to every department that runs a scheme.

**We cannot win "see all government schemes." That race is over and we didn't
enter it.** Any plan whose goal is comprehensiveness is a plan to lose slowly.

---

## Questioning each part of the brief

### "See all Govt Schemes, Tenders, Property, RTI, Unclaimed, Auctions for each state"

**6 verticals × 36 states/UTs = 216 combinations.** Each with its own portal,
vocabulary (*khatiyan* / *7-12* / *RTC* / *patta* / *khatauni* / *chitta*),
process, and failure modes.

Two problems, and the second is fatal:

1. **Sourcing.** Established today: GePNIC state portals return `Disallow: /`.
   Land portals put CAPTCHAs on the pages that matter. There is no official API
   for tenders or land records. UMANG says `Disallow: /`. Comprehensiveness
   requires data we cannot lawfully obtain.

2. **Decay.** Even if you hand-wrote all 216, they rot. Portals change, deadlines
   move, rules shift. Today alone I found **Bhumi Jankari dead** — the standard
   Bihar registration portal, DNS resolving, service gone. A 216-page site
   maintained by a small team isn't a product; it's a growing pile of
   confidently-wrong advice about people's land.

**Verdict: reject.** Not scaled-back — rejected. It optimises for the one thing
we can't win and can't maintain.

### "Live information"

**Mostly impossible through permitted means, and we proved it today.**

Live tenders: blocked pending NIC. Live land records: CAPTCHA-gated. Live
schemes: myScheme has them, we'd be a stale mirror.

There is exactly **one** live thing we can lawfully publish, and it's good:
**Bihar survey stage per mouza**, sourced from public administrative
announcements. No personal data, no scraping of citizens' records, genuine
urgency. That's the entire viable "live" surface.

**Verdict: cut to one — the Bihar deadline tracker.**

### "Words as per National Standard"

The standard is **[GIGW 3.0](https://guidelines.india.gov.in/)** — NIC/MeitY.
88 mandatory guidelines across Quality, Accessibility, Cybersecurity, Lifecycle.
WCAG 2.1 Level AA. STQC certifies compliance.

**But read the scope: GIGW is mandatory for ministries, departments and PSUs.
It does not apply to you — and that cuts both ways.**

- ✅ **Adopt its accessibility.** WCAG 2.1 AA is right regardless of who mandates
  it. Your audience includes people on cheap phones, poor connections, and screen
  readers. Non-negotiable.
- ✅ **Adopt its terminology.** Use the official word — *khatiyan*, *jamabandi*,
  *vanshavali*, *Prapatra-2*, *Encumbrance Certificate*. Already doing this. It's
  what makes the site findable and credible.
- ⛔ **Do NOT adopt its visual conventions or emblems.** A private company styled
  to look like a `.gov.in` site is not "professional" — it's misleading. Citizens
  handing over land details need to know instantly you are not the government.
  **Looking official is a liability, not an asset.**

**Verdict: accessibility yes, vocabulary yes, government costume no.**

---

## What the research says we *should* be

Look at what actually helped a real person today — you.

The useful answer to "I lost my great-grandfather's land papers" was: Bihar's
survey is running; December isn't your deadline, your *mouza's* draft publication
is; the vanshavali form exists for exactly this; **it doesn't need Sarpanch
approval**; check who's on the Jamabandi before filing anything; and the record
survives the fire because the state keeps its own copy.

**None of that required scraping anything. None of it is on myScheme, CPPP, or
Bhulekh.** The government publishes *data*. It does not publish *"here is what
your situation means and what happens if you do nothing."*

**That gap is the product.** Not aggregation — the state does that. Not
comprehensiveness — we lose. **Consequence, sequence, and the gotchas.**

### The moat, stated honestly

- **Government portals cannot say "you have five months."** They're not allowed to
  be alarming, and they're organised by department, not by predicament.
- **They cannot say "everyone thinks you need a Sarpanch signature — you don't."**
  Correcting a widespread misconception about your own process is not something a
  department does.
- **They cannot connect across silos.** UDGAM doesn't know that a legal heir
  certificate is the same obstacle as a vanshavali. You can.
- **They are organised by who owns the data. You can organise by what happened to
  the citizen.** *"My father died"* touches deposits, land, pension, and
  succession — four departments, one situation.

---

## Recommended plan

### 1. Reframe: situations, not verticals

Stop building six vertical directories. Build **situations**, each of which cuts
across verticals and ends at official portals:

| Situation | Touches |
|---|---|
| *"A parent or grandparent died and left things unsettled"* | unclaimed deposits · land mutation · vanshavali · legal heir cert · pension |
| *"I lost my documents"* | certified copies · SRO · RTI · DigiLocker |
| *"My land is in a dead ancestor's name"* | Bihar survey · khatiyan · vanshavali · possession |
| *"I applied and nothing happened"* | RTI · first appeal · CPGRAMS |
| *"I'm buying property"* | EC · revenue records · IBAPI/BaankNet · prohibited-property list |
| *"I was defrauded"* | 1930 · cybercrime.gov.in · the golden hour |

**This is defensible precisely because it's the one shape the government cannot
copy** — it requires an editorial voice and a willingness to say "this will go
wrong."

### 2. Depth in Bihar, not breadth across 36

One state, with a live deadline affecting millions, where you have personal
stake and direct knowledge. If guidance can't win Bihar with a clock running,
216 pages wouldn't have saved it.

### 3. Send traffic to the state, always

Every page ends at the official portal. It's honest, it's what the NIC letter
promises, and it's the only defensible position for a private site handling
public information.

### 4. Fix what's live before adding anything

Audit results below. **Three of four pages are English-only** while your audience
is Bihar.

---

## QA audit — current state

| Check | schemes | unclaimed | bihar-survey | rti |
|---|:--:|:--:|:--:|:--:|
| `<html lang>` | ✅ | ✅ | ✅ | ✅ |
| Single `<h1>` | ✅ | ✅ | ✅ | ✅ |
| Skip-to-content link | ❌ | ❌ | ❌ | ❌ |
| `<main>` landmark | ❌ | ❌ | ❌ | ❌ |
| og:/social tags | ❌ | ❌ | ❌ | ❌ |
| Canonical URL | ❌ | ❌ | ❌ | ❌ |
| JSON-LD schema.org | ❌ | ❌ | ❌ | ❌ |
| **Language switcher** | ✅ en/hi/kn/ta | ❌ | ❌ | ❌ |

**Ranked by actual harm:**

1. **i18n gap — severe.** The Bihar page is English-only. Its reader is a Bihari
   landholder. This is the worst defect on the site, and it isn't close.
2. **No `<main>`/skip-link — WCAG 2.1 AA failure.** Screen-reader users tab
   through the whole nav on every page. GIGW mandates AA; adopt it.
3. **No og:/canonical/JSON-LD.** These pages will be shared on WhatsApp — with no
   preview card. For this audience WhatsApp *is* the distribution channel.
4. **317 KB single file, no tests, data inline.** Not urgent, but it's why nothing
   can be reused across pages.
5. **Link rot is real, not theoretical.** Bhumi Jankari died. Nothing would have
   caught it but me checking by hand.

---

## Workflows — "ease of change"

Current: four handwritten HTML files, duplicated CSS, no tests, no link checks,
manual deploy. It got you live in a day. It will not survive ten pages.

**Proposed, in priority order:**

1. **`assets/site.css` + shared header/footer partial.** The design tokens are
   already identical across pages — extract them once. Small build step, no
   framework.
2. **Content as data, not markup.** Each situation page becomes a small JSON/MD
   file. Non-developers can then edit content; that's the actual bottleneck.
3. **A link checker in CI.** The one automation with unambiguous ROI. It would
   have caught Bhumi Jankari the day it died. Runs weekly, opens an issue.
4. **A `reviewed:` date on every page, shown to users.** Facts here decay. State
   when you last checked, and let readers judge.
5. **Bihar survey-stage tracker.** The only live data worth building, and it needs
   no personal data.

**Deliberately not proposing:** a framework, a CMS, a database, or a scraper.
Each adds maintenance to a project whose scarce resource is *editorial correctness*,
not engineering.

---

## What I'd refuse

- **A national land name-search.** It works too well; it helps predators as
  efficiently as heirs.
- **Any CAPTCHA bypass.** It's a sentence, not an obstacle.
- **Looking like a government site.** See GIGW note above.
- **Comprehensiveness as a goal.** It's the one thing we're guaranteed to lose at.

---

## The counter-argument to all of this

The honest case against me:

**Situation-based guidance doesn't scale, doesn't defend, and doesn't monetise.**
It's a media business: manual, decaying, dependent on an editorial voice that
lives in one head. A comprehensive directory at least has an asset at the end.
And "the government already does it" hasn't stopped a hundred private tender
aggregators from making money — being *better organised* than a `.gov.in` site
is a real business, even if unglamorous.

**Where that's right:** if the goal is a saleable asset, guidance is a weak
foundation.

**Where I think it's wrong:** those aggregators mostly scrape, which we've
established you can't lawfully do here. Strip out scraping and "better organised
directory" collapses back into myScheme — but worse, because they have 4,750
schemes and you have 46.

**The question only you can answer:** is Commercios a media business or a data
business? Everything above assumes media. If the answer is data, the honest
advice is that the six-vertical plan doesn't work, and the strategy needs
rethinking from the revenue model down — not from the sitemap up.

---

## Sources

- [myScheme](https://www.myscheme.gov.in/) — counts read live, 17 Jul 2026
- [GIGW 3.0](https://guidelines.india.gov.in/) · [Scope](https://guidelines.india.gov.in/scope-and-objective/) · [STQC certification](https://www.stqc.gov.in/en/website-quality-certification-0)
- [IBAPI](https://ibapi.in/) · [IBAPI SOP (PDF)](https://www.ibapi.in/Documents/SOP%20Common%20Portal%20for%20E-Auction%20of%20Properties%20Version%201.4.1.pdf) · [MSTC](https://www.mstcecommerce.com/auctionhome/ibapi/index.jsp)
- [API Setu directory](https://directory.apisetu.gov.in/search)
- [UMANG](https://web.umang.gov.in) — robots.txt `Disallow: /`, checked 17 Jul 2026
- robots.txt sweep + QA audit: reproducible, commands in `property-automation-national-research.md`
