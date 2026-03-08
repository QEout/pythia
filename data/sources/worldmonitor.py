"""Real-time global intelligence data — same sources WorldMonitor uses.

Free, no-auth APIs:
  - USGS Earthquake API (seismic)
  - Open-Meteo Climate API (weather extremes)
  - AviationStack-compatible free feeds (delays)
  - Yahoo Finance extended quotes (via existing finance module)
"""

from __future__ import annotations
import logging
import httpx

log = logging.getLogger(__name__)
TIMEOUT = 15


async def _get(url: str, params: dict | None = None) -> dict | list | None:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as c:
            r = await c.get(url, params=params)
            if r.status_code == 200:
                return r.json()
            log.warning("Fetch %s returned %d", url, r.status_code)
    except Exception as e:
        log.warning("Fetch %s failed: %s", url, e)
    return None


async def fetch_earthquakes() -> list[dict]:
    """USGS Earthquake Hazards Program — free, no key, updated every minute."""
    data = await _get(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
    )
    if not data or "features" not in data:
        return []
    items = []
    for f in data["features"][:15]:
        p = f.get("properties", {})
        coords = f.get("geometry", {}).get("coordinates", [0, 0])
        items.append({
            "title": f"M{p.get('mag', '?')} — {p.get('place', 'Unknown')}",
            "magnitude": p.get("mag"),
            "location": p.get("place", ""),
            "lat": coords[1] if len(coords) > 1 else None,
            "lon": coords[0] if len(coords) > 0 else None,
            "time": p.get("time"),
            "source": "USGS",
        })
    return items


async def fetch_climate_anomalies() -> list[dict]:
    """Open-Meteo — free weather API. Fetch extreme conditions for major cities."""
    cities = [
        ("Tokyo", 35.68, 139.69), ("New York", 40.71, -74.01),
        ("London", 51.51, -0.13), ("Shanghai", 31.23, 121.47),
        ("Mumbai", 19.08, 72.88), ("São Paulo", -23.55, -46.63),
        ("Lagos", 6.52, 3.38), ("Dubai", 25.20, 55.27),
    ]
    items = []
    for name, lat, lon in cities:
        data = await _get(
            "https://api.open-meteo.com/v1/forecast",
            {"latitude": lat, "longitude": lon, "current_weather": "true"},
        )
        if not data or "current_weather" not in data:
            continue
        cw = data["current_weather"]
        temp = cw.get("temperature", 0)
        wind = cw.get("windspeed", 0)
        anomaly = None
        if temp > 40:
            anomaly = f"Extreme heat: {temp}°C"
        elif temp < -20:
            anomaly = f"Extreme cold: {temp}°C"
        elif wind > 60:
            anomaly = f"High winds: {wind} km/h"
        if anomaly:
            items.append({
                "title": f"{name}: {anomaly}",
                "type": "extreme_weather",
                "region": name,
                "temperature": temp,
                "windspeed": wind,
                "source": "Open-Meteo",
            })
        else:
            items.append({
                "title": f"{name}: {temp}°C, wind {wind} km/h",
                "type": "weather",
                "region": name,
                "temperature": temp,
                "windspeed": wind,
                "source": "Open-Meteo",
            })
    return items


async def fetch_global_disruptions() -> list[dict]:
    """GDACS (Global Disaster Alert & Coordination System) — free, no key.
    Returns recent global disaster alerts: earthquakes, floods, cyclones, etc."""
    data = await _get("https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?limit=10&from=2024-01-01")
    items = []
    if data and isinstance(data, dict):
        features = data.get("features", [])
        for f in features[:10]:
            p = f.get("properties", {})
            items.append({
                "title": p.get("name") or p.get("description", "Global event"),
                "type": p.get("eventtype", ""),
                "severity": p.get("alertlevel", ""),
                "country": p.get("country", ""),
                "source": "GDACS",
            })
    if not items:
        items.append({
            "title": "No major global disruption alerts",
            "type": "info",
            "severity": "green",
            "source": "GDACS",
        })
    return items


async def fetch_market_fear_greed() -> list[dict]:
    """Alternative.me Crypto Fear & Greed Index — free, no key."""
    data = await _get("https://api.alternative.me/fng/?limit=1")
    if not data or "data" not in data:
        return []
    items = []
    for d in data["data"][:1]:
        items.append({
            "title": f"Crypto Fear & Greed: {d.get('value_classification', '?')} ({d.get('value', '?')})",
            "value": int(d.get("value", 50)),
            "classification": d.get("value_classification", ""),
            "source": "Alternative.me",
        })
    return items


async def fetch_all_worldmonitor() -> dict:
    """Fetch all real-time global intelligence data concurrently."""
    import asyncio
    results = await asyncio.gather(
        fetch_earthquakes(),
        fetch_climate_anomalies(),
        fetch_global_disruptions(),
        fetch_market_fear_greed(),
        return_exceptions=True,
    )
    labels = ["earthquakes", "climate", "disruptions", "markets"]
    out = {}
    for label, res in zip(labels, results):
        if isinstance(res, Exception):
            log.warning("Global intel %s failed: %s", label, res)
            out[label] = []
        else:
            out[label] = res or []
    out["signals"] = []
    total = sum(len(v) for v in out.values())
    log.info(
        "Global intel: %d total (quakes=%d climate=%d disruptions=%d markets=%d)",
        total, len(out["earthquakes"]), len(out["climate"]),
        len(out["disruptions"]), len(out["markets"]),
    )
    return out
