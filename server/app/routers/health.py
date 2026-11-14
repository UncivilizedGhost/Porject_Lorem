"""`GET /health`: ok + whether Mongo is reachable + the current demo day. Owner: person 3.

The frontends' demo bars read `current_demo_day` from here.
"""

from __future__ import annotations

from fastapi import APIRouter

from app import db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    mongo_ok = True
    current_demo_day: int | None = None
    try:
        await db.get_client().admin.command("ping")
        clock = await db.clock_state().find_one({"_id": "demo"})
        current_demo_day = clock["current_demo_day"] if clock else None
    except Exception:  # noqa: BLE001 - a health check reports, it does not raise
        mongo_ok = False
    return {"status": "ok", "mongo": mongo_ok, "current_demo_day": current_demo_day}
