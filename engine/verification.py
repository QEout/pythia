"""Verification engine — checks yesterday's predictions against today's reality.

Enhanced with memory feedback: verification results are written back into agent
episodic memory so agents learn from their hits and misses (MiroFish-inspired).
"""

from __future__ import annotations
import json
import logging
from datetime import datetime, timedelta
from openai import OpenAI

from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from data.collector import collect_world_data
from db.store import get_unverified_predictions, mark_verified, update_agent_score
from agents.memory import update_memory_outcome

log = logging.getLogger(__name__)

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

VERIFY_SYSTEM = """You are the Verification Agent for Pythia, a prediction engine.

You are given:
1. A prediction that was made earlier
2. Current real-world data

Determine if the prediction came true, partially true, or was wrong.

Output STRICT JSON:
{
  "verdict": "hit" | "partial" | "miss",
  "explanation": "1-2 sentence explanation of why this is a hit/partial/miss",
  "evidence": "specific data point from current data that supports your verdict",
  "lesson": "1 sentence about what the agent should learn from this outcome for future predictions"
}"""


async def verify_predictions():
    """Check predictions older than 12h that haven't been verified yet."""
    cutoff = (datetime.utcnow() - timedelta(hours=12)).isoformat()
    unverified = get_unverified_predictions(before=cutoff)

    if not unverified:
        log.info("No predictions to verify.")
        return []

    log.info("Verifying %d predictions...", len(unverified))

    snapshot = await collect_world_data()
    current_data = snapshot.summary()

    results = []
    for pred in unverified:
        try:
            resp = client.chat.completions.create(
                model=DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": VERIFY_SYSTEM},
                    {"role": "user", "content": f"PREDICTION (made at {pred['ts']}):\n{pred['prediction']}\n\nCURRENT WORLD DATA:\n{current_data}\n\nVerify. Output JSON only."},
                ],
                temperature=0.2,
                max_tokens=400,
                response_format={"type": "json_object"},
            )
            text = resp.choices[0].message.content or "{}"
            verdict = json.loads(text)

            hit = verdict.get("verdict") in ("hit", "partial")
            note = f"{verdict.get('verdict')}: {verdict.get('explanation', '')} | Evidence: {verdict.get('evidence', '')}"

            mark_verified(pred["id"], hit, note)
            update_agent_score(pred["agent_name"], hit)

            update_memory_outcome(
                agent_name=pred["agent_name"],
                prediction=pred["prediction"],
                outcome=verdict.get("verdict", "miss"),
                lesson=verdict.get("lesson", ""),
            )

            results.append({
                "prediction_id": pred["id"],
                "prediction": pred["prediction"],
                "agent": pred["agent_name"],
                "verdict": verdict,
            })
            log.info("Verified pred #%d (%s): %s", pred["id"], pred["agent_name"], verdict.get("verdict"))

        except Exception as e:
            log.warning("Failed to verify pred #%d: %s", pred["id"], e)

    return results
