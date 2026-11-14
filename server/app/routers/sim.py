"""Simulated SMS / call / FHIR log (ADR-0004). Owner: person 4. Helpers in `app/services/messaging.py`."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app import db
from app.services import messaging

router = APIRouter(prefix="/sim", tags=["sim"])


class ReplyBody(BaseModel):
    text: str


@router.get("/log")
async def log(limit: int = Query(100, ge=1, le=500)):
    """?limit=… sms_sent and fhir_sync events, newest first."""
    rows = await db.fetch(
        "SELECT id, created_at, doc FROM events WHERE doc->>'type' IN ('sms_sent', 'fhir_sync') "
        "ORDER BY created_at DESC, id LIMIT $1",
        limit,
    )
    return [
        {
            "id": r["_id"],
            "created_at": r["created_at"],
            "type": r["type"],
            "subject_type": r["subject_type"],
            "subject_id": r["subject_id"],
            "demo_day": r.get("demo_day", 0),
            "payload": r["payload"],
        }
        for r in rows
    ]


@router.post("/sms/{event_id}/reply")
async def reply(event_id: str, body: ReplyBody):
    """Body { text }. Writes a replied row linked by reply_to; 'YES' confirms the linked Escalation Step."""
    result = await messaging.reply_to_sms(event_id, body.text)
    if result is None:
        raise HTTPException(status_code=404, detail="message not found")
    return result
