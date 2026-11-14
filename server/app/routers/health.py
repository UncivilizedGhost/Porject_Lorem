"""`GET /health`: ok + whether the database is reachable + the current demo day + Learn reference row counts. Owner: person 3.

The frontends' demo bars read `current_demo_day` from here.
"""

from __future__ import annotations

from fastapi import APIRouter

from app import db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict:
    db_ok = True
    current_demo_day: int | None = None
    learn: dict[str, int] = {}
    try:
        clock = await db.get("clock_state", "demo")
        current_demo_day = clock["current_demo_day"] if clock else None
        learn = {t: len(await db.find(t)) for t in db.REFERENCE_TABLES}
    except Exception:  # noqa: BLE001 - a health check reports, it does not raise
        db_ok = False
    return {"status": "ok", "db": db_ok, "current_demo_day": current_demo_day, "learn": learn}
