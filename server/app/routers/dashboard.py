"""Equity Dashboard. Owner: person 1. Spec: .scratch/equity-dashboard/spec.md

Pure logic in `app/services/group_insight.py`, `app/services/simulation.py` and
`app/services/summary_filter.py`. Reads fixtures only; nothing here writes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import db
from app.fixtures import seed
from app.fixtures.seed import county_id
from app.services import group_insight, nemotron, simulation, summary_facts
from app.services.summary_filter import filter_sentences

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

SUPPRESS_BELOW = 5      # "not enough data", no value returned
SMALL_SAMPLE_BELOW = 20 # value returned with a warning


def _pct(v: float) -> str:
    return f"{v:.0f}\u00a0%"


def _protect(cell: dict) -> dict:
    # Some fixture cells are stored already suppressed, with no figures at all.
    if cell.get("suppressed") or cell["n"] < SUPPRESS_BELOW:
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
    # Stage warning thresholds live with the card fixture (one set for the demo).
    cards = await db.find("insight_cards", limit=1)
    return {
        **doc,
        "breakdown": {
            dimension: {label: _protect(cell) for label, cell in cells.items()}
            for dimension, cells in doc["breakdown"].items()
        },
        "stage_warning_days": cards[0]["stage_warning_days"] if cards else {},
    }


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


async def _group_card(name: str, dimension: str, group: str) -> tuple[dict, dict, list[dict]]:
    """One breakdown group's card, its county and its Recommended Actions."""
    county = await db.get("counties", county_id(name))
    if county is None:
        raise HTTPException(status_code=404, detail="unknown county")
    cells = county["breakdown"].get(dimension)
    if cells is None or group not in cells:
        raise HTTPException(status_code=404, detail="unknown group")
    cell = _protect(cells[group])
    if cell.get("suppressed"):
        raise HTTPException(status_code=422, detail="not enough data for this group")
    card = group_insight.build_card(county, dimension, group, cell, await db.find("insight_cards"))
    card["card_id"] = group_insight.card_id(county_id(name), dimension, group)
    return card, county, group_insight.recommend(card, county, await db.find("actions"))


@router.get("/counties/{name}/insight")
async def insight(name: str, dimension: str, group: str):
    """Insight Card for one breakdown group + its Recommended Actions (gap-pattern rules, no model).
    Unknown county or group → 404; a suppressed group (n < 5) → 422."""
    card, county, recommended = await _group_card(name, dimension, group)
    return {
        **card,
        "county_pct_within_target": county["pct_within_target"],
        "cause_shares": county["causes"].get(card["stage"], {}),
        "recommended_actions": recommended,
    }


class SimulateBody(BaseModel):
    card_id: str
    dials: dict[str, float] = {}


@router.post("/simulate")
async def simulate(body: SimulateBody):
    """Body { card_id, dials }. Ranges only, same-lever → larger single effect, null effect → simulated: false, needed-for-70/80. No DB write."""
    card, matched = await _card_with_matches(body.card_id)
    return simulation.simulate(card, matched, body.dials)


class SummaryBody(BaseModel):
    county: str
    dimension: str
    group: str


@router.post("/summary")
async def summary(body: SummaryBody):
    """Body { county, dimension, group }. Facts with ids (suppressed cells skipped) → pregenerated summary if present, else Nemotron → sentences without a valid id, or whose wording the facts do not back, dropped. Timeout/error → sentences built from the same facts."""
    card, county, recommended = await _group_card(body.county, body.dimension, body.group)
    facts = summary_facts.build_facts(card, county, recommended)
    valid = {f["id"] for f in facts}
    # Written ahead by scripts/pregenerate_answers.py: the shared endpoint is too slow to call live.
    ready = [s for s in seed.pregenerated_summaries().get(card["card_id"], []) if set(s["fact_ids"]) <= valid]
    if ready:
        return {"sentences": ready, "facts": facts, "source": "pregenerated"}
    sentences: list[dict] = []
    try:
        reply = await nemotron.complete(summary_facts.SYSTEM_PROMPT, summary_facts.build_prompt(facts))
        sentences = summary_facts.precise_sentences(filter_sentences(reply, valid), facts)
    except Exception:  # noqa: BLE001 - timeout, HTTP error or missing key: the card must still work
        sentences = []
    if sentences:
        return {"sentences": sentences, "facts": facts, "source": "live"}
    return {"sentences": summary_facts.fallback_sentences(card, county, recommended), "facts": facts, "source": "rules"}
