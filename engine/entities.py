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
    "Canada": "country", "Mexico": "country", "Brazil": "country", "Argentina": "country",
    "Turkey": "country", "Syria": "country", "Lebanon": "country", "Yemen": "country",
    "Egypt": "country", "Qatar": "country", "UAE": "country", "United Arab Emirates": "country",
    "Pakistan": "country", "Indonesia": "country", "Philippines": "country", "Vietnam": "country",
    "Australia": "country", "Nigeria": "country", "South Africa": "country", "Poland": "country",
    "Italy": "country", "Spain": "country", "Netherlands": "country", "Taiwan Strait": "topic",
    "South China Sea": "topic", "Red Sea": "topic", "Gaza": "topic", "West Bank": "topic",
    "European Union": "organization", "ECB": "organization", "PBOC": "organization",
    "Bank of Japan": "organization", "World Bank": "organization", "WTO": "organization",
    "ASEAN": "organization", "African Union": "organization", "ECOWAS": "organization",
    "Hamas": "organization", "Hezbollah": "organization", "Houthis": "organization",
    "TSMC": "company", "Samsung": "company", "Intel": "company", "AMD": "company",
    "ASML": "company", "Alibaba": "company", "Tencent": "company", "TSLA": "company",
    "AAPL": "company", "MSFT": "company", "GOOGL": "company", "AMZN": "company", "NVDA": "company",
    "Netanyahu": "person", "Modi": "person", "Erdogan": "person", "Macron": "person",
    "Scholz": "person", "Zelenskyy": "person", "Starmer": "person", "von der Leyen": "person",
    "oil": "topic", "gas": "topic", "semiconductor": "topic", "AI chip": "topic",
    "drone": "topic", "missile": "topic", "ceasefire": "topic", "tariffs": "topic",
}

_ENTITY_PATTERN = re.compile(
    r'\b(' + '|'.join(re.escape(k) for k in sorted(KNOWN_ENTITIES.keys(), key=len, reverse=True)) + r')\b',
    re.IGNORECASE,
)
_KNOWN_ENTITY_LOWER = {k.lower() for k in KNOWN_ENTITIES.keys()}

_PROPER_NOUN_PATTERN = re.compile(
    r'\b(?:[A-Z][a-z]+|[A-Z]{2,})(?:\s+(?:[A-Z][a-z]+|[A-Z]{2,})){0,2}\b'
)

_STOP_ENTITIES = {
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December", "Reuters", "Bloomberg",
    "Breaking News", "Latest News", "World News", "News", "Top News",
}


def _guess_entity_type(name: str) -> str:
    if name in KNOWN_ENTITIES:
        return KNOWN_ENTITIES[name]
    if any(token in name for token in ["Inc", "Corp", "Ltd", "Group", "Bank", "Energy", "AI", "Technologies"]):
        return "company"
    if name.isupper() and 2 <= len(name) <= 6:
        return "organization"
    parts = name.split()
    if len(parts) >= 2 and all(p[:1].isupper() for p in parts if p):
        return "person"
    return "topic"


def _extract_heuristic_entities(text: str) -> list[tuple[str, str]]:
    results: list[tuple[str, str]] = []
    seen: set[str] = set()
    for candidate in _PROPER_NOUN_PATTERN.findall(text):
        candidate = candidate.strip(" .,;:!?()[]{}\"'")
        if not candidate or candidate in _STOP_ENTITIES:
            continue
        if candidate.lower() in _KNOWN_ENTITY_LOWER:
            continue
        # single title-cased words are often noisy; keep acronyms and multi-word names
        if " " not in candidate and not candidate.isupper():
            continue
        if len(candidate) < 3 or candidate in seen:
            continue
        seen.add(candidate)
        results.append((candidate, _guess_entity_type(candidate)))
    return results


def extract_entities_fast(items: list[dict]) -> dict[str, int]:
    """Fast keyword-based entity extraction from news items.

    Returns {entity: mention_count} and updates the entity graph.
    """
    counts: dict[str, int] = {}
    for item in items:
        title = item.get('title', '') or ''
        text = f"{title} {item.get('snippet', '')} {item.get('notes', '')}"
        item_entities: list[tuple[str, str]] = []
        seen_in_item: set[str] = set()

        for match in _ENTITY_PATTERN.finditer(text):
            raw = match.group(0)
            canonical = _canonicalize(raw)
            if canonical not in seen_in_item:
                item_entities.append((canonical, KNOWN_ENTITIES.get(canonical, "unknown")))
                seen_in_item.add(canonical)
            counts[canonical] = counts.get(canonical, 0) + 1

        # Heuristic expansion for proper nouns not in the static dictionary
        for entity, etype in _extract_heuristic_entities(title):
            if entity not in seen_in_item:
                item_entities.append((entity, etype))
                seen_in_item.add(entity)
            counts[entity] = counts.get(entity, 0) + 1

        # Persist each entity with the actual headline context and co-mentioned entities.
        relation_names = [name for name, _ in item_entities]
        for entity, etype in item_entities:
            related = [name for name in relation_names if name != entity][:12]
            upsert_entity(
                entity,
                etype,
                context=f"[headline] {title[:180]}",
                relations=related,
            )

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
