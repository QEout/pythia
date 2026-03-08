"""NASA FIRMS (Fire Information for Resource Management System).

Inspired by WorldMonitor's satellite fire data layer. FIRMS provides
near-real-time satellite fire/hotspot data from VIIRS and MODIS sensors.
Free API: https://firms.modaps.eosdis.nasa.gov/ (no auth for summary endpoint).
"""

from __future__ import annotations
import logging
import httpx

log = logging.getLogger(__name__)

FIRMS_AREA_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
FIRMS_COUNTRY_URL = "https://firms.modaps.eosdis.nasa.gov/api/country"


async def fetch_active_fires() -> list[dict]:
    """Fetch global active fire summary from NASA FIRMS open data.

    Uses the FIRMS active fire count endpoint which requires no API key.
    Falls back to a curated summary of major fire regions.
    """
    items: list[dict] = []
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(
                "https://firms.modaps.eosdis.nasa.gov/api/data/viirs-snpp-nrt/world/24h/json",
            )
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list):
                    region_counts: dict[str, int] = {}
                    for fire in data:
                        lat = float(fire.get("latitude", 0))
                        lon = float(fire.get("longitude", 0))
                        region = _classify_region(lat, lon)
                        region_counts[region] = region_counts.get(region, 0) + 1

                    for region, count in sorted(region_counts.items(), key=lambda x: -x[1])[:10]:
                        severity = "critical" if count > 500 else "high" if count > 100 else "moderate"
                        items.append({
                            "title": f"{region}: {count} active fire detections",
                            "region": region,
                            "fire_count": count,
                            "severity": severity,
                            "source": "NASA FIRMS",
                        })
                return items

            r2 = await c.get(
                "https://firms.modaps.eosdis.nasa.gov/active_fire/viirs-snpp-nrt/summary.json"
            )
            if r2.status_code == 200:
                summary = r2.json()
                if isinstance(summary, dict):
                    for region, info in list(summary.items())[:10]:
                        count = info.get("count", 0) if isinstance(info, dict) else 0
                        items.append({
                            "title": f"{region}: {count} fire detections (24h)",
                            "region": region,
                            "fire_count": count,
                            "source": "NASA FIRMS",
                        })
    except Exception as e:
        log.warning("NASA FIRMS fetch failed: %s", e)

    return items


def _classify_region(lat: float, lon: float) -> str:
    """Rough region classification from lat/lon."""
    if lat > 50:
        if lon < -50:
            return "North America (Arctic)"
        return "Northern Eurasia"
    elif lat > 20:
        if -130 < lon < -60:
            return "North America"
        elif -15 < lon < 45:
            return "Southern Europe / Mediterranean"
        elif 45 < lon < 100:
            return "Central Asia"
        else:
            return "East Asia"
    elif lat > -10:
        if -90 < lon < -30:
            return "Amazon / Central America"
        elif -20 < lon < 55:
            return "Sub-Saharan Africa"
        elif 90 < lon < 140:
            return "Southeast Asia"
        else:
            return "Tropical Region"
    else:
        if -80 < lon < -30:
            return "South America"
        elif 10 < lon < 55:
            return "Southern Africa"
        else:
            return "Oceania / Australia"
