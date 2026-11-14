"""Demo-day engine (ADR-0004): the only scheduling mechanism. Owner: person 3.

advance_day(): increments clock_state.current_demo_day, advances every Patient's
pathway_clock.current_demo_day, sets fired_at on every unconfirmed step whose due day has been
reached; a fired message_sms / auto_call rung writes a simulated event through
services.messaging. Returns { current_demo_day, fired }.

identities(): Coordinator id, most recent Contact id, most recent Patient id.
reset(): truncates db.RUNTIME_TABLES, reseeds clock_state and the Coordinator.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app import db
from app.fixtures.seed import COORDINATOR_ID, ensure_clock_and_coordinator
from app.services import messaging


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


async def current_day() -> int:
    clock = await db.get("clock_state", "demo")
    return int(clock["current_demo_day"]) if clock else 0


_RUNG_TEXT = {
    "message_sms": ("sms", "Please confirm your next appointment by replying YES."),
    "auto_call": ("auto_call", "Automated call: please confirm your next appointment."),
}


async def advance_day() -> dict[str, Any]:
    day = await current_day() + 1
    await db.upsert("clock_state", "demo", {"current_demo_day": day})

    for patient in await db.find("patients"):
        clock = {**patient["pathway_clock"], "current_demo_day": day}
        await db.update("patients", patient["_id"], {"pathway_clock": clock})

    due = await db.fetch(
        "SELECT id, created_at, doc FROM escalation_steps "
        "WHERE (doc->>'due_demo_day')::int <= $1 "
        "AND doc->>'fired_at' IS NULL AND doc->>'confirmed_at' IS NULL "
        "ORDER BY (doc->>'due_demo_day')::int, (doc->>'step_index')::int, created_at",
        day,
    )
    fired: list[dict[str, Any]] = []
    for step in due:
        await db.update("escalation_steps", step["_id"], {"fired_at": now_iso()})
        patient = await db.get("patients", step["patient_id"])
        if step["rung"] in _RUNG_TEXT and patient:
            channel, text = _RUNG_TEXT[step["rung"]]
            await messaging.send_sms(
                patient.get("phone") or "+358 40 000 0000",
                text,
                "patient",
                step["patient_id"],
                f"escalation_{step['rung']}",
                channel=channel,
            )
        fired.append(
            {
                "id": step["_id"],
                "patient_id": step["patient_id"],
                "step_index": step["step_index"],
                "rung": step["rung"],
            }
        )
    return {"current_demo_day": day, "fired": fired}


async def identities() -> dict[str, Any]:
    contacts = await db.find("contacts", newest_first=True, limit=1)
    patients = await db.find("patients", newest_first=True, limit=1)
    patient = patients[0] if patients else None
    people = patient["trusted_people"] if patient else []
    return {
        "coordinator_id": COORDINATOR_ID,
        "contact_id": contacts[0]["_id"] if contacts else None,
        "patient_id": patient["_id"] if patient else None,
        "trusted_person": people[0] if people else None,
        "current_demo_day": await current_day(),
    }


async def reset() -> dict[str, Any]:
    await db.truncate(db.RUNTIME_TABLES + ["clock_state", "coordinators"])
    await ensure_clock_and_coordinator()
    return {"current_demo_day": 0}
