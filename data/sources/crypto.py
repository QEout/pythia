"""CoinGecko free API — top crypto data."""

from __future__ import annotations
import logging
import httpx

log = logging.getLogger(__name__)

COINGECKO_URL = "https://api.coingecko.com/api/v3"


async def fetch_crypto() -> list[dict]:
    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(f"{COINGECKO_URL}/coins/markets", params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 20,
                "page": 1,
                "sparkline": "false",
                "price_change_percentage": "1h,24h,7d",
            })
            r.raise_for_status()
            for coin in r.json():
                items.append({
                    "name": coin["name"],
                    "symbol": coin["symbol"].upper(),
                    "price": coin["current_price"],
                    "change_24h": coin.get("price_change_percentage_24h"),
                    "change_7d": coin.get("price_change_percentage_7d_in_currency"),
                    "market_cap": coin.get("market_cap"),
                    "volume_24h": coin.get("total_volume"),
                })

            tr = await c.get(f"{COINGECKO_URL}/search/trending")
            if tr.status_code == 200:
                for item in tr.json().get("coins", [])[:10]:
                    c_item = item.get("item", {})
                    items.append({
                        "name": c_item.get("name", ""),
                        "symbol": c_item.get("symbol", ""),
                        "price": c_item.get("data", {}).get("price", 0),
                        "trending": True,
                    })
    except Exception as e:
        log.warning("CoinGecko failed: %s", e)
    return items
