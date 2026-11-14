"""The grading half of the rules module. Pure functions; see package docstring.

Rules to implement:
- any Safety Check item ticked → red, advice call_now, rule "Safety Check: <item>"
- per-symptom option → grade maps; fever depends on phase
  (treatment: ≥38.0 / <36.0 / unwell → red, 37.5–37.9 → yellow;
   not on treatment: >38.0 with unwell → red, 37.5–38.0 → yellow)
- "something else": severity + interference + new/worse → grade
- combine: worst wins; two or more yellows → red; rule is a readable string
- Check-in: same symptom rules + Red Flags (fever during treatment, breathlessness at rest,
  coughing up blood)
- warning sign: coughing up blood → red, anything else → yellow (call-back)
- Own Words never change a grade
"""

from __future__ import annotations

from typing import Any


def grade_symptom_report(payload: dict[str, Any], phase: str) -> dict[str, Any]:
    raise NotImplementedError


def grade_checkin(answers: dict[str, Any], phase: str) -> dict[str, Any]:
    raise NotImplementedError


def grade_warning_sign(symptom: str) -> dict[str, Any]:
    raise NotImplementedError
