"""Contact → Patient promotion (ADR-0002) and the Confirmation. Owner: person 3.

promote(contact_id, coordinator_id):
  copies county, trusted_people, accessibility; sets referral, phase suspected_cancer,
  pathway_clock.started_demo_day = current demo day; sets promoted_patient_id on the Contact;
  creates the five escalation_steps (models.escalation_steps.LADDER); sends the day-0 SMS via
  services.messaging.send_sms. Idempotent: an already-promoted Contact returns its Patient.

confirm(step_id, actor, trusted_person_name, input):
  sets confirmed_at on the step and on every later unfired rung; writes a confirmation event.
"""

from __future__ import annotations

from typing import Any

from app import db
from app.fixtures.seed import COORDINATOR_ID
from app.models import LADDER, EscalationStep, Patient, PathwayClock, Referral
from app.services import messaging
from app.services.demo_clock import current_day, now_iso
from app.services.events import write_event


class NotFound(Exception):
    pass


async def promote(contact_id: str, coordinator_id: str | None = None) -> str:
    contact = await db.get("contacts", contact_id)
    if contact is None:
        raise NotFound(contact_id)
    if contact.get("promoted_patient_id"):
        return contact["promoted_patient_id"]

    coordinator_id = coordinator_id or COORDINATOR_ID
    day = await current_day()
    patient = Patient(
        contact_id=contact_id,
        county=contact["county"],
        demographics=contact.get("demographics", {}),
        coordinator_id=coordinator_id,
        referral=Referral(flagged_by=coordinator_id, source="worklist", at=now_iso()),
        phase="suspected_cancer",
        pathway_clock=PathwayClock(started_demo_day=day, current_demo_day=day),
        trusted_people=contact.get("trusted_people", []),
        accessibility=contact.get("accessibility", {}),
        display_name=contact.get("display_name"),
        phone=contact.get("phone"),
    )
    patient_id = await db.insert("patients", patient.model_dump(mode="json"))
    for index, rung, offset in LADDER:
        step = EscalationStep(patient_id=patient_id, step_index=index, rung=rung, due_demo_day=day + offset)
        await db.insert("escalation_steps", step.model_dump(mode="json"))

    callback = contact.get("callback")
    if callback:
        callback = {**callback, "status": "handled"}
    await db.update(
        "contacts",
        contact_id,
        {"promoted_patient_id": patient_id, **({"callback": callback} if callback else {})},
    )
    await messaging.send_sms(
        patient.phone or "+358 40 000 0000",
        "Your care pathway has started. Nurse Aino will contact you about your next appointment.",
        "patient",
        patient_id,
        "pathway_started",
    )
    return patient_id


async def confirm(
    step_id: str, actor: str, trusted_person_name: str | None, input: str
) -> dict[str, Any] | None:
    step = await db.get("escalation_steps", step_id)
    if step is None:
        return None
    if step.get("confirmed_at"):
        return {"step_id": step_id, "actor": step.get("confirmed_by") or actor, "confirmed_at": step["confirmed_at"]}
    now = now_iso()
    later = await db.find("escalation_steps", {"patient_id": step["patient_id"]})
    for s in later:
        if s["_id"] == step_id or (s["step_index"] > step["step_index"] and not s.get("confirmed_at")):
            await db.update(
                "escalation_steps", s["_id"], {"confirmed_at": now, "confirmed_by": actor}
            )
    await write_event(
        "patient",
        step["patient_id"],
        "confirmation",
        {"step_id": step_id, "rung": step["rung"], "trusted_person_name": trusted_person_name},
        actor=actor,
        input=input,
    )
    return {"step_id": step_id, "actor": actor, "confirmed_at": now}
