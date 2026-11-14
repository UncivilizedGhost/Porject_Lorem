"""Simulated SMS / automated call / FHIR sync (ADR-0004). Owner: person 4.

These signatures are final from hour 1: person 3's promotion and advance-day code imports them.
Nothing is ever sent: each call writes an `events` row that the sim log shows.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from app import db
from app.services.learn.text import normalize

Channel = Literal["sms", "auto_call", "suomi_fi"]

YES_WORDS = {"yes", "y", "kylla", "joo", "jaa", "ja", "ok"}


async def _demo_day() -> int:
    clock = await db.get("clock_state", "demo")
    return int(clock["current_demo_day"]) if clock else 0


async def _write_event(subject_type: str, subject_id: str, type_: str, payload: dict[str, Any]) -> str:
    return await db.insert(
        "events",
        {
            "subject_type": subject_type,
            "subject_id": subject_id,
            "type": type_,
            "payload": payload,
            "actor": "coordinator",  # system-generated; not a Patient or Trusted Person action
            "input": "touch",
            "demo_day": await _demo_day(),
        },
    )


async def send_sms(
    to: str,
    text: str,
    subject_type: str,
    subject_id: str,
    purpose: str,
    *,
    channel: Channel = "sms",
) -> str | None:
    """Write an `sms_sent` event { to, text, purpose, channel, simulated: true, status: "sent" }.
    Returns the event id."""
    return await _write_event(
        subject_type,
        subject_id,
        "sms_sent",
        {"to": to, "text": text, "purpose": purpose, "channel": channel, "simulated": True, "status": "sent"},
    )


def _fhir_resource(summary: dict[str, Any]) -> dict[str, Any]:
    display = str(summary.get("display", ""))
    effective = summary.get("effective") or datetime.now(UTC).isoformat()
    if summary.get("resource_type") == "MedicationStatement":
        return {
            "resourceType": "MedicationStatement",
            "status": summary.get("status", "completed"),
            "medicationCodeableConcept": {"text": display},
            "effectiveDateTime": effective,
        }
    resource: dict[str, Any] = {
        "resourceType": "Observation",
        "status": "final",
        "code": {"text": display},
        "effectiveDateTime": effective,
    }
    value = summary.get("value")
    if isinstance(value, int | float) and not isinstance(value, bool):
        quantity: dict[str, Any] = {"value": value}
        if summary.get("unit"):
            quantity["unit"] = summary["unit"]
        resource["valueQuantity"] = quantity
    elif value is not None:
        resource["valueString"] = str(value)
    return resource


async def log_fhir_sync(subject_type: str, subject_id: str, resource_summary: dict[str, Any]) -> str | None:
    """Write a `fhir_sync` event with a minimal FHIR R4 Bundle (collection) holding one
    Observation or MedicationStatement, payload mock: true. Returns the event id."""
    bundle = {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [{"resource": _fhir_resource(resource_summary)}],
    }
    return await _write_event(subject_type, subject_id, "fhir_sync", {"mock": True, "bundle": bundle})


def kanta_medicines() -> dict[str, Any]:
    """The fixture medicine list wrapped as a FHIR mock-up (the demo's stand-in for Kanta)."""
    from app.fixtures.seed import load

    medicines = load("medicines.json")
    entries = [
        {"resource": _fhir_resource({"resource_type": "MedicationStatement", "display": m["label"]})}
        for m in medicines
    ]
    return {
        "label": "(FHIR mock-up)",
        "mock": True,
        "bundle": {"resourceType": "Bundle", "type": "collection", "entry": entries},
        "medicines": medicines,
    }


async def reply_to_sms(event_id: str, text: str) -> dict[str, Any] | None:
    """Simulate a reply to a sent message. Writes a linked `sms_sent` row with status "replied".
    A YES reply confirms the subject's fired Escalation Step. None if the message is unknown."""
    original = await db.get("events", event_id)
    if not original or original["type"] != "sms_sent":
        return None
    reply_id = await _write_event(
        original["subject_type"],
        original["subject_id"],
        "sms_sent",
        {
            "to": "Nurse Aino",
            "text": text,
            "purpose": "reply",
            "channel": original["payload"].get("channel", "sms"),
            "simulated": True,
            "status": "replied",
            "reply_to": event_id,
        },
    )
    confirmed = False
    if normalize(text) in YES_WORDS and original["subject_type"] == "patient":
        confirmed = await _confirm_fired_step(original["subject_id"])
    return {"event_id": reply_id, "confirmed": confirmed}


async def _confirm_fired_step(patient_id: str) -> bool:
    """The Confirmation (ADR-0003): sets confirmed_at on the fired rung and every later
    unconfirmed rung, so the ladder stops."""
    steps = await db.find("escalation_steps", {"patient_id": patient_id})
    open_steps = sorted(
        (s for s in steps if not s.get("confirmed_at")), key=lambda s: s.get("step_index", 0)
    )
    fired = [s for s in open_steps if s.get("fired_at")]
    if not fired:
        return False
    first_index = fired[0].get("step_index", 0)
    now = datetime.now(UTC).isoformat()
    for step in open_steps:
        if step.get("step_index", 0) >= first_index:
            await db.update("escalation_steps", step["_id"], {"confirmed_at": now})
    await _write_event(
        "patient", patient_id, "confirmation", {"escalation_step_id": fired[0]["_id"], "via": "sms_reply"}
    )
    return True
