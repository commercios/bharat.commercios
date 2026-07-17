# Data access request to NIC

**Status:** drafted into Gmail (commercios.com@gmail.com) on 17-Jul-2026, awaiting
CIN + phone, not yet sent.

**Before sending, fill in:** `CIN`, `Phone`. If there is no CIN, delete the line
rather than guess — the letter reads fine without it.

**Follow-up:** if no reply by ~7 Aug 2026, follow up once. Treat continued silence
as a no. Also worth phoning the CPPP helpdesk on 0120-4200462 — a spoken enquiry
often routes faster than a cold email, and two minutes tells you whether a
data-sharing route exists at all.

**To:** cppp-nic@nic.in
**Cc:** (consider) support-eproc@nic.in
**Subject:** Request for permitted programmatic access to CPPP tender data — Commercios (bharat.commercios.com)

---

Respected Sir/Madam,

I am writing to request guidance on obtaining permitted programmatic access to
tender information published on the Central Public Procurement Portal
(eprocure.gov.in).

**About us**

Commercios is a registered company in India. We operate
**https://bharat.commercios.com**, a free public information portal that helps
Indian citizens and small businesses use government information that is already
published but scattered across many portals. Access is free — no subscription,
paywall, or advertising — and we have no revenue model on this information.

The site is live today with four sections, each of which explains an official
process and links the citizen to the official portal to act on it:

- **Government schemes** — central and state welfare schemes, in English, Hindi,
  Kannada and Tamil.
- **Unclaimed money** — how to search the RBI's UDGAM portal and IEPF for
  deposits and shares left unclaimed, including by deceased family members.
- **Bihar land survey** — the Special Survey, the vanshavali and self-declaration
  forms, and the stages at which a landholder must act.
- **Right to Information** — how to use the RTI Act when a department does not
  respond.

We mention this because it shows the shape of what we are asking for. We do not
host copies of government systems or compete with them. Every page ends by
sending the citizen to the official portal.

**What we are asking for**

We would like to display active tender listings — title, reference number,
issuing organisation, closing date, and a link back to the official tender page
on your portal — so that small suppliers who do not know CPPP exists can
discover opportunities and be directed to the official portal to participate.

Specifically, we would be grateful if you could advise:

1. Whether NIC provides an official API, bulk data export, or data-sharing
   arrangement for CPPP tender metadata.
2. If not, whether NIC would permit periodic automated retrieval of the public
   tender listings, and under what conditions — request frequency, permitted
   fields, user-agent identification, attribution requirements, or a
   registration process.
3. Whether a similar arrangement is possible for the GePNIC state portals, or
   whether each state must be approached separately.

**Why we are writing rather than simply collecting the data**

We want to be straightforward about our position. In assessing this, we checked
the published access policies of the relevant portals:

- `eproc.karnataka.gov.in/robots.txt` and `mahatenders.gov.in/robots.txt` both
  specify `User-agent: * / Disallow: /`.
- `eprocure.gov.in` does not publish a robots.txt.

We have taken the state portals' directive as a clear instruction and have **not**
collected data from them. We disabled that part of our own software rather than
run it. We have not built any workaround, and we have not used authenticated
sessions to reach listings that are not available to anonymous visitors. We would
rather ask permission and be told no than proceed on the basis that silence
implies consent.

**Our commitments**

Should you permit access, we undertake to:

- Observe any rate limit you specify. Our system currently allows a minimum
  1.5-second interval between requests, and we will lower the frequency on
  request.
- Identify our traffic with a clear user-agent string and a contact address.
- Attribute CPPP/NIC as the source on every listing, and link to the official
  tender page as the authoritative record — we intend to send traffic to your
  portal, not to substitute for it.
- Publish only information already public on the portal, and never republish
  bid-sensitive or restricted material.
- Display the retrieval timestamp on every record, so no user mistakes our copy
  for the live official position.
- Cease collection immediately on request, at any time, for any reason.

We are also happy to comply with any conditions you consider appropriate,
including registering our organisation or IP ranges with your office.

We recognise that your team's priority is the integrity and availability of the
procurement system itself, and we have no wish to add load or risk to it. If a
formal application route or a different office handles such requests, we would be
grateful for a pointer.

Thank you for your time and for the work behind the portal.

Yours faithfully,

**Arpit Dalvar**
Founder & Director, Commercios
CIN: [FILL IN]
Email: commercios.com@gmail.com
Phone: [FILL IN]
Web: https://bharat.commercios.com

---

## Notes for you (not part of the email)

**Why it's written this way.** The disclosure about robots.txt is deliberate.
You could omit it — but if permission is ever granted and it later emerges you'd
already assessed how to scrape, the disclosure is what makes the request
credible rather than a formality. It also demonstrates competence: you found the
policy, read it, and stopped.

**The strongest argument you have** is that CPPP exists to publicise tenders,
publication on it is *mandatory* for central ministries, and you are proposing
to send small suppliers *to* the portal. You are aligned with the portal's
purpose, not competing with it. That's why the "link back as authoritative" and
"traffic to you, not from you" commitments are load-bearing — keep them.

**On "no monetisation yet."** You told me free with no model today. That's what
I wrote. If that changes, tell NIC before it does — a permission obtained on a
description that later stops being true is worse than no permission.

**Realistic outcomes:**

- *No reply.* The most likely single outcome. Follow up once after ~3 weeks,
  then treat silence as a no — silence is not consent.
- *A pointer to another office.* Good. Follow it.
- *Conditional yes.* Comply exactly, including the rate limit.
- *No.* Then tenders needs a rethink, not a workaround.

**Also worth doing:** phone the CPPP helpdesk on **0120-4200462**. Government
departments often route a spoken enquiry faster than an unsolicited email, and
you'll learn in two minutes whether a data-sharing route exists at all.

**Send it from `commercios.com@gmail.com`** — it matches the domain and the
GitHub org. A company address at your own domain would carry more weight if you
have one.
