"""Google Trends — trending searches via public RSS feed.

The pytrends scraping library is frequently blocked by Google (404/429).
Google provides a free daily trends RSS feed that requires no auth.
"""

from __future__ import annotations
import logging
import httpx
import feedparser

log = logging.getLogger(__name__)

TRENDS_RSS = {
    "US": "https://trends.google.com/trending/rss?geo=US",
    "CN": "https://trends.google.com/trending/rss?geo=CN",
    "GB": "https://trends.google.com/trending/rss?geo=GB",
    "JP": "https://trends.google.com/trending/rss?geo=JP",
}


async def fetch_google_trends() -> list[dict]:
    items: list[dict] = []
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        for region, url in TRENDS_RSS.items():
            try:
                r = await client.get(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                })
                if r.status_code != 200:
                    log.debug("Google Trends RSS %s returned %d", region, r.status_code)
                    continue
                feed = feedparser.parse(r.text)
                for entry in feed.entries[:10]:
                    title = entry.get("title", "")
                    traffic = ""
                    if hasattr(entry, "ht_approx_traffic"):
                        traffic = entry.ht_approx_traffic
                    items.append({
                        "query": title,
                        "region": region,
                        "traffic": traffic,
                        "url": entry.get("link", ""),
                    })
            except Exception as e:
                log.debug("Google Trends RSS %s failed: %s", region, e)

    seen: set[str] = set()
    deduped: list[dict] = []
    for it in items:
        key = it["query"].lower().strip()
        if key and key not in seen:
            seen.add(key)
            deduped.append(it)
    return deduped[:40]
