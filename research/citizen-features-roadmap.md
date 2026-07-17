# Government features worth building on bharat.commercios.com

**Research — 17 July 2026**

Every item below carries a **permission status**, checked before it was proposed.
That's today's lesson applied: the tender pipeline was fully built, tested and
gated before anyone read a robots.txt. One `curl` would have saved all of it.

---

## The finding that changes the strategy

**India has an official government API gateway, and I should have found it days
ago.** [API Setu](https://apisetu.gov.in) — MeitY, launched March 2020 under the
2015 Open API policy.

**2,871 publishers. 8,893 APIs.** Including:

| Publisher | What |
|---|---|
| **Revenue Department, Odisha** | **Copy of Registered Deed (Sale, Gift)** — 5 APIs |
| **Karnataka Dept of Transport** | **Driving Licence + Vehicle RC** — 2 APIs |
| Dept of Registration & Stamps, Maharashtra | digital Leave & License |
| Mee Seva, Andhra Pradesh | 28 APIs |
| eDistrict Kerala | 25 APIs |
| TN eGovernance | 20 APIs |
| Digital Gujarat | 19 APIs |
| eDistrict UP / Odisha | 7 / 6 APIs |
| **Bihar** | 52 APIs |

Categories include Housing & Shelter (10), Transport & Infrastructure (15),
Identity Docs (12), Public Safety Law & Justice (9).

### Read the type split before getting excited

**2,791 "Docs" vs 109 "Services."** That's the whole architecture in one number.

These are overwhelmingly **DigiLocker document-pull APIs**. The model is:
*a citizen authenticates, consents, and pulls their own document.* It is **not**
bulk access, and there is no endpoint that hands you everyone's land records.

**That constraint is the feature.** It's precisely the model that survives every
objection in the property research:

- Official and sanctioned — no robots.txt ambiguity
- Consent-based — the citizen authorises each pull
- No aggregation — you never hold a database of other people's records
- No DPDP exposure — you're not the data fiduciary for a national index
- No CAPTCHA to route around — you're using the front door they built

**The thing I refused to build (a national name-search) is the thing the
architecture makes impossible.** That's not a coincidence. It's the design.

### Can Commercios get in?

Yes — private companies can apply as **Requester** organisations.

- **Approval:** MeitY/NeSL process — assessed on business use case, data security
  infrastructure, and API compliance
- **Cost:** **no API usage fee.** Free for the API itself; you bear integration cost
- **Needs:** CIN, GSTIN, PAN, Udyam Aadhaar, and **an official domain email**

⚠️ **Concrete blocker:** `commercios.com@gmail.com` will not qualify. You need
`something@commercios.com`. Fix that first — it gates the whole route, and it's
an afternoon's work.

⚠️ **Honest caveat:** many directory entries read *"Last updated: 4 years ago."*
Verify any specific API still works before designing around it.

⚠️ **Scope caveat:** the Requester role is framed around *verification/KYC* —
banks checking a customer. "Help a citizen retrieve their own record" may or may
not be accepted as a use case. Ask MeitY before building.

---

## Tier 0 — Ship now. No integration, no permission needed.

Pure guidance + deep links. Your proven model. The schemes site already does
exactly this.

### 1. Unclaimed money 🔥 *my strongest recommendation*

**Between ₹62,000 crore and ₹78,000 crore sits unclaimed in Indian banks alone.**
Plus shares and dividends moved to IEPF after seven years of non-claim.

- **[UDGAM](https://udgam.rbi.org.in)** — RBI's portal, free, 30 banks ≈ 90% of
  the DEA Fund. Search by name + one ID proof → get a UDRN → claim from the bank.
- **[IEPF](https://iepf.gov.in)** — unclaimed shares/dividends. Form IEPF-5.
- **[unclaimedassetsportal.in](https://unclaimedassetsportal.in)** — the
  government's newer common platform spanning deposits, insurance, shares, MFs.

**Why this is the best thing on this list:**

- **The hook is unbeatable.** "You may have money you don't know about" needs no
  marketing.
- **Enormous latent demand, near-zero awareness.** Most people have never heard
  of UDGAM.
- **Zero privacy exposure** — people search their own name on RBI's own portal.
  You hold nothing.
- **It's the same emotional shape as your own problem** — an ancestor's asset,
  lost paperwork, a record that survives anyway.
- **Deceased relatives' deposits are a huge slice** of that ₹78,000 crore, and
  the claim path (legal heir, succession) is exactly the vanshavali knowledge
  you're already building for Bihar land. **The two products share a spine.**

**Permission:** ✅ Nothing to scrape. Link out. Explain the process.

### 2. Bihar land survey ⏰ *most urgent*

Deadline **December 2026**; real deadline is your *mouza's* draft publication.
Vanshavali, Prapatra-2, khatiyan, jamabandi, survey stage. Detailed in
`property-automation-national-research.md`.

**Permission:** ✅ Guidance only.

### 3. RTI — the meta-unlock 🗝️

**This is the tool that unlocks every other item on this list, and almost nobody
uses it properly.**

RTI is the legal mechanism to *compel* a department to give you a record. Stuck
sub-registrar? RTI. Mutation ignored for two years? RTI. No response to a scheme
application? RTI. ₹10 fee. 30-day statutory deadline. Free for BPL applicants.

**Why it fits you specifically:** it's the answer to the failure mode behind
every other section — *"I asked and nothing happened."* It converts your site
from a directory into leverage.

**Permission:** ✅ Guidance. Template letters are the product.

### 4. Cybercrime & financial fraud

**[cybercrime.gov.in](https://cybercrime.gov.in)** and helpline **1930**.

The **golden hour matters** — reporting a fraudulent transfer within ~60 minutes
can freeze funds mid-chain. Most victims lose that window googling what to do.
A page that says *"call 1930 NOW, then file here, then do this"* has genuine
life-impact per visit.

**Permission:** ✅ Guidance.

### 5. EPFO / UAN

Passbook, UAN activation, KYC seeding, transfer on job change, withdrawal,
pension (EPS-95). Vast affected population; notoriously confusing.

**Permission:** ✅ Guidance.

---

## Tier 1 — Also strong guidance plays

| Feature | Portal | Why | Permission |
|---|---|---|---|
| **eCourts case status** | ecourts.gov.in / NJDG | "Is there a case on my land?" — directly relevant to property disputes | ✅ guidance |
| **CPGRAMS** | pgportal.gov.in | Escalation when a department stonewalls. Pairs with RTI. | ✅ guidance |
| **NALSA free legal aid** | nalsa.gov.in | Free lawyers for eligible citizens — women, SC/ST, BPL, disaster victims. **Massively underused, and directly relevant to your own land situation.** | ✅ guidance |
| **Jeevan Pramaan** | jeevanpramaan.gov.in | Digital life certificate. Pensioners lose payments over this every year. | ✅ guidance |
| **Consumer helpline** | 1915 / INGRAM | Refunds, defective goods, service disputes | ✅ guidance |
| **Certificates** (birth, death, caste, income, domicile) | state eDistrict | **Death certificates are a dependency of your vanshavali flow** — the chain won't close without them | ✅ guidance |
| **Udyam / MSME registration** | udyam.gov.in | Free; unlocks procurement benefits. **Natural bridge to tenders if NIC ever replies.** | ✅ guidance |

---

## Tier 2 — DigiLocker Requester integration

Once you have a domain email and MeitY approval:

- **Vehicle RC + Driving Licence** — Karnataka confirmed live on API Setu;
  Parivahan is national
- **Registered deeds** — Odisha has 5 APIs; a live proof that the model works for
  land documents
- **eDistrict certificates** — Kerala, UP, Odisha, AP, TN, Gujarat

**What this actually gives citizens:** "pull your own document, here, now,
verified" instead of "go to this portal, fight the CAPTCHA, good luck."

**Sequence it honestly:** Tier 0 first. Prove the guidance thesis converts before
spending weeks on MeitY paperwork for an integration nobody has asked for yet.

---

## What I'd not build

| Idea | Why not |
|---|---|
| National land name-search | Works too well. Helps predators as efficiently as heirs. |
| Aadhaar anything | Heavily restricted, criminal penalties for misuse. Don't touch. |
| Scraping any portal with a CAPTCHA | It's a sentence, not an obstacle. |
| Mirroring records people act on | You become the proximate cause of decisions on stale data. |
| Aggregating personal data "because it's public" | DPDP s.3(c)(ii) probably exempts you. "Probably" is not a strategy. |

---

## Recommended sequence

1. **Unclaimed money page.** Biggest hook, zero risk, ships this week.
2. **Bihar land survey.** Urgency and a deadline; you have direct expertise.
3. **RTI toolkit.** Converts the site from directory to leverage.
4. **Measure.** If Tier 0 doesn't convert, no API will save it.
5. **Get `arpit@commercios.com`.** Gates DigiLocker; costs an afternoon.
6. **Then** apply to MeitY as a Requester, with real traffic to point at.

**The through-line:** unclaimed money, ancestral land, and legal heirship are
the *same story* — an asset that exists, a record that survives, and a citizen
who doesn't know the door is open. That's a coherent product, not a directory of
links. It's also, notably, your own story.

---

## Open questions

- **Do you have `@commercios.com` email?** Gates all of Tier 2.
- **CIN, GSTIN, Udyam** — in hand? Needed for DigiLocker.
- **Who writes the content?** The moat is being *right*. Wrong advice about
  someone's ancestral land or fraud window is worse than none.
- **Does multilingual extend?** Your schemes page has Hindi and Kannada. If
  Bihar is the focus, Hindi coverage is table stakes.

---

## Sources

- [API Setu](https://www.apisetu.gov.in/) · [API Directory](https://directory.apisetu.gov.in/search) · [API Policy](https://apisetu.gov.in/api-policy) · [API Setu on Digital India](https://www.digitalindia.gov.in/initiative/api-setu/)
- [DigiLocker Partners](https://www.digilocker.gov.in/web/partners/introductions) · [Partner Onboarding SOP (PDF)](https://cf-media.api-setu.in/resources/Partners-SOP.pdf) · [Onboarding FAQ (PDF)](https://www.digilocker.gov.in/assets/FAQ%20DL%20EL_onboarding.pdf)
- [UDGAM — RBI](https://udgam.rbi.org.in/unclaimed-deposits/) · [RBI UDGAM FAQ](https://www.rbi.org.in/commonman/english/scripts/FAQs.aspx?Id=3579)
- [Unclaimed Assets Portal](https://unclaimedassetsportal.in)
- Directory figures read live from API Setu, 17 Jul 2026
