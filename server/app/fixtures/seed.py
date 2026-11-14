"""Idempotent seed (upsert by name / id). Runs at server start if collections are empty, or
on demand: `python -m app.fixtures.seed`. Owner: person 3 (clock, Coordinator), person 1 (fixtures).
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from app import db

HERE = Path(__file__).parent


def load(name: str) -> list[dict]:
    return json.loads((HERE / name).read_text(encoding="utf-8"))


async def ensure_clock_and_coordinator() -> None:
    await db.clock_state().update_one(
        {"_id": "demo"}, {"$setOnInsert": {"current_demo_day": 0}}, upsert=True
    )
    # TODO(person 3): seed the demo Coordinator ("Nurse Aino", "Western Uusimaa") if missing.


async def ensure_fixtures() -> None:
    # TODO(person 1): upsert counties.json, actions.json, insight_cards.json by name / _id.
    # TODO(person 3): clinicians.json (stretch).
    pass


async def ensure_seeded() -> None:
    try:
        await ensure_clock_and_coordinator()
        await ensure_fixtures()
    except Exception as exc:  # noqa: BLE001
        print(f"[seed] skipped, Mongo not reachable: {exc}")


if __name__ == "__main__":
    asyncio.run(ensure_seeded())
