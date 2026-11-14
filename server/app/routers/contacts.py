"""Contacts: phase 0–1 people (ADR-0002).

Owner: person 2 for create / read / accessibility (`app/services/risk_check.py`),
person 3 for warning-sign-tap, promote and callback-handled (`app/services/promotion.py`,
`app/rules`). Specs: .scratch/patient-companion/spec.md, .scratch/coordinator-worklist/spec.md
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("")
async def create_contact():
    """person 2: body county, language, consent, risk_check answers, trusted_people?, accessibility?. risk_group computed server-side."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/{contact_id}")
async def get_contact():
    """person 2: a Contact before promotion."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.patch("/{contact_id}/accessibility")
async def patch_accessibility():
    """person 2: partial update of read_aloud / voice_mode / text_size / high_contrast (+ top-level language)."""
    raise HTTPException(status_code=501, detail="not implemented")


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
