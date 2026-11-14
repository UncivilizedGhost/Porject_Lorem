"""Escalation Step document (ADR-0003). Owner: person 3."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Rung = Literal["message_sms", "auto_call", "nurse_call", "trusted_person", "flag_health_centre"]

# (step_index, rung, days after the Pathway Clock starts). Plan section 4.2 draft timing.
LADDER: list[tuple[int, Rung, int]] = [
    (0, "message_sms", 0),
    (1, "auto_call", 2),
    (2, "nurse_call", 3),
    (3, "trusted_person", 5),
    (4, "flag_health_centre", 7),
]


class EscalationStep(BaseModel):
    patient_id: str
    step_index: Literal[0, 1, 2, 3, 4]
    rung: Rung
    due_demo_day: int
    confirmation_kind: str = "first_appointment"
    fired_at: str | None = None
    confirmed_at: str | None = None
    confirmed_by: Literal["self", "trusted_person"] | None = None
    handled_at: str | None = None
