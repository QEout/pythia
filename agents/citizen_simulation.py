"""Million-citizen Agent-Based Model — pure NumPy, no LLM calls.

Simulates information propagation, sentiment shifts, and emergent group behavior
across a population of 1M agents organized in a social network.
"""

from __future__ import annotations
import logging
import numpy as np
from dataclasses import dataclass, field

from config import CITIZEN_AGENT_COUNT

log = logging.getLogger(__name__)

GROUP_LABELS = [
    "tech_worker", "finance_pro", "student", "blue_collar",
    "retiree", "entrepreneur", "media_worker", "govt_employee",
    "gig_worker", "homemaker",
]
GROUP_DISTRIBUTION = [0.12, 0.08, 0.15, 0.18, 0.10, 0.06, 0.05, 0.08, 0.10, 0.08]

GROUP_SENSITIVITY = {
    "tech_worker": {"tech": 0.9, "finance": 0.5, "politics": 0.3, "opinion": 0.6, "culture": 0.5, "blackswan": 0.4},
    "finance_pro": {"tech": 0.4, "finance": 0.95, "politics": 0.6, "opinion": 0.3, "culture": 0.2, "blackswan": 0.7},
    "student":     {"tech": 0.7, "finance": 0.2, "politics": 0.4, "opinion": 0.9, "culture": 0.9, "blackswan": 0.3},
    "blue_collar": {"tech": 0.2, "finance": 0.3, "politics": 0.5, "opinion": 0.7, "culture": 0.6, "blackswan": 0.2},
    "retiree":     {"tech": 0.1, "finance": 0.4, "politics": 0.7, "opinion": 0.5, "culture": 0.3, "blackswan": 0.3},
    "entrepreneur":{"tech": 0.8, "finance": 0.8, "politics": 0.5, "opinion": 0.5, "culture": 0.4, "blackswan": 0.6},
    "media_worker":{"tech": 0.5, "finance": 0.3, "politics": 0.7, "opinion": 0.95, "culture": 0.8, "blackswan": 0.5},
    "govt_employee":{"tech": 0.3, "finance": 0.4, "politics": 0.9, "opinion": 0.6, "culture": 0.3, "blackswan": 0.4},
    "gig_worker":  {"tech": 0.5, "finance": 0.3, "politics": 0.3, "opinion": 0.8, "culture": 0.7, "blackswan": 0.2},
    "homemaker":   {"tech": 0.2, "finance": 0.2, "politics": 0.3, "opinion": 0.7, "culture": 0.8, "blackswan": 0.1},
}


@dataclass
class CitizenWorld:
    n: int = CITIZEN_AGENT_COUNT
    groups: np.ndarray = field(default=None)
    sensitivity: np.ndarray = field(default=None)  # (n, 6) per-domain sensitivity
    spread_prob: np.ndarray = field(default=None)   # probability of sharing info
    sentiment: np.ndarray = field(default=None)     # current sentiment (-1 to 1)
    activated: np.ndarray = field(default=None)     # bool: has seen the info
    followers: np.ndarray = field(default=None)     # how many followers each has (power-law)

    def __post_init__(self):
        rng = np.random.default_rng(42)
        group_indices = rng.choice(len(GROUP_LABELS), size=self.n, p=GROUP_DISTRIBUTION)
        self.groups = group_indices

        domains = ["tech", "finance", "politics", "opinion", "culture", "blackswan"]
        self.sensitivity = np.zeros((self.n, len(domains)), dtype=np.float32)
        for gi, label in enumerate(GROUP_LABELS):
            mask = group_indices == gi
            for di, domain in enumerate(domains):
                base = GROUP_SENSITIVITY[label][domain]
                self.sensitivity[mask, di] = rng.normal(base, 0.1, size=mask.sum()).clip(0, 1)

        self.spread_prob = rng.beta(2, 5, size=self.n).astype(np.float32)
        self.sentiment = np.zeros(self.n, dtype=np.float32)
        self.activated = np.zeros(self.n, dtype=bool)
        self.followers = (rng.pareto(1.5, size=self.n) * 10 + 1).astype(np.int32).clip(1, 10000)

    def reset(self):
        self.sentiment[:] = 0
        self.activated[:] = False


DOMAIN_INDEX = {"tech": 0, "finance": 1, "politics": 2, "opinion": 3, "culture": 4, "blackswan": 5}


def simulate_prediction_spread(
    world: CitizenWorld,
    predictions: list[dict],
    steps: int = 24,
) -> dict:
    """Simulate how predictions spread and shift sentiment across the population.

    Each prediction has: domain, confidence, prediction text.
    Returns aggregated simulation results.
    """
    rng = np.random.default_rng()
    world.reset()
    n = world.n

    history = []

    for pred in predictions:
        domain = pred.get("domain", "opinion")
        confidence = pred.get("confidence", 0.5)
        is_wildcard = pred.get("is_wildcard", False)
        di = DOMAIN_INDEX.get(domain, 3)

        domain_sensitivity = world.sensitivity[:, di]
        polarity = 1.0 if confidence > 0.5 else -0.5
        if is_wildcard:
            polarity *= 1.5  # wildcards create stronger emotional reactions

        initial_seed = max(int(n * 0.001), 100)
        seed_weights = domain_sensitivity.copy()
        seed_weights /= seed_weights.sum()
        seed_idx = rng.choice(n, size=initial_seed, replace=False, p=seed_weights)
        world.activated[seed_idx] = True
        world.sentiment[seed_idx] += polarity * domain_sensitivity[seed_idx]

    for step in range(steps):
        active_idx = np.where(world.activated)[0]
        if len(active_idx) == 0:
            break

        spreaders_mask = rng.random(len(active_idx)) < world.spread_prob[active_idx]
        spreaders = active_idx[spreaders_mask]

        new_reach = world.followers[spreaders].sum()
        new_activations = min(new_reach, n - world.activated.sum())

        if new_activations <= 0:
            break

        inactive_idx = np.where(~world.activated)[0]
        if len(inactive_idx) == 0:
            break

        n_new = min(int(new_activations * 0.1), len(inactive_idx))
        if n_new == 0:
            break

        new_idx = rng.choice(inactive_idx, size=n_new, replace=False)
        world.activated[new_idx] = True

        avg_polarity = world.sentiment[spreaders].mean() if len(spreaders) > 0 else 0
        noise = rng.normal(0, 0.1, size=n_new).astype(np.float32)
        world.sentiment[new_idx] = avg_polarity * 0.8 + noise

        total_activated = int(world.activated.sum())
        avg_sent = float(world.sentiment[world.activated].mean())
        history.append({
            "step": step,
            "total_activated": total_activated,
            "activation_pct": round(total_activated / n * 100, 2),
            "avg_sentiment": round(avg_sent, 4),
        })

    group_results = {}
    for gi, label in enumerate(GROUP_LABELS):
        mask = world.groups == gi
        activated_in_group = world.activated[mask].sum()
        total_in_group = mask.sum()
        avg_sent = float(world.sentiment[mask & world.activated].mean()) if activated_in_group > 0 else 0
        group_results[label] = {
            "activated_pct": round(int(activated_in_group) / int(total_in_group) * 100, 2),
            "avg_sentiment": round(avg_sent, 4),
            "total": int(total_in_group),
        }

    return {
        "total_agents": n,
        "total_activated": int(world.activated.sum()),
        "activation_pct": round(int(world.activated.sum()) / n * 100, 2),
        "avg_sentiment": round(float(world.sentiment[world.activated].mean()), 4) if world.activated.any() else 0,
        "spread_history": history,
        "group_breakdown": group_results,
    }
