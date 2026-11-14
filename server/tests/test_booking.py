"""Person 3 (stretch): Booking. HTTP seam."""

import pytest
from test_core_api import make_contact

pytestmark = pytest.mark.usefixtures("fresh_db")

MONDAY = "2026-11-16"
SUNDAY = "2026-11-22"


async def first_clinician(client, type_="xray_ct"):
    r = await client.get("/clinicians", params={"type": type_})
    assert r.status_code == 200
    return r.json()[0]


async def test_clinicians_are_filtered_by_appointment_type(client):
    xray = await client.get("/clinicians", params={"type": "xray_ct"})
    assert xray.json() and all("xray_ct" in c["types"] for c in xray.json())
    chemo = await client.get("/clinicians", params={"type": "chemotherapy"})
    assert all("chemotherapy" in c["types"] for c in chemo.json())
    assert {c["id"] for c in xray.json()} != {c["id"] for c in chemo.json()}


async def test_availability_lists_only_working_days_and_hours(client):
    c = await first_clinician(client)
    body = (await client.get(f"/clinicians/{c['id']}/availability", params={"from": MONDAY, "to": SUNDAY})).json()
    assert body["working_days"] == c["working_days"]
    dates = {d["date"] for d in body["days"]}
    assert MONDAY in dates
    assert SUNDAY not in dates  # weekend: nobody works
    first = next(d for d in body["days"] if d["date"] == MONDAY)
    assert first["slots"][0] == c["hours"]["start"]
    assert all(c["hours"]["start"] <= s < c["hours"]["end"] for s in first["slots"])


async def test_booking_removes_the_slot_and_refuses_a_double_booking(client):
    contact = await make_contact(client)
    c = await first_clinician(client)
    day = (await client.get(f"/clinicians/{c['id']}/availability", params={"from": MONDAY, "to": MONDAY})).json()["days"][0]
    slot = day["slots"][0]
    body = {
        "subject_type": "contact",
        "subject_id": contact,
        "clinician_id": c["id"],
        "type": "xray_ct",
        "start": f"{MONDAY}T{slot}",
    }
    r = await client.post("/appointments", json=body)
    assert r.status_code == 200, r.text
    assert r.json()["location"] == c["location"]

    after = (await client.get(f"/clinicians/{c['id']}/availability", params={"from": MONDAY, "to": MONDAY})).json()["days"][0]
    assert slot not in after["slots"]
    assert (await client.post("/appointments", json=body)).status_code == 409


async def test_booking_outside_working_hours_is_rejected(client):
    contact = await make_contact(client)
    c = await first_clinician(client)
    body = {
        "subject_type": "contact",
        "subject_id": contact,
        "clinician_id": c["id"],
        "type": "xray_ct",
        "start": f"{SUNDAY}T10:00",
    }
    assert (await client.post("/appointments", json=body)).status_code == 422


async def test_booking_for_a_callback_contact_marks_the_callback_booked(client):
    contact = await make_contact(client)
    await client.post(f"/contacts/{contact}/warning-sign-tap", json={"symptom": "hoarseness"})
    c = await first_clinician(client)
    slot = (await client.get(f"/clinicians/{c['id']}/availability", params={"from": MONDAY, "to": MONDAY})).json()["days"][0]["slots"][0]
    await client.post(
        "/appointments",
        json={"subject_type": "contact", "subject_id": contact, "clinician_id": c["id"], "type": "xray_ct", "start": f"{MONDAY}T{slot}"},
    )
    worklist = (await client.get("/worklist")).json()["rows"]
    assert [r for r in worklist if r["kind"] == "callback"] == []
