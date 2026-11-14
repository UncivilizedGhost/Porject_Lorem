"""Alerts (ADR-0003). Owner: person 3."""

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import reporting, worklist

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AcknowledgeBody(BaseModel):
    coordinator_id: str


class ActionBody(BaseModel):
    action: Literal["assign_to_me", "record_action", "mark_done"]
    note: str | None = None
    coordinator_id: str | None = None


@router.get("/{alert_id}")
async def get_alert(alert_id: str):
    """The R7 card: the Alert with each triggering report, answers in plain words, Own Words verbatim."""
    card = await reporting.alert_card(alert_id)
    if card is None:
        raise HTTPException(status_code=404, detail="alert not found")
    return card


@router.post("/{alert_id}/acknowledge")
async def acknowledge(alert_id: str, body: AcknowledgeBody):
    """Body { coordinator_id }. Sets acknowledged_by / acknowledged_at. Idempotent."""
    alert = await worklist.acknowledge(alert_id, body.coordinator_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")
    return alert


@router.post("/{alert_id}/reopen")
async def reopen(alert_id: str):
    """Undo 'Mark done': clears closed_at so the Alert returns to the Worklist. Idempotent."""
    alert = await worklist.reopen_alert(alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")
    return alert


@router.post("/{alert_id}/actions")
async def actions(alert_id: str, body: ActionBody):
    """Body { action: assign_to_me | record_action | mark_done, note? }. Appends to actions_taken; mark_done sets closed_at."""
    alert = await worklist.record_action(alert_id, body.action, body.note, body.coordinator_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")
    return alert
