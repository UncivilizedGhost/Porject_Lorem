"""Demo shims (ADR-0004). Owner: person 3. Spec: .scratch/coordinator-worklist/spec.md

Logic lives in `app/services/demo_clock.py`.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import demo_clock

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/advance-day")
async def advance_day():
    """Bump clock_state, advance every pathway_clock, fire due Escalation Steps. Returns { current_demo_day, fired: [...] }."""
    return await demo_clock.advance_day()


@router.get("/identities")
async def identities():
    """Demo Coordinator id, most recent Contact id, most recent Patient id (+ first Trusted Person)."""
    return await demo_clock.identities()


class StartTreatmentBody(BaseModel):
    patient_id: str | None = None


@router.post("/start-treatment")
async def start_treatment(body: StartTreatmentBody | None = None):
    """Demo shim: move a Patient (default: the most recent) to phase 'treatment' so Check-ins grade on-treatment rules."""
    patient = await demo_clock.start_treatment(body.patient_id if body else None)
    if patient is None:
        raise HTTPException(status_code=404, detail="no patient")
    return {"patient_id": patient["_id"], "phase": patient["phase"]}


@router.post("/reset")
async def reset():
    """Truncate runtime tables, reseed clock_state and the Coordinator. Fixtures stay."""
    return await demo_clock.reset()
