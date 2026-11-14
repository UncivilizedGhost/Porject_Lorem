"""Derived blocks for `GET /patients/{id}` and the trusted view. Owner: person 2.

pathway_steps: ordered steps from fixtures/pathway_template.json with done | next | later and
a date or estimated date, derived from phase + pathway_clock (+ appointments if Booking exists).
status: on_track | running_late (current step past its expected day, or any Escalation Step
fired and unconfirmed).
next_step: what / when / where / what to bring + pending_confirmation { id, kind }.
medicines: fixtures/medicines.json (generic labels, no drug names).
trusted_view: the same minus clinical content; never events, Check-in or Symptom Report answers.

A step is done once its expected day is more than STEP_GRACE_DAYS behind the pathway day. Between
its expected day and the end of the grace window it is still the current step and the Patient
is "running late".
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"
STEP_GRACE_DAYS = 2


def _load(name: str) -> list[dict[str, Any]]:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def pathway_steps(patient: dict[str, Any]) -> list[dict[str, Any]]:
    clock = patient["pathway_clock"]
    elapsed = clock["current_demo_day"] - clock["started_demo_day"]
    start = datetime.fromisoformat(patient["referral"]["at"])
    in_treatment = patient.get("phase") == "treatment"
    steps = []
    next_assigned = False
    for tpl in _load("pathway_template.json"):
        # Steps at day 0 happened before the Referral, so they have no grace window.
        done = in_treatment or tpl["expected_day"] == 0 or tpl["expected_day"] + STEP_GRACE_DAYS <= elapsed
        if done:
            state = "done"
        elif not next_assigned:
            state, next_assigned = "next", True
        else:
            state = "later"
        steps.append({
            "id": tpl["id"],
            "label": tpl["label"],
            "location": tpl["location"],
            "expected_day": tpl["expected_day"],
            "time": tpl["time"],
            "state": state,
            "date": (start + timedelta(days=tpl["expected_day"])).date().isoformat(),
            "date_is_estimate": state == "later" or state == "next",
        })
    return steps
