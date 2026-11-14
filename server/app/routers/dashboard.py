"""Equity Dashboard. Owner: person 1. Spec: .scratch/equity-dashboard/spec.md

Pure logic in `app/services/simulation.py` and `app/services/summary_filter.py`.
Reads fixtures only; the only write is the append-only Decision Log.
"""

from datetime import date
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from app import db
from app.fixtures.seed import county_id
from app.services import nemotron, simulation, summary_facts
from app.services.summary_filter import filter_sentences

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

SUPPRESS_BELOW = 5      # "not enough data", no value returned
SMALL_SAMPLE_BELOW = 20 # value returned with a warning


def _pct(v: float) -> str:
    return f"{v:.0f}\u00a0%"


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
    """Body { card_id }. Facts with ids (suppressed cells skipped) → pregenerated summary if present, else Nemotron → sentences without a valid id dropped. Timeout/error → cached summary."""
    card, matched = await _card_with_matches(body.card_id)
    county = await db.get("counties", county_id(card["where"]))
    facts = summary_facts.build_facts(card, county, matched)
    valid = {f["id"] for f in facts}
    # Written ahead by scripts/pregenerate_answers.py: the shared endpoint is too slow to call live.
    ready = [s for s in card.get("pregenerated_summary") or [] if set(s["fact_ids"]) <= valid]
    if ready:
        return {"sentences": ready, "facts": facts, "source": "pregenerated"}
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


class DecisionBody(BaseModel):
    card_id: str
    action_ids: list[str]
    verdict: Literal["approve", "adapt", "reject"]
    reason: str
    owner: str
    due: date
    decided_by: str
    snapshot: dict[str, Any]

    @field_validator("reason")
    @classmethod
    def _reason_required(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("a reason is required")
        return v.strip()


@router.post("/decisions", status_code=201)
async def create_decision(body: DecisionBody):
    """Append a Decision Log row. 422 if reason blank or verdict invalid. Insert only."""
    clock = await db.get("clock_state", "demo")
    doc = body.model_dump(mode="json")
    doc["demo_day"] = clock["current_demo_day"] if clock else 0
    doc["_id"] = await db.insert("decisions", doc)
    return doc


@router.get("/decisions")
async def list_decisions(card_id: str):
    """?card_id=… newest first."""
    return await db.find("decisions", {"card_id": card_id}, newest_first=True)


SUGGEST_SYSTEM_PROMPT = (
    "You help a county team explore possible actions for one demographic group. Use only the "
    "numbered facts you are given. Write at most 3 short sentences in plain English. End every "
    "sentence with the ids of the facts it uses in square brackets, like [group_pct]. Describe "
    "options to explore from the Action Library; never recommend, rank or decide. Say that a "
    "person decides. All figures are synthetic demo data."
)

DIMENSION_LABEL = {
    "age": "age group",
    "language": "language group",
    "ethnicity": "ethnicity group",
    "education_group": "education group",
    "municipality_type": "municipality type",
}


def _suggestion_facts(doc: dict, dimension: str, group: str, cell: dict, actions: list[dict]) -> list[dict]:
    label = DIMENSION_LABEL.get(dimension, dimension.replace("_", " "))
    facts = [
        {"id": "group_pct", "value": cell["pct_within_target"],
         "text": f"{_pct(cell['pct_within_target'])} of {group} ({label}) in {doc['name']} start treatment within the target (n={cell['n']})"},
        {"id": "county_pct", "value": doc["pct_within_target"],
         "text": f"{_pct(doc['pct_within_target'])} of all patients in {doc['name']} start treatment within the target"},
    ]
    for cause, share in doc["causes"].get("referral", {}).items():
        facts.append({"id": f"cause_{cause}", "value": share,
                      "text": f"{_pct(share * 100)} of delayed referral stages are Cause Code '{cause.replace('_', ' ')}'"})
    for action in actions:
        eff = action.get("effect")
        text = f"{action['title']} (evidence badge: {action['badge']}"
        if eff:
            text += f"; evidence shows {eff['low'] * 100:.0f}–{eff['high'] * 100:.0f}\u00a0% fewer missed visits"
        else:
            text += "; no effect estimate"
        fact = {"id": f"action_{action['_id']}", "value": action["badge"], "text": text + ")"}
        if action["evidence"]:
            fact["source_url"] = action["evidence"][0]["url"]
        facts.append(fact)
    return facts


def _rule_sentences(doc: dict, dimension: str, group: str, cell: dict, actions: list[dict]) -> list[dict]:
    label = DIMENSION_LABEL.get(dimension, dimension.replace("_", " "))
    sentences = [{
        "text": (f"Only {_pct(cell['pct_within_target'])} of {group} ({label}) in {doc['name']} start "
                 f"treatment within the target, against {_pct(doc['pct_within_target'])} county-wide"),
        "fact_ids": ["group_pct", "county_pct"],
    }]
    if actions:
        sentences.append({
            "text": "Options to explore in the Action Library: " + "; ".join(a["title"] for a in actions),
            "fact_ids": [f"action_{a['_id']}" for a in actions],
        })
    with_effect = [a for a in actions if a.get("effect")]
    if with_effect:
        action, eff = with_effect[0], with_effect[0]["effect"]
        sentences.append({
            "text": (f"The evidence for {action['title']} shows "
                     f"{eff['low'] * 100:.0f}–{eff['high'] * 100:.0f}\u00a0% fewer missed visits"),
            "fact_ids": [f"action_{action['_id']}"],
        })
    return sentences


class SuggestBody(BaseModel):
    county: str
    dimension: str
    group: str


@router.post("/suggest")
async def suggest(body: SuggestBody):
    """Facts-only options for one group. Model unavailable → Action Library rules."""
    doc = await db.get("counties", county_id(body.county))
    if doc is None:
        raise HTTPException(status_code=404, detail="unknown county")
    cells = doc["breakdown"].get(body.dimension)
    if cells is None or body.group not in cells:
        raise HTTPException(status_code=404, detail="unknown group")
    cell = _protect(cells[body.group])
    if cell.get("suppressed"):
        raise HTTPException(status_code=422, detail="not enough data for this group")
    actions = [a for a in await db.find("actions") if a["gap_pattern"]["phase"] == "referral"]
    facts = _suggestion_facts(doc, body.dimension, body.group, cell, actions)
    valid = {f["id"] for f in facts}
    sentences: list[dict] = []
    try:
        reply = await nemotron.complete(SUGGEST_SYSTEM_PROMPT, summary_facts.build_prompt(facts), timeout_s=20)
        sentences = filter_sentences(reply, valid)
    except Exception:
        sentences = []
    if sentences:
        return {"sentences": sentences, "facts": facts, "source": "ai"}
    return {
        "sentences": _rule_sentences(doc, body.dimension, body.group, cell, actions),
        "facts": facts,
        "source": "rules",
    }
