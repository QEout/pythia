"""Advanced Citizen Agent-Based Model — pure NumPy, no LLM calls.

Simulates 1M+ agents with:
  - 5 behavioral archetypes (amplifier, skeptic, contrarian, follower, opinion_leader)
  - Continuous belief strength model (not binary activation)
  - Skepticism thresholds (need multiple exposures before believing)
  - Trust networks between groups (echo chamber effects)
  - Counter-narrative emergence dynamics
  - Opinion leader amplification
  - Small-world network topology
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

ARCHETYPE_LABELS = ["follower", "amplifier", "skeptic", "contrarian", "opinion_leader"]
ARCHETYPE_DISTRIBUTION = [0.55, 0.15, 0.15, 0.08, 0.07]

GROUP_SENSITIVITY = {
    "tech_worker":   {"tech": 0.9, "finance": 0.5, "politics": 0.3, "opinion": 0.6, "culture": 0.5, "blackswan": 0.4, "military": 0.2, "health": 0.4, "energy": 0.3, "china": 0.4, "crypto": 0.7, "supply_chain": 0.3},
    "finance_pro":   {"tech": 0.4, "finance": 0.95,"politics": 0.6, "opinion": 0.3, "culture": 0.2, "blackswan": 0.7, "military": 0.3, "health": 0.3, "energy": 0.6, "china": 0.5, "crypto": 0.8, "supply_chain": 0.6},
    "student":       {"tech": 0.7, "finance": 0.2, "politics": 0.4, "opinion": 0.9, "culture": 0.9, "blackswan": 0.3, "military": 0.2, "health": 0.5, "energy": 0.3, "china": 0.5, "crypto": 0.6, "supply_chain": 0.1},
    "blue_collar":   {"tech": 0.2, "finance": 0.3, "politics": 0.5, "opinion": 0.7, "culture": 0.6, "blackswan": 0.2, "military": 0.4, "health": 0.6, "energy": 0.5, "china": 0.3, "crypto": 0.1, "supply_chain": 0.4},
    "retiree":       {"tech": 0.1, "finance": 0.4, "politics": 0.7, "opinion": 0.5, "culture": 0.3, "blackswan": 0.3, "military": 0.5, "health": 0.8, "energy": 0.4, "china": 0.3, "crypto": 0.05,"supply_chain": 0.2},
    "entrepreneur":  {"tech": 0.8, "finance": 0.8, "politics": 0.5, "opinion": 0.5, "culture": 0.4, "blackswan": 0.6, "military": 0.2, "health": 0.4, "energy": 0.5, "china": 0.6, "crypto": 0.7, "supply_chain": 0.7},
    "media_worker":  {"tech": 0.5, "finance": 0.3, "politics": 0.7, "opinion": 0.95,"culture": 0.8, "blackswan": 0.5, "military": 0.5, "health": 0.5, "energy": 0.3, "china": 0.6, "crypto": 0.3, "supply_chain": 0.2},
    "govt_employee": {"tech": 0.3, "finance": 0.4, "politics": 0.9, "opinion": 0.6, "culture": 0.3, "blackswan": 0.4, "military": 0.7, "health": 0.6, "energy": 0.5, "china": 0.7, "crypto": 0.1, "supply_chain": 0.4},
    "gig_worker":    {"tech": 0.5, "finance": 0.3, "politics": 0.3, "opinion": 0.8, "culture": 0.7, "blackswan": 0.2, "military": 0.1, "health": 0.4, "energy": 0.3, "china": 0.3, "crypto": 0.5, "supply_chain": 0.3},
    "homemaker":     {"tech": 0.2, "finance": 0.2, "politics": 0.3, "opinion": 0.7, "culture": 0.8, "blackswan": 0.1, "military": 0.1, "health": 0.7, "energy": 0.3, "china": 0.2, "crypto": 0.05,"supply_chain": 0.2},
}

# Inter-group trust matrix: how much each group trusts info from other groups.
# Higher = more likely to believe info coming from that group.
GROUP_TRUST = np.array([
    # tech  fin  stu  blue ret  ent  med  gov  gig  home
    [0.9,  0.5, 0.6, 0.3, 0.2, 0.8, 0.4, 0.3, 0.5, 0.3],  # tech_worker
    [0.5,  0.9, 0.2, 0.2, 0.3, 0.7, 0.3, 0.5, 0.2, 0.2],  # finance_pro
    [0.7,  0.2, 0.9, 0.5, 0.2, 0.5, 0.7, 0.2, 0.6, 0.4],  # student
    [0.2,  0.2, 0.4, 0.9, 0.6, 0.3, 0.5, 0.4, 0.7, 0.6],  # blue_collar
    [0.1,  0.3, 0.2, 0.5, 0.9, 0.2, 0.5, 0.6, 0.3, 0.7],  # retiree
    [0.8,  0.7, 0.4, 0.3, 0.2, 0.9, 0.5, 0.4, 0.5, 0.3],  # entrepreneur
    [0.5,  0.3, 0.6, 0.4, 0.3, 0.5, 0.9, 0.4, 0.5, 0.4],  # media_worker
    [0.3,  0.5, 0.3, 0.4, 0.5, 0.4, 0.4, 0.9, 0.3, 0.4],  # govt_employee
    [0.5,  0.2, 0.6, 0.6, 0.3, 0.5, 0.5, 0.2, 0.9, 0.5],  # gig_worker
    [0.2,  0.2, 0.4, 0.5, 0.6, 0.3, 0.5, 0.4, 0.4, 0.9],  # homemaker
], dtype=np.float32)

DOMAINS = ["tech", "finance", "politics", "opinion", "culture", "blackswan",
           "military", "health", "energy", "china", "crypto", "supply_chain"]
DOMAIN_INDEX = {d: i for i, d in enumerate(DOMAINS)}


@dataclass
class CitizenWorld:
    n: int = CITIZEN_AGENT_COUNT
    groups: np.ndarray = field(default=None)
    archetypes: np.ndarray = field(default=None)
    sensitivity: np.ndarray = field(default=None)
    belief_strength: np.ndarray = field(default=None)
    opinion: np.ndarray = field(default=None)
    skepticism: np.ndarray = field(default=None)
    exposure_count: np.ndarray = field(default=None)
    spread_prob: np.ndarray = field(default=None)
    followers: np.ndarray = field(default=None)
    activated: np.ndarray = field(default=None)

    def __post_init__(self):
        rng = np.random.default_rng(42)
        self.groups = rng.choice(len(GROUP_LABELS), size=self.n, p=GROUP_DISTRIBUTION)
        self.archetypes = rng.choice(len(ARCHETYPE_LABELS), size=self.n, p=ARCHETYPE_DISTRIBUTION)

        self.sensitivity = np.zeros((self.n, len(DOMAINS)), dtype=np.float32)
        for gi, label in enumerate(GROUP_LABELS):
            mask = self.groups == gi
            for di, domain in enumerate(DOMAINS):
                base = GROUP_SENSITIVITY[label].get(domain, 0.3)
                self.sensitivity[mask, di] = rng.normal(base, 0.08, size=mask.sum()).clip(0, 1)

        # Archetype modifiers
        amplifiers = self.archetypes == 1
        skeptics = self.archetypes == 2
        contrarians = self.archetypes == 3
        leaders = self.archetypes == 4

        self.spread_prob = rng.beta(2, 5, size=self.n).astype(np.float32)
        self.spread_prob[amplifiers] *= 2.5    # amplifiers share aggressively
        self.spread_prob[skeptics] *= 0.4      # skeptics rarely share
        self.spread_prob[contrarians] *= 1.8   # contrarians share counter-narratives
        self.spread_prob[leaders] *= 3.0       # opinion leaders are mega-spreaders
        self.spread_prob = self.spread_prob.clip(0, 0.95)

        self.skepticism = rng.beta(3, 5, size=self.n).astype(np.float32)
        self.skepticism[skeptics] = rng.beta(7, 2, size=skeptics.sum()).astype(np.float32)
        self.skepticism[amplifiers] = rng.beta(2, 7, size=amplifiers.sum()).astype(np.float32)
        self.skepticism[leaders] = rng.beta(4, 4, size=leaders.sum()).astype(np.float32)

        self.followers = (rng.pareto(1.5, size=self.n) * 10 + 1).astype(np.int32).clip(1, 10000)
        self.followers[leaders] = (rng.pareto(1.2, size=leaders.sum()) * 100 + 50).astype(np.int32).clip(50, 100000)

        self.belief_strength = np.zeros(self.n, dtype=np.float32)
        self.opinion = np.zeros(self.n, dtype=np.float32)
        self.exposure_count = np.zeros(self.n, dtype=np.int32)
        self.activated = np.zeros(self.n, dtype=bool)

    def reset(self):
        self.belief_strength[:] = 0
        self.opinion[:] = 0
        self.exposure_count[:] = 0
        self.activated[:] = False


def simulate_prediction_spread(
    world: CitizenWorld,
    predictions: list[dict],
    steps: int = 24,
) -> dict:
    """Advanced information propagation simulation.

    Features beyond simple activation:
      - Belief strength accumulates with repeated exposure
      - Skeptics need multiple exposures before believing
      - Contrarians push back, creating counter-narratives
      - Opinion leaders amplify reach disproportionately
      - Echo chambers form via group trust matrix
      - Counter-narrative emergence when contrarians exceed threshold
    """
    rng = np.random.default_rng()
    world.reset()
    n = world.n

    amplifiers = world.archetypes == 1
    skeptics = world.archetypes == 2
    contrarians = world.archetypes == 3
    leaders = world.archetypes == 4

    history = []
    archetype_history = []

    for pred in predictions:
        domain = pred.get("domain", "opinion")
        confidence = pred.get("confidence", 0.5)
        is_wildcard = pred.get("is_wildcard", False)
        di = DOMAIN_INDEX.get(domain, 3)

        domain_sensitivity = world.sensitivity[:, di]
        polarity = (confidence - 0.5) * 2
        if is_wildcard:
            polarity *= 1.5

        initial_seed = max(int(n * 0.001), 100)
        seed_weights = domain_sensitivity.copy()
        seed_weights /= seed_weights.sum()
        seed_idx = rng.choice(n, size=initial_seed, replace=False, p=seed_weights)

        world.activated[seed_idx] = True
        world.belief_strength[seed_idx] += confidence * domain_sensitivity[seed_idx]
        world.opinion[seed_idx] += polarity * domain_sensitivity[seed_idx]
        world.exposure_count[seed_idx] += 1

    counter_narrative_strength = 0.0

    for step in range(steps):
        active_idx = np.where(world.activated)[0]
        if len(active_idx) == 0:
            break

        spreaders_mask = rng.random(len(active_idx)) < world.spread_prob[active_idx]
        spreaders = active_idx[spreaders_mask]
        if len(spreaders) == 0:
            continue

        spreader_groups = world.groups[spreaders]
        new_reach = world.followers[spreaders].sum()
        potential_new = min(new_reach, n - world.activated.sum())

        inactive_idx = np.where(~world.activated)[0]
        if len(inactive_idx) == 0:
            break

        contact_rate = 0.1 + 0.02 * step
        n_contacts = min(int(potential_new * contact_rate), len(inactive_idx))
        if n_contacts <= 0:
            break

        contact_idx = rng.choice(inactive_idx, size=n_contacts, replace=False)
        contact_groups = world.groups[contact_idx]

        trust_boost = np.zeros(n_contacts, dtype=np.float32)
        for si, sg in enumerate(np.unique(spreader_groups)):
            sg_fraction = (spreader_groups == sg).sum() / len(spreader_groups)
            for ci_batch in range(0, n_contacts, 10000):
                batch_slice = slice(ci_batch, min(ci_batch + 10000, n_contacts))
                batch_groups = contact_groups[batch_slice]
                trust_boost[batch_slice] += GROUP_TRUST[batch_groups, sg] * sg_fraction

        world.exposure_count[contact_idx] += 1
        avg_spreader_belief = world.belief_strength[spreaders].mean()
        avg_spreader_opinion = world.opinion[spreaders].mean()

        exposure_factor = np.minimum(world.exposure_count[contact_idx].astype(np.float32) / 3.0, 1.0)
        incoming_belief = avg_spreader_belief * trust_boost * exposure_factor

        skepticism_threshold = world.skepticism[contact_idx]
        convinced = incoming_belief > skepticism_threshold

        contrarian_mask = world.archetypes[contact_idx] == 3
        contrarian_convinced = contrarian_mask & (rng.random(n_contacts) < 0.3)
        convinced = convinced | contrarian_convinced

        new_activated = contact_idx[convinced]
        if len(new_activated) > 0:
            world.activated[new_activated] = True

            normal_new = new_activated[~world.archetypes[new_activated].astype(bool) | (world.archetypes[new_activated] != 3)]
            contrarian_new = new_activated[world.archetypes[new_activated] == 3]

            if len(normal_new) > 0:
                noise = rng.normal(0, 0.08, size=len(normal_new)).astype(np.float32)
                world.belief_strength[normal_new] = incoming_belief[convinced][~world.archetypes[new_activated].astype(bool) | (world.archetypes[new_activated] != 3)][:len(normal_new)] if len(normal_new) > 0 else 0
                world.opinion[normal_new] = avg_spreader_opinion * 0.7 + noise

            if len(contrarian_new) > 0:
                world.belief_strength[contrarian_new] = 0.5
                world.opinion[contrarian_new] = -avg_spreader_opinion * 0.8 + rng.normal(0, 0.1, size=len(contrarian_new)).astype(np.float32)
                counter_narrative_strength += len(contrarian_new) / n * 10

        total_activated = int(world.activated.sum())
        active_opinion = world.opinion[world.activated]
        avg_sent = float(active_opinion.mean()) if total_activated > 0 else 0
        opinion_std = float(active_opinion.std()) if total_activated > 1 else 0

        history.append({
            "step": step,
            "total_activated": total_activated,
            "activation_pct": round(total_activated / n * 100, 2),
            "avg_sentiment": round(avg_sent, 4),
            "polarization": round(opinion_std, 4),
            "counter_narrative": round(counter_narrative_strength, 4),
        })

        # Snapshot archetype distribution
        archetype_snap = {}
        for ai, alabel in enumerate(ARCHETYPE_LABELS):
            amask = world.archetypes == ai
            active_in_arch = (world.activated & amask).sum()
            archetype_snap[alabel] = {
                "activated_pct": round(int(active_in_arch) / max(1, int(amask.sum())) * 100, 2),
                "avg_opinion": round(float(world.opinion[amask & world.activated].mean()) if active_in_arch > 0 else 0, 4),
            }
        archetype_history.append(archetype_snap)

    group_results = {}
    for gi, label in enumerate(GROUP_LABELS):
        mask = world.groups == gi
        activated_in_group = world.activated[mask].sum()
        total_in_group = mask.sum()
        group_opinion = world.opinion[mask & world.activated]
        avg_sent = float(group_opinion.mean()) if activated_in_group > 0 else 0
        polarization = float(group_opinion.std()) if activated_in_group > 1 else 0
        group_results[label] = {
            "activated_pct": round(int(activated_in_group) / int(total_in_group) * 100, 2),
            "avg_sentiment": round(avg_sent, 4),
            "polarization": round(polarization, 4),
            "total": int(total_in_group),
        }

    archetype_results = {}
    for ai, alabel in enumerate(ARCHETYPE_LABELS):
        amask = world.archetypes == ai
        active_in = (world.activated & amask).sum()
        total_in = amask.sum()
        archetype_results[alabel] = {
            "total": int(total_in),
            "activated_pct": round(int(active_in) / max(1, int(total_in)) * 100, 2),
            "avg_opinion": round(float(world.opinion[amask & world.activated].mean()) if active_in > 0 else 0, 4),
        }

    active_opinions = world.opinion[world.activated]
    return {
        "total_agents": n,
        "total_activated": int(world.activated.sum()),
        "activation_pct": round(int(world.activated.sum()) / n * 100, 2),
        "avg_sentiment": round(float(active_opinions.mean()), 4) if world.activated.any() else 0,
        "polarization_index": round(float(active_opinions.std()), 4) if world.activated.sum() > 1 else 0,
        "counter_narrative_strength": round(counter_narrative_strength, 4),
        "spread_history": history,
        "group_breakdown": group_results,
        "archetype_breakdown": archetype_results,
    }
