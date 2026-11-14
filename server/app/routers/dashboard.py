"""Equity Dashboard. Owner: person 1. Spec: .scratch/equity-dashboard/spec.md

Pure logic in `app/services/simulation.py` and `app/services/summary_filter.py`.
Reads fixtures only; the only write is the append-only Decision Log.
"""

from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from app import db
from app.fixtures.seed import county_id
from app.services import nemotron, simulation, summary_facts
from app.services.summary_filter import filter_sentences

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

SUPPRESS_BELOW = 5  # "not enough data", no value returned
SMALL_SAMPLE_BELOW = 20  # value returned with a warning


def _protect(cell: dict) -> dict:
    if cell["n"] < SUPPRESS_BELOW:
        return {"suppressed": True}
    return {**cell, "small_sample": cell["n"] < SMALL_SAMPLE_BELOW}


@router.get("/counties")
async def counties():
    """All 22 for level 1: name, tile, the three numbers."""
    keys = ("name", "tile", "pct_within_target", "median_days_referral_to_treatment", "reach_rate_over_75")
    return [{k: c[k] for k in keys} for c in await db.find("counties")]


@router.get("/counties/{name}")
async def county(name: str):
    """Full document for level 2. n < 5 cells → { suppressed: true }; n < 20 → small_sample: true."""
    doc = await db.get("counties", county_id(name))
    if doc is None:
        raise HTTPException(status_code=404, detail="unknown county")
    doc["breakdown"] = {
        dimension: {label: _protect(cell) for label, cell in cells.items()}
        for dimension, cells in doc["breakdown"].items()
    }
    # Stage warning thresholds live with the card fixture (one set for the demo).
    cards = await db.find("insight_cards", limit=1)
    doc["stage_warning_days"] = cards[0]["stage_warning_days"] if cards else {}
    return doc


@router.get("/actions")
async def actions():
    """The Action Library."""
    return await db.find("actions")


async def _card_with_matches(card_id: str) -> tuple[dict, list[dict]]:
    card = await db.get("insight_cards", card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="unknown insight card")
    return card, [a for a in await db.find("actions") if _matches(a["gap_pattern"], card)]


def _matches(pattern: dict, card: dict) -> bool:
    """Stage must equal; a null cause / group in the pattern matches any. No ranking."""
    return (
        pattern["phase"] == card["stage"]
        and pattern["cause"] in (None, card["cause"])
        and pattern["group"] in (None, card["group"])
    )


@router.get("/insight/{card_id:path}")
async def insight(card_id: str):
    """Card definition + Matched Actions (gap_pattern match, no ranking)."""
    card, matched = await _card_with_matches(card_id)
    return {**card, "matched_actions": matched}


class SimulateBody(BaseModel):
    card_id: str
    dials: dict[str, float] = {}


@router.post("/simulate")
async def simulate(body: SimulateBody):
    """Body { card_id, dials }. Ranges only, same-lever → larger single effect, null effect → simulated: false, needed-for-70/80. No DB write."""
    card, matched = await _card_with_matches(body.card_id)
    return simulation.simulate(card, matched, body.dials)


class SummaryBody(BaseModel):
    card_id: str


@router.post("/summary")
async def summary(body: SummaryBody):
    """Body { card_id }. Facts with ids (suppressed cells skipped) → Nemotron → sentences without a valid id dropped. Timeout/error → cached summary."""
    card, matched = await _card_with_matches(body.card_id)
    county = await db.get("counties", county_id(card["where"]))
    facts = summary_facts.build_facts(card, county, matched)
    valid = {f["id"] for f in facts}
    sentences: list[dict] = []
    try:
        reply = await nemotron.complete(summary_facts.SYSTEM_PROMPT, summary_facts.build_prompt(facts))
        sentences = filter_sentences(reply, valid)
    except Exception:  # noqa: BLE001 - timeout, HTTP error or missing key: the card must still work
        sentences = []
    if sentences:
        return {"sentences": sentences, "facts": facts, "source": "live"}
    cached = [s for s in card["cached_summary"] if set(s["fact_ids"]) <= valid]
    return {"sentences": cached, "facts": facts, "source": "cached"}


@router.post("/decisions")
async def create_decision():
    """Append a Decision Log row. 422 if reason blank or verdict invalid. Insert only."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/decisions")
async def list_decisions():
    """?card_id=… newest first."""
    raise HTTPException(status_code=501, detail="not implemented")
