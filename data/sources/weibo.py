"""Weibo hot search scraper (public data)."""

from __future__ import annotations
import logging
import httpx

log = logging.getLogger(__name__)

WEIBO_HOT_URL = "https://weibo.com/ajax/side/hotSearch"


async def fetch_weibo_hot() -> list[dict]:
    items: list[dict] = []
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
            r = await c.get(WEIBO_HOT_URL, headers=headers)
            r.raise_for_status()
            data = r.json()
            for item in data.get("data", {}).get("realtime", [])[:30]:
                items.append({
                    "title": item.get("word", ""),
                    "hot": item.get("num", 0),
                    "label": item.get("label_name", ""),
                })
    except Exception as e:
        log.warning("Weibo hot search failed: %s", e)
    return items
