"""Append-only event writes. Owner: person 3."""

from __future__ import annotations

from typing import Any

from app import db
from app.models import Event
from app.services.demo_clock import current_day


async def write_event(
    subject_type: str,
    subject_id: str,
    type: str,
    payload: dict[str, Any] | None = None,
    *,
    actor: str = "self",
    input: str = "touch",
) -> str:
    event = Event(
        subject_type=subject_type,
        subject_id=subject_id,
        type=type,
        payload=payload or {},
        actor=actor,
        input=input,
        demo_day=await current_day(),
    )
    return await db.insert("events", event.model_dump(mode="json"))
