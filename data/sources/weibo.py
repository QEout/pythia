"""Weibo hot search — uses the ajax band list API."""

from __future__ import annotations
import logging
import httpx

log = logging.getLogger(__name__)


async def fetch_weibo_hot() -> list[dict]:
    items: list[dict] = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://weibo.com/hot/search",
    }

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
            r = await c.get("https://weibo.com/ajax/statuses/hot_band", headers=headers)
            if r.status_code != 200:
                log.debug("Weibo hot_band returned %d", r.status_code)
                return items
            data = r.json()
            for entry in data.get("data", {}).get("band_list", [])[:30]:
                word = entry.get("word") or entry.get("note") or ""
                if not word:
                    continue
                items.append({
                    "title": word,
                    "hot": entry.get("num", 0),
                    "label": entry.get("label_name", ""),
                    "category": entry.get("category", ""),
                })
    except Exception as e:
        log.warning("Weibo hot search failed: %s", e)

    if not items:
        try:
            async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
                r = await c.get(
                    "https://weibo.com/ajax/side/hotSearch",
                    headers=headers,
                )
                if r.status_code == 200:
                    data = r.json()
                    for entry in data.get("data", {}).get("realtime", [])[:30]:
                        items.append({
                            "title": entry.get("word", ""),
                            "hot": entry.get("num", 0),
                            "label": entry.get("label_name", ""),
                        })
        except Exception as e:
            log.debug("Weibo fallback failed: %s", e)

    return items
