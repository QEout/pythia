"""Google Trends — trending searches."""

from __future__ import annotations
import logging

log = logging.getLogger(__name__)


async def fetch_google_trends() -> list[dict]:
    items: list[dict] = []
    try:
        from pytrends.request import TrendReq
        pt = TrendReq(hl="en-US", tz=480, timeout=(10, 25))
        df = pt.trending_searches(pn="united_states")
        for _, row in df.head(20).iterrows():
            items.append({"query": row[0]})

        df_cn = pt.trending_searches(pn="china")
        for _, row in df_cn.head(20).iterrows():
            items.append({"query": row[0]})
    except Exception as e:
        log.warning("Google Trends failed: %s", e)
    return items
