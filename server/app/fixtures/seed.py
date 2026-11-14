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


COORDINATOR_ID = "coordinator-aino"


def county_id(name: str) -> str:
    return name.lower().replace(" ", "-")


async def ensure_clock_and_coordinator() -> None:
    await db.upsert("clock_state", "demo", {"current_demo_day": 0}, overwrite=False)
    await db.upsert(
        "coordinators", COORDINATOR_ID, {"name": "Nurse Aino", "county": "Western Uusimaa"}, overwrite=False
    )


async def ensure_fixtures() -> None:
    # Person 1: counties by name, actions and insight cards by _id. Idempotent upserts.
    for doc in load("counties.json"):
        await db.upsert("counties", county_id(doc["name"]), doc)
    for doc in load("actions.json"):
        await db.upsert("actions", doc["_id"], doc)
    for doc in load("insight_cards.json"):
        await db.upsert("insight_cards", doc["_id"], doc)
    for clinician in load("clinicians.json"):
        await db.upsert("clinicians", clinician["_id"], clinician)


async def ensure_seeded() -> None:
    await ensure_clock_and_coordinator()
    await ensure_fixtures()


async def _main() -> None:
    await db.init_schema()
    await ensure_seeded()
    await db.close_pool()


if __name__ == "__main__":
    asyncio.run(_main())
