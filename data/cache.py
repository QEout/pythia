"""In-memory cache with TTL — inspired by WorldMonitor's 3-tier caching.

WorldMonitor uses in-memory → Redis → upstream with stampede prevention.
We implement a lightweight version: in-memory with TTL + stale-on-error fallback,
which avoids hammering free-tier APIs within the same prediction cycle.
"""

from __future__ import annotations
import asyncio
import logging
import time
from typing import Any, Awaitable, Callable

log = logging.getLogger(__name__)

_cache: dict[str, tuple[float, Any]] = {}  # key -> (expires_at, value)
_locks: dict[str, asyncio.Lock] = {}       # stampede prevention


def get_cached(key: str) -> Any | None:
    """Return cached value if not expired, else None."""
    entry = _cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if time.time() < expires_at:
        return value
    return None


def get_stale(key: str) -> Any | None:
    """Return cached value even if expired (stale-on-error fallback)."""
    entry = _cache.get(key)
    return entry[1] if entry else None


def set_cached(key: str, value: Any, ttl_seconds: int = 300):
    """Store value with TTL."""
    _cache[key] = (time.time() + ttl_seconds, value)


async def cached_fetch(
    key: str,
    fetcher: Callable[[], Awaitable[Any]],
    ttl: int = 300,
) -> Any:
    """Fetch with cache-aside pattern and stampede prevention.

    If multiple coroutines request the same key concurrently, only one
    actually calls the fetcher; others wait for its result.
    On error, returns stale data if available.
    """
    cached = get_cached(key)
    if cached is not None:
        return cached

    if key not in _locks:
        _locks[key] = asyncio.Lock()

    async with _locks[key]:
        cached = get_cached(key)
        if cached is not None:
            return cached

        try:
            value = await fetcher()
            set_cached(key, value, ttl)
            return value
        except Exception as e:
            stale = get_stale(key)
            if stale is not None:
                log.warning("Fetch %s failed, returning stale data: %s", key, e)
                return stale
            raise


TTL_SHORT = 120    # 2 min — volatile data (crypto prices, trending)
TTL_MEDIUM = 300   # 5 min — standard data (news, RSS)
TTL_LONG = 900     # 15 min — slow-changing data (climate, earthquakes)
TTL_EXTENDED = 3600  # 1 hr — very stable data (ACLED conflicts, GDELT)


def cache_stats() -> dict:
    """Return cache diagnostics with per-entry detail for the frontend."""
    now = time.time()
    total = len(_cache)
    alive = sum(1 for exp, _ in _cache.values() if exp > now)
    entries = []
    for key, (expires_at, _) in _cache.items():
        age = now - (expires_at - 900)  # rough age estimate assuming TTL ~15m
        is_stale = now >= expires_at
        ttl_remaining = max(0, expires_at - now)
        entries.append({
            "key": key,
            "age_seconds": round(age),
            "ttl": round(ttl_remaining),
            "stale": is_stale,
        })
    return {"total_entries": total, "alive": alive, "stale": total - alive, "entries": entries}
