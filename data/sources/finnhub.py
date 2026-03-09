"""Finnhub real-time stock quotes — free tier 60 calls/min.

Register for a free API key at https://finnhub.io/register
"""

from __future__ import annotations
import asyncio
import logging
import httpx
from config import FINNHUB_API_KEY

log = logging.getLogger(__name__)

TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
    "TSLA", "META", "JPM", "V", "WMT",
    "UNH", "XOM", "JNJ", "PG", "MA",
]


async def fetch_stock_quotes() -> list[dict]:
    if not FINNHUB_API_KEY:
        log.debug("FINNHUB_API_KEY not set, skipping")
        return []

    items: list[dict] = []
    async with httpx.AsyncClient(timeout=15) as client:
        for ticker in TICKERS:
            try:
                r = await client.get(
                    "https://finnhub.io/api/v1/quote",
                    params={"symbol": ticker, "token": FINNHUB_API_KEY},
                )
                if r.status_code != 200:
                    continue
                q = r.json()
                current = q.get("c", 0)
                prev_close = q.get("pc", 0)
                if current == 0:
                    continue
                change_pct = ((current - prev_close) / prev_close * 100) if prev_close else 0
                direction = "↑" if change_pct > 0 else "↓" if change_pct < 0 else "→"
                items.append({
                    "title": f"{ticker}: ${current:.2f} {direction}{abs(change_pct):.2f}%",
                    "symbol": ticker,
                    "price": current,
                    "change_pct": round(change_pct, 2),
                    "high": q.get("h", 0),
                    "low": q.get("l", 0),
                    "open": q.get("o", 0),
                    "prev_close": prev_close,
                    "category": "stock_quote",
                })
                await asyncio.sleep(0.1)
            except Exception as e:
                log.debug("Finnhub %s failed: %s", ticker, e)
    return items
