"""天机 (Tianji) — Million-Agent Swarm Intelligence Prediction Engine.

FastAPI server with scheduled prediction cycles and real-time dashboard.
泄天机于数据，见未来于群智
"""

from __future__ import annotations
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import PREDICTION_INTERVAL_HOURS
from db.store import (
    init_db, get_recent_consensus, get_agent_scores,
    get_recent_predictions,
)
from engine.prediction import run_prediction_cycle
from engine.verification import verify_predictions
from agents.memory import init_memory_tables, get_trending_entities

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
log = logging.getLogger("pythia")

scheduler = AsyncIOScheduler()
ws_clients: set[WebSocket] = set()
latest_round: dict | None = None


async def broadcast(data: dict):
    dead = set()
    msg = json.dumps(data, ensure_ascii=False, default=str)
    for ws in ws_clients:
        try:
            await ws.send_text(msg)
        except Exception:
            dead.add(ws)
    ws_clients.difference_update(dead)


async def scheduled_prediction():
    global latest_round
    try:
        result = await run_prediction_cycle()
        latest_round = result
        await broadcast({"type": "prediction_update", "data": result})
    except Exception as e:
        log.error("Prediction cycle failed: %s", e, exc_info=True)


async def scheduled_verification():
    try:
        results = await verify_predictions()
        if results:
            await broadcast({"type": "verification_update", "data": results})
    except Exception as e:
        log.error("Verification failed: %s", e, exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from datetime import datetime, timedelta
    init_db()
    init_memory_tables()
    scheduler.add_job(scheduled_prediction, "interval", hours=PREDICTION_INTERVAL_HOURS, id="predict")
    scheduler.add_job(
        scheduled_verification, "interval", hours=6, id="verify",
        next_run_time=datetime.now() + timedelta(minutes=2),
    )
    scheduler.start()
    log.info("天机 (Tianji) started. Prediction interval: %dh. Verification will run in 2 min then every 6h.", PREDICTION_INTERVAL_HOURS)
    yield
    scheduler.shutdown()


app = FastAPI(title="天机 Tianji", lifespan=lifespan)


build_dir = Path(__file__).parent / "dashboard_build"
if build_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(build_dir / "assets")), name="assets")


@app.get("/", response_class=HTMLResponse)
async def index():
    react_index = build_dir / "index.html"
    if react_index.exists():
        return HTMLResponse(react_index.read_text(encoding="utf-8"))
    html_path = Path(__file__).parent / "dashboard" / "index.html"
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@app.post("/api/predict")
async def trigger_prediction():
    """Manually trigger a prediction cycle (batch mode)."""
    global latest_round
    result = await run_prediction_cycle()
    latest_round = result
    await broadcast({"type": "prediction_update", "data": result})
    return JSONResponse(result)


@app.get("/api/predict/stream")
async def trigger_prediction_stream():
    """SSE streaming prediction — sends progress events as each step completes."""
    from engine.prediction import run_prediction_cycle_streaming

    async def event_generator():
        final_result = None
        async for event_str in run_prediction_cycle_streaming():
            yield event_str
            if event_str.startswith("event: complete"):
                data_line = event_str.split("data: ", 1)[1].split("\n")[0]
                try:
                    final_result = json.loads(data_line)
                except Exception:
                    pass

        if final_result:
            global latest_round
            latest_round = final_result
            await broadcast({"type": "prediction_update", "data": final_result})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/verify")
async def trigger_verification():
    results = await verify_predictions()
    if results:
        await broadcast({"type": "verification_update", "data": results})
    return JSONResponse({"verified": len(results), "results": results})


@app.get("/api/latest")
async def get_latest():
    if latest_round:
        return JSONResponse(latest_round)
    consensus = get_recent_consensus(1)
    if consensus:
        row = consensus[0]
        preds = json.loads(row.get("predictions", "[]")) if isinstance(row.get("predictions"), str) else row.get("predictions", [])
        sim = json.loads(row.get("sim_result", "{}") or "{}") if isinstance(row.get("sim_result"), str) else row.get("sim_result")
        consensus_preds = [p for p in preds if not p.get("is_wildcard")]
        wildcards = [p for p in preds if p.get("is_wildcard")] or [p for p in preds if p.get("source_agent")]
        return JSONResponse({
            "round_id": row.get("round_id", ""),
            "ts": row.get("ts", ""),
            "roundtable": {
                "consensus_predictions": consensus_preds or preds,
                "wildcards": wildcards,
                "debate_summary": row.get("debate_log", ""),
            },
            "simulation": sim,
            "chief_analyses": [],
        })
    return JSONResponse({"message": "暂无预测。请使用 POST /api/predict 触发第一轮预测。"})


@app.get("/api/history")
async def get_history():
    return JSONResponse({
        "consensus": get_recent_consensus(20),
        "predictions": get_recent_predictions(100),
        "agent_scores": get_agent_scores(),
    })


@app.get("/api/world")
async def get_world_data():
    """Fetch all intelligence data for the World Intel tab (16 sources)."""
    from config import FRED_API_KEY, FINNHUB_API_KEY
    from data.sources.worldmonitor import fetch_all_worldmonitor
    from data.sources.acled import fetch_acled_conflicts
    from data.sources.polymarket import fetch_polymarket
    from data.sources.nasa_firms import fetch_active_fires
    from data.sources.fred import fetch_fred_indicators
    from data.sources.who import fetch_who_alerts
    from data.sources.finnhub import fetch_stock_quotes
    from data.sources.news import fetch_news
    from data.sources.weibo import fetch_weibo_hot
    from data.sources.trends import fetch_google_trends
    from data.sources.crypto import fetch_crypto
    from data.sources.finance import fetch_finance
    from data.sources.gdelt import fetch_gdelt_trending
    from data.cache import cached_fetch, TTL_SHORT, TTL_LONG, TTL_MEDIUM, TTL_EXTENDED
    try:
        (wm, conflicts, markets, fires, fred, who, stocks, news_items,
         weibo, trends, crypto, finance, gdelt) = await asyncio.gather(
            cached_fetch("worldmonitor", fetch_all_worldmonitor, TTL_LONG),
            cached_fetch("acled", fetch_acled_conflicts, TTL_EXTENDED),
            cached_fetch("polymarket", fetch_polymarket, TTL_MEDIUM),
            cached_fetch("fires", fetch_active_fires, TTL_LONG),
            cached_fetch("fred", fetch_fred_indicators, TTL_LONG),
            cached_fetch("who", fetch_who_alerts, TTL_LONG),
            cached_fetch("finnhub", fetch_stock_quotes, TTL_SHORT),
            cached_fetch("news", fetch_news, TTL_MEDIUM),
            cached_fetch("weibo", fetch_weibo_hot, TTL_MEDIUM),
            cached_fetch("trends", fetch_google_trends, TTL_MEDIUM),
            cached_fetch("crypto", fetch_crypto, TTL_SHORT),
            cached_fetch("finance", fetch_finance, TTL_SHORT),
            cached_fetch("gdelt", fetch_gdelt_trending, TTL_LONG),
            return_exceptions=True,
        )
        result = wm if isinstance(wm, dict) else {"earthquakes": [], "climate": [], "disruptions": [], "markets": []}
        result["conflicts"] = conflicts if isinstance(conflicts, list) else []
        result["prediction_markets"] = markets if isinstance(markets, list) else []
        result["fires"] = fires if isinstance(fires, list) else []
        result["fred"] = fred if isinstance(fred, list) else []
        result["who"] = who if isinstance(who, list) else []
        result["stocks"] = stocks if isinstance(stocks, list) else []
        result["news_headlines"] = (news_items if isinstance(news_items, list) else [])[:50]
        result["weibo"] = weibo if isinstance(weibo, list) else []
        result["trends"] = trends if isinstance(trends, list) else []
        result["crypto"] = crypto if isinstance(crypto, list) else []
        result["finance"] = finance if isinstance(finance, list) else []
        result["gdelt"] = gdelt if isinstance(gdelt, list) else []
        result["meta"] = {
            "fred_configured": bool(FRED_API_KEY),
            "finnhub_configured": bool(FINNHUB_API_KEY),
        }
        return JSONResponse(result)
    except Exception as e:
        log.error("World data fetch failed: %s", e)
        return JSONResponse({
            "earthquakes": [], "climate": [], "disruptions": [], "markets": [],
            "conflicts": [], "prediction_markets": [], "fires": [],
            "fred": [], "who": [], "stocks": [], "news_headlines": [],
            "weibo": [], "trends": [], "crypto": [], "finance": [], "gdelt": [],
            "meta": {"fred_configured": bool(FRED_API_KEY), "finnhub_configured": bool(FINNHUB_API_KEY)},
        })


def _normalize_source_items(source_key: str, payload) -> list[dict]:
    """Normalize heterogeneous source payloads into a simple list for UI detail drawers."""
    if payload is None:
        return []

    if source_key == "worldmonitor" and isinstance(payload, dict):
        items: list[dict] = []
        section_map = {
            "earthquakes": "earthquake",
            "climate": "climate",
            "disruptions": "disruption",
            "markets": "market",
        }
        for section, section_items in payload.items():
            if not isinstance(section_items, list):
                continue
            for item in section_items:
                if not isinstance(item, dict):
                    continue
                items.append({
                    "title": item.get("title") or item.get("name") or section,
                    "subtitle": item.get("location") or item.get("region") or item.get("country") or item.get("classification") or "",
                    "url": item.get("url") or item.get("link") or "",
                    "category": section_map.get(section, section),
                    "raw": item,
                })
        return items

    if isinstance(payload, list):
        items = []
        for item in payload:
            if not isinstance(item, dict):
                items.append({"title": str(item), "subtitle": "", "url": "", "category": source_key, "raw": item})
                continue
            items.append({
                "title": item.get("title") or item.get("name") or item.get("query") or item.get("word") or item.get("symbol") or source_key,
                "subtitle": item.get("snippet") or item.get("source") or item.get("label") or item.get("date") or item.get("country") or "",
                "url": item.get("url") or item.get("link") or "",
                "category": item.get("category") or source_key,
                "raw": item,
            })
        return items

    return [{"title": source_key, "subtitle": "", "url": "", "category": source_key, "raw": payload}]


@app.get("/api/source/{source_key}")
async def get_source_detail(source_key: str):
    """Return normalized source payload so the UI can inspect raw values and links."""
    from data.cache import cached_fetch, TTL_SHORT, TTL_LONG, TTL_MEDIUM, TTL_EXTENDED
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

    source_map = {
        "news": (fetch_news, TTL_MEDIUM),
        "weibo": (fetch_weibo_hot, TTL_MEDIUM),
        "trends": (fetch_google_trends, TTL_MEDIUM),
        "crypto": (fetch_crypto, TTL_SHORT),
        "finance": (fetch_finance, TTL_SHORT),
        "worldmonitor": (fetch_all_worldmonitor, TTL_LONG),
        "acled": (fetch_acled_conflicts, TTL_EXTENDED),
        "gdelt": (fetch_gdelt_trending, TTL_LONG),
        "polymarket": (fetch_polymarket, TTL_MEDIUM),
        "fires": (fetch_active_fires, TTL_LONG),
        "fred": (fetch_fred_indicators, TTL_LONG),
        "who": (fetch_who_alerts, TTL_LONG),
        "finnhub": (fetch_stock_quotes, TTL_SHORT),
    }

    if source_key not in source_map:
        return JSONResponse({"error": "Unknown source"}, status_code=404)

    fetcher, ttl = source_map[source_key]
    try:
        payload = await cached_fetch(source_key, fetcher, ttl)
        items = _normalize_source_items(source_key, payload)
        return JSONResponse({
            "source": source_key,
            "count": len(items),
            "items": items[:100],
        })
    except Exception as e:
        log.warning("Source detail fetch failed for %s: %s", source_key, e)
        return JSONResponse({"source": source_key, "count": 0, "items": [], "error": str(e)})


@app.get("/api/agents")
async def get_agents():
    from agents.chief_agents import CHIEFS
    from agents.memory import get_agent_episodic_memory
    scores = {s["agent_name"]: s for s in get_agent_scores()}
    return JSONResponse([
        {
            "name": a.name,
            "name_cn": a.name_cn,
            "emoji": a.emoji,
            "domain": a.domain,
            "personality": a.personality,
            "score": scores.get(a.name, {"total": 0, "hits": 0, "accuracy": 0}),
            "recent_memory": get_agent_episodic_memory(a.name, limit=5),
        }
        for a in CHIEFS
    ])


@app.get("/api/agent/{agent_name}")
async def get_agent_detail(agent_name: str):
    """Deep detail for a single agent: personality, memory, related news, predictions."""
    from agents.chief_agents import CHIEFS
    from agents.memory import get_agent_episodic_memory, get_trending_entities
    from data.cache import cached_fetch, TTL_LONG, TTL_MEDIUM, TTL_EXTENDED

    agent = next((a for a in CHIEFS if a.name.lower() == agent_name.lower()), None)
    if not agent:
        return JSONResponse({"error": "Agent not found"}, status_code=404)

    score_list = get_agent_scores()
    score = next((s for s in score_list if s["agent_name"] == agent.name), {"total": 0, "hits": 0, "accuracy": 0})
    memory = get_agent_episodic_memory(agent.name, limit=15)

    from db.store import get_conn
    conn = get_conn()
    recent_preds = [dict(r) for r in conn.execute(
        "SELECT prediction, confidence, reasoning, verified, verify_note, ts FROM predictions WHERE agent_name = ? ORDER BY ts DESC LIMIT 10",
        (agent.name,),
    ).fetchall()]
    conn.close()

    domain_news = []
    try:
        from data.sources.rss import fetch_rss_feeds
        from data.sources.worldmonitor import fetch_all_worldmonitor
        from data.cache import cached_fetch, TTL_LONG
        wm = await cached_fetch("worldmonitor", fetch_all_worldmonitor, TTL_LONG)
        if isinstance(wm, dict):
            domain_map = {
                "politics": ["disruptions"],
                "tech": [],
                "opinion": [],
                "finance": ["markets"],
                "culture": [],
                "blackswan": ["earthquakes", "disruptions", "climate"],
                "military": ["conflicts"],
                "health": [],
                "energy": ["climate"],
                "china": [],
                "crypto": ["markets"],
                "supply_chain": ["disruptions"],
            }
            keys = domain_map.get(agent.domain, [])
            for key in keys:
                items = wm.get(key, [])
                for item in items[:5]:
                    if isinstance(item, dict):
                        domain_news.append({
                            "title": item.get("title", ""),
                            "category": key,
                            "time": item.get("time", item.get("ts", "")),
                        })
        from data.sources.acled import fetch_acled_conflicts
        if agent.domain in ("military", "politics", "blackswan"):
            conflicts = await cached_fetch("acled", fetch_acled_conflicts, TTL_EXTENDED)
            if isinstance(conflicts, list):
                for c in conflicts[:5]:
                    if isinstance(c, dict):
                        domain_news.append({"title": c.get("title", ""), "category": "conflict", "time": c.get("ts", "")})
        if agent.domain in ("crypto", "finance"):
            from data.sources.polymarket import fetch_polymarket
            poly = await cached_fetch("polymarket", fetch_polymarket, TTL_MEDIUM)
            if isinstance(poly, list):
                for p in poly[:5]:
                    if isinstance(p, dict):
                        domain_news.append({"title": p.get("title", ""), "category": "prediction_market", "time": ""})
    except Exception as e:
        log.warning("Failed to fetch domain news for %s: %s", agent.name, e)

    entities = get_trending_entities(10)

    return JSONResponse({
        "name": agent.name,
        "name_cn": agent.name_cn,
        "emoji": agent.emoji,
        "domain": agent.domain,
        "personality": agent.personality,
        "score": score,
        "memory": memory,
        "recent_predictions": recent_preds,
        "domain_news": domain_news[:15],
        "related_entities": [e for e in entities if any(
            kw in (e.get("context") or "").lower() for kw in [agent.domain]
        )][:8],
    })


@app.get("/api/entities")
async def get_entities():
    """Get trending entities from the knowledge graph with full context."""
    entities = get_trending_entities(80)
    return JSONResponse(entities)


@app.get("/api/entity/{entity_name}")
async def get_entity_detail(entity_name: str):
    """Deep detail for a single entity: context, related predictions, connections, timeline."""
    from db.store import get_conn
    from agents.memory import _conn as mem_conn_fn

    conn = mem_conn_fn()
    row = conn.execute(
        "SELECT * FROM entity_graph WHERE entity = ? COLLATE NOCASE", (entity_name,)
    ).fetchone()
    if not row:
        conn.close()
        return JSONResponse({"error": "Entity not found"}, status_code=404)

    entity = dict(row)
    relations_raw = entity.get("relations") or "[]"
    try:
        relations = json.loads(relations_raw) if isinstance(relations_raw, str) else relations_raw
    except Exception:
        relations = []

    related_entities = []
    for r in relations[:10]:
        rel_row = conn.execute(
            "SELECT entity, entity_type, mention_count FROM entity_graph WHERE entity = ? COLLATE NOCASE",
            (r,)
        ).fetchone()
        if rel_row:
            related_entities.append(dict(rel_row))

    co_occurring = conn.execute(
        """SELECT entity, entity_type, mention_count, context
           FROM entity_graph
           WHERE entity != ? COLLATE NOCASE
             AND (context LIKE ? OR entity_type = ?)
           ORDER BY mention_count DESC LIMIT 10""",
        (entity_name, f"%{entity_name}%", entity.get("entity_type", "")),
    ).fetchall()
    conn.close()

    db_conn = get_conn()
    related_preds = db_conn.execute(
        """SELECT prediction, confidence, agent_name, domain, verified, verify_note, ts
           FROM predictions
           WHERE prediction LIKE ?
           ORDER BY ts DESC LIMIT 15""",
        (f"%{entity_name}%",),
    ).fetchall()

    agent_mentions = db_conn.execute(
        """SELECT agent_name, prediction, confidence, outcome, ts
           FROM agent_memory
           WHERE prediction LIKE ?
           ORDER BY ts DESC LIMIT 10""",
        (f"%{entity_name}%",),
    ).fetchall()
    db_conn.close()

    contexts = (entity.get("context") or "").split("] ")
    parsed_contexts = []
    for ctx in contexts:
        ctx = ctx.strip()
        if not ctx:
            continue
        if ctx.startswith("["):
            parts = ctx.split("] ", 1)
            meta = parts[0].lstrip("[")
            text = parts[1] if len(parts) > 1 else ""
        else:
            meta = ""
            text = ctx
        parsed_contexts.append({"meta": meta, "text": text[:200]})

    return JSONResponse({
        "entity": entity.get("entity", entity_name),
        "entity_type": entity.get("entity_type", "topic"),
        "mention_count": entity.get("mention_count", 0),
        "first_seen": entity.get("first_seen", ""),
        "last_seen": entity.get("last_seen", ""),
        "contexts": parsed_contexts[-10:],
        "relations": relations,
        "related_entities": related_entities + [dict(r) for r in co_occurring if dict(r)["entity"] != entity_name],
        "related_predictions": [dict(r) for r in related_preds],
        "agent_mentions": [dict(r) for r in agent_mentions],
    })


@app.get("/api/accuracy")
async def get_accuracy_dashboard():
    """Historical prediction accuracy — the core value metric of Tianji."""
    from db.store import get_conn
    conn = get_conn()

    total = conn.execute("SELECT COUNT(*) FROM predictions WHERE verified IS NOT NULL").fetchone()[0]
    hits = conn.execute("SELECT COUNT(*) FROM predictions WHERE verified = 1").fetchone()[0]
    misses = conn.execute("SELECT COUNT(*) FROM predictions WHERE verified = 0").fetchone()[0]
    pending = conn.execute("SELECT COUNT(*) FROM predictions WHERE verified IS NULL").fetchone()[0]

    by_agent = [dict(r) for r in conn.execute("""
        SELECT agent_name,
               COUNT(*) as total,
               SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as hits,
               SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) as misses,
               ROUND(CAST(SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(*), 1) * 100, 1) as accuracy
        FROM predictions WHERE verified IS NOT NULL
        GROUP BY agent_name ORDER BY accuracy DESC
    """).fetchall()]

    by_domain = [dict(r) for r in conn.execute("""
        SELECT domain,
               COUNT(*) as total,
               SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as hits,
               ROUND(CAST(SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(*), 1) * 100, 1) as accuracy
        FROM predictions WHERE verified IS NOT NULL
        GROUP BY domain ORDER BY accuracy DESC
    """).fetchall()]

    recent_verified = [dict(r) for r in conn.execute("""
        SELECT prediction, agent_name, domain, confidence, verified, verify_note, ts, verified_at
        FROM predictions WHERE verified IS NOT NULL
        ORDER BY verified_at DESC LIMIT 30
    """).fetchall()]

    by_round = [dict(r) for r in conn.execute("""
        SELECT round_id,
               COUNT(*) as total,
               SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as hits,
               ROUND(CAST(SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(*), 1) * 100, 1) as accuracy,
               MIN(ts) as ts
        FROM predictions WHERE verified IS NOT NULL
        GROUP BY round_id ORDER BY ts DESC LIMIT 20
    """).fetchall()]

    conn.close()
    return JSONResponse({
        "total_verified": total,
        "hits": hits,
        "misses": misses,
        "pending": pending,
        "overall_accuracy": round(hits / max(total, 1) * 100, 1),
        "by_agent": by_agent,
        "by_domain": by_domain,
        "by_round": by_round,
        "recent_verified": recent_verified,
    })


@app.get("/api/cache")
async def get_cache_status():
    """Cache diagnostics endpoint."""
    from data.cache import cache_stats
    return JSONResponse(cache_stats())


@app.post("/api/translate")
async def translate_text(request: Request):
    """On-demand translation of prediction text using LLM."""
    from openai import OpenAI
    from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
    body = await request.json()
    text = body.get("text", "")
    target = body.get("target_language", "中文")
    if not text:
        return JSONResponse({"translated": ""})
    try:
        client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
        resp = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": f"Translate the following text to {target}. Return ONLY the translation, nothing else."},
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=500,
        )
        translated = resp.choices[0].message.content or text
        return JSONResponse({"translated": translated.strip()})
    except Exception as e:
        log.warning("Translation failed: %s", e)
        return JSONResponse({"translated": text})


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ws_clients.add(ws)
    log.info("WebSocket client connected (%d total)", len(ws_clients))
    try:
        if latest_round:
            await ws.send_text(json.dumps({"type": "prediction_update", "data": latest_round}, ensure_ascii=False, default=str))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        ws_clients.discard(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        reload_excludes=["*.db", "*.db-wal", "*.db-shm", "*.sqlite"],
    )
