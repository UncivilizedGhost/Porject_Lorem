"""Booking (stretch): clinician availability and appointments. Owner: person 3.

Synthetic clinicians fixture; free slots = working days and hours minus existing appointments.
Slots are local wall-clock strings ("YYYY-MM-DDTHH:MM"), the same on the way in and out.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from app import db
from app.models import Appointment
from app.services import messaging


class SlotTaken(Exception):
    pass


class BadSlot(ValueError):
    pass


async def list_clinicians(type_: str | None) -> list[dict[str, Any]]:
    clinicians = await db.find("clinicians")
    out = [c for c in clinicians if type_ is None or type_ in c["types"]]
    return [{"id": c["_id"], **{k: v for k, v in c.items() if k not in ("_id", "created_at")}} for c in out]


def _day_slots(clinician: dict[str, Any], day: date) -> list[str]:
    if day.isoweekday() not in clinician["working_days"]:
        return []
    start = datetime.combine(day, datetime.strptime(clinician["hours"]["start"], "%H:%M").time())
    end = datetime.combine(day, datetime.strptime(clinician["hours"]["end"], "%H:%M").time())
    step = timedelta(minutes=clinician["slot_minutes"])
    out = []
    while start + step <= end:
        out.append(start.strftime("%H:%M"))
        start += step
    return out


async def availability(clinician_id: str, from_: str, to: str) -> dict[str, Any] | None:
    clinician = await db.get("clinicians", clinician_id)
    if clinician is None:
        return None
    booked = {a["start"] for a in await db.find("appointments", {"clinician_id": clinician_id})}
    days = []
    day, last = date.fromisoformat(from_), date.fromisoformat(to)
    while day <= last:
        free = [s for s in _day_slots(clinician, day) if f"{day.isoformat()}T{s}" not in booked]
        if _day_slots(clinician, day):
            days.append({"date": day.isoformat(), "slots": free})
        day += timedelta(days=1)
    return {"clinician_id": clinician_id, "working_days": clinician["working_days"], "days": days}


async def book(subject_type: str, subject_id: str, clinician_id: str, type_: str, start: str) -> dict[str, Any]:
    clinician = await db.get("clinicians", clinician_id)
    if clinician is None or type_ not in clinician["types"]:
        raise BadSlot("clinician does not offer that appointment type")
    day, _, slot = start.partition("T")
    if slot not in _day_slots(clinician, date.fromisoformat(day)):
        raise BadSlot("outside the clinician's working days and hours")
    if await db.find("appointments", {"clinician_id": clinician_id, "start": start}):
        raise SlotTaken(start)

    doc = Appointment(
        subject_type=subject_type,
        subject_id=subject_id,
        clinician_id=clinician_id,
        type=type_,
        start=start,
        location=clinician["location"],
    ).model_dump(mode="json")
    appointment_id = await db.insert("appointments", doc)

    table = "patients" if subject_type == "patient" else "contacts"
    person = await db.get(table, subject_id) or {}
    if subject_type == "contact" and person.get("callback"):
        await db.update("contacts", subject_id, {"callback": {**person["callback"], "status": "booked"}})
    pending = None
    if subject_type == "patient":
        steps = await db.find("escalation_steps", {"patient_id": subject_id})
        pending = next((s["_id"] for s in sorted(steps, key=lambda s: s["step_index"]) if not s.get("confirmed_at")), None)
    await messaging.send_sms(
        person.get("phone") or "+358 40 000 0000",
        f"Appointment booked: {start.replace('T', ' ')} at {clinician['location']}. Please confirm by replying YES.",
        subject_type,
        subject_id,
        "appointment_booked",
    )
    return {"id": appointment_id, **doc, "confirmation_step_id": pending}
