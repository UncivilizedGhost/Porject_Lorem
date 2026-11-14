"""The Coordinator Worklist. Owner: person 3. Merge logic in `app/services/worklist.py`."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/worklist", tags=["worklist"])


@router.get("")
async def worklist():
    """?coordinator_id=… → rows { row_id, kind, band 1..4, level, person, reason, delivery_status, pathway_clock, reported_by, created_at, waiting_working_days, acknowledged, actions, detail_ref } + workload line."""
    raise HTTPException(status_code=501, detail="not implemented")
