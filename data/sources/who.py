"""WHO Disease Outbreak News + global health stats.

WHO DON RSS: https://www.who.int/feeds/entity/don/en/rss.xml (no key)
disease.sh: free global COVID/disease stats (no key)
"""

from __future__ import annotations
import logging
import httpx
import feedparser

log = logging.getLogger(__name__)

WHO_DON_RSS = "https://www.who.int/feeds/entity/don/en/rss.xml"
DISEASE_SH = "https://disease.sh/v3/covid-19/all"
OUTBREAK_NEWS = "https://www.who.int/api/news/diseaseoutbreaknews"


async def fetch_who_alerts() -> list[dict]:
    items: list[dict] = []
    async with httpx.AsyncClient(timeout=15) as client:
        # WHO Disease Outbreak News RSS
        try:
            r = await client.get(WHO_DON_RSS, follow_redirects=True)
            if r.status_code == 200:
                d = feedparser.parse(r.text)
                for entry in d.entries[:10]:
                    items.append({
                        "title": entry.get("title", ""),
                        "snippet": (entry.get("summary") or "")[:200],
                        "url": entry.get("link", ""),
                        "date": entry.get("published", ""),
                        "category": "who_outbreak",
                        "severity": "high",
                    })
        except Exception as e:
            log.debug("WHO RSS failed: %s", e)

        # WHO Outbreak News API (JSON fallback)
        if not items:
            try:
                r = await client.get(OUTBREAK_NEWS, params={"$top": 10, "$orderby": "PublicationDate desc"})
                if r.status_code == 200:
                    for entry in r.json().get("value", [])[:10]:
                        items.append({
                            "title": entry.get("Title", {}).get("Value", ""),
                            "snippet": "",
                            "date": entry.get("PublicationDate", ""),
                            "category": "who_outbreak",
                            "severity": "high",
                        })
            except Exception as e:
                log.debug("WHO API failed: %s", e)

        # Global COVID stats from disease.sh
        try:
            r = await client.get(DISEASE_SH)
            if r.status_code == 200:
                d = r.json()
                items.append({
                    "title": f"COVID-19 Global: {d.get('cases', 0):,} cases, {d.get('deaths', 0):,} deaths, {d.get('active', 0):,} active",
                    "cases": d.get("cases", 0),
                    "deaths": d.get("deaths", 0),
                    "active": d.get("active", 0),
                    "todayCases": d.get("todayCases", 0),
                    "todayDeaths": d.get("todayDeaths", 0),
                    "category": "covid_global",
                    "severity": "medium" if d.get("todayCases", 0) < 100000 else "high",
                })
        except Exception as e:
            log.debug("disease.sh failed: %s", e)

    return items
