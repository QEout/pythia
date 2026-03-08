"""Entity extraction — simplified GraphRAG inspired by MiroFish.

MiroFish uses full GraphRAG with LLM-powered entity-relation extraction.
We implement a two-stage approach:
  1. Fast keyword-based extraction (zero LLM cost, runs every cycle)
  2. Optional LLM-powered deep extraction (runs periodically for richer graph)

This feeds into the agent memory system to give agents awareness of
recurring entities and their relationships.
"""

from __future__ import annotations
import json
import logging
import re
from agents.memory import upsert_entity

log = logging.getLogger(__name__)

KNOWN_ENTITIES: dict[str, str] = {
    "US": "country", "USA": "country", "United States": "country",
    "China": "country", "Russia": "country", "Ukraine": "country",
    "Israel": "country", "Iran": "country", "India": "country",
    "Japan": "country", "Germany": "country", "France": "country",
    "UK": "country", "United Kingdom": "country",
    "North Korea": "country", "South Korea": "country",
    "Taiwan": "country", "Saudi Arabia": "country",
    "EU": "organization", "NATO": "organization", "UN": "organization",
    "OPEC": "organization", "WHO": "organization", "IMF": "organization",
    "Fed": "organization", "Federal Reserve": "organization",
    "BRICS": "organization", "G7": "organization", "G20": "organization",
    "Bitcoin": "crypto", "BTC": "crypto", "Ethereum": "crypto", "ETH": "crypto",
    "S&P 500": "index", "Nasdaq": "index", "Dow Jones": "index",
    "OpenAI": "company", "Google": "company", "Microsoft": "company",
    "Apple": "company", "Amazon": "company", "Meta": "company",
    "NVIDIA": "company", "Tesla": "company", "DeepSeek": "company",
    "ByteDance": "company", "TikTok": "company", "Huawei": "company",
    "Trump": "person", "Biden": "person", "Xi Jinping": "person",
    "Putin": "person", "Musk": "person", "Zelensky": "person",
    "AI": "topic", "GPT": "topic", "LLM": "topic",
    "tariff": "topic", "sanctions": "topic", "inflation": "topic",
    "recession": "topic", "interest rate": "topic",
    "earthquake": "event_type", "hurricane": "event_type",
    "wildfire": "event_type", "flood": "event_type",
    "pandemic": "event_type", "cyberattack": "event_type",
}

_ENTITY_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(k) for k in sorted(KNOWN_ENTITIES.keys(), key=len, reverse=True)) + r')\b',
    re.IGNORECASE,
)


def extract_entities_fast(items: list[dict]) -> dict[str, int]:
    """Fast keyword-based entity extraction from news items.

    Returns {entity: mention_count} and updates the entity graph.
    """
    counts: dict[str, int] = {}
    for item in items:
        text = f"{item.get('title', '')} {item.get('snippet', '')} {item.get('notes', '')}"
        for match in _ENTITY_PATTERN.finditer(text):
            raw = match.group(0)
            canonical = _canonicalize(raw)
            counts[canonical] = counts.get(canonical, 0) + 1

    for entity, count in counts.items():
        etype = KNOWN_ENTITIES.get(entity, "unknown")
        for _ in range(count):
            upsert_entity(entity, etype, context=f"Mentioned {count}x in latest data cycle")

    return counts


def _canonicalize(raw: str) -> str:
    """Normalize entity names to canonical form."""
    mapping = {
        "us": "US", "usa": "USA", "united states": "US",
        "uk": "UK", "united kingdom": "UK",
        "btc": "Bitcoin", "eth": "Ethereum",
        "fed": "Federal Reserve",
    }
    return mapping.get(raw.lower(), raw)


async def extract_entities_deep(items: list[dict], client, model: str) -> list[dict]:
    """LLM-powered deep entity-relation extraction.

    Runs periodically for richer graph construction. Extracts entities,
    relationships, and sentiment that keyword matching misses.
    """
    if not items:
        return []

    headlines = "\n".join(
        f"- {it.get('title', '')}" for it in items[:30] if it.get('title')
    )

    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": """Extract entities and relationships from these headlines.
Output JSON: {"entities": [{"name": "X", "type": "person|country|company|org|topic|event", "sentiment": "positive|negative|neutral"}], "relationships": [{"from": "X", "to": "Y", "relation": "verb/description"}]}
Focus on entities that appear in multiple headlines or are central to developing stories."""},
                {"role": "user", "content": headlines},
            ],
            temperature=0.2,
            max_tokens=800,
            response_format={"type": "json_object"},
        )
        text = resp.choices[0].message.content or "{}"
        result = json.loads(text)

        entities = result.get("entities", [])
        relations = result.get("relationships", [])

        for ent in entities:
            name = ent.get("name", "")
            etype = ent.get("type", "unknown")
            related = [r["to"] for r in relations if r.get("from") == name]
            upsert_entity(name, etype, context=ent.get("sentiment", ""), relations=related)

        return entities
    except Exception as e:
        log.warning("Deep entity extraction failed: %s", e)
        return []
