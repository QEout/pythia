"""Prediction pipeline — orchestrates the full cycle:
   collect data → extract entities → chief agents (with memory) → roundtable → citizen sim → store.

Enhanced with:
  - Entity extraction (MiroFish GraphRAG inspired)
  - Agent memory saving (MiroFish Zep inspired)
  - Cached data collection (WorldMonitor cache inspired)
"""

from __future__ import annotations
import asyncio
import logging
import uuid
from datetime import datetime

from data.collector import collect_world_data
from agents.chief_agents import run_all_chiefs, CHIEFS
from agents.citizen_simulation import CitizenWorld, simulate_prediction_spread
from agents.memory import save_agent_memory
from engine.roundtable import run_roundtable
from engine.entities import extract_entities_fast
from db.store import (
    save_snapshot, save_prediction, save_consensus,
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

    # 1. Collect world data (with caching)
    log.info("[1/6] Collecting world data from %d+ sources...", 13)
    snapshot = await collect_world_data()
    for domain in ["news", "weibo", "trends", "crypto", "finance",
                    "conflicts", "gdelt", "predictions_market", "fires"]:
        items = getattr(snapshot, domain)
        if items:
            save_snapshot(domain, items)

    # 2. Entity extraction (fast keyword pass)
    log.info("[2/6] Extracting entities (knowledge graph update)...")
    all_items = snapshot.all_items_flat()
    entity_counts = extract_entities_fast(all_items)
    log.info("Extracted %d unique entities from %d items", len(entity_counts), len(all_items))

    # 3. Run chief agents (with memory injection)
    log.info("[3/6] Running 6 chief agents (with memory + entity context)...")
    world_summary = snapshot.summary()
    chief_results = await run_all_chiefs(world_summary)

    # 4. Roundtable debate
    log.info("[4/6] Roundtable debate...")
    roundtable = await run_roundtable(chief_results)

    # 5. Citizen simulation
    log.info("[5/6] Running million-agent citizen simulation...")
    all_preds = roundtable.get("consensus_predictions", []) + roundtable.get("wildcards", [])
    citizen_world = get_citizen_world()
    sim_result = simulate_prediction_spread(citizen_world, all_preds, steps=24)
    log.info("Simulation complete: %s%% population reached, avg sentiment %.3f",
             sim_result["activation_pct"], sim_result["avg_sentiment"])

    # 6. Store everything + save to agent memory
    log.info("[6/6] Storing predictions and updating agent memory...")
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
            save_agent_memory(
                agent_name=agent_name,
                round_id=round_id,
                prediction=pred["prediction"],
                confidence=pred.get("confidence", 0.5),
                domain=pred.get("domain", "unknown"),
            )

    for wc in roundtable.get("wildcards", []):
        agent_name = wc.get("source_agent", "Cassandra")
        save_prediction(
            round_id=round_id,
            domain=wc.get("domain", "blackswan"),
            agent_name=agent_name,
            prediction=wc["prediction"],
            confidence=wc.get("confidence", 0.2),
            reasoning=wc.get("reasoning", ""),
        )
        save_agent_memory(
            agent_name=agent_name,
            round_id=round_id,
            prediction=wc["prediction"],
            confidence=wc.get("confidence", 0.2),
            domain=wc.get("domain", "blackswan"),
        )

    save_consensus(
        round_id=round_id,
        predictions=all_preds,
        debate_log=roundtable.get("debate_summary", ""),
        sim_result=sim_result,
    )

    log.info("=== Round %s complete (%d sources, %d entities, %d predictions) ===",
             round_id, snapshot.source_count, len(entity_counts), len(all_preds))

    return {
        "round_id": round_id,
        "ts": datetime.utcnow().isoformat(),
        "source_count": snapshot.source_count,
        "entity_count": len(entity_counts),
        "top_entities": sorted(entity_counts.items(), key=lambda x: -x[1])[:10],
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
