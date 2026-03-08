"""Polymarket prediction markets — free real-time odds on world events.

Inspired by WorldMonitor's prediction market integration. Polymarket provides
crowd-sourced probability estimates for geopolitical, economic, and cultural events.
Free API: https://gamma-api.polymarket.com/ (no auth).
"""

from __future__ import annotations
import logging
import httpx

log = logging.getLogger(__name__)

POLYMARKET_API = "https://gamma-api.polymarket.com/markets"


async def fetch_polymarket() -> list[dict]:
    """Fetch active prediction markets with highest volume."""
    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(POLYMARKET_API, params={
                "closed": "false",
                "limit": 25,
                "order": "volume",
                "ascending": "false",
            })
            if r.status_code != 200:
                log.warning("Polymarket returned %d", r.status_code)
                return items
            markets = r.json()
            if not isinstance(markets, list):
                markets = markets.get("data", []) if isinstance(markets, dict) else []
            for m in markets[:20]:
                outcomes = m.get("outcomes", [])
                prices = m.get("outcomePrices", [])
                prob_str = ""
                if prices and outcomes:
                    try:
                        probs = [float(p) for p in prices]
                        parts = [f"{o}: {p:.0%}" for o, p in zip(outcomes, probs)]
                        prob_str = " | ".join(parts)
                    except (ValueError, TypeError):
                        pass
                items.append({
                    "title": m.get("question", m.get("title", "")),
                    "probability": prob_str,
                    "volume": m.get("volume", 0),
                    "liquidity": m.get("liquidity", 0),
                    "end_date": m.get("endDate", ""),
                    "category": m.get("groupSlug", ""),
                    "source": "Polymarket",
                })
    except Exception as e:
        log.warning("Polymarket fetch failed: %s", e)
    return items
