#!/usr/bin/env python3
"""
VC scraper using Browserbase cloud browsers — handles JS-rendered pages and rate limits.
Targets:
  1. Signal NFX public investor list (https://signal.nfx.com/investors)
  2. Crunchbase.com/organizations (top VC firms)
  3. vcguide.co public investor list
"""

import os
import time
import json
import re
import requests
from playwright.sync_api import sync_playwright

BROWSERBASE_API_KEY = os.environ.get("BROWSERBASE_API_KEY", "bb_live_sDdTjSGuxmEY8OIpTh4rz-ORF4M")
BROWSERBASE_PROJECT_ID = os.environ.get("BROWSERBASE_PROJECT_ID", "a9e0cd20-6608-4645-b372-dd73815145d6")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://tnloaqibvtekphwjehwc.supabase.co")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

WS_ENDPOINT = "wss://connect.browserbase.com"


def create_session() -> str:
    resp = requests.post(
        "https://api.browserbase.com/v1/sessions",
        headers={"x-bb-api-key": BROWSERBASE_API_KEY, "Content-Type": "application/json"},
        json={"projectId": BROWSERBASE_PROJECT_ID},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["id"]


def upsert_vcs(records: list[dict]) -> int:
    if not records:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/vcs?on_conflict=name"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    resp = requests.post(url, headers=headers, json=records, timeout=30)
    if resp.status_code not in (200, 201):
        print(f"  [WARN] upsert {resp.status_code}: {resp.text[:200]}")
        return 0
    return len(records)


def normalize_stages(stages: list) -> list:
    out = []
    for s in stages:
        sl = str(s).lower().replace(" ", "-")
        if "pre" in sl:
            out.append("pre-seed")
        elif "seed" in sl:
            out.append("seed")
        elif "series-a" in sl or sl == "a":
            out.append("series-a")
        elif "series-b" in sl or sl == "b":
            out.append("series-b")
        elif "series-c" in sl or sl == "c":
            out.append("series-c")
        elif "growth" in sl or "late" in sl:
            out.append("growth")
        else:
            out.append(sl)
    return list(dict.fromkeys(out))


def scrape_signal_nfx(page) -> list[dict]:
    """Scrape Signal NFX public investor directory."""
    print("  Navigating to signal.nfx.com/investors ...")
    records = []

    try:
        page.goto("https://signal.nfx.com/investors", wait_until="networkidle", timeout=30000)
        time.sleep(3)

        # Signal NFX loads investor cards via React — scroll to load more
        prev_count = 0
        for scroll_round in range(20):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)

            cards = page.query_selector_all("[data-testid='investor-card'], .investor-card, [class*='InvestorCard'], [class*='investor-card']")
            if not cards:
                # Try alternative selectors
                cards = page.query_selector_all("a[href*='/investors/']")

            if len(cards) == prev_count and scroll_round > 2:
                print(f"  Stopped scrolling at {len(cards)} cards")
                break
            prev_count = len(cards)
            print(f"  Scroll {scroll_round+1}: {len(cards)} cards")

        # Extract data from cards
        for card in cards:
            try:
                name_el = card.query_selector("h2, h3, [class*='name'], [class*='Name']")
                name = name_el.inner_text().strip() if name_el else None
                if not name:
                    # Try getting from href
                    href = card.get_attribute("href") or ""
                    if "/investors/" in href:
                        slug = href.split("/investors/")[-1].split("?")[0]
                        name = slug.replace("-", " ").title()
                if not name:
                    continue

                desc_el = card.query_selector("p, [class*='bio'], [class*='description']")
                desc = desc_el.inner_text().strip()[:500] if desc_el else None

                sector_els = card.query_selector_all("[class*='tag'], [class*='Tag'], [class*='sector'], [class*='theme']")
                sectors = [el.inner_text().strip() for el in sector_els if el.inner_text().strip()]

                stage_els = card.query_selector_all("[class*='stage'], [class*='Stage']")
                stages = [el.inner_text().strip() for el in stage_els if el.inner_text().strip()]

                geo_els = card.query_selector_all("[class*='location'], [class*='geo'], [class*='region']")
                geos = [el.inner_text().strip() for el in geo_els if el.inner_text().strip()]

                href = card.get_attribute("href") or ""
                source_url = f"https://signal.nfx.com{href}" if href.startswith("/") else href

                records.append({
                    "name": name,
                    "website": None,
                    "description": desc,
                    "focus_sectors": sectors[:8],
                    "stage_preference": normalize_stages(stages),
                    "check_size_min": None,
                    "check_size_max": None,
                    "geo_focus": geos[:5],
                    "notable_portfolio": [],
                    "source_url": source_url,
                    "source": "signal_nfx_live",
                })
            except Exception as e:
                continue

        # Also try the JSON API endpoint now that we have a real browser session
        print("  Trying Signal NFX JSON API ...")
        for page_num in range(1, 15):
            try:
                resp = page.request.get(
                    f"https://signal.nfx.com/investors.json?page={page_num}&per_page=50",
                    headers={"Accept": "application/json"},
                )
                if resp.status != 200:
                    break
                data = resp.json()
                investors = data.get("investors") or (data if isinstance(data, list) else [])
                if not investors:
                    break
                for inv in investors:
                    name = (inv.get("name") or inv.get("firm_name") or "").strip()
                    if not name:
                        continue
                    # Check for duplicate names already scraped
                    if any(r["name"].lower() == name.lower() for r in records):
                        continue
                    sectors = inv.get("investment_themes") or inv.get("sectors") or []
                    if isinstance(sectors, str):
                        sectors = [s.strip() for s in sectors.split(",")]
                    stages = inv.get("stages") or inv.get("investment_stages") or []
                    geo = inv.get("locations") or inv.get("geography") or []
                    if isinstance(geo, str):
                        geo = [g.strip() for g in geo.split(",")]
                    portfolio = inv.get("notable_portfolio_companies") or []
                    records.append({
                        "name": name,
                        "website": inv.get("website") or inv.get("url"),
                        "description": inv.get("bio") or inv.get("description"),
                        "focus_sectors": [str(s) for s in sectors][:8],
                        "stage_preference": normalize_stages(stages),
                        "check_size_min": None,
                        "check_size_max": None,
                        "geo_focus": [str(g) for g in geo][:5],
                        "notable_portfolio": [str(p) for p in portfolio][:10],
                        "source_url": f"https://signal.nfx.com/investors/{inv.get('slug', '')}",
                        "source": "signal_nfx_live",
                    })
                print(f"  API page {page_num}: {len(investors)} investors")
                time.sleep(1)
            except Exception as e:
                print(f"  API page {page_num} failed: {e}")
                break

    except Exception as e:
        print(f"  Signal NFX error: {e}")

    # Deduplicate
    seen = set()
    deduped = []
    for r in records:
        k = r["name"].lower()
        if k not in seen:
            seen.add(k)
            deduped.append(r)
    print(f"  Signal NFX: {len(deduped)} unique records")
    return deduped


def scrape_vcguide(page) -> list[dict]:
    """Scrape vcguide.co public VC list."""
    print("  Navigating to vcguide.co ...")
    records = []
    try:
        page.goto("https://vcguide.co", wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # Try to find the fund listings
        links = page.query_selector_all("a[href*='/fund/'], a[href*='/vc/'], a[href*='/investor/']")
        print(f"  Found {len(links)} fund links")

        fund_urls = list(set([
            l.get_attribute("href") for l in links
            if l.get_attribute("href") and ("/fund/" in l.get_attribute("href") or "/vc/" in l.get_attribute("href"))
        ]))[:50]

        for url in fund_urls[:30]:
            try:
                full_url = f"https://vcguide.co{url}" if url.startswith("/") else url
                page.goto(full_url, wait_until="domcontentloaded", timeout=15000)
                time.sleep(1.5)

                name_el = page.query_selector("h1")
                name = name_el.inner_text().strip() if name_el else None
                if not name:
                    continue

                desc_el = page.query_selector("p.description, .fund-description, main p")
                desc = desc_el.inner_text().strip()[:500] if desc_el else None

                sector_els = page.query_selector_all("[class*='sector'], [class*='tag'], .badge")
                sectors = [el.inner_text().strip() for el in sector_els if el.inner_text().strip()]

                records.append({
                    "name": name,
                    "website": None,
                    "description": desc,
                    "focus_sectors": sectors[:8],
                    "stage_preference": [],
                    "check_size_min": None,
                    "check_size_max": None,
                    "geo_focus": [],
                    "notable_portfolio": [],
                    "source_url": full_url,
                    "source": "vcguide",
                })
            except Exception:
                continue

    except Exception as e:
        print(f"  vcguide.co error: {e}")

    seen = set()
    deduped = [r for r in records if r["name"].lower() not in seen and not seen.add(r["name"].lower())]
    print(f"  vcguide: {len(deduped)} records")
    return deduped


def scrape_crunchbase_vcs(page) -> list[dict]:
    """Scrape Crunchbase search results for top VC investors."""
    print("  Navigating to Crunchbase investor search ...")
    records = []

    try:
        page.goto(
            "https://www.crunchbase.com/search/principal.investors/field/investors/facet_ids/financial-investors",
            wait_until="networkidle",
            timeout=30000,
        )
        time.sleep(4)

        # Scroll to load more results
        for _ in range(5):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(2)

        # Extract investor cards
        cards = page.query_selector_all("[data-testid='investor-result'], .search-result, [class*='ResultCard']")
        if not cards:
            cards = page.query_selector_all("a[href*='/organization/']")
        print(f"  Crunchbase cards found: {len(cards)}")

        for card in cards[:100]:
            try:
                name_el = card.query_selector("h3, h2, [class*='name']")
                name = name_el.inner_text().strip() if name_el else None
                if not name:
                    href = card.get_attribute("href") or ""
                    if "/organization/" in href:
                        name = href.split("/organization/")[-1].replace("-", " ").title()
                if not name:
                    continue

                desc_el = card.query_selector("p, [class*='description']")
                desc = desc_el.inner_text().strip()[:400] if desc_el else None

                href = card.get_attribute("href") or ""
                if not href:
                    link_el = card.query_selector("a")
                    href = link_el.get_attribute("href") if link_el else ""

                source_url = f"https://www.crunchbase.com{href}" if href.startswith("/") else href

                records.append({
                    "name": name,
                    "website": None,
                    "description": desc,
                    "focus_sectors": [],
                    "stage_preference": [],
                    "check_size_min": None,
                    "check_size_max": None,
                    "geo_focus": [],
                    "notable_portfolio": [],
                    "source_url": source_url,
                    "source": "crunchbase_live",
                })
            except Exception:
                continue

    except Exception as e:
        print(f"  Crunchbase error: {e}")

    seen = set()
    deduped = [r for r in records if r["name"].lower() not in seen and not seen.add(r["name"].lower())]
    print(f"  Crunchbase: {len(deduped)} records")
    return deduped


def scrape_f6s_vcs(page) -> list[dict]:
    """Scrape f6s.com/funds — public VC/accelerator directory."""
    print("  Navigating to f6s.com/funds ...")
    records = []
    try:
        page.goto("https://www.f6s.com/funds", wait_until="networkidle", timeout=30000)
        time.sleep(3)
        for _ in range(8):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1.5)

        cards = page.query_selector_all(".fund-card, [class*='FundCard'], [class*='fund-item'], a[href*='/fund/']")
        print(f"  f6s fund cards: {len(cards)}")

        for card in cards[:100]:
            try:
                name_el = card.query_selector("h2, h3, .fund-name, [class*='name']")
                name = name_el.inner_text().strip() if name_el else None
                if not name:
                    continue

                desc_el = card.query_selector("p, .description, [class*='description']")
                desc = desc_el.inner_text().strip()[:400] if desc_el else None

                tag_els = card.query_selector_all(".tag, [class*='tag'], [class*='badge']")
                tags = [el.inner_text().strip() for el in tag_els if el.inner_text().strip()]

                href = card.get_attribute("href") or ""
                if not href:
                    link = card.query_selector("a")
                    href = link.get_attribute("href") if link else ""
                source_url = f"https://www.f6s.com{href}" if href.startswith("/") else href

                records.append({
                    "name": name,
                    "website": None,
                    "description": desc,
                    "focus_sectors": tags[:6],
                    "stage_preference": [],
                    "check_size_min": None,
                    "check_size_max": None,
                    "geo_focus": [],
                    "notable_portfolio": [],
                    "source_url": source_url,
                    "source": "f6s_live",
                })
            except Exception:
                continue
    except Exception as e:
        print(f"  f6s error: {e}")

    seen = set()
    deduped = [r for r in records if r["name"].lower() not in seen and not seen.add(r["name"].lower())]
    print(f"  f6s: {len(deduped)} records")
    return deduped


def main():
    print("Starting Browserbase VC scraper...")
    print(f"Project ID: {BROWSERBASE_PROJECT_ID}")

    if not SERVICE_ROLE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
        return

    # Get current count
    h = {"apikey": SERVICE_ROLE_KEY, "Authorization": f"Bearer {SERVICE_ROLE_KEY}", "Prefer": "count=exact"}
    resp = requests.head(f"{SUPABASE_URL}/rest/v1/vcs?select=count", headers=h, timeout=10)
    print(f"Current DB count: {resp.headers.get('content-range', 'unknown')}")

    all_records = []

    with sync_playwright() as p:
        # Create Browserbase session
        print("\nCreating Browserbase session...")
        session_id = create_session()
        print(f"Session ID: {session_id}")

        browser = p.chromium.connect_over_cdp(
            f"{WS_ENDPOINT}?apiKey={BROWSERBASE_API_KEY}&sessionId={session_id}"
        )
        context = browser.contexts[0]
        page = context.new_page()

        # Set a reasonable timeout
        page.set_default_timeout(20000)

        # 1. Signal NFX
        print("\n[1/4] Signal NFX...")
        try:
            signal_records = scrape_signal_nfx(page)
            all_records.extend(signal_records)
        except Exception as e:
            print(f"Signal NFX failed: {e}")

        # 2. Crunchbase
        print("\n[2/4] Crunchbase...")
        try:
            cb_records = scrape_crunchbase_vcs(page)
            all_records.extend(cb_records)
        except Exception as e:
            print(f"Crunchbase failed: {e}")

        # 3. F6S
        print("\n[3/4] F6S.com...")
        try:
            f6s_records = scrape_f6s_vcs(page)
            all_records.extend(f6s_records)
        except Exception as e:
            print(f"F6S failed: {e}")

        # 4. VCguide
        print("\n[4/4] vcguide.co...")
        try:
            vg_records = scrape_vcguide(page)
            all_records.extend(vg_records)
        except Exception as e:
            print(f"vcguide failed: {e}")

        browser.close()

    print(f"\nTotal scraped (pre-dedup): {len(all_records)}")

    # Global dedup by name
    seen = set()
    deduped = []
    for r in all_records:
        k = r["name"].lower().strip()
        if k and k not in seen:
            seen.add(k)
            deduped.append(r)
    print(f"After dedup: {len(deduped)}")

    # Load into Supabase
    total_loaded = 0
    for i in range(0, len(deduped), 50):
        batch = deduped[i:i+50]
        loaded = upsert_vcs(batch)
        total_loaded += loaded
    print(f"Loaded into Supabase: {total_loaded}")

    # Final count
    resp = requests.head(f"{SUPABASE_URL}/rest/v1/vcs?select=count", headers=h, timeout=10)
    print(f"Final DB count: {resp.headers.get('content-range', 'unknown')}")

    return total_loaded


if __name__ == "__main__":
    main()
