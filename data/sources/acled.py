"""ACLED (Armed Conflict Location & Event Data) — free conflict tracking.

Inspired by WorldMonitor's ACLED integration for conflict/protest monitoring.
Free API: https://acleddata.com/ (requires free registration for full access,
but the public read-only endpoint works for recent top events).
"""

from __future__ import annotations
import logging
from datetime import datetime, timedelta
import httpx

log = logging.getLogger(__name__)

ACLED_API = "https://api.acleddata.com/acled/read"


async def fetch_acled_conflicts() -> list[dict]:
    """Fetch recent armed conflict events from ACLED's public endpoint."""
    items: list[dict] = []
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(ACLED_API, params={
                "event_date": week_ago,
                "event_date_where": ">=",
                "limit": 30,
                "fields": "event_date|country|event_type|sub_event_type|fatalities|notes|latitude|longitude|source",
            })
            if r.status_code != 200:
                log.warning("ACLED returned %d", r.status_code)
                return items
            data = r.json()
            for ev in data.get("data", [])[:25]:
                fatalities = int(ev.get("fatalities", 0) or 0)
                severity = "critical" if fatalities >= 10 else "high" if fatalities >= 1 else "medium"
                items.append({
                    "title": f"{ev.get('event_type', 'Event')}: {ev.get('country', 'Unknown')}",
                    "type": ev.get("event_type", ""),
                    "sub_type": ev.get("sub_event_type", ""),
                    "country": ev.get("country", ""),
                    "fatalities": fatalities,
                    "severity": severity,
                    "date": ev.get("event_date", ""),
                    "notes": (ev.get("notes") or "")[:200],
                    "lat": ev.get("latitude"),
                    "lon": ev.get("longitude"),
                    "source": "ACLED",
                })
    except Exception as e:
        log.warning("ACLED fetch failed: %s", e)
    return items
