"""Unified data collector — pulls from all free sources every cycle.

Data sources:
  - NewsAPI + RSS feeds (global news)
  - Weibo Hot Search (Chinese social media)
  - Google Trends (search interest)
  - CoinGecko (crypto markets)
  - Yahoo Finance (traditional markets)
  - WorldMonitor API (geopolitics, seismic, climate, aviation, markets)
"""

from __future__ import annotations
import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime

from data.sources.news import fetch_news
from data.sources.weibo import fetch_weibo_hot
from data.sources.trends import fetch_google_trends
from data.sources.crypto import fetch_crypto
from data.sources.finance import fetch_finance
from data.sources.worldmonitor import fetch_all_worldmonitor

log = logging.getLogger(__name__)


@dataclass
class WorldSnapshot:
    ts: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    news: list[dict] = field(default_factory=list)
    weibo: list[dict] = field(default_factory=list)
    trends: list[dict] = field(default_factory=list)
    crypto: list[dict] = field(default_factory=list)
    finance: list[dict] = field(default_factory=list)
    earthquakes: list[dict] = field(default_factory=list)
    climate: list[dict] = field(default_factory=list)
    disruptions: list[dict] = field(default_factory=list)
    fear_greed: list[dict] = field(default_factory=list)

    def summary(self, domain: str | None = None) -> str:
        parts: list[str] = []
        data_map = {
            "politics": [("news", self.news), ("disruptions", self.disruptions)],
            "tech": [("news", self.news), ("trends", self.trends)],
            "opinion": [("weibo", self.weibo), ("trends", self.trends)],
            "finance": [("crypto", self.crypto), ("finance", self.finance)],
            "culture": [("weibo", self.weibo), ("trends", self.trends)],
            "blackswan": [
                ("news", self.news), ("earthquakes", self.earthquakes),
                ("climate", self.climate), ("disruptions", self.disruptions),
                ("crypto", self.crypto), ("weibo", self.weibo),
                ("fear_greed", self.fear_greed),
            ],
        }
        sources = data_map.get(domain, [
            ("news", self.news), ("weibo", self.weibo),
            ("trends", self.trends), ("crypto", self.crypto),
            ("finance", self.finance), ("earthquakes", self.earthquakes),
            ("climate", self.climate), ("disruptions", self.disruptions),
            ("fear_greed", self.fear_greed),
        ])
        for label, items in sources:
            if items:
                parts.append(f"[{label.upper()} — {len(items)} items]")
                for it in items[:15]:
                    title = it.get("title") or it.get("name") or it.get("query") or str(it)
                    extra = it.get("snippet") or it.get("price") or it.get("hot") or ""
                    parts.append(f"  • {title}  {extra}")
        return "\n".join(parts) if parts else "(no data)"


async def collect_world_data() -> WorldSnapshot:
    """Gather data from all sources concurrently."""
    results = await asyncio.gather(
        fetch_news(),
        fetch_weibo_hot(),
        fetch_google_trends(),
        fetch_crypto(),
        fetch_finance(),
        fetch_all_worldmonitor(),
        return_exceptions=True,
    )
    snap = WorldSnapshot()

    labels = ["news", "weibo", "trends", "crypto", "finance"]
    for label, res in zip(labels, results[:5]):
        if isinstance(res, Exception):
            log.warning("Data source %s failed: %s", label, res)
            continue
        setattr(snap, label, res or [])

    wm_data = results[5]
    if isinstance(wm_data, dict):
        snap.earthquakes = wm_data.get("earthquakes", [])
        snap.climate = wm_data.get("climate", [])
        snap.disruptions = wm_data.get("disruptions", [])
        snap.fear_greed = wm_data.get("markets", [])
    elif isinstance(wm_data, Exception):
        log.warning("Global intel failed: %s", wm_data)

    log.info(
        "World snapshot collected: news=%d weibo=%d trends=%d crypto=%d finance=%d "
        "earthquakes=%d climate=%d disruptions=%d fear_greed=%d",
        len(snap.news), len(snap.weibo), len(snap.trends),
        len(snap.crypto), len(snap.finance),
        len(snap.earthquakes), len(snap.climate),
        len(snap.disruptions), len(snap.fear_greed),
    )
    return snap
