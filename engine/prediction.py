"""Prediction pipeline — orchestrates the full cycle:
   collect data → extract entities → chief agents (with memory) → roundtable → citizen sim → store.

Supports both batch and streaming modes. Streaming yields SSE events as each step completes.
"""

from __future__ import annotations
import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import AsyncGenerator

from data.collector import collect_world_data
from agents.chief_agents import run_chief_agent, CHIEFS
from agents.citizen_simulation import CitizenWorld, simulate_prediction_spread
from agents.memory import save_agent_memory, enrich_graph_from_prediction
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


def _sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Event."""
    payload = json.dumps(data, ensure_ascii=False, default=str)
    return f"event: {event}\ndata: {payload}\n\n"


async def run_prediction_cycle_streaming() -> AsyncGenerator[str, None]:
    """Full prediction cycle that yields SSE events as each step completes."""
    round_id = f"R-{datetime.utcnow().strftime('%Y%m%d-%H%M')}-{uuid.uuid4().hex[:6]}"
    total_steps = 6

    yield _sse_event("step", {
        "step": 1, "total": total_steps,
        "label": "collecting_data",
        "message": "正在从 13+ 数据源收集实时数据...",
        "message_en": "Collecting real-time data from 13+ sources...",
    })

    # 1. Collect world data
    snapshot = await collect_world_data()
    for domain in ["news", "weibo", "trends", "crypto", "finance",
                    "conflicts", "gdelt", "predictions_market", "fires"]:
        items = getattr(snapshot, domain)
        if items:
            save_snapshot(domain, items)

    yield _sse_event("step", {
        "step": 2, "total": total_steps,
        "label": "extracting_entities",
        "message": "正在提取实体、更新知识图谱...",
        "message_en": "Extracting entities, updating knowledge graph...",
    })

    # 2. Entity extraction
    all_items = snapshot.all_items_flat()
    entity_counts = extract_entities_fast(all_items)

    yield _sse_event("entities", {
        "count": len(entity_counts),
        "top": sorted(entity_counts.items(), key=lambda x: -x[1])[:8],
    })

    yield _sse_event("step", {
        "step": 3, "total": total_steps,
        "label": "running_agents",
        "message": f"正在运行 {len(CHIEFS)} 个首席智能体 (ReACT 推理)...",
        "message_en": f"Running {len(CHIEFS)} chief agents (ReACT reasoning)...",
    })

    # 3. Run chief agents — stream each agent's result as it completes
    world_summary = snapshot.summary()
    chief_results: list[tuple] = []

    async def run_and_emit(agent):
        result = await run_chief_agent(agent, world_summary)
        return (agent, result)

    tasks = [asyncio.create_task(run_and_emit(agent)) for agent in CHIEFS]

    completed = 0
    for coro in asyncio.as_completed(tasks):
        agent, output = await coro
        completed += 1
        chief_results.append((agent, output))
        n_preds = len(output.get("predictions", []))
        yield _sse_event("agent_done", {
            "agent": agent.name,
            "agent_cn": agent.name_cn,
            "emoji": agent.emoji,
            "domain": agent.domain,
            "completed": completed,
            "total_agents": len(CHIEFS),
            "output": output,
            "prediction_count": n_preds,
        })

    # Reorder to match CHIEFS order
    agent_order = {a.name: i for i, a in enumerate(CHIEFS)}
    chief_results.sort(key=lambda x: agent_order.get(x[0].name, 99))

    yield _sse_event("step", {
        "step": 4, "total": total_steps,
        "label": "roundtable_debate",
        "message": "圆桌辩论 — 12 个智能体正在交叉验证与投票...",
        "message_en": "Roundtable debate — 12 agents cross-validating and voting...",
    })

    # 4. Roundtable debate
    roundtable = await run_roundtable(chief_results)

    yield _sse_event("roundtable_done", {
        "consensus_count": len(roundtable.get("consensus_predictions", [])),
        "wildcard_count": len(roundtable.get("wildcards", [])),
        "debate_summary": roundtable.get("debate_summary", "")[:300],
    })

    yield _sse_event("step", {
        "step": 5, "total": total_steps,
        "label": "citizen_simulation",
        "message": "百万公民仿真 — 预测信息扩散与舆情极化...",
        "message_en": "Million-citizen simulation — modeling information spread...",
    })

    # 5. Citizen simulation
    all_preds = roundtable.get("consensus_predictions", []) + roundtable.get("wildcards", [])
    citizen_world = get_citizen_world()
    sim_result = simulate_prediction_spread(citizen_world, all_preds, steps=24)

    yield _sse_event("step", {
        "step": 6, "total": total_steps,
        "label": "storing_results",
        "message": "正在存储预测、更新智能体记忆...",
        "message_en": "Storing predictions, updating agent memory...",
    })

    # 6. Store everything
    for pred in roundtable.get("consensus_predictions", []):
        supporters = pred.get("supporters", [])
        for agent_name in supporters:
            save_prediction(
                round_id=round_id, domain=pred.get("domain", "unknown"),
                agent_name=agent_name, prediction=pred["prediction"],
                confidence=pred.get("confidence", 0.5), reasoning=pred.get("reasoning", ""),
            )
            save_agent_memory(
                agent_name=agent_name, round_id=round_id,
                prediction=pred["prediction"], confidence=pred.get("confidence", 0.5),
                domain=pred.get("domain", "unknown"),
            )
        enrich_graph_from_prediction(
            prediction=pred["prediction"], domain=pred.get("domain", "unknown"),
            confidence=pred.get("confidence", 0.5),
        )

    for wc in roundtable.get("wildcards", []):
        agent_name = wc.get("source_agent", "Cassandra")
        save_prediction(
            round_id=round_id, domain=wc.get("domain", "blackswan"),
            agent_name=agent_name, prediction=wc["prediction"],
            confidence=wc.get("confidence", 0.2), reasoning=wc.get("reasoning", ""),
        )
        save_agent_memory(
            agent_name=agent_name, round_id=round_id,
            prediction=wc["prediction"], confidence=wc.get("confidence", 0.2),
            domain=wc.get("domain", "blackswan"),
        )
        enrich_graph_from_prediction(
            prediction=wc["prediction"], domain=wc.get("domain", "blackswan"),
            confidence=wc.get("confidence", 0.2),
        )

    save_consensus(
        round_id=round_id, predictions=all_preds,
        debate_log=roundtable.get("debate_summary", ""), sim_result=sim_result,
    )

    # Final result
    final = {
        "round_id": round_id,
        "ts": datetime.utcnow().isoformat(),
        "source_count": snapshot.source_count,
        "entity_count": len(entity_counts),
        "top_entities": sorted(entity_counts.items(), key=lambda x: -x[1])[:10],
        "chief_analyses": [
            {"agent": a.name, "agent_cn": a.name_cn, "emoji": a.emoji, "domain": a.domain, "output": o}
            for a, o in chief_results
        ],
        "roundtable": roundtable,
        "simulation": sim_result,
    }

    yield _sse_event("complete", final)


async def run_prediction_cycle() -> dict:
    """Batch mode — runs the full cycle and returns the final result."""
    result = None
    async for event_str in run_prediction_cycle_streaming():
        if event_str.startswith("event: complete"):
            data_line = event_str.split("data: ", 1)[1].split("\n")[0]
            result = json.loads(data_line)
    return result or {"error": "Prediction cycle produced no result"}
