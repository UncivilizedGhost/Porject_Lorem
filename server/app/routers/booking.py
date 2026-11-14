"""Booking screen (stretch, after Worklist acceptance). Owner: person 3."""

from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services import booking

router = APIRouter(prefix="", tags=["booking"])


class AppointmentBody(BaseModel):
    subject_type: Literal["contact", "patient"]
    subject_id: str
    clinician_id: str
    type: str
    start: str  # "YYYY-MM-DDTHH:MM"


@router.get("/clinicians")
async def clinicians(type: str | None = None):
    """?type=… from the synthetic clinicians fixture."""
    return await booking.list_clinicians(type)


@router.get("/clinicians/{clinician_id}/availability")
async def availability(clinician_id: str, from_: str = Query(alias="from"), to: str = Query()):
    """?from=&to= free slots minus existing appointments."""
    result = await booking.availability(clinician_id, from_, to)
    if result is None:
        raise HTTPException(status_code=404, detail="clinician not found")
    return result


@router.post("/appointments")
async def create_appointment(body: AppointmentBody):
    """Books a slot + simulated SMS. Becomes the step to confirm if a Confirmation is pending."""
    try:
        return await booking.book(body.subject_type, body.subject_id, body.clinician_id, body.type, body.start)
    except booking.SlotTaken:
        raise HTTPException(status_code=409, detail="that slot is already booked") from None
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None
