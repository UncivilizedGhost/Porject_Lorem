"""Alerts (ADR-0003). Owner: person 3."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/{alert_id}/acknowledge")
async def acknowledge():
    """Body { coordinator_id }. Sets acknowledged_by / acknowledged_at. Idempotent."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/{alert_id}/actions")
async def actions():
    """Body { action: assign_to_me | record_action | mark_done, note? }. Appends to actions_taken; mark_done sets closed_at."""
    raise HTTPException(status_code=501, detail="not implemented")
