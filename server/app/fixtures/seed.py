"""Idempotent seed (upsert by name / id). Runs at server start if collections are empty, or
on demand: `python -m app.fixtures.seed`. Owner: person 3 (clock, Coordinator), person 1 (fixtures).
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from app import db

HERE = Path(__file__).parent
# AI summaries written ahead of time by scripts/pregenerate_answers.py, if any.
PREGENERATED_SUMMARIES = HERE / "pregenerated_summaries.json"


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
    summaries = (
        json.loads(PREGENERATED_SUMMARIES.read_text(encoding="utf-8")) if PREGENERATED_SUMMARIES.is_file() else {}
    )
    for doc in load("insight_cards.json"):
        if doc["_id"] in summaries:
            doc = {**doc, "pregenerated_summary": summaries[doc["_id"]]}
        await db.upsert("insight_cards", doc["_id"], doc)
    for clinician in load("clinicians.json"):
        await db.upsert("clinicians", clinician["_id"], clinician)


async def ensure_learn_reference() -> None:
    """Learn passages, credible sources and pregenerated answers. The files win: every start
    overwrites the rows, so the tables never drift from what is in git."""
    from app import config
    from app.services.learn.corpus import _host

    for doc in load("learn_corpus.json"):
        await db.upsert("learn_passages", doc["id"], doc)
    sources = Path(config.CREDIBLE_SOURCES_PATH)
    for line in sources.read_text(encoding="utf-8").splitlines() if sources.is_file() else []:
        if line.strip():
            domain = _host(line)
            await db.upsert("credible_sources", domain, {"domain": domain})
    answers = HERE / "learn_answers.json"
    for n, doc in enumerate(json.loads(answers.read_text(encoding="utf-8")) if answers.is_file() else []):
        await db.upsert("learn_answers", f"answer-{n}", doc)


async def ensure_seeded() -> None:
    await ensure_clock_and_coordinator()
    await ensure_fixtures()
    await ensure_learn_reference()


async def _main() -> None:
    await db.init_schema()
    await ensure_seeded()
    await db.close_pool()


if __name__ == "__main__":
    asyncio.run(_main())
