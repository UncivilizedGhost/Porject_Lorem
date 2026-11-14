"""Demo shims (ADR-0004). Owner: person 3. Spec: .scratch/coordinator-worklist/spec.md

Logic lives in `app/services/demo_clock.py`.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/advance-day")
async def advance_day():
    """Bump clock_state, advance every pathway_clock, fire due Escalation Steps. Returns { current_demo_day, fired: [...] }."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/identities")
async def identities():
    """Demo Coordinator id, most recent Contact id, most recent Patient id (+ first Trusted Person)."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/reset")
async def reset():
    """Drop runtime collections, reseed clock_state and the Coordinator. Fixtures stay."""
    raise HTTPException(status_code=501, detail="not implemented")
