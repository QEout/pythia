"""Unified data collector — pulls from all free sources every cycle.

Data sources (16 total, all free / free-tier):
  - NewsAPI + 100+ RSS feeds (categorized global news)
  - Weibo Hot Search (Chinese social media)
  - Google Trends (search interest)
  - CoinGecko (crypto markets)
  - Yahoo Finance (traditional markets)
  - USGS Earthquakes · Open-Meteo Climate · GDACS Disasters · Fear & Greed
  - ACLED (armed conflict tracking)
  - GDELT (global event analysis)
  - Polymarket (prediction markets)
  - NASA FIRMS (satellite fire detection)
  - FRED (Federal Reserve Economic Data)
  - WHO (Disease Outbreak News)
  - Finnhub (real-time stock quotes)

Caching: WorldMonitor-inspired cache-aside pattern prevents API rate limit issues.
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
from data.sources.acled import fetch_acled_conflicts
from data.sources.gdelt import fetch_gdelt_trending
from data.sources.polymarket import fetch_polymarket
from data.sources.nasa_firms import fetch_active_fires
from data.sources.fred import fetch_fred_indicators
from data.sources.who import fetch_who_alerts
from data.sources.finnhub import fetch_stock_quotes
from data.cache import cached_fetch, TTL_SHORT, TTL_MEDIUM, TTL_LONG, TTL_EXTENDED

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
    # extended sources
    conflicts: list[dict] = field(default_factory=list)
    gdelt: list[dict] = field(default_factory=list)
    predictions_market: list[dict] = field(default_factory=list)
    fires: list[dict] = field(default_factory=list)
    # v2 sources
    fred_indicators: list[dict] = field(default_factory=list)
    who_alerts: list[dict] = field(default_factory=list)
    stock_quotes: list[dict] = field(default_factory=list)

    def summary(self, domain: str | None = None) -> str:
        parts: list[str] = []
        data_map = {
            "politics": [
                ("news", self.news), ("conflicts", self.conflicts),
                ("gdelt", self.gdelt), ("disruptions", self.disruptions),
                ("predictions_market", self.predictions_market),
            ],
            "tech": [
                ("news", self.news), ("trends", self.trends),
                ("gdelt", self.gdelt),
            ],
            "opinion": [
                ("weibo", self.weibo), ("trends", self.trends),
                ("predictions_market", self.predictions_market),
            ],
            "finance": [
                ("crypto", self.crypto), ("finance", self.finance),
                ("fear_greed", self.fear_greed),
                ("predictions_market", self.predictions_market),
                ("fred", self.fred_indicators), ("stocks", self.stock_quotes),
            ],
            "culture": [
                ("weibo", self.weibo), ("trends", self.trends),
                ("news", self.news),
            ],
            "health": [
                ("news", self.news), ("who_alerts", self.who_alerts),
                ("trends", self.trends),
            ],
            "energy": [
                ("news", self.news), ("finance", self.finance),
                ("fred", self.fred_indicators), ("climate", self.climate),
            ],
            "blackswan": [
                ("news", self.news), ("earthquakes", self.earthquakes),
                ("climate", self.climate), ("disruptions", self.disruptions),
                ("conflicts", self.conflicts), ("fires", self.fires),
                ("crypto", self.crypto), ("weibo", self.weibo),
                ("fear_greed", self.fear_greed), ("gdelt", self.gdelt),
                ("predictions_market", self.predictions_market),
                ("who_alerts", self.who_alerts),
            ],
        }
        sources = data_map.get(domain, [
            ("news", self.news), ("weibo", self.weibo),
            ("trends", self.trends), ("crypto", self.crypto),
            ("finance", self.finance), ("earthquakes", self.earthquakes),
            ("climate", self.climate), ("disruptions", self.disruptions),
            ("fear_greed", self.fear_greed),
            ("conflicts", self.conflicts), ("gdelt", self.gdelt),
            ("predictions_market", self.predictions_market),
            ("fires", self.fires),
            ("fred", self.fred_indicators), ("who_alerts", self.who_alerts),
            ("stocks", self.stock_quotes),
        ])
        for label, items in sources:
            if items:
                parts.append(f"[{label.upper()} — {len(items)} items]")
                for it in items[:12]:
                    title = it.get("title") or it.get("name") or it.get("query") or str(it)
                    extra = it.get("snippet") or it.get("price") or it.get("hot") or it.get("probability") or ""
                    parts.append(f"  • {title}  {extra}")
        return "\n".join(parts) if parts else "(no data)"

    @property
    def source_count(self) -> int:
        return sum(1 for src in [
            self.news, self.weibo, self.trends, self.crypto, self.finance,
            self.earthquakes, self.climate, self.disruptions, self.fear_greed,
            self.conflicts, self.gdelt, self.predictions_market, self.fires,
            self.fred_indicators, self.who_alerts, self.stock_quotes,
        ] if src)

    def all_items_flat(self) -> list[dict]:
        """Return all items in a single flat list — for entity extraction."""
        result: list[dict] = []
        for src in [
            self.news, self.weibo, self.trends, self.crypto, self.finance,
            self.earthquakes, self.climate, self.disruptions, self.fear_greed,
            self.conflicts, self.gdelt, self.predictions_market, self.fires,
            self.fred_indicators, self.who_alerts, self.stock_quotes,
        ]:
            result.extend(src)
        return result


async def collect_world_data() -> WorldSnapshot:
    """Gather data from all sources concurrently with caching."""
    results = await asyncio.gather(
        cached_fetch("news", fetch_news, TTL_MEDIUM),          # 0
        cached_fetch("weibo", fetch_weibo_hot, TTL_MEDIUM),    # 1
        cached_fetch("trends", fetch_google_trends, TTL_MEDIUM),  # 2
        cached_fetch("crypto", fetch_crypto, TTL_SHORT),       # 3
        cached_fetch("finance", fetch_finance, TTL_SHORT),     # 4
        cached_fetch("worldmonitor", fetch_all_worldmonitor, TTL_LONG),  # 5
        cached_fetch("acled", fetch_acled_conflicts, TTL_EXTENDED),  # 6
        cached_fetch("gdelt", fetch_gdelt_trending, TTL_LONG),  # 7
        cached_fetch("polymarket", fetch_polymarket, TTL_MEDIUM),  # 8
        cached_fetch("fires", fetch_active_fires, TTL_LONG),  # 9
        cached_fetch("fred", fetch_fred_indicators, TTL_LONG),  # 10
        cached_fetch("who", fetch_who_alerts, TTL_LONG),       # 11
        cached_fetch("finnhub", fetch_stock_quotes, TTL_SHORT),  # 12
        return_exceptions=True,
    )
    snap = WorldSnapshot()

    simple_sources = ["news", "weibo", "trends", "crypto", "finance"]
    for label, res in zip(simple_sources, results[:5]):
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

    indexed_sources = [
        ("conflicts", 6), ("gdelt", 7), ("predictions_market", 8), ("fires", 9),
        ("fred_indicators", 10), ("who_alerts", 11), ("stock_quotes", 12),
    ]
    for label, idx in indexed_sources:
        res = results[idx]
        if isinstance(res, Exception):
            log.warning("Data source %s failed: %s", label, res)
        else:
            setattr(snap, label, res or [])

    log.info(
        "World snapshot: %d active sources | news=%d weibo=%d trends=%d crypto=%d "
        "finance=%d quakes=%d climate=%d disruptions=%d fear=%d "
        "conflicts=%d gdelt=%d polymarket=%d fires=%d "
        "fred=%d who=%d stocks=%d",
        snap.source_count,
        len(snap.news), len(snap.weibo), len(snap.trends),
        len(snap.crypto), len(snap.finance),
        len(snap.earthquakes), len(snap.climate),
        len(snap.disruptions), len(snap.fear_greed),
        len(snap.conflicts), len(snap.gdelt),
        len(snap.predictions_market), len(snap.fires),
        len(snap.fred_indicators), len(snap.who_alerts),
        len(snap.stock_quotes),
    )
    return snap
