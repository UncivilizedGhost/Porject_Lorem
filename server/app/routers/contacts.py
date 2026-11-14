"""Contacts: phase 0–1 people (ADR-0002).

Owner: person 2 for create / read / accessibility (`app/services/risk_check.py`),
person 3 for warning-sign-tap, promote and callback-handled (`app/services/promotion.py`,
`app/rules`). Specs: .scratch/patient-companion/spec.md, .scratch/coordinator-worklist/spec.md
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import db
from app.models import Contact
from app.services import promotion

router = APIRouter(prefix="/contacts", tags=["contacts"])


class PromoteBody(BaseModel):
    coordinator_id: str | None = None


@router.post("")
async def create_contact(contact: Contact):
    """person 2: body county, language, consent, risk_check answers, trusted_people?, accessibility?. risk_group computed server-side.

    NOTE: minimal version by person 3 so promote round-trips; person 2 replaces it (risk_group).
    """
    doc = contact.model_dump(mode="json")
    contact_id = await db.insert("contacts", doc)
    return {"id": contact_id, **doc}


@router.get("/{contact_id}")
async def get_contact(contact_id: str):
    """person 2: a Contact before promotion."""
    contact = await db.get("contacts", contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="contact not found")
    return {"id": contact_id, **contact}


@router.patch("/{contact_id}/accessibility")
async def patch_accessibility():
    """person 2: partial update of read_aloud / voice_mode / text_size / high_contrast (+ top-level language)."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{contact_id}/warning-sign-tap")
async def warning_sign_tap():
    """person 3: record tap, write event, grade (coughing up blood → red Alert, else call-back pending), send simulated SMS. Returns { grade, advice }."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{contact_id}/promote")
async def promote(contact_id: str, body: PromoteBody | None = None):
    """person 3: Contact → Patient (ADR-0002), start pathway_clock, create 5 escalation_steps, day-0 SMS. Idempotent."""
    try:
        patient_id = await promotion.promote(contact_id, body.coordinator_id if body else None)
    except promotion.NotFound:
        raise HTTPException(status_code=404, detail="contact not found") from None
    return {"patient_id": patient_id}


@router.post("/{contact_id}/callback-handled")
async def callback_handled():
    """person 3: 'Mark handled' on a call-back row."""
    raise HTTPException(status_code=501, detail="not implemented")
