#!/usr/bin/env python3
"""
VC Data Scraper — Phase 1
Sources: Signal.nfx.com/investors, curated public VC lists, firm websites
Target: 500+ VC records loaded into Supabase vcs table
"""

import os
import json
import time
import urllib.robotparser
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin

# Supabase config
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://tnloaqibvtekphwjehwc.supabase.co")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; vc-match-kit-scraper/1.0; +https://vcmatch.3vo.ai)",
    "Accept": "text/html,application/xhtml+xml",
}

robots_cache = {}


def can_fetch(url: str) -> bool:
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    if base not in robots_cache:
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(f"{base}/robots.txt")
        try:
            rp.read()
        except Exception:
            rp = None
        robots_cache[base] = rp
    rp = robots_cache[base]
    if rp is None:
        return True
    return rp.can_fetch("*", url)


def upsert_vcs(records: list[dict]) -> int:
    if not records:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/vcs"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    # Supabase upsert requires on_conflict — we'll use name as dedup key
    resp = requests.post(
        url + "?on_conflict=name",
        headers=headers,
        json=records,
        timeout=30,
    )
    if resp.status_code not in (200, 201):
        print(f"  [WARN] upsert error {resp.status_code}: {resp.text[:200]}")
        return 0
    return len(records)


# ---------------------------------------------------------------------------
# Source 1: Signal.nfx.com/investors — public investor directory
# ---------------------------------------------------------------------------

def scrape_signal_nfx(max_pages: int = 15) -> list[dict]:
    """
    Signal NFX has a public investor directory at signal.nfx.com/investors
    It loads JSON data via API calls.
    """
    print("Scraping Signal NFX investor list...")
    base_api = "https://signal.nfx.com/investors.json"
    records = []

    for page in range(1, max_pages + 1):
        url = f"{base_api}?page={page}&per_page=50"
        if not can_fetch(url):
            print(f"  robots.txt disallows {url}, skipping")
            break
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                print(f"  page {page}: HTTP {resp.status_code}, stopping")
                break
            data = resp.json()
            investors = data.get("investors") or data if isinstance(data, list) else []
            if not investors:
                break
            for inv in investors:
                record = _map_signal_investor(inv)
                if record:
                    records.append(record)
            print(f"  page {page}: {len(investors)} investors, total so far: {len(records)}")
            time.sleep(1.5)
        except Exception as e:
            print(f"  page {page} error: {e}")
            break

    print(f"Signal NFX: {len(records)} records collected")
    return records


def _map_signal_investor(inv: dict) -> dict | None:
    name = inv.get("name") or inv.get("firm_name") or inv.get("organization_name")
    if not name:
        return None
    sectors = inv.get("investment_themes") or inv.get("sectors") or []
    if isinstance(sectors, str):
        sectors = [s.strip() for s in sectors.split(",") if s.strip()]
    stages = inv.get("stages") or inv.get("investment_stages") or []
    if isinstance(stages, str):
        stages = [s.strip() for s in stages.split(",") if s.strip()]
    geo = inv.get("locations") or inv.get("geography") or []
    if isinstance(geo, str):
        geo = [g.strip() for g in geo.split(",") if g.strip()]
    portfolio = inv.get("notable_portfolio_companies") or []
    check_min = inv.get("min_investment")
    check_max = inv.get("max_investment")
    return {
        "name": name.strip(),
        "website": inv.get("website") or inv.get("url"),
        "description": inv.get("bio") or inv.get("description"),
        "focus_sectors": [str(s) for s in sectors],
        "stage_preference": _normalize_stages(stages),
        "check_size_min": _parse_check_size(check_min),
        "check_size_max": _parse_check_size(check_max),
        "geo_focus": [str(g) for g in geo],
        "notable_portfolio": [str(p) for p in portfolio][:10],
        "linkedin_url": inv.get("linkedin_url"),
        "twitter_url": inv.get("twitter_url") or inv.get("twitter"),
        "source_url": inv.get("signal_url") or f"https://signal.nfx.com/investors/{inv.get('slug', '')}",
        "source": "signal_nfx",
    }


# ---------------------------------------------------------------------------
# Source 2: Crunchbase public organization pages (limited, robots.txt respecting)
# ---------------------------------------------------------------------------

def scrape_crunchbase_public(vc_slugs: list[str]) -> list[dict]:
    """
    Scrape a list of known VC firm public Crunchbase pages.
    Respects robots.txt — only fetches publicly accessible pages.
    """
    print(f"Scraping {len(vc_slugs)} Crunchbase profiles...")
    records = []
    base = "https://www.crunchbase.com/organization/"
    for slug in vc_slugs:
        url = f"{base}{slug}"
        if not can_fetch(url):
            continue
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                continue
            soup = BeautifulSoup(resp.text, "lxml")
            record = _parse_crunchbase_page(soup, url, slug)
            if record:
                records.append(record)
            time.sleep(2)
        except Exception as e:
            print(f"  {slug}: {e}")
    print(f"Crunchbase: {len(records)} records collected")
    return records


def _parse_crunchbase_page(soup: BeautifulSoup, url: str, slug: str) -> dict | None:
    try:
        name_el = soup.find("h1") or soup.find("title")
        name = name_el.get_text(strip=True) if name_el else slug.replace("-", " ").title()
        desc_el = soup.find("p", {"class": lambda c: c and "description" in c.lower()}) if soup else None
        desc = desc_el.get_text(strip=True) if desc_el else None
        return {
            "name": name,
            "website": None,
            "description": desc,
            "focus_sectors": [],
            "stage_preference": [],
            "check_size_min": None,
            "check_size_max": None,
            "geo_focus": [],
            "notable_portfolio": [],
            "source_url": url,
            "source": "crunchbase",
        }
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Source 3: Curated VC dataset — comprehensive static seed
# ---------------------------------------------------------------------------

CURATED_VCS = [
    # Tier-1 Established Funds
    {"name": "Sequoia Capital", "website": "https://www.sequoiacap.com", "focus_sectors": ["Technology", "Consumer", "Healthcare", "Fintech", "Enterprise SaaS"], "stage_preference": ["seed", "series-a", "series-b", "growth"], "check_size_min": 1000, "check_size_max": 100000, "geo_focus": ["United States", "Global"], "notable_portfolio": ["Apple", "Google", "Airbnb", "WhatsApp", "Stripe", "OpenAI"], "description": "Global venture capital firm focused on technology and healthcare companies.", "source": "curated"},
    {"name": "Andreessen Horowitz (a16z)", "website": "https://a16z.com", "focus_sectors": ["Software", "Crypto", "Bio", "Consumer", "Fintech", "AI"], "stage_preference": ["seed", "series-a", "series-b", "growth"], "check_size_min": 500, "check_size_max": 200000, "geo_focus": ["United States", "Global"], "notable_portfolio": ["GitHub", "Coinbase", "Lyft", "Airbnb", "Slack", "Roblox"], "description": "Leading venture capital firm investing from seed to growth across software, fintech, crypto, and bio.", "source": "curated"},
    {"name": "Accel", "website": "https://www.accel.com", "focus_sectors": ["Enterprise SaaS", "Security", "Consumer", "Fintech"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 50000, "geo_focus": ["United States", "Europe", "India"], "notable_portfolio": ["Facebook", "Dropbox", "Slack", "Atlassian", "CrowdStrike"], "description": "Global venture firm focused on early-stage and growth investments in technology.", "source": "curated"},
    {"name": "Benchmark", "website": "https://www.benchmark.com", "focus_sectors": ["Consumer", "Enterprise", "Marketplace"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 15000, "geo_focus": ["United States"], "notable_portfolio": ["Twitter", "Uber", "Snapchat", "eBay", "WeWork"], "description": "Early-stage venture capital firm focusing on transformative consumer and enterprise companies.", "source": "curated"},
    {"name": "Kleiner Perkins", "website": "https://www.kleinerperkins.com", "focus_sectors": ["Enterprise", "Consumer", "Healthcare", "Greentech"], "stage_preference": ["series-a", "series-b"], "check_size_min": 1000, "check_size_max": 50000, "geo_focus": ["United States"], "notable_portfolio": ["Google", "Amazon", "Twitter", "Genentech", "DoorDash"], "description": "Legacy venture firm investing in breakthrough technology and life sciences.", "source": "curated"},
    {"name": "Greylock Partners", "website": "https://greylock.com", "focus_sectors": ["Enterprise SaaS", "Consumer", "Security", "AI"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 25000, "geo_focus": ["United States"], "notable_portfolio": ["LinkedIn", "Airbnb", "Facebook", "Discord", "Figma"], "description": "Enterprise and consumer technology investor focused on founders building transformative companies.", "source": "curated"},
    {"name": "Lightspeed Venture Partners", "website": "https://lsvp.com", "focus_sectors": ["Enterprise", "Consumer", "Fintech", "Healthcare", "Deep Tech"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 50000, "geo_focus": ["United States", "India", "China", "Israel", "Europe"], "notable_portfolio": ["Snap", "Nutanix", "AppDynamics", "MuleSoft"], "description": "Multi-stage venture capital firm with global reach across US, India, China, and Europe.", "source": "curated"},
    {"name": "Index Ventures", "website": "https://www.indexventures.com", "focus_sectors": ["Consumer", "Enterprise", "Fintech", "Gaming", "Healthcare"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 50000, "geo_focus": ["Europe", "United States"], "notable_portfolio": ["Dropbox", "Figma", "Discord", "Etsy", "Robinhood"], "description": "Transatlantic venture capital firm backing ambitious founders from seed to IPO.", "source": "curated"},
    {"name": "New Enterprise Associates (NEA)", "website": "https://www.nea.com", "focus_sectors": ["Healthcare", "Technology", "Enterprise SaaS", "Consumer"], "stage_preference": ["series-a", "series-b", "growth"], "check_size_min": 1000, "check_size_max": 75000, "geo_focus": ["United States", "India", "China"], "notable_portfolio": ["Salesforce", "Workday", "Robinhood", "Duolingo"], "description": "One of the world's largest VC firms with over 200 portfolio companies.", "source": "curated"},
    {"name": "General Catalyst", "website": "https://www.generalcatalyst.com", "focus_sectors": ["Enterprise SaaS", "Consumer", "Healthcare", "Climate", "Fintech"], "stage_preference": ["seed", "series-a", "series-b", "growth"], "check_size_min": 500, "check_size_max": 100000, "geo_focus": ["United States", "Europe"], "notable_portfolio": ["Stripe", "Airbnb", "HubSpot", "Warby Parker", "Snap"], "description": "Venture capital and growth equity firm investing in enterprise and consumer technology.", "source": "curated"},

    # Pre-seed / Seed Specialists
    {"name": "Y Combinator", "website": "https://www.ycombinator.com", "focus_sectors": ["Technology", "SaaS", "Consumer", "Fintech", "Healthcare", "AI"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 125, "check_size_max": 500, "geo_focus": ["Global"], "notable_portfolio": ["Airbnb", "Dropbox", "Stripe", "Reddit", "DoorDash", "Twitch"], "description": "The world's most successful startup accelerator investing $500K in early-stage companies.", "source": "curated"},
    {"name": "First Round Capital", "website": "https://firstround.com", "focus_sectors": ["Enterprise SaaS", "Consumer", "Fintech", "Healthcare"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States"], "notable_portfolio": ["Uber", "Square", "Warby Parker", "Notion", "Roblox"], "description": "Seed-stage venture capital firm deeply focused on helping founders build great companies.", "source": "curated"},
    {"name": "Precursor Ventures", "website": "https://precursorvc.com", "focus_sectors": ["Technology", "SaaS", "Consumer", "Fintech"], "stage_preference": ["pre-seed"], "check_size_min": 100, "check_size_max": 500, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Pre-seed focused fund investing in companies before product-market fit.", "source": "curated"},
    {"name": "Hustle Fund", "website": "https://www.hustlefund.vc", "focus_sectors": ["Technology", "SaaS", "Fintech", "Consumer"], "stage_preference": ["pre-seed"], "check_size_min": 25, "check_size_max": 250, "geo_focus": ["United States", "Southeast Asia"], "notable_portfolio": [], "description": "Pre-seed fund investing $25K–$150K in fast-moving founders.", "source": "curated"},
    {"name": "Pear VC", "website": "https://pear.vc", "focus_sectors": ["Enterprise SaaS", "Consumer", "Healthcare", "AI"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 2500, "geo_focus": ["United States"], "notable_portfolio": ["DoorDash", "Branch", "Guardant Health"], "description": "Pre-seed and seed VC helping founders build companies from day zero.", "source": "curated"},
    {"name": "Village Global", "website": "https://www.villageglobal.vc", "focus_sectors": ["Technology", "SaaS", "Consumer", "Fintech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Network-driven seed fund backed by tech luminaries.", "source": "curated"},
    {"name": "Initialized Capital", "website": "https://initialized.com", "focus_sectors": ["Developer Tools", "SaaS", "Consumer", "Crypto"], "stage_preference": ["seed", "series-a"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States"], "notable_portfolio": ["Coinbase", "Instacart", "Flexport", "Cruise"], "description": "Seed and Series A fund co-founded by Alexis Ohanian and Garry Tan.", "source": "curated"},
    {"name": "South Park Commons", "website": "https://www.southparkcommons.com", "focus_sectors": ["Deep Tech", "AI", "Biotech", "Infrastructure"], "stage_preference": ["pre-seed"], "check_size_min": 250, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Community for founders in the earliest stages of exploration.", "source": "curated"},
    {"name": "Afore Capital", "website": "https://afore.vc", "focus_sectors": ["Technology", "SaaS", "Consumer"], "stage_preference": ["pre-seed"], "check_size_min": 250, "check_size_max": 1500, "geo_focus": ["United States", "Latin America"], "notable_portfolio": [], "description": "Pre-product, pre-seed VC investing at inception.", "source": "curated"},
    {"name": "BoxGroup", "website": "https://www.boxgroup.com", "focus_sectors": ["Consumer", "Fintech", "Healthcare", "Enterprise"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": ["Plaid", "Ro", "Oscar Health", "Warby Parker"], "description": "NYC-based pre-seed and seed investor writing first checks.", "source": "curated"},

    # Fintech Specialists
    {"name": "QED Investors", "website": "https://qedinvestors.com", "focus_sectors": ["Fintech", "Payments", "Insurance", "Lending"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 20000, "geo_focus": ["United States", "Latin America", "Europe", "Africa"], "notable_portfolio": ["Credit Karma", "SoFi", "Avant", "Nubank", "Klarna"], "description": "Fintech-focused VC with over 150 portfolio companies globally.", "source": "curated"},
    {"name": "Ribbit Capital", "website": "https://ribbitcap.com", "focus_sectors": ["Fintech", "Crypto", "Insurance", "Payments"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 50000, "geo_focus": ["Global"], "notable_portfolio": ["Robinhood", "Coinbase", "Nubank", "Credit Karma"], "description": "Fintech-focused global venture fund.", "source": "curated"},
    {"name": "Nyca Partners", "website": "https://nycapartners.com", "focus_sectors": ["Fintech", "Payments", "Lending", "RegTech"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Fintech-specialist VC fund with deep operator expertise.", "source": "curated"},
    {"name": "Flourish Ventures", "website": "https://flourishventures.com", "focus_sectors": ["Fintech", "Financial Inclusion", "Insurance"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["Global", "Emerging Markets"], "notable_portfolio": [], "description": "Fintech venture fund focused on financial health and inclusion.", "source": "curated"},
    {"name": "Commerce Ventures", "website": "https://www.commerceventures.com", "focus_sectors": ["Fintech", "Commerce", "Payments", "Supply Chain"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Seed and Series A fintech investor focused on retail and payments innovation.", "source": "curated"},

    # Healthcare Specialists
    {"name": "a16z Bio + Health", "website": "https://bio.a16z.com", "focus_sectors": ["Healthcare", "Biotech", "Digital Health", "Drug Discovery"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 100000, "geo_focus": ["United States"], "notable_portfolio": ["Nuvation Bio", "Devoted Health", "Mammoth Biosciences"], "description": "Andreessen Horowitz's dedicated bio and health division.", "source": "curated"},
    {"name": "Rock Health", "website": "https://rockhealth.com", "focus_sectors": ["Digital Health", "Healthcare IT", "Telehealth"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Digital health focused venture fund and accelerator.", "source": "curated"},
    {"name": "Bessemer Venture Partners", "website": "https://www.bvp.com", "focus_sectors": ["Cloud SaaS", "Healthcare", "Consumer", "Fintech", "Deep Tech"], "stage_preference": ["seed", "series-a", "series-b", "growth"], "check_size_min": 500, "check_size_max": 75000, "geo_focus": ["United States", "Israel", "India"], "notable_portfolio": ["LinkedIn", "Shopify", "Twitch", "Yelp", "Pinterest"], "description": "One of the oldest and most successful VC firms globally.", "source": "curated"},
    {"name": "GV (Google Ventures)", "website": "https://www.gv.com", "focus_sectors": ["AI/ML", "Healthcare", "Life Sciences", "SaaS", "Consumer"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 30000, "geo_focus": ["United States", "Europe"], "notable_portfolio": ["Uber", "Slack", "Nest", "23andMe", "Flatiron Health"], "description": "Alphabet's venture capital arm investing across all stages.", "source": "curated"},
    {"name": "ARCH Venture Partners", "website": "https://www.archventure.com", "focus_sectors": ["Life Sciences", "Biotech", "Healthcare", "Deep Tech"], "stage_preference": ["seed", "series-a"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": ["Illumina", "Juno Therapeutics", "Agenus"], "description": "Life sciences and deep tech venture firm with roots in university research commercialization.", "source": "curated"},

    # Enterprise SaaS Specialists
    {"name": "Tiger Global Management", "website": "https://www.tigerglobal.com", "focus_sectors": ["Technology", "SaaS", "Consumer", "Fintech"], "stage_preference": ["series-b", "series-c", "growth"], "check_size_min": 10000, "check_size_max": 500000, "geo_focus": ["Global"], "notable_portfolio": ["Stripe", "Peloton", "Chime", "ByteDance"], "description": "Global technology investor deploying large checks at growth stage.", "source": "curated"},
    {"name": "Coatue Management", "website": "https://www.coatue.com", "focus_sectors": ["Technology", "Consumer", "Fintech", "SaaS"], "stage_preference": ["series-b", "growth"], "check_size_min": 10000, "check_size_max": 200000, "geo_focus": ["United States", "Asia"], "notable_portfolio": ["Snap", "Lyft", "DoorDash", "Ant Financial"], "description": "Technology-focused hedge fund and venture firm.", "source": "curated"},
    {"name": "Battery Ventures", "website": "https://www.battery.com", "focus_sectors": ["Enterprise SaaS", "Industrial Tech", "Consumer"], "stage_preference": ["seed", "series-a", "series-b", "growth"], "check_size_min": 1000, "check_size_max": 50000, "geo_focus": ["United States", "Israel", "Europe"], "notable_portfolio": ["Groupon", "Glassdoor", "Optimizely", "Wayfair"], "description": "Multi-stage investor focused on enterprise software and emerging tech.", "source": "curated"},
    {"name": "Insight Partners", "website": "https://www.insightpartners.com", "focus_sectors": ["SaaS", "Enterprise Software", "Cybersecurity", "Fintech"], "stage_preference": ["series-b", "series-c", "growth"], "check_size_min": 5000, "check_size_max": 500000, "geo_focus": ["Global"], "notable_portfolio": ["Twitter", "Shopify", "DocuSign", "HubSpot", "Qualtrics"], "description": "Leading global software investor across growth stages.", "source": "curated"},
    {"name": "Sapphire Ventures", "website": "https://sapphireventures.com", "focus_sectors": ["Enterprise SaaS", "Security", "Developer Tools", "AI"], "stage_preference": ["series-a", "series-b"], "check_size_min": 5000, "check_size_max": 50000, "geo_focus": ["United States", "Europe"], "notable_portfolio": ["Zendesk", "Pagerduty", "LinkedIn", "Box"], "description": "Enterprise tech investor backed by SAP.", "source": "curated"},

    # Deep Tech / AI
    {"name": "Lux Capital", "website": "https://luxcapital.com", "focus_sectors": ["Deep Tech", "AI/ML", "Robotics", "Space", "Life Sciences"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 30000, "geo_focus": ["United States"], "notable_portfolio": ["Butterfly Network", "Tenstorrent", "Nuro"], "description": "Deep tech investor focused on science and technology at the frontier.", "source": "curated"},
    {"name": "Eclipse Ventures", "website": "https://eclipse.vc", "focus_sectors": ["Industrial AI", "Robotics", "Automation", "Logistics"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Industrial transformation investor focused on AI and automation.", "source": "curated"},
    {"name": "Founders Fund", "website": "https://foundersfund.com", "focus_sectors": ["Deep Tech", "AI", "Space", "Biotech", "Energy"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 50000, "geo_focus": ["United States"], "notable_portfolio": ["SpaceX", "Palantir", "Stripe", "Airbnb", "Lyft"], "description": "Technology-focused VC firm founded by Peter Thiel.", "source": "curated"},
    {"name": "Khosla Ventures", "website": "https://www.khoslaventures.com", "focus_sectors": ["AI", "Climate Tech", "Healthcare", "Fintech", "Deep Tech"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": ["DoorDash", "Square", "Stripe", "OpenAI", "Okta"], "description": "Radical innovation focused VC firm founded by Vinod Khosla.", "source": "curated"},
    {"name": "Creative Destruction Lab (CDL)", "website": "https://creativedestructionlab.com", "focus_sectors": ["AI", "Deep Tech", "Quantum", "Biotech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 2000, "geo_focus": ["Canada", "United States", "Europe"], "notable_portfolio": [], "description": "Science-based seed program for massively scalable startups.", "source": "curated"},

    # Climate / Sustainability
    {"name": "Breakthrough Energy Ventures", "website": "https://www.breakthroughenergy.org/ventures", "focus_sectors": ["Climate Tech", "Clean Energy", "Carbon Removal", "Agriculture"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 50000, "geo_focus": ["Global"], "notable_portfolio": ["QuantumScape", "Lilac Solutions", "Form Energy"], "description": "Bill Gates-backed fund investing in breakthrough energy innovation.", "source": "curated"},
    {"name": "Energy Impact Partners", "website": "https://www.energyimpactpartners.com", "focus_sectors": ["Clean Energy", "Grid Tech", "Climate", "Transportation"], "stage_preference": ["series-a", "series-b"], "check_size_min": 2000, "check_size_max": 30000, "geo_focus": ["United States", "Europe"], "notable_portfolio": [], "description": "Strategic investment firm focused on the global energy transformation.", "source": "curated"},
    {"name": "Congruent Ventures", "website": "https://congruentvc.com", "focus_sectors": ["Climate Tech", "Sustainability", "Clean Energy", "Circular Economy"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Early-stage climate and sustainability focused VC.", "source": "curated"},
    {"name": "Obvious Ventures", "website": "https://obvious.com", "focus_sectors": ["Sustainable Systems", "People Power", "Healthy Living", "Climate"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": ["Beyond Meat", "Medium", "Remix"], "description": "World Positive investing across sustainable systems, people power, and healthy living.", "source": "curated"},
    {"name": "Union Square Ventures", "website": "https://www.usv.com", "focus_sectors": ["Fintech", "Web3", "Climate", "Education", "Healthcare"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States", "Europe"], "notable_portfolio": ["Twitter", "Tumblr", "Zynga", "Etsy", "Coinbase", "Stripe"], "description": "Thesis-driven VC firm with focus on large networks of engaged users.", "source": "curated"},

    # Geographic Specialists — NYC
    {"name": "Lerer Hippeau", "website": "https://lererhippeau.com", "focus_sectors": ["Consumer", "Media", "Ecommerce", "SaaS", "Healthcare"], "stage_preference": ["seed", "series-a"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["New York", "United States"], "notable_portfolio": ["Warby Parker", "Oscar Health", "Buzzfeed", "Casper"], "description": "NYC-based seed and Series A investor backing category-defining companies.", "source": "curated"},
    {"name": "Primary Venture Partners", "website": "https://primary.vc", "focus_sectors": ["Enterprise SaaS", "Consumer", "Fintech", "Healthcare"], "stage_preference": ["pre-seed", "seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["New York", "United States"], "notable_portfolio": [], "description": "NYC's leading early-stage venture firm.", "source": "curated"},
    {"name": "Greycroft", "website": "https://www.greycroft.com", "focus_sectors": ["Consumer", "Media", "Ecommerce", "SaaS", "AI"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": ["Maker Studios", "Venmo", "Bumble", "Pluto TV", "HuffPost"], "description": "NYC and LA based VC firm investing in digital media and consumer tech.", "source": "curated"},
    {"name": "RRE Ventures", "website": "https://www.rre.com", "focus_sectors": ["Enterprise", "Consumer", "Fintech", "Media"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 15000, "geo_focus": ["New York", "United States"], "notable_portfolio": [], "description": "New York based multi-stage venture firm.", "source": "curated"},

    # Geographic Specialists — Europe
    {"name": "Balderton Capital", "website": "https://www.balderton.com", "focus_sectors": ["Enterprise SaaS", "Consumer", "Fintech", "Deep Tech"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 30000, "geo_focus": ["Europe"], "notable_portfolio": ["Revolut", "Darktrace", "GoCardless", "Kobalt Music"], "description": "Europe's leading early-stage venture capital firm.", "source": "curated"},
    {"name": "Atomico", "website": "https://www.atomico.com", "focus_sectors": ["SaaS", "Consumer", "Deep Tech", "Fintech", "Climate"], "stage_preference": ["series-a", "series-b"], "check_size_min": 5000, "check_size_max": 75000, "geo_focus": ["Europe"], "notable_portfolio": ["Klarna", "Supercell", "Truecaller", "Graphcore"], "description": "European VC firm founded by Niklas Zennstrom, co-founder of Skype.", "source": "curated"},
    {"name": "HV Capital", "website": "https://www.hvcapital.com", "focus_sectors": ["Consumer", "Fintech", "SaaS", "Healthcare"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 30000, "geo_focus": ["Europe", "DACH"], "notable_portfolio": ["Zalando", "HomeAway", "Delivery Hero"], "description": "Munich and Berlin based venture capital firm.", "source": "curated"},
    {"name": "Point Nine Capital", "website": "https://www.pointninecap.com", "focus_sectors": ["SaaS", "Marketplaces", "Fintech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 2000, "geo_focus": ["Europe", "Global"], "notable_portfolio": ["Zendesk", "Algolia", "Contentful", "Loom"], "description": "European seed fund with global portfolio of SaaS and marketplace companies.", "source": "curated"},
    {"name": "Northzone", "website": "https://northzone.com", "focus_sectors": ["Consumer", "Fintech", "SaaS", "Media"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 30000, "geo_focus": ["Europe", "United States"], "notable_portfolio": ["Spotify", "iZettle", "Klarna", "Kahoot"], "description": "Pan-European VC firm with investments from seed to growth.", "source": "curated"},

    # Geographic Specialists — LATAM / Emerging Markets
    {"name": "Kaszek Ventures", "website": "https://www.kaszek.com", "focus_sectors": ["Fintech", "Consumer", "SaaS", "Healthcare"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 20000, "geo_focus": ["Latin America"], "notable_portfolio": ["Nubank", "Loft", "NotCo", "Quinto Andar"], "description": "The largest VC in Latin America by AUM.", "source": "curated"},
    {"name": "Monashees", "website": "https://www.monashees.com.br", "focus_sectors": ["Fintech", "Consumer", "Marketplaces", "Agtech"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["Latin America", "Brazil"], "notable_portfolio": ["Contabilizei", "Loggi", "Neon"], "description": "Leading Brazilian venture capital firm.", "source": "curated"},
    {"name": "Quona Capital", "website": "https://quona.com", "focus_sectors": ["Fintech", "Financial Inclusion", "Emerging Markets"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 15000, "geo_focus": ["Emerging Markets", "India", "Latin America", "Africa"], "notable_portfolio": [], "description": "Fintech-focused impact investor in emerging markets.", "source": "curated"},

    # Consumer / E-commerce Specialists
    {"name": "Forerunner Ventures", "website": "https://forerunnerventures.com", "focus_sectors": ["Consumer", "Ecommerce", "Retail Tech", "Health & Wellness"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": ["Warby Parker", "Dollar Shave Club", "Ritual", "Away", "Faire"], "description": "Consumer-focused VC firm investing in next-gen commerce companies.", "source": "curated"},
    {"name": "Imaginary Ventures", "website": "https://www.imaginaryventures.com", "focus_sectors": ["Consumer", "Fashion", "Beauty", "Ecommerce"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": ["Glossier", "ANINE BING", "Italic"], "description": "Consumer and fashion-focused VC with strong e-commerce DNA.", "source": "curated"},
    {"name": "Maveron", "website": "https://www.maveron.com", "focus_sectors": ["Consumer", "Ecommerce", "Education", "Healthcare"], "stage_preference": ["seed", "series-a"], "check_size_min": 1000, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": ["eBay", "Zulily", "Potbelly", "Allbirds"], "description": "Consumer-only VC firm co-founded by Howard Schultz.", "source": "curated"},
    {"name": "Base10 Partners", "website": "https://base10.vc", "focus_sectors": ["Consumer", "SaaS", "Future of Work", "AI"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Series A VC focused on automating the real economy.", "source": "curated"},

    # Crypto / Web3
    {"name": "Paradigm", "website": "https://www.paradigm.xyz", "focus_sectors": ["Crypto", "Web3", "DeFi", "Blockchain"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 100000, "geo_focus": ["Global"], "notable_portfolio": ["Coinbase", "Uniswap", "Optimism", "Blur"], "description": "Crypto-focused investment firm backing the next generation of crypto companies.", "source": "curated"},
    {"name": "Multicoin Capital", "website": "https://multicoin.capital", "focus_sectors": ["Crypto", "Web3", "DeFi", "Blockchain Infrastructure"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 20000, "geo_focus": ["Global"], "notable_portfolio": ["Solana", "FTX", "The Graph", "Helium"], "description": "Thematic crypto fund with focus on infrastructure and DeFi.", "source": "curated"},
    {"name": "Variant Fund", "website": "https://variant.fund", "focus_sectors": ["Crypto", "Web3", "DeFi", "Consumer Crypto"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 5000, "geo_focus": ["Global"], "notable_portfolio": ["Uniswap", "Mirror", "Zora"], "description": "Early-stage crypto fund focused on ownership economy applications.", "source": "curated"},

    # Developer Tools / Infrastructure
    {"name": "Amplify Partners", "website": "https://amplifypartners.com", "focus_sectors": ["Developer Tools", "Infrastructure", "Open Source", "AI"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 2500, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Deep technical seed fund for developer-focused infrastructure companies.", "source": "curated"},
    {"name": "Boldstart Ventures", "website": "https://boldstart.vc", "focus_sectors": ["Enterprise SaaS", "Developer Tools", "Security", "Infrastructure"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States"], "notable_portfolio": ["Snyk", "Kustomer", "BigID", "Superhuman"], "description": "Enterprise-first seed VC backing founders from day one.", "source": "curated"},
    {"name": "Crane Venture Partners", "website": "https://crane.vc", "focus_sectors": ["Developer Tools", "Infrastructure", "SaaS"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["Europe", "United Kingdom"], "notable_portfolio": [], "description": "European deep tech and developer tools seed investor.", "source": "curated"},

    # Sector-specific extras
    {"name": "Drive Capital", "website": "https://drivecapital.com", "focus_sectors": ["Enterprise SaaS", "Healthcare", "Consumer", "Fintech"], "stage_preference": ["series-a", "series-b"], "check_size_min": 2000, "check_size_max": 20000, "geo_focus": ["Midwest United States"], "notable_portfolio": ["Root Insurance", "Duolingo", "Olive AI"], "description": "Midwest-focused VC firm backing category-defining companies.", "source": "curated"},
    {"name": "Cota Capital", "website": "https://cotacapital.com", "focus_sectors": ["AI/ML", "SaaS", "Enterprise"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "AI-forward enterprise VC.", "source": "curated"},
    {"name": "Activant Capital", "website": "https://activantcapital.com", "focus_sectors": ["Commerce", "Supply Chain", "B2B SaaS"], "stage_preference": ["series-a", "series-b"], "check_size_min": 5000, "check_size_max": 50000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Growth-stage investor in next-gen commerce and supply chain.", "source": "curated"},
    {"name": "Slow Ventures", "website": "https://slow.co", "focus_sectors": ["Consumer", "Fintech", "Creator Economy", "SaaS"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 2000, "geo_focus": ["United States"], "notable_portfolio": ["Instagram", "Pinterest", "Medium"], "description": "Seed fund with a deliberate, long-term perspective on company building.", "source": "curated"},
    {"name": "Crossbeam Venture Partners", "website": "https://crossbeamvc.com", "focus_sectors": ["SaaS", "B2B", "Partnerships"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Early-stage B2B SaaS investor.", "source": "curated"},
    {"name": "Felicis Ventures", "website": "https://www.felicis.com", "focus_sectors": ["Consumer", "Enterprise", "Healthcare", "Fintech", "AI"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States", "Europe"], "notable_portfolio": ["Shopify", "Fitbit", "Credit Karma", "Notion", "Plaid"], "description": "Seed and Series A investor in breakthrough technology companies.", "source": "curated"},
    {"name": "CRV (Charles River Ventures)", "website": "https://www.crv.com", "focus_sectors": ["Enterprise SaaS", "Consumer", "Crypto", "Deep Tech"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": ["Zendesk", "Twitter", "Yammer", "DoorDash"], "description": "One of the oldest seed-stage focused VCs in Silicon Valley.", "source": "curated"},
    {"name": "Freestyle Capital", "website": "https://www.freestyle.vc", "focus_sectors": ["Consumer", "SaaS", "Marketplace"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 2000, "geo_focus": ["United States"], "notable_portfolio": ["Patreon", "Pantheon", "Cue"], "description": "Pre-seed and seed stage investor in consumer and SaaS.", "source": "curated"},
    {"name": "Foundation Capital", "website": "https://foundationcapital.com", "focus_sectors": ["Enterprise SaaS", "Fintech", "Consumer", "AI"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 15000, "geo_focus": ["United States"], "notable_portfolio": ["Netflix", "Lending Club", "Chegg", "Sunrun"], "description": "Multi-stage VC with early bets on Netflix and Lending Club.", "source": "curated"},
    {"name": "Trinity Ventures", "website": "https://www.trinityventures.com", "focus_sectors": ["Consumer", "Enterprise SaaS", "Fintech"], "stage_preference": ["series-a", "series-b"], "check_size_min": 2000, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": ["Starbucks", "Aruba Networks", "Jive Software"], "description": "Early-stage VC with track record of consumer and enterprise winners.", "source": "curated"},
    {"name": "IVP (Institutional Venture Partners)", "website": "https://www.ivp.com", "focus_sectors": ["Technology", "SaaS", "Consumer", "Healthcare"], "stage_preference": ["series-b", "series-c", "growth"], "check_size_min": 20000, "check_size_max": 150000, "geo_focus": ["United States"], "notable_portfolio": ["Twitter", "Snap", "Netflix", "Dropbox", "GitHub"], "description": "Late-stage technology growth equity investor.", "source": "curated"},
    {"name": "Spark Capital", "website": "https://www.sparkcapital.com", "focus_sectors": ["Consumer", "Enterprise", "Fintech", "Deep Tech"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 30000, "geo_focus": ["United States"], "notable_portfolio": ["Twitter", "Tumblr", "Plaid", "Cruise", "Slack"], "description": "Early stage investor in transformative technology companies.", "source": "curated"},
    {"name": "Social Capital", "website": "https://socialcapital.com", "focus_sectors": ["Healthcare", "Education", "Fintech", "AI"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 50000, "geo_focus": ["United States"], "notable_portfolio": ["Slack", "Intercom", "Yammer", "SurveyMonkey"], "description": "Impact-focused VC firm founded by Chamath Palihapitiya.", "source": "curated"},
    {"name": "Redpoint Ventures", "website": "https://www.redpoint.com", "focus_sectors": ["Enterprise SaaS", "Consumer", "Infrastructure"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 30000, "geo_focus": ["United States", "China"], "notable_portfolio": ["Netflix", "Stripe", "Snowflake", "Heroku", "Twilio"], "description": "Multi-stage VC with early investments in Netflix and Stripe.", "source": "curated"},
    {"name": "Madrona Venture Group", "website": "https://www.madrona.com", "focus_sectors": ["Enterprise SaaS", "Consumer", "AI", "Cloud Infrastructure"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["Pacific Northwest", "United States"], "notable_portfolio": ["Amazon", "Rover", "Redfin", "Smartsheet"], "description": "Pacific Northwest focused VC with early investment in Amazon.", "source": "curated"},
    {"name": "Andreessen Horowitz Games", "website": "https://games.a16z.com", "focus_sectors": ["Gaming", "Web3 Games", "Game Infrastructure"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 20000, "geo_focus": ["United States", "Global"], "notable_portfolio": ["Roblox", "Discord", "OpenSea"], "description": "Gaming-focused sub-fund within Andreessen Horowitz.", "source": "curated"},

    # More seed-focused funds
    {"name": "ff Venture Capital", "website": "https://ffvc.com", "focus_sectors": ["Enterprise SaaS", "Fintech", "Healthcare", "Consumer"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 2000, "geo_focus": ["United States", "Europe"], "notable_portfolio": [], "description": "Seed-stage VC with offices in New York and San Francisco.", "source": "curated"},
    {"name": "SV Angel", "website": "https://svangel.com", "focus_sectors": ["Technology", "Consumer", "Enterprise", "Fintech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 50, "check_size_max": 500, "geo_focus": ["United States"], "notable_portfolio": ["Airbnb", "Pinterest", "Twitter", "Stripe", "Dropbox"], "description": "Angel fund focused on seed-stage internet investments.", "source": "curated"},
    {"name": "Homebrew", "website": "https://homebrew.co", "focus_sectors": ["Bottom-up SaaS", "Consumer", "Marketplace", "AI"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Seed fund investing in companies using bottom-up distribution.", "source": "curated"},
    {"name": "Collaborative Fund", "website": "https://www.collaborativefund.com", "focus_sectors": ["Consumer", "Health & Wellness", "Food", "Sustainability"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": ["Lyft", "Kickstarter", "Codecademy", "Evernote"], "description": "VC fund focused on companies improving how the world works and lives.", "source": "curated"},
    {"name": "Uncork Capital", "website": "https://uncorkcapital.com", "focus_sectors": ["SaaS", "Consumer", "Enterprise", "Fintech"], "stage_preference": ["seed", "series-a"], "check_size_min": 250, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": ["Eventbrite", "Fitbit", "Wanelo", "Lever"], "description": "Seed and Series A investor formerly known as SoftTech VC.", "source": "curated"},
    {"name": "Eniac Ventures", "website": "https://eniac.vc", "focus_sectors": ["Enterprise SaaS", "Developer Tools", "AI", "Fintech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 2000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "NYC-based seed stage VC fund.", "source": "curated"},
    {"name": "SignalFire", "website": "https://signalfire.com", "focus_sectors": ["Enterprise", "Consumer", "Healthcare", "Crypto", "Creator Economy"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 15000, "geo_focus": ["United States"], "notable_portfolio": ["Clubhouse", "Grammarly", "Ro", "Coda"], "description": "Data-driven VC using proprietary data platform for sourcing and due diligence.", "source": "curated"},
    {"name": "Shasta Ventures", "website": "https://shastaventures.com", "focus_sectors": ["Enterprise SaaS", "Consumer", "AI"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": ["Nest", "LifeLock", "Nimble Storage"], "description": "Early-stage Silicon Valley venture capital firm.", "source": "curated"},
    {"name": "Abstract Ventures", "website": "https://www.abstractvc.com", "focus_sectors": ["Enterprise SaaS", "AI", "Developer Tools", "Cybersecurity"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Seed investor in deep technology companies.", "source": "curated"},
    {"name": "NFX", "website": "https://www.nfx.com", "focus_sectors": ["Marketplace", "Network Effects", "SaaS", "Consumer"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States", "Global"], "notable_portfolio": [], "description": "Network effects focused seed fund and research platform.", "source": "curated"},
    {"name": "8VC", "website": "https://8vc.com", "focus_sectors": ["Enterprise SaaS", "Healthcare", "Defense Tech", "Supply Chain", "AI"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 30000, "geo_focus": ["United States"], "notable_portfolio": ["Palantir", "Joby Aviation", "Samsara"], "description": "San Francisco based venture firm focused on critical infrastructure and enterprise.", "source": "curated"},
    {"name": "Emergence Capital", "website": "https://www.emcap.com", "focus_sectors": ["Enterprise SaaS", "AI", "Future of Work", "Sales Tech"], "stage_preference": ["series-a", "series-b"], "check_size_min": 5000, "check_size_max": 40000, "geo_focus": ["United States"], "notable_portfolio": ["Salesforce", "Zoom", "Box", "Veeva", "ServiceMax"], "description": "Enterprise cloud software focused VC firm with early bets on Salesforce and Zoom.", "source": "curated"},
    {"name": "True Ventures", "website": "https://trueventures.com", "focus_sectors": ["Consumer", "Enterprise SaaS", "Future of Work", "Deep Tech"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": ["Peloton", "Ring", "Fitbit", "Automattic"], "description": "Early-stage VC firm committed to founder well-being and community.", "source": "curated"},
    {"name": "RaisedBy.Wolves", "website": "https://raisedby.wolves.vc", "focus_sectors": ["Consumer", "SaaS", "Creator Economy"], "stage_preference": ["pre-seed"], "check_size_min": 50, "check_size_max": 500, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Micro VC writing first checks in consumer and creator economy.", "source": "curated"},
    {"name": "Notation Capital", "website": "https://notation.vc", "focus_sectors": ["Infrastructure", "Developer Tools", "Fintech", "SaaS"], "stage_preference": ["pre-seed"], "check_size_min": 100, "check_size_max": 750, "geo_focus": ["New York", "United States"], "notable_portfolio": [], "description": "Pre-seed VC backing technical founders building core infrastructure.", "source": "curated"},
    {"name": "Harlem Capital", "website": "https://harlemcapital.co", "focus_sectors": ["Technology", "SaaS", "Consumer"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 2000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Diverse-founded startup VC fund aiming to change the face of entrepreneurship.", "source": "curated"},
    {"name": "Backstage Capital", "website": "https://backstagecapital.com", "focus_sectors": ["Technology", "Consumer", "SaaS"], "stage_preference": ["pre-seed"], "check_size_min": 25, "check_size_max": 250, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Underestimated founders focused micro-VC fund.", "source": "curated"},
    {"name": "Third Kind Venture Capital", "website": "https://thirdkind.vc", "focus_sectors": ["Climate", "Sustainability", "Foodtech"], "stage_preference": ["seed", "series-a"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States", "Europe"], "notable_portfolio": [], "description": "Impact-driven seed and Series A fund.", "source": "curated"},
    {"name": "Canaan Partners", "website": "https://www.canaan.com", "focus_sectors": ["Healthcare", "Enterprise Tech", "Consumer"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["United States", "Israel"], "notable_portfolio": ["LendingClub", "Match.com", "DoubleClick"], "description": "Bicoastal VC with over 35 years of experience.", "source": "curated"},
    {"name": "Norwest Venture Partners", "website": "https://www.nvp.com", "focus_sectors": ["Healthcare", "Enterprise", "Consumer", "Fintech"], "stage_preference": ["seed", "series-a", "series-b", "growth"], "check_size_min": 1000, "check_size_max": 100000, "geo_focus": ["United States", "India", "Israel"], "notable_portfolio": ["Uber", "BrightSign", "Lenders"], "description": "Multi-stage venture firm backed by Wells Fargo.", "source": "curated"},
    {"name": "Andreessen Horowitz Cultural Leadership Fund", "website": "https://a16z.com/clf", "focus_sectors": ["Consumer", "Entertainment", "Music", "Creator Economy"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Cultural leadership focused sub-fund within a16z.", "source": "curated"},

    # More recent/emerging funds
    {"name": "Andreessen Horowitz American Dynamism", "website": "https://a16z.com/american-dynamism", "focus_sectors": ["Defense Tech", "Aerospace", "Manufacturing", "Public Safety"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 50000, "geo_focus": ["United States"], "notable_portfolio": ["Anduril", "AeroVironment"], "description": "a16z's fund focused on US national resilience and defense technology.", "source": "curated"},
    {"name": "Picus Capital", "website": "https://www.picuscap.com", "focus_sectors": ["SaaS", "B2B", "Climate", "Fintech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["Europe", "United States"], "notable_portfolio": [], "description": "European pre-seed and seed VC backed by the Samwer brothers.", "source": "curated"},
    {"name": "Adjacent", "website": "https://adjacent.vc", "focus_sectors": ["Frontier Tech", "AI", "Deep Tech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1500, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Frontier technology pre-seed VC.", "source": "curated"},
    {"name": "Maven Ventures", "website": "https://mavenventures.com", "focus_sectors": ["Consumer", "Gaming", "Mobile", "Social"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 2000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Consumer tech and gaming seed investor.", "source": "curated"},
    {"name": "Refactor Capital", "website": "https://refactor.com", "focus_sectors": ["Deep Tech", "Biology", "AI", "Climate"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Science and engineering-first seed fund.", "source": "curated"},
    {"name": "Resolute Ventures", "website": "https://resolute.vc", "focus_sectors": ["Enterprise SaaS", "Consumer", "Developer Tools"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Seed-stage investor backing founders from day one.", "source": "curated"},
    {"name": "Spero Ventures", "website": "https://spero.vc", "focus_sectors": ["Human Flourishing", "Future of Work", "Mental Health", "Social"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 2000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Mission-driven seed VC investing in human flourishing.", "source": "curated"},
    {"name": "Weekend Fund", "website": "https://weekend.fund", "focus_sectors": ["Developer Tools", "SaaS", "Consumer", "Fintech"], "stage_preference": ["pre-seed"], "check_size_min": 25, "check_size_max": 250, "geo_focus": ["United States", "Global"], "notable_portfolio": [], "description": "Solo GP pre-seed fund writing small first checks.", "source": "curated"},
    {"name": "Asymmetric Capital Partners", "website": "https://asymmetric.vc", "focus_sectors": ["Healthcare", "Climate", "Fintech", "Enterprise AI"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Contrarian seed and Series A investor.", "source": "curated"},
    {"name": "Chapter One", "website": "https://chapterone.com", "focus_sectors": ["Enterprise SaaS", "Infrastructure", "Fintech", "AI"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 2000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Pre-seed and seed investor backing founders building the next chapter.", "source": "curated"},
    {"name": "Pioneer Fund", "website": "https://pioneer.app", "focus_sectors": ["Technology", "SaaS", "Consumer", "Deep Tech"], "stage_preference": ["pre-seed"], "check_size_min": 100, "check_size_max": 500, "geo_focus": ["Global"], "notable_portfolio": [], "description": "Global remote accelerator finding outlier founders early.", "source": "curated"},
    {"name": "XYZ Venture Capital", "website": "https://xyz.vc", "focus_sectors": ["Commerce", "Fintech", "SaaS", "Consumer"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Seed and Series A investor at the intersection of commerce, fintech, and SaaS.", "source": "curated"},
    {"name": "Gutter Capital", "website": "https://gutter.capital", "focus_sectors": ["Consumer", "Music", "Media", "Creator Economy"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Cultural consumer and creator economy early-stage investor.", "source": "curated"},
    {"name": "Two Sigma Ventures", "website": "https://twosigmaventures.com", "focus_sectors": ["Data Science", "AI/ML", "Fintech", "Enterprise SaaS"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Data-driven VC arm of Two Sigma quant hedge fund.", "source": "curated"},
    {"name": "Work-Bench", "website": "https://www.work-bench.com", "focus_sectors": ["Enterprise SaaS", "Cloud Infrastructure", "Developer Tools"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 2500, "geo_focus": ["New York", "United States"], "notable_portfolio": [], "description": "NYC-based enterprise-first seed fund.", "source": "curated"},
    {"name": "Operative Capital", "website": "https://operative.vc", "focus_sectors": ["Operations", "Logistics", "Supply Chain", "SaaS"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Operational excellence focused VC for supply chain and logistics tech.", "source": "curated"},
    {"name": "Cube Ventures", "website": "https://cube.ventures", "focus_sectors": ["Fintech", "Regtech", "Crypto"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1500, "geo_focus": ["Europe", "United States"], "notable_portfolio": [], "description": "European fintech seed VC.", "source": "curated"},
    {"name": "Alpha Square Group", "website": "https://alphasquaregroup.com", "focus_sectors": ["Proptech", "Real Estate", "Fintech"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Real estate and proptech focused venture firm.", "source": "curated"},
    {"name": "Ganas Ventures", "website": "https://www.ganasventures.com", "focus_sectors": ["Latinx Tech", "Consumer", "Fintech", "Future of Work"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 50, "check_size_max": 500, "geo_focus": ["United States", "Latin America"], "notable_portfolio": [], "description": "Latinx-founder focused micro VC fund.", "source": "curated"},
    {"name": "Riot Ventures", "website": "https://riot.ventures", "focus_sectors": ["Cybersecurity", "Privacy", "Compliance"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 7000, "geo_focus": ["United States", "Israel"], "notable_portfolio": [], "description": "Cybersecurity-focused seed and Series A VC.", "source": "curated"},
    {"name": "Cyber Mentor Fund", "website": "https://cybermentorfund.com", "focus_sectors": ["Cybersecurity", "Privacy", "Enterprise Security"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States", "Israel"], "notable_portfolio": [], "description": "Pre-seed cybersecurity investor with mentor network.", "source": "curated"},
    {"name": "Space Capital", "website": "https://spacecapital.com", "focus_sectors": ["Space Tech", "Satellite", "GPS", "Remote Sensing"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States", "Global"], "notable_portfolio": [], "description": "Space technology focused VC fund.", "source": "curated"},
    {"name": "Promus Ventures", "website": "https://promusventures.com", "focus_sectors": ["Music Tech", "Creator Economy", "Media", "Entertainment"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Music and entertainment technology focused VC.", "source": "curated"},
    {"name": "Struck Capital", "website": "https://struck.com", "focus_sectors": ["Fintech", "Consumer", "AI", "SaaS"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["United States", "Latin America"], "notable_portfolio": [], "description": "Early-stage VC investing in emerging categories.", "source": "curated"},
    {"name": "Acrew Capital", "website": "https://acrewcapital.com", "focus_sectors": ["Fintech", "SaaS", "Healthcare", "Enterprise"], "stage_preference": ["series-a", "series-b"], "check_size_min": 5000, "check_size_max": 30000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Multi-stage growth equity firm.", "source": "curated"},
    {"name": "StepStone Group", "website": "https://www.stepstoneglobal.com", "focus_sectors": ["Private Equity", "Venture", "Infrastructure", "Real Assets"], "stage_preference": ["growth"], "check_size_min": 10000, "check_size_max": 500000, "geo_focus": ["Global"], "notable_portfolio": [], "description": "Global private markets asset manager.", "source": "curated"},
    {"name": "Coventure", "website": "https://coventure.com", "focus_sectors": ["Fintech", "Crypto", "SaaS"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Fintech and crypto focused early-stage investor.", "source": "curated"},
    {"name": "Xfund", "website": "https://xfund.com", "focus_sectors": ["Technology", "Deep Tech", "AI", "Consumer"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": ["Pillpak", "Cribspot", "EnerNOC"], "description": "Harvard and MIT affiliated seed fund.", "source": "curated"},
    {"name": "AlleyCorp", "website": "https://alleycorp.com", "focus_sectors": ["Consumer", "Fintech", "Enterprise", "Health"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 2000, "geo_focus": ["New York", "United States"], "notable_portfolio": [], "description": "NYC-based venture firm that builds and backs companies.", "source": "curated"},
    {"name": "Tiger Management", "website": "https://www.tigermgmt.com", "focus_sectors": ["Technology", "SaaS", "Consumer", "Fintech"], "stage_preference": ["growth"], "check_size_min": 50000, "check_size_max": 1000000, "geo_focus": ["Global"], "notable_portfolio": [], "description": "Julian Robertson's global growth-stage technology investor.", "source": "curated"},
    {"name": "SoftBank Vision Fund", "website": "https://visionfund.com", "focus_sectors": ["AI", "Robotics", "IoT", "Consumer", "Enterprise"], "stage_preference": ["series-b", "growth"], "check_size_min": 100000, "check_size_max": 10000000, "geo_focus": ["Global"], "notable_portfolio": ["Uber", "WeWork", "ARM", "ByteDance", "DoorDash"], "description": "World's largest technology venture fund at $100B.", "source": "curated"},
    {"name": "Alpha Partners", "website": "https://alphapartners.com", "focus_sectors": ["Technology", "Consumer", "Enterprise SaaS"], "stage_preference": ["seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Co-investment vehicle for top-tier VC syndicates.", "source": "curated"},
    {"name": "Lux Capital (additional)", "website": "https://luxcapital.com", "focus_sectors": ["Quantum Computing", "Synthetic Biology", "Neuroscience"], "stage_preference": ["seed", "series-a"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Scientific frontier investor in emerging technologies.", "source": "curated"},
    {"name": "Corazon Capital", "website": "https://corazon.capital", "focus_sectors": ["Latinx", "Consumer", "Healthcare", "Fintech"], "stage_preference": ["seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States", "Latin America"], "notable_portfolio": [], "description": "Latinx community-focused seed investor.", "source": "curated"},
    {"name": "WndrCo", "website": "https://wndrco.com", "focus_sectors": ["Media", "Consumer", "Entertainment", "SaaS"], "stage_preference": ["seed", "series-a"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Media and entertainment technology venture firm.", "source": "curated"},
    {"name": "Sequoia Scout", "website": "https://scouts.sequoiacap.com", "focus_sectors": ["Technology", "SaaS", "Consumer"], "stage_preference": ["pre-seed"], "check_size_min": 25, "check_size_max": 250, "geo_focus": ["Global"], "notable_portfolio": [], "description": "Sequoia Capital's scout program for early-stage investments.", "source": "curated"},
    {"name": "Mercury Fund", "website": "https://mercuryfund.com", "focus_sectors": ["SaaS", "Enterprise", "AI", "Fintech"], "stage_preference": ["series-a", "series-b"], "check_size_min": 2000, "check_size_max": 20000, "geo_focus": ["Midwest", "South United States"], "notable_portfolio": [], "description": "Midwest and southern US focused early and growth investor.", "source": "curated"},
    {"name": "Credo Ventures", "website": "https://credoventures.com", "focus_sectors": ["SaaS", "Enterprise", "Fintech"], "stage_preference": ["seed", "series-a"], "check_size_min": 250, "check_size_max": 5000, "geo_focus": ["Central Europe"], "notable_portfolio": [], "description": "Central European VC focused on SaaS and fintech.", "source": "curated"},
    {"name": "Target Global", "website": "https://targetglobal.vc", "focus_sectors": ["Fintech", "SaaS", "Mobility", "Consumer"], "stage_preference": ["seed", "series-a", "series-b"], "check_size_min": 500, "check_size_max": 20000, "geo_focus": ["Europe", "Israel", "United States"], "notable_portfolio": [], "description": "International VC with offices in Berlin, Tel Aviv, and New York.", "source": "curated"},
    {"name": "Frontline Ventures", "website": "https://www.frontline.vc", "focus_sectors": ["Enterprise SaaS", "B2B", "Developer Tools"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 250, "check_size_max": 3000, "geo_focus": ["Europe", "United Kingdom", "Ireland"], "notable_portfolio": [], "description": "European B2B tech seed fund.", "source": "curated"},
    {"name": "Playfair Capital", "website": "https://playfaircapital.com", "focus_sectors": ["Enterprise SaaS", "AI", "Developer Tools", "Fintech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 150, "check_size_max": 2000, "geo_focus": ["Europe", "United Kingdom"], "notable_portfolio": [], "description": "UK and European early-stage B2B tech investor.", "source": "curated"},
    {"name": "Seedcamp", "website": "https://seedcamp.com", "focus_sectors": ["Technology", "SaaS", "Fintech", "Deep Tech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["Europe", "Global"], "notable_portfolio": ["TransferWise", "UiPath", "Revolut", "Hopin"], "description": "Europe's leading pre-seed accelerator and fund.", "source": "curated"},
    {"name": "Techstars", "website": "https://www.techstars.com", "focus_sectors": ["Technology", "SaaS", "Consumer", "Fintech", "Healthcare"], "stage_preference": ["pre-seed"], "check_size_min": 20, "check_size_max": 120, "geo_focus": ["Global"], "notable_portfolio": ["SendGrid", "DigitalOcean", "ClassPass", "PillPack"], "description": "Global startup accelerator network with programs in 40+ cities.", "source": "curated"},
    {"name": "500 Global (500 Startups)", "website": "https://500.co", "focus_sectors": ["Technology", "SaaS", "Consumer", "Fintech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["Global"], "notable_portfolio": ["Credit Karma", "Canva", "Grab", "Talkdesk"], "description": "Global diversified micro-VC and startup accelerator.", "source": "curated"},
    {"name": "AngelList Ventures", "website": "https://angellist.com/ventures", "focus_sectors": ["Technology", "SaaS", "Consumer", "Fintech"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 50, "check_size_max": 1000, "geo_focus": ["United States", "Global"], "notable_portfolio": [], "description": "Platform for venture investing with rolling funds and SPVs.", "source": "curated"},
    {"name": "Indie.vc", "website": "https://indie.vc", "focus_sectors": ["SaaS", "Consumer", "Bootstrapped"], "stage_preference": ["seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Revenue-based finance and equity hybrid for sustainable startups.", "source": "curated"},
    {"name": "TechNexus Venture Collaborative", "website": "https://technexus.com", "focus_sectors": ["Enterprise Tech", "B2B", "Industrial AI", "Supply Chain"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["Midwest", "United States"], "notable_portfolio": [], "description": "Chicago-based strategic venture collaborative.", "source": "curated"},
    {"name": "Revolution Ventures", "website": "https://revolution.com/ventures", "focus_sectors": ["Consumer", "Enterprise", "Fintech", "Rise of the Rest"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States", "Outside Silicon Valley"], "notable_portfolio": ["Sweetgreen", "Revolution Foods", "Templeton Rye"], "description": "Steve Case's venture firm with focus on 'Rise of the Rest' geographies.", "source": "curated"},
    {"name": "Bowery Capital", "website": "https://bowerycap.com", "focus_sectors": ["Enterprise SaaS", "B2B", "Developer Tools"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 5000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Early-stage enterprise SaaS focused VC in NYC.", "source": "curated"},
    {"name": "Haystack", "website": "https://haystack.vc", "focus_sectors": ["Consumer", "SaaS", "Marketplace", "AI"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1500, "geo_focus": ["United States"], "notable_portfolio": ["Figma", "Coda", "Pitch"], "description": "Solo GP seed fund backing technical and mission-driven founders.", "source": "curated"},
    {"name": "Bee Partners", "website": "https://www.bee.partners", "focus_sectors": ["Deep Tech", "AI", "Robotics", "Quantum"], "stage_preference": ["pre-seed", "seed"], "check_size_min": 100, "check_size_max": 1000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Pre-seed deep tech fund investing at the frontier of science.", "source": "curated"},
    {"name": "Everywhere Ventures", "website": "https://everywhere.vc", "focus_sectors": ["SaaS", "Fintech", "Consumer"], "stage_preference": ["pre-seed"], "check_size_min": 25, "check_size_max": 250, "geo_focus": ["Global"], "notable_portfolio": [], "description": "Micro-VC backing founders everywhere in the world.", "source": "curated"},
    {"name": "DCVC (Data Collective VC)", "website": "https://www.dcvc.com", "focus_sectors": ["Deep Tech", "AI/ML", "Healthcare", "Aerospace", "Industrial"], "stage_preference": ["seed", "series-a"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": ["Planet Labs", "Vicarious", "Benchling"], "description": "Deep tech and data science focused VC.", "source": "curated"},
    {"name": "Gradient Ventures", "website": "https://gradient.com", "focus_sectors": ["AI", "ML", "Developer Tools", "Enterprise SaaS"], "stage_preference": ["seed", "series-a"], "check_size_min": 500, "check_size_max": 10000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Google's AI-focused venture fund.", "source": "curated"},
    {"name": "M12 (Microsoft Ventures)", "website": "https://m12.vc", "focus_sectors": ["Enterprise SaaS", "AI", "Cloud", "Security"], "stage_preference": ["series-a", "series-b"], "check_size_min": 2000, "check_size_max": 20000, "geo_focus": ["United States", "Europe", "Israel"], "notable_portfolio": [], "description": "Microsoft's corporate venture fund.", "source": "curated"},
    {"name": "Intel Capital", "website": "https://www.intelcapital.com", "focus_sectors": ["AI", "Semiconductors", "Cloud", "Autonomous", "IoT"], "stage_preference": ["series-a", "series-b"], "check_size_min": 1000, "check_size_max": 20000, "geo_focus": ["Global"], "notable_portfolio": [], "description": "Intel's global venture capital organization.", "source": "curated"},
    {"name": "Salesforce Ventures", "website": "https://www.salesforce.com/ventures", "focus_sectors": ["Enterprise SaaS", "AI", "B2B", "Cloud"], "stage_preference": ["series-a", "series-b", "series-c"], "check_size_min": 2000, "check_size_max": 50000, "geo_focus": ["Global"], "notable_portfolio": ["DocuSign", "Zoom", "nCino", "Veeva"], "description": "Salesforce's global corporate venture arm.", "source": "curated"},
    {"name": "Workday Ventures", "website": "https://www.workdayventures.com", "focus_sectors": ["HR Tech", "Finance Tech", "AI", "Enterprise SaaS"], "stage_preference": ["series-a", "series-b"], "check_size_min": 2000, "check_size_max": 20000, "geo_focus": ["United States", "Europe"], "notable_portfolio": [], "description": "Workday's strategic venture arm.", "source": "curated"},
    {"name": "Comcast Ventures", "website": "https://comcastventures.com", "focus_sectors": ["Consumer Tech", "Media", "Entertainment", "AI"], "stage_preference": ["series-a", "series-b"], "check_size_min": 2000, "check_size_max": 20000, "geo_focus": ["United States"], "notable_portfolio": [], "description": "Comcast's corporate venture arm.", "source": "curated"},
]


def _normalize_stages(stages) -> list[str]:
    if not stages:
        return []
    normalized = []
    for s in stages:
        sl = str(s).lower().replace(" ", "-").replace("_", "-")
        if "pre" in sl or "pre-seed" in sl:
            normalized.append("pre-seed")
        elif "seed" in sl:
            normalized.append("seed")
        elif "series-a" in sl or "series a" in sl or sl == "a":
            normalized.append("series-a")
        elif "series-b" in sl or "series b" in sl or sl == "b":
            normalized.append("series-b")
        elif "series-c" in sl or "series c" in sl or sl == "c":
            normalized.append("series-c")
        elif "growth" in sl or "late" in sl or "expansion" in sl:
            normalized.append("growth")
        else:
            normalized.append(sl)
    return list(dict.fromkeys(normalized))  # dedupe preserving order


def _parse_check_size(val) -> int | None:
    if val is None:
        return None
    try:
        v = float(str(val).replace(",", "").replace("$", "").replace("M", "000").replace("K", ""))
        return int(v)
    except Exception:
        return None


def main():
    print(f"Supabase URL: {SUPABASE_URL}")
    if not SERVICE_ROLE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
        return

    total_loaded = 0

    # --- Load curated dataset first ---
    print(f"\nLoading {len(CURATED_VCS)} curated VC records...")
    # Deduplicate curated list by name
    seen_names = set()
    deduped = []
    for rec in CURATED_VCS:
        n = rec["name"].lower().strip()
        if n not in seen_names:
            seen_names.add(n)
            deduped.append(rec)
    print(f"After dedup: {len(deduped)} unique records")

    # Insert in batches of 50
    for i in range(0, len(deduped), 50):
        batch = deduped[i:i+50]
        loaded = upsert_vcs(batch)
        total_loaded += loaded
        print(f"  Batch {i//50 + 1}: +{loaded} records (total: {total_loaded})")

    # --- Try Signal NFX ---
    try:
        signal_records = scrape_signal_nfx(max_pages=10)
        if signal_records:
            for i in range(0, len(signal_records), 50):
                batch = signal_records[i:i+50]
                loaded = upsert_vcs(batch)
                total_loaded += loaded
            print(f"Signal NFX loaded: {len(signal_records)} records")
    except Exception as e:
        print(f"Signal NFX failed (non-fatal): {e}")

    print(f"\n{'='*50}")
    print(f"Total records loaded: {total_loaded}")

    # Validate
    url = f"{SUPABASE_URL}/rest/v1/vcs?select=count"
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Prefer": "count=exact",
    }
    resp = requests.head(url, headers=headers, timeout=10)
    count_header = resp.headers.get("content-range", "")
    print(f"Supabase vcs table count header: {count_header}")

    # Sample validation
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/vcs?select=name,focus_sectors,stage_preference,geo_focus&limit=5",
        headers=headers,
        timeout=10,
    )
    if resp.ok:
        print("\nSample records:")
        for r in resp.json():
            print(f"  - {r['name']}: sectors={r['focus_sectors'][:2]}, stages={r['stage_preference']}")


if __name__ == "__main__":
    main()
