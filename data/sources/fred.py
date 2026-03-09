"""Federal Reserve Economic Data (FRED) — free macroeconomic indicators.

Register for a free API key at https://fred.stlouisfed.org/docs/api/api_key.html
"""

from __future__ import annotations
import logging
import httpx
from config import FRED_API_KEY

log = logging.getLogger(__name__)

SERIES = {
    "GDP":           "GDP",
    "Unemployment":  "UNRATE",
    "CPI":           "CPIAUCSL",
    "10Y_Yield":     "DGS10",
    "Fed_Funds":     "FEDFUNDS",
    "M2_Money":      "M2SL",
    "SP500":         "SP500",
    "VIX":           "VIXCLS",
}


async def fetch_fred_indicators() -> list[dict]:
    if not FRED_API_KEY:
        log.debug("FRED_API_KEY not set, skipping")
        return []

    items: list[dict] = []
    async with httpx.AsyncClient(timeout=15) as client:
        for label, series_id in SERIES.items():
            try:
                r = await client.get(
                    "https://api.stlouisfed.org/fred/series/observations",
                    params={
                        "series_id": series_id,
                        "api_key": FRED_API_KEY,
                        "file_type": "json",
                        "sort_order": "desc",
                        "limit": 2,
                    },
                )
                if r.status_code != 200:
                    continue
                obs = r.json().get("observations", [])
                if not obs:
                    continue
                latest = obs[0]
                prev = obs[1] if len(obs) > 1 else None
                val = latest.get("value", ".")
                if val == ".":
                    continue
                val_f = float(val)
                change = ""
                if prev and prev.get("value", ".") != ".":
                    prev_f = float(prev["value"])
                    diff = val_f - prev_f
                    pct = (diff / abs(prev_f) * 100) if prev_f != 0 else 0
                    direction = "↑" if diff > 0 else "↓" if diff < 0 else "→"
                    change = f"{direction} {pct:+.2f}%"
                items.append({
                    "title": f"{label}: {val_f:.2f} {change}".strip(),
                    "series": series_id,
                    "value": val_f,
                    "change": change,
                    "date": latest.get("date", ""),
                    "category": "macro_economy",
                })
            except Exception as e:
                log.debug("FRED %s failed: %s", series_id, e)
    return items
