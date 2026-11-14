"""Demo-day engine (ADR-0004): the only scheduling mechanism. Owner: person 3.

advance_day(): increments clock_state.current_demo_day, advances every Patient's
pathway_clock.current_demo_day, sets fired_at on every unconfirmed step whose due day has been
reached; a fired message_sms / auto_call rung writes a simulated event through
services.messaging; then the simulated nurse call (see nurse_calls). Returns
{ current_demo_day, fired, nurse_calls }.

identities(): Coordinator id, most recent Contact id, most recent Patient id.
reset(): truncates db.RUNTIME_TABLES, reseeds clock_state and the Coordinator.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
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
    return {"current_demo_day": day, "fired": fired, "nurse_calls": await nurse_calls(day)}


# The nurse returns a warning-sign call-back this many demo days after the tap, unless the
# Coordinator has already handled it from the Worklist.
NURSE_CALL_AFTER_DAYS = 1


async def nurse_calls(day: int) -> list[dict[str, Any]]:
    """Demo shim (ADR-0004): the call-back phone call. Promotes the Contact and books the next
    pathway step at its clinician, on the step's pathway date or the first free slot after it."""
    from app.services import booking, pathway, promotion, worklist

    calls = []
    for contact in await db.find("contacts", {"callback": {"status": "pending"}}):
        if day - contact["callback"].get("demo_day", day) < NURSE_CALL_AFTER_DAYS:
            continue
        patient_id = await promotion.promote(contact["_id"], COORDINATOR_ID)
        await worklist.close_callback(contact["_id"], "booked")
        appointment = await _book_next_step(patient_id, booking, pathway)
        calls.append({"contact_id": contact["_id"], "patient_id": patient_id, "appointment": appointment})
    return calls


async def _book_next_step(patient_id: str, booking, pathway) -> dict[str, Any] | None:
    patient = await db.get("patients", patient_id)
    step = next((s for s in pathway.pathway_steps(patient) if s["state"] == "next"), None)
    if step is None:
        return None
    clinician = next((c for c in await db.find("clinicians") if c["location"] == step["location"]), None)
    if clinician is None:
        return None
    first = date.fromisoformat(step["date"])
    free = await booking.availability(clinician["_id"], first.isoformat(), (first + timedelta(days=14)).isoformat())
    for d in free["days"]:
        if d["slots"]:
            slot = step["time"] if step["time"] in d["slots"] else d["slots"][0]
            return await booking.book("patient", patient_id, clinician["_id"], clinician["types"][0], f"{d['date']}T{slot}")
    return None


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


async def start_treatment(patient_id: str | None = None) -> dict[str, Any] | None:
    """Demo shim (ADR-0004): there is no real treatment-start event in the build."""
    if patient_id is None:
        latest = await db.find("patients", newest_first=True, limit=1)
        patient_id = latest[0]["_id"] if latest else None
    if patient_id is None:
        return None
    return await db.update("patients", patient_id, {"phase": "treatment"})


async def reset() -> dict[str, Any]:
    await db.truncate(db.RUNTIME_TABLES + ["clock_state", "coordinators"])
    await ensure_clock_and_coordinator()
    return {"current_demo_day": 0}
