"""Escalation Steps (ADR-0003). Owner: person 3."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/escalation-steps", tags=["escalation-steps"])


@router.post("/{step_id}/confirm")
async def confirm():
    """The Confirmation. Body actor, trusted_person_name?, input. Sets confirmed_at on this and every later unfired rung; writes a confirmation event."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{step_id}/handled")
async def handled():
    """'Mark handled' on an Escalation Step row."""
    raise HTTPException(status_code=501, detail="not implemented")
