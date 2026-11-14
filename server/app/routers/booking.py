"""Booking screen (stretch, after Worklist acceptance). Owner: person 3."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="", tags=["booking"])


@router.get("/clinicians")
async def clinicians():
    """?type=… from the synthetic clinicians fixture."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.get("/clinicians/{clinician_id}/availability")
async def availability():
    """?from=&to= free slots minus existing appointments."""
    raise HTTPException(status_code=501, detail="not implemented")


@router.post("/appointments")
async def create_appointment():
    """Books a slot + simulated SMS. Becomes the step to confirm if a Confirmation is pending."""
    raise HTTPException(status_code=501, detail="not implemented")
