"""Equity Dashboard. Owner: person 1. Spec: .scratch/equity-dashboard/spec.md

Pure logic in `app/services/simulation.py` and `app/services/summary_filter.py`.
Reads fixtures only; the only write is the append-only Decision Log.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/counties")
async def counties():
    """All 22 for level 1: name, tile, the three numbers."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/counties/{name}")
async def county():
    """Full document for level 2. n < 5 cells → { suppressed: true }; n < 20 → small_sample: true."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/actions")
async def actions():
    """The Action Library."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/insight/{card_id:path}")
async def insight():
    """Card definition + Matched Actions (gap_pattern match, no ranking)."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/simulate")
async def simulate():
    """Body { card_id, dials }. Ranges only, same-lever → larger single effect, null effect → simulated: false, needed-for-70/80. No DB write."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/summary")
async def summary():
    """Body { card_id }. Facts with ids (suppressed cells skipped) → Nemotron → sentences without a valid id dropped. Timeout/error → cached summary."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/decisions")
async def create_decision():
    """Append a Decision Log row. 422 if reason blank or verdict invalid. Insert only."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/decisions")
async def list_decisions():
    """?card_id=… newest first."""
    raise HTTPException(status_code=501, detail="not implemented")
