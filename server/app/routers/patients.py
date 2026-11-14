"""Patients: phase 2–3 people, created only by promotion.

Owner: person 2 for read / trusted-view / accessibility (`app/services/pathway.py`),
person 3 for checkin / symptom-report / medication-log (`app/rules`, `app/services/worklist.py`),
person 4 for kanta-medicines (`app/services/messaging.py`).
"""

from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import db
from app.services import pathway, reporting

# Request bodies carry no grade / rule / advice_shown: those are computed server-side and any
# client-sent value is dropped (pydantic ignores unknown fields).


class CheckinBody(BaseModel):
    answers: dict[str, Any]
    actor: Literal["self", "trusted_person"] = "self"
    trusted_person_name: str | None = None
    input: Literal["touch", "voice"] = "touch"


class SymptomEntry(BaseModel):
    symptom: str
    answers: dict[str, Any] = Field(default_factory=dict)


class SafetyCheck(BaseModel):
    ticked: list[str] = Field(default_factory=list)


class OwnWords(BaseModel):
    text: str
    source: Literal["voice", "typed"]


class SymptomReportBody(BaseModel):
    safety_check: SafetyCheck = Field(default_factory=SafetyCheck)
    symptoms: list[SymptomEntry] = Field(default_factory=list)
    own_words: OwnWords | None = None
    actor: Literal["self", "trusted_person"] = "self"
    trusted_person_name: str | None = None
    input: Literal["touch", "voice"] = "touch"


class MedicationLogBody(BaseModel):
    medicine_id: str
    status: Literal["taken", "skipped", "side_effect"]
    actor: Literal["self", "trusted_person"] = "self"
    input: Literal["touch", "voice"] = "touch"


async def _graded(call):
    try:
        return await call
    except reporting.NotFound:
        raise HTTPException(status_code=404, detail="patient not found") from None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/{patient_id}")
async def get_patient(patient_id: str):
    """person 2: Patient + derived pathway_steps, status, next_step (with pending_confirmation), medicines."""
    patient = await db.get("patients", patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="patient not found")
    return {"id": patient_id, **await pathway.patient_view(patient)}


@router.get("/{patient_id}/trusted-view")
async def trusted_view():
    """person 2: appointments, pending Confirmations, trusted people. Never events, Check-in or Symptom Report answers."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.patch("/{patient_id}/accessibility")
async def patch_accessibility():
    """person 2: partial accessibility update."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{patient_id}/checkin")
async def checkin(patient_id: str, body: CheckinBody):
    """person 3: body answers, actor, trusted_person_name?, input. Writes event, grades, creates/appends Alert. Returns { grade, advice_shown }."""
    return await _graded(
        reporting.submit_checkin(patient_id, body.answers, body.actor, body.trusted_person_name, body.input)
    )


@router.post("/{patient_id}/symptom-report")
async def symptom_report(patient_id: str, body: SymptomReportBody):
    """person 3: body = symptom_report payload minus server-computed fields. Always creates or appends an Alert. Returns { grade, advice_shown, rule }."""
    return await _graded(
        reporting.submit_symptom_report(
            patient_id,
            body.safety_check.ticked,
            [s.model_dump() for s in body.symptoms],
            body.own_words.model_dump() if body.own_words else None,
            body.actor,
            body.trusted_person_name,
            body.input,
        )
    )


@router.post("/{patient_id}/medication-log")
async def medication_log(patient_id: str, body: MedicationLogBody):
    """person 3: body { medicine_id, status, actor, input }. Two skipped without a taken between → yellow Alert."""
    return await _graded(
        reporting.log_medication(patient_id, body.medicine_id, body.status, body.actor, body.input)
    )


@router.get("/{patient_id}/kanta-medicines")
async def kanta_medicines():
    """person 4: fixture medicine list wrapped as a FHIR mock-up (labelled)."""
    raise HTTPException(status_code=501, detail="not implemented")
