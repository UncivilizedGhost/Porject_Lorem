"""Escalation Steps (ADR-0003). Owner: person 3."""

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import promotion, worklist

router = APIRouter(prefix="/escalation-steps", tags=["escalation-steps"])


class ConfirmBody(BaseModel):
    actor: Literal["self", "trusted_person"] = "self"
    trusted_person_name: str | None = None
    input: Literal["touch", "voice"] = "touch"


class HandledBody(BaseModel):
    outcome: str | None = None


@router.post("/{step_id}/confirm")
async def confirm(step_id: str, body: ConfirmBody):
    """The Confirmation. Body actor, trusted_person_name?, input. Sets confirmed_at on this and every later unfired rung; writes a confirmation event."""
    result = await promotion.confirm(step_id, body.actor, body.trusted_person_name, body.input)
    if result is None:
        raise HTTPException(status_code=404, detail="escalation step not found")
    return result


@router.post("/{step_id}/handled")
async def handled(step_id: str, body: HandledBody | None = None):
    """'Mark handled' on an Escalation Step row. Optional body { outcome: rebook | handed_to_trusted_person | ... }."""
    step = await worklist.mark_step_handled(step_id, body.outcome if body else None)
    if step is None:
        raise HTTPException(status_code=404, detail="escalation step not found")
    return step


@router.post("/{step_id}/reopen")
async def reopen(step_id: str):
    """Undo 'Mark handled': clears handled_at so the row returns to the Worklist."""
    step = await worklist.reopen_step(step_id)
    if step is None:
        raise HTTPException(status_code=404, detail="escalation step not found")
    return step
