"""Insight Card simulation: a pure function over fixtures. Owner: person 1.

simulate(card, actions, dials) →
  per action: simulated, assumed_effect, days_saved { low, high }, extra_within_target { low, high }
  combined: pct_within_target { low, high }, lever_rule_applied
  target gap: needed_for_70, needed_for_80, reachable_70, reachable_80, max achievable
Rules: dial clamped to [low, high] (default published); results at range ends, never a point;
same lever → larger single effect, not the sum; effect null → simulated: false, no numbers.

Units: percentages are 0-100, effects are fractions of the lever (0.43 = 43% fewer missed visits).
The card baseline describes the missed-first-visit lever: `missed_visit_share` is the share of the
group (in percentage points) who start late because of a missed first visit, so removing a
fraction `e` of missed visits moves the group's % within target by `share * e` points.
"""

from __future__ import annotations

from typing import Any


def _at(baseline: dict[str, Any], effect: float) -> dict[str, float]:
    people_late = baseline["n"] * baseline["missed_visit_share"] / 100
    return {
        "days_saved": people_late * baseline["days_lost_to_missed_visits"] * effect,
        "extra_within_target": people_late * effect,
        "pct_points": baseline["missed_visit_share"] * effect,
    }


def simulate(card: dict[str, Any], actions: list[dict[str, Any]], dials: dict[str, float]) -> dict[str, Any]:
    baseline = card["baseline"]
    per_action: dict[str, Any] = {}
    by_lever: dict[str, list[tuple[str, dict[str, Any]]]] = {}
    low_pts = high_pts = 0.0
    for a in actions:
        eff = a["effect"]
        # Only the missed-visits lever has a baseline on the card; others stay unsimulated.
        if eff is None or a["lever"] != "missed_visits":
            per_action[a["_id"]] = {"simulated": False}
            continue
        lo, hi = _at(baseline, eff["low"]), _at(baseline, eff["high"])
        dial = dials.get(a["_id"], eff["published"])
        per_action[a["_id"]] = {
            "simulated": True,
            "assumed_effect": min(max(dial, eff["low"]), eff["high"]),
            "days_saved": {"low": lo["days_saved"], "high": hi["days_saved"]},
            "extra_within_target": {"low": lo["extra_within_target"], "high": hi["extra_within_target"]},
        }
        by_lever.setdefault(a["lever"], []).append((a["_id"], eff))
    # Same lever → the larger single effect counts, never the sum.
    rule_applied = []
    for lever, members in by_lever.items():
        winner_id, winner = max(members, key=lambda m: (m[1]["high"], m[1]["low"]))
        low_pts += _at(baseline, winner["low"])["pct_points"]
        high_pts += _at(baseline, winner["high"])["pct_points"]
        if len(members) > 1:
            rule_applied.append(
                {"lever": lever, "counted": winner_id, "not_counted": [i for i, _ in members if i != winner_id]}
            )
    base = baseline["pct_within_target"]
    share = baseline["missed_visit_share"]
    evidence_max = max((e["high"] for _, e in by_lever.get("missed_visits", [])), default=None)

    def needed(target: float) -> float:
        return (target - base) / share

    def reachable(target: float) -> bool:
        return evidence_max is not None and needed(target) <= evidence_max

    return {
        "actions": per_action,
        "target_gap": {
            "needed_for_70": needed(70),
            "needed_for_80": needed(80),
            "reachable_70": reachable(70),
            "reachable_80": reachable(80),
            "evidence_max_effect": evidence_max,
            # Even if every missed first visit were prevented
            "max_achievable_pct": base + share,
        },
        "combined": {
            "pct_within_target": {"low": base + low_pts, "high": base + high_pts} if by_lever else None,
            "lever_rule_applied": rule_applied or None,
        },
    }
