"""Derived blocks for `GET /patients/{id}` and the trusted view. Owner: person 2.

pathway_steps: ordered steps from fixtures/pathway_template.json with done | next | later and
a date or estimated date, derived from phase + pathway_clock (+ appointments if Booking exists).
status: on_track | running_late (current step past its expected day, or any Escalation Step
fired and unconfirmed).
next_step: what / when / where / what to bring + pending_confirmation { id, kind }.
medicines: fixtures/medicines.json (generic labels, no drug names).
trusted_view: the same minus clinical content; never events, Check-in or Symptom Report answers.

NOTE: person 3 added `patient_view` below as a contract-shaped placeholder so the Worklist
and the promote round-trip work; person 2 replaces its body with the real derivation.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app import db

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"


def _fixture(name: str) -> list[dict[str, Any]]:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


async def patient_view(patient: dict[str, Any]) -> dict[str, Any]:
    steps = await db.find("escalation_steps", {"patient_id": patient["_id"]})
    steps.sort(key=lambda s: s["step_index"])
    pending = next((s for s in steps if not s.get("confirmed_at")), None)
    template = _fixture("pathway_template.json")
    pathway_steps = [
        {**t, "state": "next" if i == 0 else "later", "date": None} for i, t in enumerate(template)
    ]
    running_late = any(s.get("fired_at") and not s.get("confirmed_at") for s in steps)
    first = template[0]
    return {
        **patient,
        "pathway_steps": pathway_steps,
        "status": "running_late" if running_late else "on_track",
        "next_step": {
            "what": first["label"],
            "when": None,
            "where": first["location"],
            "bring": ["Kela card"],
            "pending_confirmation": {"id": pending["_id"], "kind": pending["confirmation_kind"]} if pending else None,
        },
        "medicines": _fixture("medicines.json"),
    }
