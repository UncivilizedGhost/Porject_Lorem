"""Contacts: phase 0–1 people (ADR-0002).

Owner: person 2 for create / read / accessibility (`app/services/risk_check.py`),
person 3 for warning-sign-tap, promote and callback-handled (`app/services/promotion.py`,
`app/rules`). Specs: .scratch/patient-companion/spec.md, .scratch/coordinator-worklist/spec.md
"""

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException

from app import db
from app.services import accessibility
from app.services.risk_check import risk_group

router = APIRouter(prefix="/contacts", tags=["contacts"])

DEFAULT_ACCESSIBILITY = {
    "read_aloud": False,
    "voice_mode": False,
    "text_size": "m",
    "high_contrast": False,
}


def _now() -> str:
    return datetime.now(UTC).isoformat()


@router.post("", status_code=201)
async def create_contact(body: dict[str, Any]):
    """person 2: body county, language, consent, risk_check answers, trusted_people?, accessibility?. risk_group computed server-side."""
    now = _now()
    check = body.get("risk_check") or {}
    answers = check.get("answers") or {}
    group = None
    if check.get("taken") and answers:
        group = risk_group(
            age=answers["age"],
            county=body["county"],
            smoking_status=answers["smoking_status"],
            cigarettes_per_day=answers.get("cigarettes_per_day"),
            years_smoked=answers.get("years_smoked"),
        )
    doc = {
        "county": body["county"],
        "language": body.get("language", "en"),
        "consent": {**(body.get("consent") or {}), "at": now},
        "risk_check": {"taken": bool(check.get("taken")), "risk_group": group, "at": now if group else None},
        "warning_sign_tap": None,
        "trusted_people": body.get("trusted_people") or [],
        "accessibility": {**DEFAULT_ACCESSIBILITY, **(body.get("accessibility") or {})},
        "promoted_patient_id": None,
        "callback": None,
    }
    id_ = await db.insert("contacts", doc)
    created = await db.get("contacts", id_)
    return {**created, "risk_group": group}


@router.get("/{contact_id}")
async def get_contact(contact_id: str):
    """person 2: a Contact before promotion."""
    contact = await db.get("contacts", contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="contact not found")
    return contact


@router.patch("/{contact_id}/accessibility")
async def patch_accessibility(contact_id: str, body: dict[str, Any]):
    """person 2: partial update of read_aloud / voice_mode / text_size / high_contrast (+ top-level language)."""
    return await accessibility.patch_accessibility("contacts", contact_id, body)


@router.post("/{contact_id}/warning-sign-tap")
async def warning_sign_tap():
    """person 3: record tap, write event, grade (coughing up blood → red Alert, else call-back pending), send simulated SMS. Returns { grade, advice }."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{contact_id}/promote")
async def promote():
    """person 3: Contact → Patient (ADR-0002), start pathway_clock, create 5 escalation_steps, day-0 SMS. Idempotent."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{contact_id}/callback-handled")
async def callback_handled():
    """person 3: 'Mark handled' on a call-back row."""
    raise HTTPException(status_code=501, detail="not implemented")
