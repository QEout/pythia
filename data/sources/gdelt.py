"""GDELT (Global Database of Events, Language, and Tone) — free geopolitical event data.

Inspired by WorldMonitor's GDELT integration. GDELT monitors the world's news
media and identifies events, themes, and emotions in real time.
Free API: https://api.gdeltproject.org/ (no auth required).
"""

from __future__ import annotations
import logging
import httpx

log = logging.getLogger(__name__)

GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"
GDELT_GEO_API = "https://api.gdeltproject.org/api/v2/geo/geo"


async def fetch_gdelt_trending() -> list[dict]:
    """Fetch trending themes and articles from GDELT's DOC API."""
    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(GDELT_DOC_API, params={
                "query": "",
                "mode": "ToneChart",
                "timespan": "24h",
                "format": "json",
            })
            if r.status_code == 200:
                data = r.json()
                for article in (data if isinstance(data, list) else data.get("articles", []))[:15]:
                    if isinstance(article, dict):
                        items.append({
                            "title": article.get("title", ""),
                            "url": article.get("url", ""),
                            "source": article.get("domain", "GDELT"),
                            "tone": article.get("tone", 0),
                            "language": article.get("language", ""),
                            "category": "gdelt_trending",
                        })

            r2 = await c.get(GDELT_DOC_API, params={
                "query": "conflict OR war OR crisis OR sanction",
                "mode": "ArtList",
                "timespan": "24h",
                "maxrecords": "20",
                "format": "json",
            })
            if r2.status_code == 200:
                data2 = r2.json()
                for article in (data2.get("articles", []) if isinstance(data2, dict) else [])[:15]:
                    items.append({
                        "title": article.get("title", ""),
                        "url": article.get("url", ""),
                        "source": article.get("domain", "GDELT"),
                        "tone": article.get("tone", 0),
                        "category": "gdelt_conflict",
                    })
    except Exception as e:
        log.warning("GDELT fetch failed: %s", e)

    seen: set[str] = set()
    deduped: list[dict] = []
    for it in items:
        key = it["title"][:50].lower()
        if key and key not in seen:
            seen.add(key)
            deduped.append(it)
    return deduped[:20]
