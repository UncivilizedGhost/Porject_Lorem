"""Simulated SMS / call / FHIR log (ADR-0004). Owner: person 4. Helpers in `app/services/messaging.py`."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/sim", tags=["sim"])


@router.get("/log")
async def log():
    """?limit=… sms_sent and fhir_sync events, newest first."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/sms/{event_id}/reply")
async def reply():
    """Body { text }. Writes a replied row linked by reply_to; 'YES' confirms the linked Escalation Step."""
    raise HTTPException(status_code=501, detail="not implemented")
