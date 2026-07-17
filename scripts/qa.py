#!/usr/bin/env python3
"""
qa.py — QA suite for bharat.commercios.com

    python3 scripts/qa.py            # structure + accessibility only (fast, offline)
    python3 scripts/qa.py --links    # also check every outbound link resolves

Exits non-zero if any ERROR is found, so it can gate a deploy or run in CI.

Why this exists: a dead link on a page telling someone how to save their land is
worse than no page. Bhumi Jankari died silently and only a hand-check caught it.
"""
import sys, os, re, glob, json
from html.parser import HTMLParser

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs')
CHECK_LINKS = '--links' in sys.argv
errors, warnings = [], []


def err(page, msg):  errors.append(f"{page}: {msg}")
def warn(page, msg): warnings.append(f"{page}: {msg}")


class Balance(HTMLParser):
    VOID = {'meta','link','br','img','hr','input','source','area','base','col','embed','track','wbr'}
    def __init__(self): super().__init__(); self.stack=[]; self.bad=[]
    def handle_starttag(self, t, a):
        if t not in self.VOID: self.stack.append(t)
    def handle_endtag(self, t):
        if self.stack and self.stack[-1] == t: self.stack.pop()
        elif t in self.stack:
            self.bad.append(t)
            while self.stack and self.stack.pop() != t: pass


def check(path):
    page = os.path.relpath(path, ROOT)
    h = open(path, encoding='utf-8').read()

    # --- structure -----------------------------------------------------------
    b = Balance(); b.feed(h)
    if b.bad:      err(page, f"mismatched tags: {set(b.bad)}")
    if b.stack:    err(page, f"unclosed at EOF: {b.stack}")

    n_h1 = len(re.findall(r'<h1[\s>]', h))
    if n_h1 != 1: err(page, f"expected exactly 1 <h1>, found {n_h1}")

    # --- accessibility (WCAG 2.1 AA essentials; GIGW's own bar) --------------
    if not re.search(r'<html[^>]+lang=', h):       err(page, "missing <html lang>")
    if not re.search(r'<main[\s>]', h):            err(page, "missing <main> landmark")
    if not re.search(r'class="skip"', h):          err(page, "missing skip-to-content link")
    if not re.search(r'<nav[^>]+aria-label', h):   warn(page, "<nav> without aria-label")
    for img in re.findall(r'<img[^>]*>', h):
        if 'alt=' not in img: err(page, f"<img> without alt: {img[:60]}")

    # --- discoverability -----------------------------------------------------
    if not re.search(r'rel="canonical"', h):       warn(page, "no canonical URL")
    if not re.search(r'property="og:title"', h):   warn(page, "no og: tags (WhatsApp shares render bare)")
    if not re.search(r'<meta name="description"', h): warn(page, "no meta description")

    # --- trust ---------------------------------------------------------------
    if 'reviewed' not in h and 'Checked against' not in h and 'Verified against' not in h:
        warn(page, "no 'last reviewed' date shown to users")
    if not re.search(r'not the government|not a lawyer|We are not', h, re.I):
        warn(page, "no disclaimer that we are not the government")

    # --- external links ------------------------------------------------------
    links = sorted(set(re.findall(r'href="(https?://[^"]+)"', h)))
    links = [l for l in links if 'fonts.g' not in l]
    for l in links:
        if l.startswith('http://'): warn(page, f"insecure http:// link: {l}")
    return page, links


def check_links(all_links):
    import urllib.request
    print("\n=== outbound links ===")
    seen = {}
    for page, links in all_links:
        for url in links:
            if url in seen: continue
            req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0 (compatible; bharat-qa)'})
            try:
                with urllib.request.urlopen(req, timeout=20) as r:
                    seen[url] = r.status
            except Exception as e:
                seen[url] = getattr(e, 'code', None) or str(e)[:40]
            ok = seen[url] in (200, 301, 302, 403)   # 403 = bot-blocked but live for humans
            print(f"  {'ok ' if ok else '⚠️ '} [{seen[url]}] {url}")
            if not ok:
                err(page, f"dead link [{seen[url]}]: {url}")


def main():
    pages = sorted(glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True))
    if not pages:
        print("no pages found"); sys.exit(1)
    print(f"=== QA: {len(pages)} pages ===")
    all_links = []
    for p in pages:
        page, links = check(p)
        all_links.append((page, links))
        print(f"  checked {page} ({len(links)} outbound)")

    if CHECK_LINKS:
        check_links(all_links)

    print()
    if warnings:
        print(f"--- {len(warnings)} warning(s)")
        for w in warnings: print(f"  ! {w}")
    if errors:
        print(f"\n--- {len(errors)} ERROR(s)")
        for e in errors: print(f"  ✗ {e}")
        print("\nFAIL"); sys.exit(1)
    print("PASS — no errors")


if __name__ == '__main__':
    main()
