"""Insight Card simulation: a pure function over fixtures. Owner: person 1.

simulate(card, actions, dials) →
  per action: simulated, assumed_effect, days_saved { low, high }, extra_within_target { low, high }
  combined: pct_within_target { low, high }, lever_rule_applied
  target gap: needed_for_70, needed_for_80, reachable_70, reachable_80, max achievable
Rules: dial clamped to [low, high] (default published); results at range ends, never a point;
same lever → larger single effect, not the sum; effect null → simulated: false, no numbers.
"""

from __future__ import annotations

from typing import Any


def simulate(card: dict[str, Any], actions: list[dict[str, Any]], dials: dict[str, float]) -> dict[str, Any]:
    raise NotImplementedError
