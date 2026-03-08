"""SQLite storage for predictions, verifications, and agent states."""

import sqlite3
import json
from datetime import datetime
from pathlib import Path

from config import DB_PATH


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS data_snapshots (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        ts          TEXT    NOT NULL DEFAULT (datetime('now')),
        domain      TEXT    NOT NULL,
        raw_json    TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS predictions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        round_id    TEXT    NOT NULL,
        ts          TEXT    NOT NULL DEFAULT (datetime('now')),
        domain      TEXT    NOT NULL,
        agent_name  TEXT    NOT NULL,
        prediction  TEXT    NOT NULL,
        confidence  REAL    NOT NULL DEFAULT 0.5,
        reasoning   TEXT,
        verified    INTEGER DEFAULT NULL,
        verified_at TEXT    DEFAULT NULL,
        verify_note TEXT    DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS consensus (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        round_id    TEXT    NOT NULL UNIQUE,
        ts          TEXT    NOT NULL DEFAULT (datetime('now')),
        predictions TEXT    NOT NULL,
        debate_log  TEXT,
        sim_result  TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_scores (
        agent_name  TEXT    PRIMARY KEY,
        total       INTEGER NOT NULL DEFAULT 0,
        hits        INTEGER NOT NULL DEFAULT 0,
        accuracy    REAL    NOT NULL DEFAULT 0.0,
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    """)
    conn.commit()
    conn.close()


def save_snapshot(domain: str, data: dict):
    conn = get_conn()
    conn.execute(
        "INSERT INTO data_snapshots (domain, raw_json) VALUES (?, ?)",
        (domain, json.dumps(data, ensure_ascii=False)),
    )
    conn.commit()
    conn.close()


def save_prediction(round_id: str, domain: str, agent_name: str,
                    prediction: str, confidence: float, reasoning: str):
    conn = get_conn()
    conn.execute(
        "INSERT INTO predictions (round_id, domain, agent_name, prediction, confidence, reasoning) VALUES (?,?,?,?,?,?)",
        (round_id, domain, agent_name, prediction, confidence, reasoning),
    )
    conn.commit()
    conn.close()


def save_consensus(round_id: str, predictions: list, debate_log: str, sim_result: dict | None):
    conn = get_conn()
    conn.execute(
        "INSERT OR REPLACE INTO consensus (round_id, predictions, debate_log, sim_result) VALUES (?,?,?,?)",
        (round_id, json.dumps(predictions, ensure_ascii=False),
         debate_log, json.dumps(sim_result, ensure_ascii=False) if sim_result else None),
    )
    conn.commit()
    conn.close()


def get_unverified_predictions(before: str | None = None) -> list[dict]:
    conn = get_conn()
    q = "SELECT * FROM predictions WHERE verified IS NULL"
    params: list = []
    if before:
        q += " AND ts < ?"
        params.append(before)
    rows = conn.execute(q + " ORDER BY ts", params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_verified(pred_id: int, hit: bool, note: str):
    conn = get_conn()
    conn.execute(
        "UPDATE predictions SET verified=?, verified_at=datetime('now'), verify_note=? WHERE id=?",
        (1 if hit else 0, note, pred_id),
    )
    conn.commit()
    conn.close()


def update_agent_score(agent_name: str, hit: bool):
    conn = get_conn()
    conn.execute("""
        INSERT INTO agent_scores (agent_name, total, hits, accuracy, updated_at)
        VALUES (?, 1, ?, ?, datetime('now'))
        ON CONFLICT(agent_name) DO UPDATE SET
            total = total + 1,
            hits = hits + ?,
            accuracy = CAST(hits + ? AS REAL) / (total + 1),
            updated_at = datetime('now')
    """, (agent_name, 1 if hit else 0, 1.0 if hit else 0.0,
          1 if hit else 0, 1 if hit else 0))
    conn.commit()
    conn.close()


def get_recent_consensus(limit: int = 10) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM consensus ORDER BY ts DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_agent_scores() -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM agent_scores ORDER BY accuracy DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_recent_predictions(limit: int = 50) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM predictions ORDER BY ts DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
