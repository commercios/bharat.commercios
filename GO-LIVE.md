# Going live — Bharat Schemes

**Scope:** ship the schemes site to `bharat.commercios.com`. Tenders, property
and vehicle come later as separate sections.

**Good news from the system scan:** you don't need Node, npm, or the pipeline for
this. `docs/index.html` is one self-contained file — all data, CSS and JS are
baked in. There is nothing to build. You're copying a file onto the internet.

Realistic time: **30 minutes of work**, then a wait for DNS.

---

## Already done for you

- `docs/index.html` — your site (copied from `~/Downloads/index_1.html`, the
  newer version with the "Trending" section).
- `docs/CNAME` — tells GitHub your domain is `bharat.commercios.com`.
- `.gitignore` — stops secrets and junk from ever being committed.

## Two things missing on your Mac

| | Fix |
|---|---|
| git identity not set | Step 1 below |
| No GitHub account/repo | Step 2 below |

Node is **not** needed. Ignore that it's missing until you start on tenders.

---

## Step 1 — Tell git who you are (this repo only)

Git refuses to commit without a name and email. Your GitHub account is
**Commercios / commercios.com@gmail.com**, so commits must carry that email to
link to the account.

**Set it for this repo only — no `--global`.** You are Arpit; Commercios is a
brand account. A global setting would stamp *every* git project on your Mac as
Commercios, including personal ones. Repo-local config keeps that contained.

Repo-local config needs a repo to exist first, so this runs after `git init` —
see Step 3. The commands are:

```bash
git config user.name "Commercios"
git config user.email "commercios.com@gmail.com"
```

Note the missing `--global`. That's deliberate, not a typo.

Check it later with `git config user.email` from inside `~/Commercios/Bharat`.

> **Privacy note:** every commit is stamped with this email, permanently, in a
> public repo. `commercios.com@gmail.com` is a brand address, so that's probably
> fine — but if you'd rather it not be scraped, GitHub offers an alias:
> Settings → Emails → "Keep my email addresses private", then use the
> `...@users.noreply.github.com` address it gives you instead.

---

## Step 2 — Create the repo on GitHub ✅ DONE

Created as **`commercios/bharat.commercios`** — Public, no README, no
`.gitignore`, no license. Correct.

**Note your owner is the `commercios` org, not a personal account.** That
determines two things later:

- Your Pages URL: `https://commercios.github.io/bharat.commercios/`
- Your DNS CNAME value: **`commercios.github.io`**

---

## Step 3 — Push your site up

```bash
cd ~/Commercios/Bharat
git init
git branch -M main

# Step 1's identity — repo-local, applied now that the repo exists
git config user.name "Commercios"
git config user.email "commercios.com@gmail.com"

git add -A
```

**Before committing, check nothing secret is going up:**

```bash
git status --porcelain
```

You should see `.gitignore`, `GO-LIVE.md`, `docs/`, `tender-pipeline/`.
You should **NOT** see `node_modules` or anything called `.env`.
If you do, stop and tell me.

```bash
git commit -m "Bharat Schemes site"
git remote add origin https://github.com/commercios/bharat.commercios.git
git push -u origin main
```

GitHub will ask you to sign in. A browser window will pop up — approve it there.

Refresh your GitHub repo page. Your files should be visible.

---

## Step 4 — Switch on Pages

1. In your repo: **Settings** → **Pages** (left sidebar).
2. **Source:** Deploy from a branch
3. **Branch:** `main` — **Folder:** `/docs`
4. **Save.**
5. Wait about 2 minutes.

The page will show your link: `https://commercios.github.io/bharat.commercios/`
**Open it. Your schemes site should be live.**

If you get a 404, wait one more minute — the first build is slow. If it's still
404 after 5 minutes, check that Folder really says `/docs`.

**At this point you're on the internet.** Everything below is just the domain.

---

## Step 5 — Point your domain at it

`docs/CNAME` is already in place, so GitHub knows the domain. Now DNS has to
agree.

1. Log in wherever you bought **commercios.com**.
2. Find **DNS settings** / **DNS records**.
3. Add a record:

   | Type | Name / Host | Value / Points to |
   |---|---|---|
   | CNAME | `bharat` | `commercios.github.io` |

   Put only `bharat` in the Name field — not the full domain. Most registrars
   add the rest automatically.

   **The value is `commercios.github.io`** — your org, with no repo name and no
   trailing path. Not `commercios.github.io/bharat.commercios`. A CNAME record
   points at a host, never a URL.

4. Back in GitHub: **Settings** → **Pages** → **Custom domain** → type
   `bharat.commercios.com` → **Save**.

5. Wait. Then tick **Enforce HTTPS** once it stops being greyed out (GitHub has
   to issue a certificate first — this can take an hour).

**DNS takes 10 minutes to a few hours.** Nothing is broken; the internet is just
slow to agree. Check progress:

```bash
dig +short bharat.commercios.com
```

When that prints something ending in `github.io`, you're live.

---

## Done. What you have

`bharat.commercios.com` serving your schemes site, free, with HTTPS.

**To change anything later:**

```bash
cd ~/Commercios/Bharat
# edit docs/index.html
git add -A && git commit -m "what changed" && git push
```

Live in about a minute. That's the whole workflow from now on.

---

## Deliberately NOT done yet

**The tender Action is dormant on purpose.** `tender-pipeline/` is in the repo,
but its workflow is still at `tender-pipeline/deploy/github-actions-refresh.yml`
— **not** in `.github/workflows/`, which is the only place GitHub looks.

That's intentional. If you enable it now it will run every morning, scrape
government sites for a page that doesn't exist, and email you a failure when the
gate correctly refuses an empty feed. Noise with no upside.

It gets moved into `.github/workflows/` on the day a tenders page exists.

---

## When you're ready for the other sections

Each vertical becomes a folder under `docs/`:

```
docs/
├── index.html          ← schemes (live now)
├── CNAME
├── tenders/index.html  ← next: pipeline is built and gated, page is not
├── property/
└── vehicle/
```

**Tenders is closest** — the pipeline already works, is tested, and refuses to
publish bad data. What's missing is a page that reads `tenders.json`, plus:

- Node installed locally (`brew install node`) so you can test before pushing.
- A first live run to learn the real tender count, so `MIN_COUNT` means
  something. It's a placeholder `1` right now.
- A read of `eprocure.gov.in/robots.txt` and their terms **before** any
  automated scraping starts.

Property and vehicle have no pipeline and no page — those are from scratch.

---

## If something goes wrong

**Site shows 404 after Pages is on** — Folder isn't `/docs`, or the first build
hasn't finished. Wait 5 minutes, then re-check Settings → Pages.

**Site loads but looks unstyled** — Google Fonts is the only external
dependency. Usually just a slow first load.

**`git push` rejected** — you probably ticked "Add a README" in Step 2. Fix:
`git pull --rebase origin main` then push again.

**Domain shows GitHub's 404 page** — DNS resolved but the custom domain isn't
saved in Settings → Pages, or `docs/CNAME` didn't get committed. Check both.

**Certificate error on HTTPS** — normal for the first hour. If it persists, in
Settings → Pages remove the custom domain, save, re-add it, save.
