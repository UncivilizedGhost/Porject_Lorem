"""The Coordinator Worklist. Owner: person 3. Merge logic in `app/services/worklist.py`."""

from fastapi import APIRouter

from app.services import worklist

router = APIRouter(prefix="/worklist", tags=["worklist"])


@router.get("")
async def get_worklist(coordinator_id: str | None = None):
    """?coordinator_id=… → { rows: [{ row_id, kind, band 1..4, level, label, person, reason, delivery_status, pathway_clock, reported_by, created_at, waiting_working_days, acknowledged, actions, detail_ref }], workload, current_demo_day }."""
    return await worklist.build(coordinator_id)
