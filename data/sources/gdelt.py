"""GDELT (Global Database of Events, Language, and Tone) — free geopolitical event data.

Free API: https://api.gdeltproject.org/ (no auth required).
Rate limit: 1 request per 5 seconds.
"""

from __future__ import annotations
import asyncio
import logging
import httpx

log = logging.getLogger(__name__)

GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"


async def fetch_gdelt_trending() -> list[dict]:
    """Fetch trending articles from GDELT's DOC API."""
    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=25) as c:
            r = await c.get(GDELT_DOC_API, params={
                "query": "(conflict OR crisis OR sanctions OR geopolitics)",
                "mode": "ArtList",
                "timespan": "24h",
                "maxrecords": "25",
                "format": "json",
            })
            if r.status_code == 200 and r.text.strip().startswith("{"):
                try:
                    data = r.json()
                    for article in (data.get("articles", []) if isinstance(data, dict) else [])[:15]:
                        items.append({
                            "title": article.get("title", ""),
                            "url": article.get("url", ""),
                            "source": article.get("domain", "GDELT"),
                            "tone": article.get("tone", 0),
                            "category": "gdelt_conflict",
                        })
                except (ValueError, KeyError):
                    pass
            elif r.status_code == 429:
                raise RuntimeError("GDELT rate-limited (429), will use stale cache")

            await asyncio.sleep(6)

            r2 = await c.get(GDELT_DOC_API, params={
                "query": "(trade OR economy OR technology OR election)",
                "mode": "ArtList",
                "timespan": "24h",
                "maxrecords": "15",
                "format": "json",
            })
            if r2.status_code == 200 and r2.text.strip().startswith("{"):
                try:
                    data2 = r2.json()
                    for article in (data2.get("articles", []) if isinstance(data2, dict) else [])[:10]:
                        items.append({
                            "title": article.get("title", ""),
                            "url": article.get("url", ""),
                            "source": article.get("domain", "GDELT"),
                            "tone": article.get("tone", 0),
                            "category": "gdelt_trending",
                        })
                except (ValueError, KeyError):
                    pass
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
