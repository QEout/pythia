"""Pythia — Million-Agent Swarm Intelligence Prediction Engine.

FastAPI server with scheduled prediction cycles and real-time dashboard.
"""

from __future__ import annotations
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import PREDICTION_INTERVAL_HOURS
from db.store import (
    init_db, get_recent_consensus, get_agent_scores,
    get_recent_predictions,
)
from engine.prediction import run_prediction_cycle
from engine.verification import verify_predictions

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
    init_db()
    scheduler.add_job(scheduled_prediction, "interval", hours=PREDICTION_INTERVAL_HOURS, id="predict")
    scheduler.add_job(scheduled_verification, "interval", hours=12, id="verify")
    scheduler.start()
    log.info("Pythia started. Prediction interval: %dh", PREDICTION_INTERVAL_HOURS)
    yield
    scheduler.shutdown()


app = FastAPI(title="Pythia", lifespan=lifespan)


@app.get("/", response_class=HTMLResponse)
async def index():
    html_path = Path(__file__).parent / "dashboard" / "index.html"
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@app.post("/api/predict")
async def trigger_prediction():
    """Manually trigger a prediction cycle."""
    global latest_round
    result = await run_prediction_cycle()
    latest_round = result
    await broadcast({"type": "prediction_update", "data": result})
    return JSONResponse(result)


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
        return JSONResponse(consensus[0])
    return JSONResponse({"message": "No predictions yet. Trigger one with POST /api/predict"})


@app.get("/api/history")
async def get_history():
    return JSONResponse({
        "consensus": get_recent_consensus(20),
        "predictions": get_recent_predictions(100),
        "agent_scores": get_agent_scores(),
    })


@app.get("/api/world")
async def get_world_data():
    """Fetch current WorldMonitor data for the dashboard."""
    from data.sources.worldmonitor import fetch_all_worldmonitor
    try:
        data = await fetch_all_worldmonitor()
        return JSONResponse(data)
    except Exception as e:
        log.error("WorldMonitor fetch failed: %s", e)
        return JSONResponse({"earthquakes": [], "climate": [], "aviation": [], "markets": [], "signals": []})


@app.get("/api/agents")
async def get_agents():
    from agents.chief_agents import CHIEFS
    scores = {s["agent_name"]: s for s in get_agent_scores()}
    return JSONResponse([
        {
            "name": a.name,
            "name_cn": a.name_cn,
            "emoji": a.emoji,
            "domain": a.domain,
            "personality": a.personality,
            "score": scores.get(a.name, {"total": 0, "hits": 0, "accuracy": 0}),
        }
        for a in CHIEFS
    ])


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
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
