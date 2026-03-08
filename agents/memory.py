"""Agent Memory System — inspired by MiroFish's Zep/Graphiti temporal knowledge graph.

MiroFish uses Zep Cloud for long-term agent memory with GraphRAG. We implement a
local SQLite-based equivalent: each Chief Agent accumulates episodic memory of its
past predictions, their outcomes, and extracted entities. This memory is injected
into the agent's prompt to enable cross-round learning.

Key ideas from MiroFish:
  - Individual + collective memory (per-agent history + shared entity graph)
  - Temporal awareness (agents know how long ago events occurred)
  - Dynamic memory updates after each simulation round
"""

from __future__ import annotations
import json
import logging
import sqlite3
from datetime import datetime
from config import DB_PATH

log = logging.getLogger(__name__)


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_memory_tables():
    """Create memory tables if they don't exist."""
    conn = _conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS agent_memory (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_name  TEXT    NOT NULL,
        round_id    TEXT    NOT NULL,
        ts          TEXT    NOT NULL DEFAULT (datetime('now')),
        prediction  TEXT    NOT NULL,
        confidence  REAL    NOT NULL,
        domain      TEXT    NOT NULL,
        outcome     TEXT    DEFAULT NULL,
        lesson      TEXT    DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS entity_graph (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        entity      TEXT    NOT NULL,
        entity_type TEXT    NOT NULL,
        first_seen  TEXT    NOT NULL DEFAULT (datetime('now')),
        last_seen   TEXT    NOT NULL DEFAULT (datetime('now')),
        mention_count INTEGER NOT NULL DEFAULT 1,
        context     TEXT    DEFAULT NULL,
        relations   TEXT    DEFAULT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_memory_agent ON agent_memory(agent_name);
    CREATE INDEX IF NOT EXISTS idx_entity_name ON entity_graph(entity);
    """)
    conn.commit()
    conn.close()


def save_agent_memory(agent_name: str, round_id: str, prediction: str,
                      confidence: float, domain: str):
    """Record a prediction into agent's episodic memory."""
    conn = _conn()
    conn.execute(
        "INSERT INTO agent_memory (agent_name, round_id, prediction, confidence, domain) VALUES (?,?,?,?,?)",
        (agent_name, round_id, prediction, confidence, domain),
    )
    conn.commit()
    conn.close()


def update_memory_outcome(agent_name: str, prediction: str, outcome: str, lesson: str):
    """Update a memory entry with verification results."""
    conn = _conn()
    conn.execute(
        """UPDATE agent_memory SET outcome=?, lesson=?
           WHERE agent_name=? AND prediction=? AND outcome IS NULL""",
        (outcome, lesson, agent_name, prediction),
    )
    conn.commit()
    conn.close()


def get_agent_episodic_memory(agent_name: str, limit: int = 10) -> list[dict]:
    """Retrieve an agent's recent prediction history with outcomes."""
    conn = _conn()
    rows = conn.execute(
        """SELECT prediction, confidence, domain, outcome, lesson, ts
           FROM agent_memory
           WHERE agent_name = ?
           ORDER BY ts DESC LIMIT ?""",
        (agent_name, limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def format_memory_prompt(agent_name: str) -> str:
    """Format agent memory into a prompt section for injection.

    Returns a string like:
    [MEMORY — Your recent prediction track record]
    - 2h ago: "BTC will drop below 60k" (confidence: 0.7) → HIT ✓
      Lesson: Crypto fear signals were reliable indicators.
    - 8h ago: "New US-China tariffs announced" (0.6) → MISS ✗
      Lesson: Policy signals were ambiguous, overreacted to rhetoric.
    """
    memories = get_agent_episodic_memory(agent_name, limit=8)
    if not memories:
        return ""

    lines = ["[MEMORY — Your recent prediction track record]"]
    now = datetime.utcnow()
    for m in memories:
        try:
            ts = datetime.fromisoformat(m["ts"])
            delta = now - ts
            hours = int(delta.total_seconds() / 3600)
            ago = f"{hours}h ago" if hours < 48 else f"{hours // 24}d ago"
        except (ValueError, TypeError):
            ago = "recently"

        outcome_str = ""
        if m.get("outcome") == "hit":
            outcome_str = " → HIT ✓"
        elif m.get("outcome") == "partial":
            outcome_str = " → PARTIAL ~"
        elif m.get("outcome") == "miss":
            outcome_str = " → MISS ✗"
        else:
            outcome_str = " → PENDING..."

        line = f'  - {ago}: "{m["prediction"]}" (confidence: {m["confidence"]:.1f}){outcome_str}'
        lines.append(line)
        if m.get("lesson"):
            lines.append(f'    Lesson: {m["lesson"]}')

    lines.append("")
    lines.append("Use your track record to calibrate confidence. If you've been wrong about a domain, be more cautious. If you've been right, trust your signals more.")
    return "\n".join(lines)


# --- Entity Graph (simplified MiroFish GraphRAG) ---

def upsert_entity(entity: str, entity_type: str, context: str = "",
                  relations: list[str] | None = None):
    """Insert or update an entity in the knowledge graph."""
    conn = _conn()
    existing = conn.execute(
        "SELECT id, mention_count FROM entity_graph WHERE entity = ? AND entity_type = ?",
        (entity, entity_type),
    ).fetchone()
    if existing:
        conn.execute(
            """UPDATE entity_graph
               SET mention_count = mention_count + 1,
                   last_seen = datetime('now'),
                   context = ?,
                   relations = ?
               WHERE id = ?""",
            (context[:500], json.dumps(relations or []), existing["id"]),
        )
    else:
        conn.execute(
            "INSERT INTO entity_graph (entity, entity_type, context, relations) VALUES (?,?,?,?)",
            (entity, entity_type, context[:500], json.dumps(relations or [])),
        )
    conn.commit()
    conn.close()


def get_trending_entities(limit: int = 15) -> list[dict]:
    """Get entities with most recent mentions — signals what the world is focused on."""
    conn = _conn()
    rows = conn.execute(
        """SELECT entity, entity_type, mention_count, last_seen, context
           FROM entity_graph
           ORDER BY last_seen DESC, mention_count DESC
           LIMIT ?""",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def format_entity_context() -> str:
    """Format trending entities into a prompt section."""
    entities = get_trending_entities(12)
    if not entities:
        return ""

    lines = ["[KNOWLEDGE GRAPH — Trending entities across all data sources]"]
    for e in entities:
        lines.append(f"  - {e['entity']} ({e['entity_type']}) — mentioned {e['mention_count']}x, last: {e['last_seen']}")
        if e.get("context"):
            lines.append(f"    Context: {e['context'][:100]}")
    return "\n".join(lines)
