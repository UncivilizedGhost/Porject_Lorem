"""Patients: phase 2–3 people, created only by promotion.

Owner: person 2 for read / trusted-view / accessibility (`app/services/pathway.py`),
person 3 for checkin / symptom-report / medication-log (`app/rules`, `app/services/worklist.py`),
person 4 for kanta-medicines (`app/services/messaging.py`).
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/{patient_id}")
async def get_patient():
    """person 2: Patient + derived pathway_steps, status, next_step (with pending_confirmation), medicines."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/{patient_id}/trusted-view")
async def trusted_view():
    """person 2: appointments, pending Confirmations, trusted people. Never events, Check-in or Symptom Report answers."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.patch("/{patient_id}/accessibility")
async def patch_accessibility():
    """person 2: partial accessibility update."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{patient_id}/checkin")
async def checkin():
    """person 3: body answers, actor, trusted_person_name?, input. Writes event, grades, creates/appends Alert. Returns { grade, advice_shown }."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{patient_id}/symptom-report")
async def symptom_report():
    """person 3: body = symptom_report payload minus server-computed fields. Always creates or appends an Alert. Returns { grade, advice_shown, rule }."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{patient_id}/medication-log")
async def medication_log():
    """person 3: body { medicine_id, status, actor, input }. Two skipped without a taken between → yellow Alert."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/{patient_id}/kanta-medicines")
async def kanta_medicines():
    """person 4: fixture medicine list wrapped as a FHIR mock-up (labelled)."""
    raise HTTPException(status_code=501, detail="not implemented")
