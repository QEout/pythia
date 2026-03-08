"""Prediction pipeline — orchestrates the full cycle:
   collect data → chief agents → roundtable → citizen sim → store.
"""

from __future__ import annotations
import asyncio
import logging
import uuid
from datetime import datetime

from data.collector import collect_world_data
from agents.chief_agents import run_all_chiefs, CHIEFS
from agents.citizen_simulation import CitizenWorld, simulate_prediction_spread
from engine.roundtable import run_roundtable
from db.store import (
    save_snapshot, save_prediction, save_consensus,
    init_db,
)

log = logging.getLogger(__name__)

_citizen_world: CitizenWorld | None = None


def get_citizen_world() -> CitizenWorld:
    global _citizen_world
    if _citizen_world is None:
        log.info("Initializing citizen world (%d agents)...", 1_000_000)
        _citizen_world = CitizenWorld()
        log.info("Citizen world ready.")
    return _citizen_world


async def run_prediction_cycle() -> dict:
    """Full prediction cycle. Returns the round result."""
    round_id = f"R-{datetime.utcnow().strftime('%Y%m%d-%H%M')}-{uuid.uuid4().hex[:6]}"
    log.info("=== Prediction round %s starting ===", round_id)

    # 1. Collect world data
    log.info("[1/5] Collecting world data...")
    snapshot = await collect_world_data()
    for domain in ["news", "weibo", "trends", "crypto", "finance"]:
        items = getattr(snapshot, domain)
        if items:
            save_snapshot(domain, items)

    # 2. Run chief agents
    log.info("[2/5] Running 6 chief agents...")
    world_summary = snapshot.summary()
    chief_results = await run_all_chiefs(world_summary)

    # 3. Roundtable debate
    log.info("[3/5] Roundtable debate...")
    roundtable = await run_roundtable(chief_results)

    # 4. Citizen simulation
    log.info("[4/5] Running million-agent citizen simulation...")
    all_preds = roundtable.get("consensus_predictions", []) + roundtable.get("wildcards", [])
    citizen_world = get_citizen_world()
    sim_result = simulate_prediction_spread(citizen_world, all_preds, steps=24)
    log.info("Simulation complete: %s%% population reached, avg sentiment %.3f",
             sim_result["activation_pct"], sim_result["avg_sentiment"])

    # 5. Store everything
    log.info("[5/5] Storing predictions...")
    for pred in roundtable.get("consensus_predictions", []):
        supporters = pred.get("supporters", [])
        for agent_name in supporters:
            save_prediction(
                round_id=round_id,
                domain=pred.get("domain", "unknown"),
                agent_name=agent_name,
                prediction=pred["prediction"],
                confidence=pred.get("confidence", 0.5),
                reasoning=pred.get("reasoning", ""),
            )

    for wc in roundtable.get("wildcards", []):
        save_prediction(
            round_id=round_id,
            domain=wc.get("domain", "blackswan"),
            agent_name=wc.get("source_agent", "Cassandra"),
            prediction=wc["prediction"],
            confidence=wc.get("confidence", 0.2),
            reasoning=wc.get("reasoning", ""),
        )

    save_consensus(
        round_id=round_id,
        predictions=all_preds,
        debate_log=roundtable.get("debate_summary", ""),
        sim_result=sim_result,
    )

    log.info("=== Round %s complete ===", round_id)

    return {
        "round_id": round_id,
        "ts": datetime.utcnow().isoformat(),
        "chief_analyses": [
            {
                "agent": a.name,
                "agent_cn": a.name_cn,
                "emoji": a.emoji,
                "domain": a.domain,
                "output": o,
            }
            for a, o in chief_results
        ],
        "roundtable": roundtable,
        "simulation": sim_result,
    }
