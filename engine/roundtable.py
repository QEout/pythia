"""Roundtable — agents debate, challenge each other, then vote on final predictions."""

from __future__ import annotations
import json
import logging
from openai import OpenAI

from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from agents.chief_agents import ChiefAgent

log = logging.getLogger(__name__)

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

ROUNDTABLE_SYSTEM = """You are the Moderator of 天机 (Tianji)'s Roundtable — a debate among 12 AI agents predicting the future.

You have received analysis and predictions from 6 specialist agents. Your job:

1. SYNTHESIZE: Identify where agents agree and disagree
2. DEBATE: For each major disagreement, present both sides fairly
3. VOTE: Produce a final ranked list of consensus predictions (top 5-8)
4. HIGHLIGHT: Mark any prediction where a lone dissenter (especially Cassandra) contradicts the majority — these are "wildcard" predictions

For each final prediction, calculate a consensus confidence:
  - If 5-6 agents agree: confidence × 1.2 (cap at 0.95)
  - If 3-4 agents agree: keep original confidence
  - If only 1-2 agents support: confidence × 0.6 (wildcard)

Output STRICT JSON:
{
  "debate_summary": "2-3 paragraph summary of the key debates and disagreements",
  "consensus_predictions": [
    {
      "prediction": "the specific prediction",
      "confidence": 0.75,
      "supporters": ["Agent1", "Agent2"],
      "dissenters": ["Agent3"],
      "domain": "finance",
      "is_wildcard": false,
      "reasoning": "why the consensus formed"
    }
  ],
  "wildcards": [
    {
      "prediction": "a lone contrarian prediction worth tracking",
      "confidence": 0.25,
      "source_agent": "Cassandra",
      "domain": "blackswan",
      "reasoning": "why this might matter despite low consensus"
    }
  ]
}"""


async def run_roundtable(chief_results: list[tuple[ChiefAgent, dict]]) -> dict:
    """Take all chief agent outputs and run a roundtable debate."""
    agent_briefs = []
    for agent, output in chief_results:
        brief = f"## {agent.emoji} {agent.name} ({agent.name_cn})\n"
        brief += f"Analysis: {output.get('analysis', 'N/A')}\n"
        brief += f"Dissent: {output.get('dissent', 'N/A')}\n"
        brief += "Predictions:\n"
        for p in output.get("predictions", []):
            brief += f"  - [{p.get('confidence', 0.5):.0%}] {p.get('prediction', '')}\n"
            brief += f"    Reasoning: {p.get('reasoning', '')}\n"
        agent_briefs.append(brief)

    all_briefs = "\n\n".join(agent_briefs)

    try:
        resp = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": ROUNDTABLE_SYSTEM},
                {"role": "user", "content": f"Here are the 6 agents' analyses and predictions:\n\n{all_briefs}\n\nConduct the roundtable debate and produce consensus. Output JSON only."},
            ],
            temperature=0.5,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        text = resp.choices[0].message.content or "{}"
        result = json.loads(text)
        log.info("Roundtable complete: %d consensus predictions, %d wildcards",
                 len(result.get("consensus_predictions", [])),
                 len(result.get("wildcards", [])))
        return result
    except Exception as e:
        log.error("Roundtable failed: %s", e)
        return {"debate_summary": "Roundtable failed", "consensus_predictions": [], "wildcards": []}
