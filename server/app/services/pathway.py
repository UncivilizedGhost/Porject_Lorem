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


def pathway_status(
    patient: dict[str, Any], steps: list[dict[str, Any]], escalation_steps: list[dict[str, Any]]
) -> str:
    clock = patient["pathway_clock"]
    elapsed = clock["current_demo_day"] - clock["started_demo_day"]
    current = next((s for s in steps if s["state"] == "next"), None)
    if current is not None and current["expected_day"] < elapsed:
        return "running_late"
    if any(e.get("fired_at") and not e.get("confirmed_at") for e in escalation_steps):
        return "running_late"
    return "on_track"


WHAT_TO_BRING = ["Kela card", "A list of your medicines"]


def pending_confirmation(patient: dict[str, Any], escalation_steps: list[dict[str, Any]]) -> dict[str, str] | None:
    """The earliest Escalation Step that is due and not yet confirmed. The ladder confirms the
    next appointment, so its kind is `appointment`."""
    day = patient["pathway_clock"]["current_demo_day"]
    due = [e for e in escalation_steps if not e.get("confirmed_at") and e["due_demo_day"] <= day]
    if not due:
        return None
    first = min(due, key=lambda e: e["step_index"])
    return {"id": first["_id"], "kind": "appointment"}


def next_step(
    steps: list[dict[str, Any]], escalation_steps: list[dict[str, Any]], patient: dict[str, Any]
) -> dict[str, Any] | None:
    current = next((s for s in steps if s["state"] == "next"), None)
    if current is None:
        return None
    return {
        "id": current["id"],
        "what": current["label"],
        "date": current["date"],
        "time": current["time"],
        "where": current["location"],
        "what_to_bring": WHAT_TO_BRING,
        "pending_confirmation": pending_confirmation(patient, escalation_steps),
    }


def medicines() -> list[dict[str, Any]]:
    return _load("medicines.json")


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
