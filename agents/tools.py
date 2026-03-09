"""Agent Tools — callable functions for ReACT-style iterative reasoning.

Chief Agents can request tool calls during analysis to gather deeper context
before finalizing predictions. This replaces the single-shot static approach.
"""

from __future__ import annotations
import json
import logging
from agents.memory import get_agent_episodic_memory, get_trending_entities
from db.store import get_agent_scores, get_recent_predictions

log = logging.getLogger(__name__)

TOOL_DESCRIPTIONS = """Available tools (output a "tool_calls" array to use them):
1. query_knowledge_graph(query) — Search the entity graph for entities, relationships, and recent context matching your query.
2. check_track_record(domain) — Retrieve your historical prediction accuracy for a specific domain, with lessons learned.
3. cross_validate(claim) — Cross-check a claim against recent predictions from all agents to see if others agree or disagree.
4. get_recent_signals(domain) — Get the most recent verified predictions and their outcomes for a domain."""


def query_knowledge_graph(query: str) -> str:
    """Search entity graph for relevant context."""
    entities = get_trending_entities(20)
    query_lower = query.lower()
    matches = [e for e in entities if query_lower in e["entity"].lower()
               or query_lower in (e.get("context") or "").lower()
               or query_lower in e.get("entity_type", "").lower()]

    if not matches:
        keywords = query_lower.split()
        matches = [e for e in entities
                   if any(kw in e["entity"].lower() or kw in (e.get("context") or "").lower()
                          for kw in keywords)]

    if not matches:
        matches = entities[:5]

    lines = [f"Knowledge graph results for '{query}':"]
    for e in matches[:8]:
        lines.append(f"  • {e['entity']} ({e['entity_type']}) — {e['mention_count']}x mentions, last: {e['last_seen']}")
        if e.get("context"):
            lines.append(f"    Context: {e['context'][:150]}")
    return "\n".join(lines) if len(lines) > 1 else f"No entities found matching '{query}'."


def check_track_record(agent_name: str, domain: str) -> str:
    """Check agent's historical accuracy in a domain."""
    memories = get_agent_episodic_memory(agent_name, limit=15)
    domain_memories = [m for m in memories if m.get("domain") == domain]

    scores = get_agent_scores()
    agent_score = next((s for s in scores if s["agent_name"] == agent_name), None)

    lines = [f"Track record for {agent_name} in '{domain}':"]
    if agent_score:
        lines.append(f"  Overall: {agent_score['hits']}/{agent_score['total']} ({agent_score['accuracy']:.0%} accuracy)")

    hits = sum(1 for m in domain_memories if m.get("outcome") == "hit")
    partials = sum(1 for m in domain_memories if m.get("outcome") == "partial")
    misses = sum(1 for m in domain_memories if m.get("outcome") == "miss")
    pending = sum(1 for m in domain_memories if not m.get("outcome"))

    if domain_memories:
        lines.append(f"  Domain '{domain}': {hits} hits, {partials} partial, {misses} misses, {pending} pending")
        lines.append("  Recent predictions:")
        for m in domain_memories[:5]:
            status = m.get("outcome", "pending").upper()
            lines.append(f"    [{status}] {m['prediction'][:80]} (conf: {m['confidence']:.1f})")
            if m.get("lesson"):
                lines.append(f"      Lesson: {m['lesson']}")
    else:
        lines.append(f"  No history in domain '{domain}' yet.")

    return "\n".join(lines)


def cross_validate(claim: str) -> str:
    """Cross-check a claim against recent predictions from all agents."""
    recent = get_recent_predictions(50)
    claim_lower = claim.lower()
    keywords = [w for w in claim_lower.split() if len(w) > 3]

    related = []
    for p in recent:
        pred_lower = p.get("prediction", "").lower()
        overlap = sum(1 for kw in keywords if kw in pred_lower)
        if overlap >= 2 or any(kw in pred_lower for kw in keywords if len(kw) > 5):
            related.append(p)

    lines = [f"Cross-validation for: '{claim[:80]}...'"]
    if related:
        lines.append(f"  Found {len(related)} related predictions:")
        for p in related[:6]:
            verdict = ""
            if p.get("verified") is not None:
                verdict = " ✓ HIT" if p["verified"] else " ✗ MISS"
            lines.append(f"    [{p['agent_name']}] {p['prediction'][:80]} (conf: {p['confidence']:.1f}){verdict}")
    else:
        lines.append("  No related predictions found from other agents.")

    return "\n".join(lines)


def get_recent_signals(domain: str) -> str:
    """Get recent verified predictions and outcomes for a domain."""
    recent = get_recent_predictions(100)
    domain_preds = [p for p in recent if p.get("domain") == domain and p.get("verified") is not None]

    lines = [f"Recent verified signals in '{domain}':"]
    if domain_preds:
        for p in domain_preds[:8]:
            verdict = "HIT" if p["verified"] else "MISS"
            lines.append(f"  [{verdict}] {p['agent_name']}: {p['prediction'][:80]}")
            if p.get("verify_note"):
                lines.append(f"    Note: {p['verify_note'][:100]}")
    else:
        lines.append(f"  No verified predictions in '{domain}' yet.")
    return "\n".join(lines)


TOOL_REGISTRY = {
    "query_knowledge_graph": lambda args, agent: query_knowledge_graph(args.get("query", "")),
    "check_track_record": lambda args, agent: check_track_record(agent, args.get("domain", "")),
    "cross_validate": lambda args, agent: cross_validate(args.get("claim", "")),
    "get_recent_signals": lambda args, agent: get_recent_signals(args.get("domain", "")),
}


def execute_tool_calls(tool_calls: list[dict], agent_name: str) -> str:
    """Execute a batch of tool calls and return combined results."""
    results = []
    for tc in tool_calls[:3]:
        tool_name = tc.get("tool", tc.get("name", ""))
        args = tc.get("args", tc.get("arguments", {}))
        fn = TOOL_REGISTRY.get(tool_name)
        if fn:
            try:
                result = fn(args, agent_name)
                results.append(f"[Tool: {tool_name}]\n{result}")
            except Exception as e:
                results.append(f"[Tool: {tool_name}] Error: {e}")
        else:
            results.append(f"[Tool: {tool_name}] Unknown tool.")
    return "\n\n".join(results)
