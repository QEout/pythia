"""NewsAPI + RSS feed aggregator.

Inspired by WorldMonitor's 435+ feed architecture, we use a categorized feed
list so each Chief Agent gets domain-relevant headlines.
"""

from __future__ import annotations
import asyncio
import logging
import httpx
import feedparser
from config import NEWSAPI_KEY

log = logging.getLogger(__name__)

RSS_FEEDS: dict[str, list[str]] = {
    # --- Original 7 categories ---
    "geopolitics": [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "https://feeds.reuters.com/reuters/topNews",
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
        "https://feeds.washingtonpost.com/rss/world",
        "https://www.theguardian.com/world/rss",
        "https://feeds.feedburner.com/ForeignPolicy",
    ],
    "tech": [
        "https://feeds.arstechnica.com/arstechnica/index",
        "https://www.theverge.com/rss/index.xml",
        "https://techcrunch.com/feed/",
        "https://feeds.wired.com/wired/index",
        "https://hnrss.org/frontpage",
        "https://www.techmeme.com/feed.xml",
    ],
    "finance": [
        "https://feeds.bloomberg.com/markets/news.rss",
        "https://www.cnbc.com/id/100003114/device/rss/rss.html",
        "https://feeds.reuters.com/reuters/businessNews",
        "https://feeds.ft.com/rss/home/us",
    ],
    "science_climate": [
        "https://www.nature.com/nature.rss",
        "https://rss.nytimes.com/services/xml/rss/nyt/Climate.xml",
        "https://phys.org/rss-feed/",
    ],
    "defense_security": [
        "https://www.janes.com/feeds/news",
        "https://www.defenseone.com/rss/",
        "https://feeds.feedburner.com/TheWarZone",
        "https://www.armscontrol.org/rss.xml",
    ],
    "asia": [
        "https://www.scmp.com/rss/91/feed",
        "https://asia.nikkei.com/rss",
        "https://www.straitstimes.com/news/asia/rss.xml",
    ],
    "mena": [
        "https://www.middleeasteye.net/rss",
        "https://english.alarabiya.net/tools/rss",
        "https://www.timesofisrael.com/feed/",
    ],
    # --- New 8 categories (WorldMonitor-inspired expansion) ---
    "defense": [
        "https://www.defenseone.com/rss/",
        "https://feeds.feedburner.com/TheWarZone",
        "https://www.militarytimes.com/arc/outboundfeeds/rss/",
        "https://breakingdefense.com/feed/",
        "https://www.navalnews.com/feed/",
        "https://www.airforcemag.com/feed/",
        "https://www.defensenews.com/arc/outboundfeeds/rss/",
        "https://www.c4isrnet.com/arc/outboundfeeds/rss/",
        "https://rusi.org/rss.xml",
        "https://www.sipri.org/rss.xml",
        "https://www.iiss.org/rss",
        "https://warontherocks.com/feed/",
    ],
    "africa": [
        "https://africanarguments.org/feed/",
        "https://issafrica.org/iss-today/feed",
        "https://www.theafricareport.com/feed/",
        "https://www.dailymaverick.co.za/article/feed/",
        "https://punchng.com/feed/",
        "https://nation.africa/rss.xml",
        "https://mg.co.za/feed/",
        "https://www.africanews.com/feed/",
    ],
    "latin_america": [
        "https://feeds.reuters.com/reuters/latinAmericaNews",
        "https://www.americasquarterly.org/feed",
        "https://www.batimes.com.ar/feed",
        "https://mexiconewsdaily.com/feed/",
        "https://feeds.elpais.com/mrss-s/pages/ep/site/english.elpais.com/portada",
        "https://www.reuters.com/arc/outboundfeeds/v3/all/?outputType=xml&size=20",
    ],
    "think_tanks": [
        "https://www.brookings.edu/feed/",
        "https://www.rand.org/pubs.xml",
        "https://feeds.cfr.org/publication/feed",
        "https://carnegieendowment.org/rss/solr.xml",
        "https://www.chathamhouse.org/rss",
        "https://www.csis.org/analysis/feed",
        "https://www.atlanticcouncil.org/feed/",
        "https://www.heritage.org/rss",
        "https://www.stimson.org/feed/",
        "https://www.wilsoncenter.org/rss.xml",
    ],
    "energy": [
        "https://oilprice.com/rss/main",
        "https://www.rigzone.com/news/rss/rigzone_latest.aspx",
        "https://www.upstreamonline.com/arc/outboundfeeds/rss/",
        "https://renewablesnow.com/rss/",
        "https://www.pv-magazine.com/feed/",
        "https://www.spglobal.com/commodityinsights/en/rss-feeds/oil",
    ],
    "health": [
        "https://www.statnews.com/feed/",
        "https://www.fiercepharma.com/rss/xml",
        "https://endpts.com/feed/",
        "https://www.who.int/feeds/entity/don/en/rss.xml",
        "https://tools.cdc.gov/api/v2/resources/media/403372.rss",
        "https://www.thelancet.com/rssfeed/lancet_online.xml",
    ],
    "cyber": [
        "https://krebsonsecurity.com/feed/",
        "https://therecord.media/feed",
        "https://www.bleepingcomputer.com/feed/",
        "https://www.darkreading.com/rss.xml",
        "https://feeds.arstechnica.com/arstechnica/security",
        "https://feeds.feedburner.com/TheHackersNews",
    ],
    "india_south_asia": [
        "https://www.thehindu.com/news/national/feeder/default.rss",
        "https://feeds.feedburner.com/ndtvnews-top-stories",
        "https://www.dawn.com/feed",
        "https://www.thedailystar.net/frontpage/rss.xml",
        "https://kathmandupost.com/rss",
        "https://thewire.in/feed",
    ],
}

ALL_FEEDS: list[tuple[str, str]] = [
    (cat, url) for cat, urls in RSS_FEEDS.items() for url in urls
]


async def _fetch_one_feed(client: httpx.AsyncClient, category: str, url: str) -> list[dict]:
    """Fetch a single RSS feed with circuit-breaker style timeout."""
    items: list[dict] = []
    try:
        r = await client.get(url, follow_redirects=True)
        if r.status_code != 200:
            return items
        d = feedparser.parse(r.text)
        for entry in d.entries[:8]:
            items.append({
                "title": entry.get("title", ""),
                "snippet": (entry.get("summary") or "")[:200],
                "source": d.feed.get("title", url),
                "url": entry.get("link", ""),
                "category": category,
            })
    except Exception as e:
        log.debug("RSS %s failed: %s", url, e)
    return items


async def fetch_news() -> list[dict]:
    items: list[dict] = []

    if NEWSAPI_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.get(
                    "https://newsapi.org/v2/top-headlines",
                    params={"language": "en", "pageSize": 30, "apiKey": NEWSAPI_KEY},
                )
                r.raise_for_status()
                for a in r.json().get("articles", []):
                    items.append({
                        "title": a.get("title", ""),
                        "snippet": (a.get("description") or "")[:200],
                        "source": a.get("source", {}).get("name", ""),
                        "url": a.get("url", ""),
                        "category": "newsapi",
                    })
        except Exception as e:
            log.warning("NewsAPI failed: %s", e)

    async with httpx.AsyncClient(timeout=12) as client:
        tasks = [_fetch_one_feed(client, cat, url) for cat, url in ALL_FEEDS]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for res in results:
            if isinstance(res, list):
                items.extend(res)

    seen: set[str] = set()
    deduped: list[dict] = []
    for it in items:
        key = it["title"][:60].lower().strip()
        if key and key not in seen:
            seen.add(key)
            deduped.append(it)
    return deduped[:150]
